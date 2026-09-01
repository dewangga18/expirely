package service

import (
	"context"
	"strings"
	"testing"
	"time"
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
