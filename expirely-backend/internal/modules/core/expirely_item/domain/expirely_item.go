package domain

import "time"

// ItemStatus represents the lifecycle status of an expirely item.
type ItemStatus string

const (
	StatusActive   ItemStatus = "active"
	StatusConsumed ItemStatus = "consumed"
	StatusWasted   ItemStatus = "wasted"
)

// ExpirelyItem represents a household item tracked for expiry.
type ExpirelyItem struct {
	ID          string     `json:"id"`
	UserID      string     `json:"-"`
	NamaProduk  string     `json:"nama_produk"`
	Kategori    *string    `json:"kategori,omitempty"`
	ExpiryDate  time.Time  `json:"expiry_date"`
	IsEstimated bool       `json:"is_estimated"`
	Status      ItemStatus `json:"status"`
	Source      string     `json:"source"` // "ai_photo" or "manual"
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

// ShelfLifeEntry is a static reference for estimating expiry of fresh items.
type ShelfLifeEntry struct {
	Kategori     string   `json:"kategori"`
	EstimasiHari int      `json:"estimasi_hari"`
	Contoh       []string `json:"contoh"`
}
