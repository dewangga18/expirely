package expirely_item

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"

	jwtpkg "venturo-skeleton-go/pkg/jwt"
)

func testRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	module := Initialize(nil)
	module.SetupRoutes(router.Group("/core/v1"))
	return router
}

func authToken(t *testing.T) string {
	t.Helper()
	token, err := jwtpkg.GenerateToken(
		"10000000-0000-0000-0000-000000000001",
		"", "", "", "", "owner@example.com", "owner", "Owner", false, nil,
	)
	if err != nil {
		t.Fatalf("generate token: %v", err)
	}
	return token
}

func performRequest(router http.Handler, method, path, body, token string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(method, path, strings.NewReader(body))
	if body != "" {
		req.Header.Set("Content-Type", "application/json")
	}
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, req)
	return recorder
}

func TestExpirelyRoutesRequireAuthentication(t *testing.T) {
	router := testRouter()
	cases := []struct {
		method string
		path   string
	}{
		{http.MethodGet, "/core/v1/items"},
		{http.MethodPost, "/core/v1/items"},
		{http.MethodPost, "/core/v1/items/photo"},
		{http.MethodGet, "/core/v1/items/10000000-0000-0000-0000-000000000001"},
		{http.MethodPatch, "/core/v1/items/10000000-0000-0000-0000-000000000001"},
		{http.MethodPatch, "/core/v1/items/10000000-0000-0000-0000-000000000001/status"},
		{http.MethodPost, "/core/v1/recommend"},
		{http.MethodGet, "/core/v1/quota"},
		{http.MethodPost, "/core/v1/quota/reward"},
		{http.MethodGet, "/core/v1/stats"},
	}

	for _, tc := range cases {
		t.Run(tc.method+" "+tc.path, func(t *testing.T) {
			response := performRequest(router, tc.method, tc.path, `{}`, "")
			if response.Code != http.StatusUnauthorized {
				t.Fatalf("expected 401, got %d: %s", response.Code, response.Body.String())
			}
		})
	}
}

func TestExpirelyValidationStopsBeforeDatabase(t *testing.T) {
	router := testRouter()
	token := authToken(t)
	cases := []struct {
		name   string
		method string
		path   string
		body   string
		want   int
	}{
		{"invalid item id", http.MethodGet, "/core/v1/items/not-a-uuid", "", http.StatusBadRequest},
		{"blank product", http.MethodPost, "/core/v1/items", `{"nama_produk":"   ","expiry_date":"2026-09-01"}`, http.StatusBadRequest},
		{"invalid photo type", http.MethodPost, "/core/v1/items/photo", `{"photo_base64":"aGVsbG8=","mime_type":"text/plain"}`, http.StatusBadRequest},
		{"invalid recommendation id", http.MethodPost, "/core/v1/recommend", `{"items":[{"id":"bad","nama_produk":"Bayam"}]}`, http.StatusBadRequest},
		{"invalid reward kind", http.MethodPost, "/core/v1/quota/reward", `{"kind":"anything"}`, http.StatusBadRequest},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			response := performRequest(router, tc.method, tc.path, tc.body, token)
			if response.Code != tc.want {
				t.Fatalf("expected %d, got %d: %s", tc.want, response.Code, response.Body.String())
			}
		})
	}
}
