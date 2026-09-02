package service

import (
	"context"
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
