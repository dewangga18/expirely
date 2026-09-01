//go:build integration

package expirely_item

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"venturo-skeleton-go/internal/config"
	jwtpkg "venturo-skeleton-go/pkg/jwt"
)

const integrationOwnerID = "10000000-0000-0000-0000-000000000001"

type integrationResponse struct {
	Data json.RawMessage `json:"data"`
}

func integrationRouter(t *testing.T) (*gin.Engine, *pgxpool.Pool) {
	t.Helper()
	pool, err := pgxpool.New(context.Background(), config.Load().Database.GetDSN())
	if err != nil {
		t.Fatalf("connect database: %v", err)
	}
	if err := pool.Ping(context.Background()); err != nil {
		pool.Close()
		t.Fatalf("ping database: %v", err)
	}
	gin.SetMode(gin.TestMode)
	router := gin.New()
	Initialize(pool).SetupRoutes(router.Group("/core/v1"))
	return router, pool
}

func integrationToken(t *testing.T, userID string) string {
	t.Helper()
	token, err := jwtpkg.GenerateToken(
		userID, "", "", "", "", "integration@example.com", "integration", "Integration User", false, nil,
	)
	if err != nil {
		t.Fatalf("generate token: %v", err)
	}
	return token
}

func responseData(t *testing.T, body []byte, target any) {
	t.Helper()
	var envelope integrationResponse
	if err := json.Unmarshal(body, &envelope); err != nil {
		t.Fatalf("decode response envelope: %v; body=%s", err, body)
	}
	if err := json.Unmarshal(envelope.Data, target); err != nil {
		t.Fatalf("decode response data: %v; body=%s", err, body)
	}
}

func TestHTTPManualItemLifecycleAndOwnership(t *testing.T) {
	router, pool := integrationRouter(t)
	defer pool.Close()
	ownerToken := integrationToken(t, integrationOwnerID)
	otherToken := integrationToken(t, "10000000-0000-0000-0000-000000000002")
	productName := "HTTP integration " + uuid.NewString()

	created := performRequest(
		router,
		http.MethodPost,
		"/core/v1/items",
		fmt.Sprintf(`{"nama_produk":%q,"kategori":"buah_segar","expiry_date":"2099-12-30"}`, productName),
		ownerToken,
	)
	if created.Code != http.StatusCreated {
		t.Fatalf("create expected 201, got %d: %s", created.Code, created.Body.String())
	}
	var item struct {
		ID          string `json:"id"`
		NamaProduk  string `json:"nama_produk"`
		Status      string `json:"status"`
		ExpiryDate  string `json:"expiry_date"`
		IsEstimated bool   `json:"is_estimated"`
	}
	responseData(t, created.Body.Bytes(), &item)
	if item.ID == "" || item.NamaProduk != productName || item.Status != "active" {
		t.Fatalf("unexpected created item: %+v", item)
	}
	defer func() {
		_, _ = pool.Exec(context.Background(), "DELETE FROM core.expirely_items WHERE id = $1", item.ID)
	}()

	otherRead := performRequest(router, http.MethodGet, "/core/v1/items/"+item.ID, "", otherToken)
	if otherRead.Code != http.StatusNotFound {
		t.Fatalf("other user read expected 404, got %d: %s", otherRead.Code, otherRead.Body.String())
	}

	updated := performRequest(
		router,
		http.MethodPatch,
		"/core/v1/items/"+item.ID,
		`{"nama_produk":"HTTP integration updated","expiry_date":"2099-12-31"}`,
		ownerToken,
	)
	if updated.Code != http.StatusOK {
		t.Fatalf("update expected 200, got %d: %s", updated.Code, updated.Body.String())
	}
	responseData(t, updated.Body.Bytes(), &item)
	if item.NamaProduk != "HTTP integration updated" || item.ExpiryDate != "2099-12-31" {
		t.Fatalf("unexpected updated item: %+v", item)
	}

	consumed := performRequest(
		router,
		http.MethodPatch,
		"/core/v1/items/"+item.ID+"/status",
		`{"status":"consumed"}`,
		ownerToken,
	)
	if consumed.Code != http.StatusOK {
		t.Fatalf("status expected 200, got %d: %s", consumed.Code, consumed.Body.String())
	}
	responseData(t, consumed.Body.Bytes(), &item)
	if item.Status != "consumed" {
		t.Fatalf("unexpected item status: %+v", item)
	}
}
