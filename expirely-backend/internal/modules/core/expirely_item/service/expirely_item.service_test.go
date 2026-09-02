package service

import (
	"context"
	"encoding/json"
	"strings"
	"testing"
	"time"

	"venturo-skeleton-go/internal/modules/core/expirely_item/domain"
)

func TestGeminiRequestKeepsAPIKeyOutOfURL(t *testing.T) {
	request, err := newGeminiRequest(context.Background(), "test-secret-key", []byte(`{"contents":[]}`))
	if err != nil {
		t.Fatalf("new Gemini request: %v", err)
	}
	if request.URL.RawQuery != "" || strings.Contains(request.URL.String(), "test-secret-key") {
		t.Fatalf("API key must not be included in URL: %s", request.URL.String())
	}
	if got := request.Header.Get("x-goog-api-key"); got != "test-secret-key" {
		t.Fatalf("x-goog-api-key header = %q", got)
	}
}

func TestUsageIdeasResponseAndPrompt(t *testing.T) {
	prompt := geminiRecommendPrompt([]string{"Bayam", "Telur"})
	if !strings.Contains(prompt, "0. Bayam") || !strings.Contains(prompt, "1. Telur") {
		t.Fatalf("prompt must preserve item indexes: %s", prompt)
	}

	var response aiUsageIdeaResponse
	payload := `{"ideas":[{"title":"Tumis bayam telur","description":"Masak keduanya untuk lauk cepat.","item_indexes":[0,1]}]}`
	if err := json.Unmarshal(extractJSONObject(payload), &response); err != nil {
		t.Fatalf("parse usage ideas: %v", err)
	}
	if len(response.Ideas) != 1 || len(response.Ideas[0].ItemIndexes) != 2 {
		t.Fatalf("unexpected usage ideas: %+v", response)
	}
}

func TestToResponseAddsEstimateBasisOnlyForEstimatedItems(t *testing.T) {
	category := "sayur_hijau"
	item := &domain.ExpirelyItem{
		ID:          "item-id",
		NamaProduk:  "Bayam",
		Kategori:    &category,
		ExpiryDate:  time.Date(2026, time.September, 5, 0, 0, 0, 0, time.UTC),
		IsEstimated: true,
		Status:      domain.StatusActive,
	}

	response := toResponse(item)
	if response.EstimateBasis == nil {
		t.Fatal("expected estimate basis for estimated item")
	}
	if response.EstimateBasis.Category != category || response.EstimateBasis.EstimateDays != 4 {
		t.Fatalf("unexpected estimate basis: %+v", response.EstimateBasis)
	}
	if response.EstimateBasis.SourceURL == "" || response.EstimateBasis.SafetyDisclaimer == "" {
		t.Fatalf("estimate basis must include source and disclaimer: %+v", response.EstimateBasis)
	}

	item.IsEstimated = false
	if response := toResponse(item); response.EstimateBasis != nil {
		t.Fatalf("exact-date item must not include estimate basis: %+v", response.EstimateBasis)
	}
}

func TestEstimateExpiryUsesShelfLifeDataset(t *testing.T) {
	now := time.Date(2026, time.September, 1, 8, 0, 0, 0, time.UTC)

	expiry, category := estimateExpiry("sayur_hijau", now)
	if category != "sayur_hijau" {
		t.Fatalf("expected category sayur_hijau, got %s", category)
	}
	if want := now.AddDate(0, 0, 4); !expiry.Equal(want) {
		t.Fatalf("expected %s, got %s", want, expiry)
	}
}

func TestEstimateExpiryFallsBackToDefault(t *testing.T) {
	now := time.Date(2026, time.September, 1, 8, 0, 0, 0, time.UTC)

	expiry, category := estimateExpiry("untrusted-category", now)
	if category != "default_unknown" {
		t.Fatalf("expected default_unknown, got %s", category)
	}
	if want := now.AddDate(0, 0, 7); !expiry.Equal(want) {
		t.Fatalf("expected %s, got %s", want, expiry)
	}
}

func TestNormalizeStorageLocation(t *testing.T) {
	location, err := normalizeStorageLocation(" Refrigerator ")
	if err != nil || location != "refrigerator" {
		t.Fatalf("expected normalized refrigerator, got %q, err=%v", location, err)
	}
	if _, err := normalizeStorageLocation("garage"); err == nil {
		t.Fatal("expected unsupported storage location to fail")
	}
}

func TestBuildSpoilageAssessmentForcesHighRiskWhenDiscardIsVisible(t *testing.T) {
	assessment := buildSpoilageAssessment(&aiVisionResult{
		KondisiVisual:          "discard",
		RisikoPembusukan:       "low",
		RekomendasiPenyimpanan: "Jangan dikonsumsi bila ragu.",
	}, "refrigerator")
	if assessment.RiskLevel != "high" || assessment.StorageLocation != "refrigerator" {
		t.Fatalf("unexpected assessment: %+v", assessment)
	}
}

func TestBatchVisionResponseParsesDistinctItems(t *testing.T) {
	response := `{"items":[{"nama_produk":"Bayam","ada_tanggal_tercetak":false,"kategori":"sayur_hijau"},{"nama_produk":"Susu","ada_tanggal_tercetak":true,"expiry_date":"2026-09-10","kategori":"susu_segar_non_uht"}]}`

	var batch aiVisionBatchResult
	if err := json.Unmarshal(extractJSONObject(response), &batch); err != nil {
		t.Fatalf("parse batch response: %v", err)
	}
	if len(batch.Items) != 2 || batch.Items[0].NamaProduk != "Bayam" || batch.Items[1].ExpiryDate != "2026-09-10" {
		t.Fatalf("unexpected batch result: %+v", batch)
	}
}

func TestBatchVisionAllowsEnoughOutputForManyItems(t *testing.T) {
	if batchVisionMaxOutputTokens <= singleVisionMaxOutputTokens {
		t.Fatalf(
			"batch output limit (%d) must exceed single-item limit (%d)",
			batchVisionMaxOutputTokens,
			singleVisionMaxOutputTokens,
		)
	}
}

func TestNewPhotoItemUsesEstimatedExpiryForFreshFood(t *testing.T) {
	now := time.Date(2026, time.September, 1, 0, 0, 0, 0, time.UTC)
	item, err := newPhotoItem("user-id", &aiVisionResult{NamaProduk: "Bayam", Kategori: "sayur_hijau"}, now)
	if err != nil {
		t.Fatalf("new photo item: %v", err)
	}
	if !item.IsEstimated || item.ExpiryDate != now.AddDate(0, 0, 4) {
		t.Fatalf("unexpected estimated item: %+v", item)
	}
}
