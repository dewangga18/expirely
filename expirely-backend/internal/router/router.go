package router

import (
	"context"
	"time"
	"venturo-skeleton-go/internal/config"
	"venturo-skeleton-go/internal/middleware"

	// Core modules
	"venturo-skeleton-go/internal/modules/core/auth"
	"venturo-skeleton-go/internal/modules/core/branch"
	"venturo-skeleton-go/internal/modules/core/client"
	"venturo-skeleton-go/internal/modules/core/company"
	"venturo-skeleton-go/internal/modules/core/expirely_item"
	"venturo-skeleton-go/internal/modules/core/role"
	"venturo-skeleton-go/internal/modules/core/user"
	userRepo "venturo-skeleton-go/internal/modules/core/user/repository"

	"venturo-skeleton-go/internal/shared/authz"
	sharedRedis "venturo-skeleton-go/internal/shared/redis"

	pkgfirebase "venturo-skeleton-go/pkg/firebase"
	"venturo-skeleton-go/pkg/logger"

	"github.com/gin-contrib/cors"
	ginzap "github.com/gin-contrib/zap"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/zap"
)

func Setup(router *gin.Engine, db *pgxpool.Pool, cfg *config.Config) {
	log := logger.GetLogger()
	if err := router.SetTrustedProxies(nil); err != nil {
		log.Fatal("Failed to disable trusted proxies", zap.Error(err))
	}

	// Redis for permission cache
	redisClient, err := sharedRedis.New(context.Background(), cfg.Redis)
	if err != nil {
		log.Warn("Redis unavailable; permission cache disabled", zap.Error(err))
	} else {
		log.Info("Redis connected",
			zap.String("addr", cfg.Redis.Host+":"+cfg.Redis.Port),
			zap.Int("db", cfg.Redis.DB),
			zap.Duration("permission_ttl", cfg.Redis.PermissionTTL),
		)
	}

	router.Use(ginzap.Ginzap(log, time.RFC3339, true))
	router.Use(ginzap.RecoveryWithZap(log, true))

	// CORS. Never allow a wildcard origin together with credentials.
	allowedOrigins := []string{
		"http://localhost:5173", "http://127.0.0.1:5173",
		"http://localhost:3000", "http://127.0.0.1:3000",
		"http://localhost:8081", "http://127.0.0.1:8081",
	}
	if cfg.Server.FrontendURL != "" && cfg.Server.FrontendURL != "*" {
		allowedOrigins = append(allowedOrigins, cfg.Server.FrontendURL)
	}
	router.Use(cors.New(cors.Config{
		AllowOrigins:     allowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"message": "Expirely API is running",
		})
	})

	// Core v1 routes
	coreV1 := router.Group("/core/v1")
	{
		// Client module (needed by auth signup)
		clientModule := client.Initialize(db)
		clientModule.SetupRoutes(coreV1)

		// Auth module
		authModule := auth.Initialize(db, cfg)
		authModule.SetupRoutes(coreV1)
		authModule.Service.SetUserIdentityRepo(userRepo.NewUserIdentityRepository(db))

		// Firebase (optional)
		if cfg.Firebase.ProjectID != "" {
			fbClient, err := pkgfirebase.New(context.Background(), cfg.Firebase.ProjectID, cfg.Firebase.CredentialsJSON)
			if err != nil {
				log.Fatal("Failed to initialize Firebase Admin", zap.Error(err))
			}
			authModule.Service.SetFirebaseVerifier(fbClient)
			log.Info("Firebase Admin initialized", zap.String("project_id", cfg.Firebase.ProjectID))
		} else {
			log.Warn("FIREBASE_PROJECT_ID not set — /auth/google endpoint disabled")
		}

		// User module
		userModule := user.Initialize(db)
		userModule.SetupRoutes(coreV1)

		// Role module
		roleModule := role.Initialize(db)
		roleModule.SetupRoutes(coreV1)

		// Authz cache
		authzService := authz.NewService(redisClient, roleModule.Repository, cfg.Redis.PermissionTTL)
		middleware.SetAuthzService(authzService)
		roleModule.Service.SetPermissionCacheInvalidator(authzService)
		authModule.Service.SetPermissionReader(authzService)

		// Company module
		companyModule := company.Initialize(db)
		companyModule.SetupRoutes(coreV1)
		companyModule.SetupUserCompanyRoutes(coreV1)

		// Branch module
		branchModule := branch.Initialize(db)
		branchModule.SetupRoutes(coreV1)
		branchModule.SetupUserBranchRoutes(coreV1)

		// Wire auth dependencies
		authModule.Service.SetCompanyUserRepo(companyModule.UserRepository)
		authModule.Service.SetCompanyRepo(companyModule.Repository)
		authModule.Service.SetRoleRepo(roleModule.Repository)
		authModule.Service.SetBranchRepo(branchModule.Repository)
		authModule.Service.SetClientService(clientModule.Service)

		// Wire company dependencies
		companyModule.Service.SetClientLookup(clientModule.Repository)
		companyModule.Service.SetBranchRepo(branchModule.Repository)
		companyModule.Service.SetDefaultAdminRoleID(cfg.Auth.DefaultAdminRoleID)

		// Wire branch dependencies
		branchModule.UserBranchService.SetScopeResolver(companyModule.Repository)
		branchModule.Service.SetCompanyMembershipLookup(companyModule.UserRepository)

		// Wire user dependencies
		userModule.Service.SetCompanySyncer(companyModule.Service)
		userModule.Service.SetBranchSyncer(branchModule.UserBranchService)
		userModule.Service.SetRoleLookup(roleModule.Repository)

		// Middleware verifiers
		middleware.SetCompanyContextVerifier(companyModule.UserRepository)
		userModule.Handler.SetCompanyVerifier(companyModule.UserRepository)
		middleware.SetUserBranchResolver(branchModule.UserBranchRepository)

		// === Expirely Item module ===
		expirelyItemModule := expirely_item.Initialize(db)
		expirelyItemModule.SetupRoutes(coreV1)
	}

	log.Info("Routes setup completed", zap.Int("routes", len(router.Routes())))
}
