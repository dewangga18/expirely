package repository

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"venturo-skeleton-go/internal/modules/core/expirely_item/domain"
	"venturo-skeleton-go/pkg/logger"
)

var ErrNotFound = errors.New("expirely item not found")

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

// Create inserts a new expirely item.
func (r *Repository) Create(ctx context.Context, item *domain.ExpirelyItem) error {
	query := `
		INSERT INTO core.expirely_items (id, user_id, nama_produk, kategori, expiry_date, is_estimated, status, source)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING created_at, updated_at
	`
	err := r.db.QueryRow(ctx, query,
		item.ID, item.UserID, item.NamaProduk, item.Kategori, item.ExpiryDate,
		item.IsEstimated, item.Status, item.Source,
	).Scan(&item.CreatedAt, &item.UpdatedAt)
	if err != nil {
		logger.Error("Failed to create expirely item", logger.Err(err))
		return err
	}
	return nil
}

// FindByID returns an item by id.
func (r *Repository) FindByID(ctx context.Context, userID, id string) (*domain.ExpirelyItem, error) {
	query := `
		SELECT id, nama_produk, kategori, expiry_date, is_estimated, status, source, created_at, updated_at
		FROM core.expirely_items
		WHERE user_id = $1 AND id = $2
	`
	var item domain.ExpirelyItem
	err := r.db.QueryRow(ctx, query, userID, id).Scan(
		&item.ID, &item.NamaProduk, &item.Kategori, &item.ExpiryDate,
		&item.IsEstimated, &item.Status, &item.Source, &item.CreatedAt, &item.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		logger.Error("Failed to scan expirely item", logger.Err(err))
		return nil, err
	}
	return &item, nil
}

// FindAll returns all items sorted by expiry urgency (nearest first).
func (r *Repository) FindAll(ctx context.Context, userID string) ([]domain.ExpirelyItem, error) {
	query := `
		SELECT id, nama_produk, kategori, expiry_date, is_estimated, status, source, created_at, updated_at
		FROM core.expirely_items
		WHERE user_id = $1 AND status = 'active'
		ORDER BY expiry_date ASC
	`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		logger.Error("Failed to list expirely items", logger.Err(err))
		return nil, err
	}
	defer rows.Close()

	var items []domain.ExpirelyItem
	for rows.Next() {
		var item domain.ExpirelyItem
		if err := rows.Scan(
			&item.ID, &item.NamaProduk, &item.Kategori, &item.ExpiryDate,
			&item.IsEstimated, &item.Status, &item.Source, &item.CreatedAt, &item.UpdatedAt,
		); err != nil {
			logger.Error("Failed to scan expirely item row", logger.Err(err))
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

// FindUrgentByIDs returns active user-owned items expiring within the threshold.
func (r *Repository) FindUrgentByIDs(ctx context.Context, userID string, ids []string, threshold time.Time) ([]domain.ExpirelyItem, error) {
	query := `
		SELECT id, nama_produk, kategori, expiry_date, is_estimated, status, source, created_at, updated_at
		FROM core.expirely_items
		WHERE user_id = $1
		  AND id = ANY($2::uuid[])
		  AND status = 'active'
		  AND expiry_date <= $3
		ORDER BY expiry_date ASC
	`
	rows, err := r.db.Query(ctx, query, userID, ids, threshold)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []domain.ExpirelyItem
	for rows.Next() {
		var item domain.ExpirelyItem
		if err := rows.Scan(
			&item.ID, &item.NamaProduk, &item.Kategori, &item.ExpiryDate,
			&item.IsEstimated, &item.Status, &item.Source, &item.CreatedAt, &item.UpdatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

// Update edits an item's fields.
func (r *Repository) Update(ctx context.Context, userID, id string, namaProduk, kategori *string, expiryDate *time.Time, isEstimated *bool) (*domain.ExpirelyItem, error) {
	query := `
		UPDATE core.expirely_items
		SET nama_produk = COALESCE($3, nama_produk),
		    kategori = COALESCE($4, kategori),
		    expiry_date = COALESCE($5, expiry_date),
		    is_estimated = COALESCE($6, is_estimated),
		    updated_at = NOW()
		WHERE user_id = $1 AND id = $2
		RETURNING id, nama_produk, kategori, expiry_date, is_estimated, status, source, created_at, updated_at
	`
	var item domain.ExpirelyItem
	err := r.db.QueryRow(ctx, query, userID, id, namaProduk, kategori, expiryDate, isEstimated).Scan(
		&item.ID, &item.NamaProduk, &item.Kategori, &item.ExpiryDate,
		&item.IsEstimated, &item.Status, &item.Source, &item.CreatedAt, &item.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		logger.Error("Failed to update expirely item", logger.Err(err))
		return nil, err
	}
	return &item, nil
}

// UpdateStatus changes the status of an item (active/consumed/wasted).
func (r *Repository) UpdateStatus(ctx context.Context, userID, id string, status domain.ItemStatus) (*domain.ExpirelyItem, error) {
	query := `
		UPDATE core.expirely_items
		SET status = $3, updated_at = NOW()
		WHERE user_id = $1 AND id = $2
		RETURNING id, nama_produk, kategori, expiry_date, is_estimated, status, source, created_at, updated_at
	`
	var item domain.ExpirelyItem
	err := r.db.QueryRow(ctx, query, userID, id, status).Scan(
		&item.ID, &item.NamaProduk, &item.Kategori, &item.ExpiryDate,
		&item.IsEstimated, &item.Status, &item.Source, &item.CreatedAt, &item.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		logger.Error("Failed to update expirely item status", logger.Err(err))
		return nil, err
	}
	return &item, nil
}

type DailyQuota struct {
	RecognitionUsed     int
	RecognitionBonus    int
	RecommendationUsed  int
	RecommendationBonus int
}

// GetDailyQuota returns or creates today's user-scoped quota record.
func (r *Repository) GetDailyQuota(ctx context.Context, userID, date string) (*DailyQuota, error) {
	query := `
		INSERT INTO core.expirely_quotas (user_id, date)
		VALUES ($1, $2)
		ON CONFLICT (user_id, date) DO NOTHING
	`
	_, err := r.db.Exec(ctx, query, userID, date)
	if err != nil {
		return nil, err
	}

	selectQuery := `
		SELECT recognition_count, recognition_bonus,
		       recommendation_count, recommendation_bonus
		FROM core.expirely_quotas
		WHERE user_id = $1 AND date = $2
	`
	var quota DailyQuota
	err = r.db.QueryRow(ctx, selectQuery, userID, date).Scan(
		&quota.RecognitionUsed,
		&quota.RecognitionBonus,
		&quota.RecommendationUsed,
		&quota.RecommendationBonus,
	)
	return &quota, err
}

// TryConsumeQuota atomically reserves one quota unit if the user still has capacity.
func (r *Repository) TryConsumeQuota(ctx context.Context, userID, date, counter string, baseLimit int) (bool, error) {
	if _, err := r.GetDailyQuota(ctx, userID, date); err != nil {
		return false, err
	}

	var query string
	switch counter {
	case "recognition":
		query = `
			UPDATE core.expirely_quotas
			SET recognition_count = recognition_count + 1
			WHERE user_id = $1 AND date = $2
			  AND recognition_count < $3 + recognition_bonus
			RETURNING recognition_count
		`
	case "recommendation":
		query = `
			UPDATE core.expirely_quotas
			SET recommendation_count = recommendation_count + 1
			WHERE user_id = $1 AND date = $2
			  AND recommendation_count < $3 + recommendation_bonus
			RETURNING recommendation_count
		`
	default:
		return false, errors.New("invalid counter")
	}
	var count int
	err := r.db.QueryRow(ctx, query, userID, date, baseLimit).Scan(&count)
	if errors.Is(err, pgx.ErrNoRows) {
		return false, nil
	}
	return err == nil, err
}

// ReleaseQuota releases a reservation after an AI provider failure.
func (r *Repository) ReleaseQuota(ctx context.Context, userID, date, counter string) error {
	var column string
	switch counter {
	case "recognition":
		column = "recognition_count"
	case "recommendation":
		column = "recommendation_count"
	default:
		return errors.New("invalid counter")
	}
	query := `UPDATE core.expirely_quotas SET ` + column + ` = GREATEST(` + column + ` - 1, 0)
		WHERE user_id = $1 AND date = $2`
	_, err := r.db.Exec(ctx, query, userID, date)
	return err
}

// GrantReward adds one rewarded-ad bonus, capped by the database at three per kind/day.
func (r *Repository) GrantReward(ctx context.Context, userID, date, kind string) error {
	if _, err := r.GetDailyQuota(ctx, userID, date); err != nil {
		return err
	}
	var column string
	switch kind {
	case "recognition":
		column = "recognition_bonus"
	case "recommendation":
		column = "recommendation_bonus"
	default:
		return errors.New("invalid reward kind")
	}
	query := `UPDATE core.expirely_quotas SET ` + column + ` = ` + column + ` + 1
		WHERE user_id = $1 AND date = $2 AND ` + column + ` < 3 RETURNING ` + column
	var bonus int
	err := r.db.QueryRow(ctx, query, userID, date).Scan(&bonus)
	if errors.Is(err, pgx.ErrNoRows) {
		return errors.New("daily reward limit reached")
	}
	return err
}

// GetStats returns item counts by status and expiring-soon count.
type StatsResult struct {
	TotalActive   int `json:"total_active"`
	TotalConsumed int `json:"total_consumed"`
	TotalWasted   int `json:"total_wasted"`
	ExpiringSoon  int `json:"expiring_soon"`
}

func (r *Repository) GetStats(ctx context.Context, userID string) (*StatsResult, error) {
	query := `
		SELECT
		  COUNT(*) FILTER (WHERE status = 'active') AS total_active,
		  COUNT(*) FILTER (WHERE status = 'consumed') AS total_consumed,
		  COUNT(*) FILTER (WHERE status = 'wasted') AS total_wasted,
		  COUNT(*) FILTER (WHERE status = 'active' AND expiry_date <= CURRENT_DATE + INTERVAL '3 days') AS expiring_soon
		FROM core.expirely_items
		WHERE user_id = $1
	`
	var stats StatsResult
	err := r.db.QueryRow(ctx, query, userID).Scan(&stats.TotalActive, &stats.TotalConsumed, &stats.TotalWasted, &stats.ExpiringSoon)
	if err != nil {
		logger.Error("Failed to get expirely stats", logger.Err(err))
		return nil, err
	}
	return &stats, nil
}
