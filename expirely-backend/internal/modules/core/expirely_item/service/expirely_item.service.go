package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"

	"venturo-skeleton-go/internal/modules/core/expirely_item/domain"
	"venturo-skeleton-go/internal/modules/core/expirely_item/dto"
	"venturo-skeleton-go/internal/modules/core/expirely_item/repository"
	"venturo-skeleton-go/pkg/logger"
)

var (
	ErrNotFound      = errors.New("expirely item not found")
	ErrQuotaExceeded = errors.New("daily quota exceeded")
	ErrNoUrgentItems = errors.New("no urgent items available")
	ErrRewardLimit   = errors.New("daily rewarded-ad limit reached")
	ErrInvalidInput  = errors.New("invalid input")
)

const (
	dailyRecognitionLimit    = 2
	dailyRecommendationLimit = 2
)

// Shelf-life dataset (Dataset A) — loaded once at startup.
var shelfLifeData = map[string]domain.ShelfLifeEntry{
	"buah_segar":          {Kategori: "buah_segar", EstimasiHari: 6, Contoh: []string{"pisang", "apel", "jeruk"}},
	"sayur_hijau":         {Kategori: "sayur_hijau", EstimasiHari: 4, Contoh: []string{"bayam", "kangkung", "sawi"}},
	"sayur_umbi":          {Kategori: "sayur_umbi", EstimasiHari: 18, Contoh: []string{"kentang", "wortel", "bawang"}},
	"roti_tanpa_pengawet": {Kategori: "roti_tanpa_pengawet", EstimasiHari: 3, Contoh: []string{"roti lokal", "roti bakery"}},
	"telur_lepas":         {Kategori: "telur_lepas", EstimasiHari: 18, Contoh: []string{"telur ayam curah"}},
	"daging_segar":        {Kategori: "daging_segar", EstimasiHari: 2, Contoh: []string{"daging sapi/ayam belum dibekukan"}},
	"daging_beku":         {Kategori: "daging_beku", EstimasiHari: 90, Contoh: []string{"daging di freezer"}},
	"ikan_segar":          {Kategori: "ikan_segar", EstimasiHari: 2, Contoh: []string{"ikan belum dibekukan"}},
	"susu_segar_non_uht":  {Kategori: "susu_segar_non_uht", EstimasiHari: 4, Contoh: []string{"susu pasteurisasi"}},
	"keju_segar":          {Kategori: "keju_segar", EstimasiHari: 10, Contoh: []string{"keju tanpa kemasan awet"}},
	"default_unknown":     {Kategori: "default_unknown", EstimasiHari: 7, Contoh: []string{}},
}

type Service struct {
	repo *repository.Repository
}

func NewService(repo *repository.Repository) *Service {
	return &Service{repo: repo}
}

// CreateManual adds an item via manual input (no AI call).
func (s *Service) CreateManual(ctx context.Context, userID string, req *dto.CreateItemRequest) (*dto.ItemResponse, error) {
	name := strings.TrimSpace(req.NamaProduk)
	if name == "" {
		return nil, fmt.Errorf("%w: nama_produk cannot be blank", ErrInvalidInput)
	}
	expiryDate, err := time.Parse("2006-01-02", req.ExpiryDate)
	if err != nil {
		return nil, fmt.Errorf("%w: expiry_date must use YYYY-MM-DD", ErrInvalidInput)
	}

	item := &domain.ExpirelyItem{
		ID:          uuid.New().String(),
		UserID:      userID,
		NamaProduk:  name,
		Kategori:    req.Kategori,
		ExpiryDate:  expiryDate,
		IsEstimated: req.IsEstimated,
		Status:      domain.StatusActive,
		Source:      "manual",
	}

	if err := s.repo.Create(ctx, item); err != nil {
		return nil, err
	}

	return toResponse(item), nil
}

// CreateFromPhoto calls AI vision API to identify the product and expiry date.
// Accepts either photoURL (download from URL) or photoBase64 (inline base64 data).
func (s *Service) CreateFromPhoto(ctx context.Context, userID, photoBase64, mimeType string) (*dto.ItemResponse, error) {
	today := time.Now().Format("2006-01-02")
	reserved, err := s.repo.TryConsumeQuota(ctx, userID, today, "recognition", dailyRecognitionLimit)
	if err != nil {
		return nil, err
	}
	if !reserved {
		return nil, ErrQuotaExceeded
	}

	if mimeType == "" {
		mimeType = "image/jpeg"
	}
	aiResult, err := callAIVisionBase64(ctx, photoBase64, mimeType)
	if err != nil {
		s.releaseQuota(ctx, userID, today, "recognition")
		return nil, fmt.Errorf("AI recognition failed: %w", err)
	}
	aiResult.NamaProduk = strings.TrimSpace(aiResult.NamaProduk)
	if aiResult.NamaProduk == "" || len(aiResult.NamaProduk) > 255 {
		s.releaseQuota(ctx, userID, today, "recognition")
		return nil, errors.New("AI returned an invalid product name")
	}
	if len(aiResult.Kategori) > 100 {
		s.releaseQuota(ctx, userID, today, "recognition")
		return nil, errors.New("AI returned an invalid category")
	}

	// Build item from AI result
	item := &domain.ExpirelyItem{
		ID:         uuid.New().String(),
		UserID:     userID,
		NamaProduk: aiResult.NamaProduk,
		Source:     "ai_photo",
		Status:     domain.StatusActive,
	}

	if aiResult.AdaTanggalTercetak && aiResult.ExpiryDate != "" {
		expiryDate, err := time.Parse("2006-01-02", aiResult.ExpiryDate)
		if err != nil {
			s.releaseQuota(ctx, userID, today, "recognition")
			return nil, fmt.Errorf("AI returned invalid date: %w", err)
		}
		item.ExpiryDate = expiryDate
		item.IsEstimated = false
	} else if aiResult.Kategori != "" {
		expiry, category := estimateExpiry(aiResult.Kategori, time.Now())
		item.Kategori = &category
		item.ExpiryDate = expiry
		item.IsEstimated = true
	} else {
		// Fallback: default 7 days
		item.ExpiryDate = time.Now().AddDate(0, 0, 7)
		item.IsEstimated = true
	}

	if err := s.repo.Create(ctx, item); err != nil {
		s.releaseQuota(ctx, userID, today, "recognition")
		return nil, err
	}

	return toResponse(item), nil
}

func estimateExpiry(category string, now time.Time) (time.Time, string) {
	entry, ok := shelfLifeData[category]
	if !ok {
		entry = shelfLifeData["default_unknown"]
	}
	return now.AddDate(0, 0, entry.EstimasiHari), entry.Kategori
}

// List returns all active items sorted by expiry urgency.
func (s *Service) List(ctx context.Context, userID string) (*dto.ItemListResponse, error) {
	items, err := s.repo.FindAll(ctx, userID)
	if err != nil {
		return nil, err
	}
	resp := make([]dto.ItemResponse, len(items))
	for i := range items {
		resp[i] = *toResponse(&items[i])
	}
	return &dto.ItemListResponse{Items: resp, Total: int64(len(resp))}, nil
}

// GetByID returns an item by ID.
func (s *Service) GetByID(ctx context.Context, userID, id string) (*dto.ItemResponse, error) {
	item, err := s.repo.FindByID(ctx, userID, id)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return toResponse(item), nil
}

// Update edits an item's fields.
func (s *Service) Update(ctx context.Context, userID, id string, req *dto.UpdateItemRequest) (*dto.ItemResponse, error) {
	var expiryDate *time.Time
	if req.ExpiryDate != nil {
		t, err := time.Parse("2006-01-02", *req.ExpiryDate)
		if err != nil {
			return nil, fmt.Errorf("%w: expiry_date must use YYYY-MM-DD", ErrInvalidInput)
		}
		expiryDate = &t
	}

	if req.NamaProduk != nil {
		trimmed := strings.TrimSpace(*req.NamaProduk)
		if trimmed == "" {
			return nil, fmt.Errorf("%w: nama_produk cannot be blank", ErrInvalidInput)
		}
		req.NamaProduk = &trimmed
	}
	item, err := s.repo.Update(ctx, userID, id, req.NamaProduk, req.Kategori, expiryDate, req.IsEstimated)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return toResponse(item), nil
}

// UpdateStatus marks an item as consumed or wasted.
func (s *Service) UpdateStatus(ctx context.Context, userID, id string, status domain.ItemStatus) (*dto.ItemResponse, error) {
	item, err := s.repo.UpdateStatus(ctx, userID, id, status)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return toResponse(item), nil
}

// Recommend calls AI to get usage recommendations for items nearing expiry.
func (s *Service) Recommend(ctx context.Context, userID string, req *dto.RecommendRequest) (*dto.RecommendResponse, error) {
	ids := make([]string, 0, len(req.Items))
	for _, item := range req.Items {
		ids = append(ids, item.ID)
	}
	items, err := s.repo.FindUrgentByIDs(ctx, userID, ids, time.Now().AddDate(0, 0, 7))
	if err != nil {
		return nil, err
	}
	if len(items) == 0 {
		return nil, ErrNoUrgentItems
	}

	today := time.Now().Format("2006-01-02")
	reserved, err := s.repo.TryConsumeQuota(ctx, userID, today, "recommendation", dailyRecommendationLimit)
	if err != nil {
		return nil, err
	}
	if !reserved {
		return nil, ErrQuotaExceeded
	}

	var productNames []string
	for _, item := range items {
		productNames = append(productNames, item.NamaProduk)
	}

	recommendations, err := callAIRecommendation(ctx, productNames)
	if err != nil {
		s.releaseQuota(ctx, userID, today, "recommendation")
		return nil, fmt.Errorf("AI recommendation failed: %w", err)
	}

	// Map recommendations back to item IDs
	resp := &dto.RecommendResponse{
		Recommendations: make([]dto.Recommendation, 0),
	}
	for i, item := range items {
		if i < len(recommendations) {
			resp.Recommendations = append(resp.Recommendations, dto.Recommendation{
				ItemID:      item.ID,
				NamaProduk:  item.NamaProduk,
				Rekomendasi: recommendations[i],
			})
		}
	}

	return resp, nil
}

// GetQuota returns today's quota status.
func (s *Service) GetQuota(ctx context.Context, userID string) (*dto.QuotaResponse, error) {
	today := time.Now().Format("2006-01-02")
	quota, err := s.repo.GetDailyQuota(ctx, userID, today)
	if err != nil {
		return nil, err
	}
	return &dto.QuotaResponse{
		Date:                today,
		RecognitionUsed:     quota.RecognitionUsed,
		RecognitionLimit:    dailyRecognitionLimit + quota.RecognitionBonus,
		RecommendationUsed:  quota.RecommendationUsed,
		RecommendationLimit: dailyRecommendationLimit + quota.RecommendationBonus,
	}, nil
}

// GrantReward simulates a completed rewarded ad and adds one quota unit.
func (s *Service) GrantReward(ctx context.Context, userID, kind string) (*dto.QuotaResponse, error) {
	today := time.Now().Format("2006-01-02")
	if err := s.repo.GrantReward(ctx, userID, today, kind); err != nil {
		if strings.Contains(err.Error(), "reward limit") {
			return nil, ErrRewardLimit
		}
		return nil, err
	}
	return s.GetQuota(ctx, userID)
}

// GetStats returns item counts by status.
func (s *Service) GetStats(ctx context.Context, userID string) (*dto.StatsResponse, error) {
	stats, err := s.repo.GetStats(ctx, userID)
	if err != nil {
		return nil, err
	}
	return &dto.StatsResponse{
		TotalActive:   stats.TotalActive,
		TotalConsumed: stats.TotalConsumed,
		TotalWasted:   stats.TotalWasted,
		ExpiringSoon:  stats.ExpiringSoon,
	}, nil
}

func (s *Service) releaseQuota(ctx context.Context, userID, date, kind string) {
	releaseCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := s.repo.ReleaseQuota(releaseCtx, userID, date, kind); err != nil {
		logger.Error("Failed to release reserved quota", logger.Err(err))
	}
}

// GetShelfLifeData returns the static shelf-life dataset.
func (s *Service) GetShelfLifeData() map[string]domain.ShelfLifeEntry {
	return shelfLifeData
}

// toResponse converts a domain item to a DTO response.
func toResponse(item *domain.ExpirelyItem) *dto.ItemResponse {
	return &dto.ItemResponse{
		ID:          item.ID,
		NamaProduk:  item.NamaProduk,
		Kategori:    item.Kategori,
		ExpiryDate:  item.ExpiryDate.Format("2006-01-02"),
		IsEstimated: item.IsEstimated,
		Status:      string(item.Status),
		Source:      item.Source,
		CreatedAt:   item.CreatedAt,
		UpdatedAt:   item.UpdatedAt,
	}
}

// --- AI Integration (Google Gemini) ---

// geminiVisionResult holds the parsed JSON from Gemini's vision response.
type aiVisionResult struct {
	NamaProduk         string `json:"nama_produk"`
	AdaTanggalTercetak bool   `json:"ada_tanggal_tercetak"`
	ExpiryDate         string `json:"expiry_date"`
	Kategori           string `json:"kategori"`
}

// geminiContentResponse is the top-level Gemini API response shape.
type geminiContentResponse struct {
	Candidates []struct {
		Content struct {
			Parts []struct {
				Text string `json:"text"`
			} `json:"parts"`
		} `json:"content"`
	} `json:"candidates"`
}

// geminiModel returns the Gemini model to use (env override for flexibility).
func geminiModel() string {
	if m := os.Getenv("AI_MODEL"); m != "" {
		return m
	}
	return "gemini-3.5-flash-lite"
}

// geminiEndpoint builds the Gemini generateContent URL without credentials.
// API keys are sent through x-goog-api-key so they cannot leak through URL logs.
func geminiEndpoint() string {
	return fmt.Sprintf(
		"https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent",
		geminiModel(),
	)
}

func newGeminiRequest(ctx context.Context, apiKey string, body []byte) (*http.Request, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, geminiEndpoint(), strings.NewReader(string(body)))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-goog-api-key", apiKey)
	return req, nil
}

// --- Key rotation ---

var (
	geminiKeys     []string
	geminiKeyIndex int
	geminiKeyMu    sync.Mutex
)

// initGeminiKeys loads keys from AI_API_KEY env var.
// Supports single key or comma-separated: AI_API_KEY=key1,key2,key3
func initGeminiKeys() {
	raw := os.Getenv("AI_API_KEY")
	if raw == "" {
		return
	}
	for _, k := range strings.Split(raw, ",") {
		k = strings.TrimSpace(k)
		if k != "" {
			geminiKeys = append(geminiKeys, k)
		}
	}
}

// nextGeminiKey returns the next API key in round-robin order.
func nextGeminiKey() (string, error) {
	geminiKeyMu.Lock()
	defer geminiKeyMu.Unlock()
	if len(geminiKeys) == 0 {
		initGeminiKeys()
	}
	if len(geminiKeys) == 0 {
		return "", fmt.Errorf("no Gemini API keys configured — set AI_API_KEY in .env")
	}
	key := geminiKeys[geminiKeyIndex%len(geminiKeys)]
	geminiKeyIndex++
	return key, nil
}

// geminiVisionPrompt is the system prompt for photo recognition.
const geminiVisionPrompt = `Analisis foto produk makanan/barang rumah tangga ini.
Kembalikan HANYA JSON dengan format:
{"nama_produk": "nama produk", "ada_tanggal_tercetak": true/false, "expiry_date": "YYYY-MM-DD", "kategori": "kategori_barang"}

Jika ada tanggal kedaluwarsa tercetak, isi expiry_date dan set ada_tanggal_tercetak: true.
Jika tidak ada tanggal tercetak (barang segar), isi kategori dan set ada_tanggal_tercetak: false.
Kategori yang dikenali: buah_segar, sayur_hijau, sayur_umbi, roti_tanpa_pengawet, telur_lepas, daging_segar, daging_beku, ikan_segar, susu_segar_non_uht, keju_segar.
Hanya kembalikan JSON, tanpa teks lain.`

// callAIVisionBase64 sends base64-encoded image data to Gemini Vision.
func callAIVisionBase64(ctx context.Context, base64Data, mimeType string) (*aiVisionResult, error) {
	apiKey, err := nextGeminiKey()
	if err != nil {
		return nil, err
	}

	body := map[string]interface{}{
		"contents": []map[string]interface{}{
			{
				"parts": []map[string]interface{}{
					{
						"inlineData": map[string]interface{}{
							"mimeType": mimeType,
							"data":     base64Data,
						},
					},
					{
						"text": geminiVisionPrompt,
					},
				},
			},
		},
		"generationConfig": map[string]interface{}{
			"maxOutputTokens": 1024,
			"responseMimeType": "application/json",
			"thinkingConfig": map[string]interface{}{
				"thinkingLevel": "minimal",
			},
		},
	}

	bodyBytes, _ := json.Marshal(body)
	req, err := newGeminiRequest(ctx, apiKey, bodyBytes)
	if err != nil {
		return nil, err
	}

	client := &http.Client{Timeout: 60 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Gemini API returned status %d: %s", resp.StatusCode, string(respBody))
	}

	var geminiResp geminiContentResponse
	if err := json.Unmarshal(respBody, &geminiResp); err != nil {
		return nil, fmt.Errorf("failed to parse Gemini response: %w", err)
	}

	if len(geminiResp.Candidates) == 0 || len(geminiResp.Candidates[0].Content.Parts) == 0 {
		return nil, fmt.Errorf("empty Gemini response")
	}

	text := geminiResp.Candidates[0].Content.Parts[0].Text
	text = strings.TrimSpace(text)
	text = strings.TrimPrefix(text, "```json")
	text = strings.TrimPrefix(text, "```")
	text = strings.TrimSuffix(text, "```")
	text = strings.TrimSpace(text)

	start := strings.Index(text, "{")
	end := strings.LastIndex(text, "}") + 1
	if start == -1 || end == 0 {
		return nil, fmt.Errorf("no JSON found in Gemini response: %s", text)
	}

	var result aiVisionResult
	if err := json.Unmarshal([]byte(text[start:end]), &result); err != nil {
		return nil, fmt.Errorf("failed to parse AI response JSON: %w", err)
	}

	return &result, nil
}

// geminiRecommendPrompt is the system prompt for usage recommendations.
func geminiRecommendPrompt(productNames string) string {
	return fmt.Sprintf(`Berikut adalah daftar bahan makanan/barang rumah tangga yang akan segera kedaluwarsa:
%s

Beri 1 saran singkat (nama resep atau cara pakai) untuk setiap barang agar tidak terbuang.
Kembalikan JSON array berisi string: ["saran1", "saran2", ...]
Pastikan jumlah saran sama dengan jumlah barang. Hanya kembalikan JSON array, tanpa teks lain.`, productNames)
}

// callAIRecommendation sends item names to Gemini and returns usage tips.
func callAIRecommendation(ctx context.Context, productNames []string) ([]string, error) {
	apiKey, err := nextGeminiKey()
	if err != nil {
		return nil, err
	}

	body := map[string]interface{}{
		"contents": []map[string]interface{}{
			{
				"parts": []map[string]interface{}{
					{
						"text": geminiRecommendPrompt(strings.Join(productNames, ", ")),
					},
				},
			},
		},
		"generationConfig": map[string]interface{}{
			"maxOutputTokens": 1024,
			"responseMimeType": "application/json",
			"thinkingConfig": map[string]interface{}{
				"thinkingLevel": "minimal",
			},
		},
	}

	bodyBytes, _ := json.Marshal(body)
	req, err := newGeminiRequest(ctx, apiKey, bodyBytes)
	if err != nil {
		return nil, err
	}

	client := &http.Client{Timeout: 60 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Gemini API returned status %d: %s", resp.StatusCode, string(respBody))
	}

	var geminiResp geminiContentResponse
	if err := json.Unmarshal(respBody, &geminiResp); err != nil {
		return nil, fmt.Errorf("failed to parse Gemini response: %w", err)
	}

	if len(geminiResp.Candidates) == 0 || len(geminiResp.Candidates[0].Content.Parts) == 0 {
		return nil, fmt.Errorf("empty Gemini response")
	}

	text := geminiResp.Candidates[0].Content.Parts[0].Text
	text = strings.TrimSpace(text)
	text = strings.TrimPrefix(text, "```json")
	text = strings.TrimPrefix(text, "```")
	text = strings.TrimSuffix(text, "```")
	text = strings.TrimSpace(text)

	start := strings.Index(text, "[")
	end := strings.LastIndex(text, "]") + 1
	if start == -1 || end == 0 {
		return nil, fmt.Errorf("no JSON array found in Gemini response: %s", text)
	}

	var recommendations []string
	if err := json.Unmarshal([]byte(text[start:end]), &recommendations); err != nil {
		return nil, fmt.Errorf("failed to parse AI recommendations: %w", err)
	}

	return recommendations, nil
}
