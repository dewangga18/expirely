package expirely_item

import (
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"

	"venturo-skeleton-go/internal/middleware"
	"venturo-skeleton-go/internal/modules/core/expirely_item/handler"
	"venturo-skeleton-go/internal/modules/core/expirely_item/repository"
	"venturo-skeleton-go/internal/modules/core/expirely_item/service"
)

type Module struct {
	Handler    *handler.Handler
	Service    *service.Service
	Repository *repository.Repository
}

func Initialize(db *pgxpool.Pool) *Module {
	repo := repository.NewRepository(db)
	svc := service.NewService(repo)
	hdlr := handler.NewHandler(svc)

	return &Module{
		Handler:    hdlr,
		Service:    svc,
		Repository: repo,
	}
}

// SetupRoutes mounts the expirely item API endpoints.
func (m *Module) SetupRoutes(router *gin.RouterGroup) {
	protected := router.Group("")
	protected.Use(middleware.JWTAuth())

	items := protected.Group("/items")
	{
		items.POST("", m.Handler.CreateManual)
		items.POST("/photo", m.Handler.CreateFromPhoto)
		items.POST("/photo/batch", m.Handler.CreateBatchFromPhoto)
		items.GET("", m.Handler.List)
		items.GET("/:id", m.Handler.GetByID)
		items.PATCH("/:id", m.Handler.Update)
		items.PATCH("/:id/status", m.Handler.UpdateStatus)
	}

	protected.POST("/recommend", m.Handler.Recommend)
	protected.GET("/quota", m.Handler.GetQuota)
	protected.POST("/quota/reward", m.Handler.GrantReward)
	protected.GET("/stats", m.Handler.GetStats)
}
