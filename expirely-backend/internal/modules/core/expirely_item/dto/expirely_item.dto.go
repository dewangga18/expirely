package dto

import "time"

// CreateItemRequest is the payload for adding an item manually.
type CreateItemRequest struct {
	NamaProduk  string  `json:"nama_produk" binding:"required,min=1,max=255"`
	Kategori    *string `json:"kategori" binding:"omitempty,max=100"`
	ExpiryDate  string  `json:"expiry_date" binding:"required"`
	IsEstimated bool    `json:"is_estimated"`
}

// UpdateItemRequest is the payload for editing an item.
type UpdateItemRequest struct {
	NamaProduk  *string `json:"nama_produk" binding:"omitempty,min=1,max=255"`
	Kategori    *string `json:"kategori" binding:"omitempty,max=100"`
	ExpiryDate  *string `json:"expiry_date"`
	IsEstimated *bool   `json:"is_estimated"`
}

// UpdateStatusRequest is the payload for marking consumed/wasted.
type UpdateStatusRequest struct {
	Status string `json:"status" binding:"required,oneof=active consumed wasted"`
}

// ItemResponse is the API response shape for a single item.
type ItemResponse struct {
	ID                 string              `json:"id"`
	NamaProduk         string              `json:"nama_produk"`
	Kategori           *string             `json:"kategori,omitempty"`
	ExpiryDate         string              `json:"expiry_date"`
	IsEstimated        bool                `json:"is_estimated"`
	Status             string              `json:"status"`
	Source             string              `json:"source"`
	CreatedAt          time.Time           `json:"created_at"`
	UpdatedAt          time.Time           `json:"updated_at"`
	SpoilageAssessment *SpoilageAssessment `json:"spoilage_assessment,omitempty"`
	EstimateBasis      *EstimateBasis      `json:"estimate_basis,omitempty"`
}

// EstimateBasis explains a category-based freshness estimate. It does not
// capture the item's real storage history and must not be treated as a safety guarantee.
type EstimateBasis struct {
	Category         string `json:"category"`
	EstimateDays     int    `json:"estimate_days"`
	SourceURL        string `json:"source_url"`
	SafetyDisclaimer string `json:"safety_disclaimer"`
}

// SpoilageAssessment is a photo-time risk indicator. It is not persisted and
// must never be interpreted as a food-safety guarantee.
type SpoilageAssessment struct {
	RiskLevel        string `json:"risk_level"`
	VisualCondition  string `json:"visual_condition"`
	StorageLocation  string `json:"storage_location"`
	Recommendation   string `json:"recommendation"`
	SafetyDisclaimer string `json:"safety_disclaimer"`
}

// ItemListResponse wraps a paginated list.
type ItemListResponse struct {
	Items []ItemResponse `json:"items"`
	Total int64          `json:"total"`
}

// RecommendRequest is the payload for AI recommendation.
type RecommendRequest struct {
	Items []RecommendItem `json:"items" binding:"required,min=1,max=20,dive"`
}

// RecommendItem is a single item in the recommendation request.
type RecommendItem struct {
	ID         string `json:"id" binding:"required,uuid"`
	NamaProduk string `json:"nama_produk" binding:"omitempty,max=255"`
}

// RecommendResponse is the AI recommendation result.
type RecommendResponse struct {
	Recommendations []Recommendation `json:"recommendations"`
}

// Recommendation is a single recommendation.
type Recommendation struct {
	ItemID      string `json:"item_id"`
	NamaProduk  string `json:"nama_produk"`
	Rekomendasi string `json:"rekomendasi"`
}

// QuotaResponse shows daily quota status.
type QuotaResponse struct {
	Date                string `json:"date"`
	RecognitionUsed     int    `json:"recognition_used"`
	RecognitionLimit    int    `json:"recognition_limit"`
	RecommendationUsed  int    `json:"recommendation_used"`
	RecommendationLimit int    `json:"recommendation_limit"`
}

// RewardQuotaRequest is the rewarded-ad mock payload.
type RewardQuotaRequest struct {
	Kind string `json:"kind" binding:"required,oneof=recognition recommendation"`
}

// StatsResponse shows dashboard statistics.
type StatsResponse struct {
	TotalActive   int `json:"total_active"`
	TotalConsumed int `json:"total_consumed"`
	TotalWasted   int `json:"total_wasted"`
	ExpiringSoon  int `json:"expiring_soon"`
}
