package handler

import (
	"encoding/base64"
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"venturo-skeleton-go/internal/middleware"
	"venturo-skeleton-go/internal/modules/core/expirely_item/domain"
	"venturo-skeleton-go/internal/modules/core/expirely_item/dto"
	"venturo-skeleton-go/internal/modules/core/expirely_item/service"
	"venturo-skeleton-go/internal/shared/response"
	"venturo-skeleton-go/pkg/logger"
)

type Handler struct {
	svc *service.Service
}

func NewHandler(svc *service.Service) *Handler {
	return &Handler{svc: svc}
}

// CreateManual handles POST /api/v1/items (manual input).
func (h *Handler) CreateManual(c *gin.Context) {
	var req dto.CreateItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid request payload", err.Error())
		return
	}

	result, err := h.svc.CreateManual(c.Request.Context(), middleware.MustGetUserID(c), &req)
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.Success(c, http.StatusCreated, "Item created successfully", result)
}

// CreateFromPhoto handles POST /api/v1/items/photo (AI recognition).
// Accepts a base64-encoded image. Remote URLs are intentionally unsupported.
func (h *Handler) CreateFromPhoto(c *gin.Context) {
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 15<<20)
	var req struct {
		PhotoBase64     string `json:"photo_base64"`
		MimeType        string `json:"mime_type"`
		StorageLocation string `json:"storage_location" binding:"omitempty,oneof=room_temperature refrigerator freezer pantry unknown"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		var maxBytesErr *http.MaxBytesError
		if errors.As(err, &maxBytesErr) {
			response.Error(c, http.StatusRequestEntityTooLarge, "Image is too large", "Maximum request size is 15MB")
			return
		}
		response.Error(c, http.StatusBadRequest, "Invalid request payload", err.Error())
		return
	}

	if req.PhotoBase64 == "" {
		response.Error(c, http.StatusBadRequest, "photo_base64 is required", "")
		return
	}
	allowedTypes := map[string]bool{
		"image/jpeg": true,
		"image/png":  true,
		"image/webp": true,
		"image/gif":  true,
	}
	if req.MimeType == "" {
		req.MimeType = "image/jpeg"
	}
	if !allowedTypes[req.MimeType] {
		response.Error(c, http.StatusBadRequest, "Unsupported image type", "Use JPEG, PNG, WebP, or GIF")
		return
	}
	decoded, err := base64.StdEncoding.DecodeString(req.PhotoBase64)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid base64 image", "")
		return
	}
	if len(decoded) > 10<<20 {
		response.Error(c, http.StatusRequestEntityTooLarge, "Image is too large", "Maximum size is 10MB")
		return
	}

	result, err := h.svc.CreateFromPhoto(c.Request.Context(), middleware.MustGetUserID(c), req.PhotoBase64, req.MimeType, req.StorageLocation)
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.Success(c, http.StatusCreated, "Item created from photo", result)
}

// List handles GET /api/v1/items.
func (h *Handler) List(c *gin.Context) {
	result, err := h.svc.List(c.Request.Context(), middleware.MustGetUserID(c))
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.Success(c, http.StatusOK, "Items retrieved successfully", result)
}

// GetByID handles GET /api/v1/items/:id.
func (h *Handler) GetByID(c *gin.Context) {
	id := c.Param("id")
	if _, err := uuid.Parse(id); err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid item ID", "")
		return
	}
	result, err := h.svc.GetByID(c.Request.Context(), middleware.MustGetUserID(c), id)
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.Success(c, http.StatusOK, "Item retrieved successfully", result)
}

// Update handles PATCH /api/v1/items/:id.
func (h *Handler) Update(c *gin.Context) {
	id := c.Param("id")
	if _, err := uuid.Parse(id); err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid item ID", "")
		return
	}
	var req dto.UpdateItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid request payload", err.Error())
		return
	}

	result, err := h.svc.Update(c.Request.Context(), middleware.MustGetUserID(c), id, &req)
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.Success(c, http.StatusOK, "Item updated successfully", result)
}

// UpdateStatus handles PATCH /api/v1/items/:id/status.
func (h *Handler) UpdateStatus(c *gin.Context) {
	id := c.Param("id")
	if _, err := uuid.Parse(id); err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid item ID", "")
		return
	}
	var req dto.UpdateStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid request payload", err.Error())
		return
	}

	result, err := h.svc.UpdateStatus(c.Request.Context(), middleware.MustGetUserID(c), id, domain.ItemStatus(req.Status))
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.Success(c, http.StatusOK, "Item status updated", result)
}

// Recommend handles POST /api/v1/recommend.
func (h *Handler) Recommend(c *gin.Context) {
	var req dto.RecommendRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid request payload", err.Error())
		return
	}

	result, err := h.svc.Recommend(c.Request.Context(), middleware.MustGetUserID(c), &req)
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.Success(c, http.StatusOK, "Recommendations generated", result)
}

// GetQuota handles GET /api/v1/quota.
func (h *Handler) GetQuota(c *gin.Context) {
	result, err := h.svc.GetQuota(c.Request.Context(), middleware.MustGetUserID(c))
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.Success(c, http.StatusOK, "Quota retrieved successfully", result)
}

// GetStats handles GET /api/v1/stats.
func (h *Handler) GetStats(c *gin.Context) {
	result, err := h.svc.GetStats(c.Request.Context(), middleware.MustGetUserID(c))
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.Success(c, http.StatusOK, "Stats retrieved successfully", result)
}

// GrantReward handles POST /api/v1/quota/reward.
func (h *Handler) GrantReward(c *gin.Context) {
	var req dto.RewardQuotaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid request payload", err.Error())
		return
	}
	result, err := h.svc.GrantReward(c.Request.Context(), middleware.MustGetUserID(c), req.Kind)
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.Success(c, http.StatusOK, "Reward quota added", result)
}

func (h *Handler) handleError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, service.ErrNotFound):
		response.Error(c, http.StatusNotFound, "Item not found", "")
	case errors.Is(err, service.ErrQuotaExceeded):
		response.Error(c, http.StatusTooManyRequests, "Daily quota exceeded", "Watch an ad to get more quota")
	case errors.Is(err, service.ErrNoUrgentItems):
		response.Error(c, http.StatusBadRequest, "No items are expiring within 7 days", "")
	case errors.Is(err, service.ErrRewardLimit):
		response.Error(c, http.StatusTooManyRequests, "Daily rewarded-ad limit reached", "Maximum 3 bonus uses per feature")
	case errors.Is(err, service.ErrInvalidInput):
		response.Error(c, http.StatusBadRequest, "Invalid item data", err.Error())
	default:
		logger.Error("Expirely request failed", logger.Err(err))
		response.Error(c, http.StatusInternalServerError, "Internal server error", "Please try again")
	}
}
