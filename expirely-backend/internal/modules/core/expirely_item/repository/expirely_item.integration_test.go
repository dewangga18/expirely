//go:build integration

package repository

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"venturo-skeleton-go/internal/config"
	"venturo-skeleton-go/internal/modules/core/expirely_item/domain"
)

const (
	testOwnerID  = "10000000-0000-0000-0000-000000000001"
	testClientID = "10000000-0000-0000-0000-000000000002"
)

func integrationRepository(t *testing.T) (*Repository, *pgxpool.Pool) {
	t.Helper()
	pool, err := pgxpool.New(context.Background(), config.Load().Database.GetDSN())
	if err != nil {
		t.Fatalf("connect database: %v", err)
	}
	if err := pool.Ping(context.Background()); err != nil {
		pool.Close()
		t.Fatalf("ping database: %v", err)
	}
	return NewRepository(pool), pool
}

func TestRepositoryScopesItemsAndQuotaPerUser(t *testing.T) {
	repo, pool := integrationRepository(t)
	defer pool.Close()
	ctx := context.Background()
	itemID := uuid.NewString()
	quotaDate := "2099-12-31"

	defer func() {
		_, _ = pool.Exec(ctx, "DELETE FROM core.expirely_items WHERE id = $1", itemID)
		_, _ = pool.Exec(ctx, "DELETE FROM core.expirely_quotas WHERE user_id = $1 AND date = $2", testOwnerID, quotaDate)
	}()

	item := &domain.ExpirelyItem{
		ID: itemID, UserID: testOwnerID, NamaProduk: "Integration item",
		ExpiryDate: time.Now().AddDate(0, 0, 2), Status: domain.StatusActive, Source: "manual",
	}
	if err := repo.Create(ctx, item); err != nil {
		t.Fatalf("create item: %v", err)
	}
	if _, err := repo.FindByID(ctx, testOwnerID, itemID); err != nil {
		t.Fatalf("owner should find item: %v", err)
	}
	if _, err := repo.FindByID(ctx, testClientID, itemID); !errors.Is(err, ErrNotFound) {
		t.Fatalf("other user should get ErrNotFound, got %v", err)
	}
	if _, err := repo.UpdateStatus(ctx, testClientID, itemID, domain.StatusWasted); !errors.Is(err, ErrNotFound) {
		t.Fatalf("other user should not update item, got %v", err)
	}

	for attempt := 1; attempt <= 2; attempt++ {
		ok, err := repo.TryConsumeQuota(ctx, testOwnerID, quotaDate, "recognition", 2)
		if err != nil || !ok {
			t.Fatalf("consume quota attempt %d: ok=%v err=%v", attempt, ok, err)
		}
	}
	if ok, err := repo.TryConsumeQuota(ctx, testOwnerID, quotaDate, "recognition", 2); err != nil || ok {
		t.Fatalf("base quota should be exhausted: ok=%v err=%v", ok, err)
	}
	if err := repo.GrantReward(ctx, testOwnerID, quotaDate, "recognition"); err != nil {
		t.Fatalf("grant reward: %v", err)
	}
	if ok, err := repo.TryConsumeQuota(ctx, testOwnerID, quotaDate, "recognition", 2); err != nil || !ok {
		t.Fatalf("reward should add capacity: ok=%v err=%v", ok, err)
	}
}
