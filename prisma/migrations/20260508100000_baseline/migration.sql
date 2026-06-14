-- CreateEnum
CREATE TYPE "ReferralBoostKind" AS ENUM ('REFEREE_WELCOME', 'REFERRER_REWARD');

-- CreateEnum
CREATE TYPE "ReferralBoostStatus" AS ENUM ('PENDING', 'ACTIVE');

-- CreateEnum
CREATE TYPE "HistoriaMediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "PensumVersionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CLIENT', 'ADMIN');

-- CreateEnum
CREATE TYPE "ManualPaymentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PaymentSource" AS ENUM ('MOBILE_BS', 'CARD');

-- CreateEnum
CREATE TYPE "Estado" AS ENUM ('PENDIENTE', 'APROBADA', 'EN_PROGRESO', 'FINALIZADA', 'RECHAZADA');

-- CreateEnum
CREATE TYPE "OnboardingStatus" AS ENUM ('PENDIENTE', 'FINALIZADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoPrerrequisito" AS ENUM ('OBLIGATORIO', 'RECOMENDADO', 'CO_REQUISITO');

-- CreateEnum
CREATE TYPE "Semestre" AS ENUM ('S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10');

-- CreateEnum
CREATE TYPE "EstadoMateria" AS ENUM ('NO_CURSADA', 'EN_CURSO', 'APROBADA', 'APLAZADA', 'RETIRADA');

-- CreateEnum
CREATE TYPE "TipoRecurso" AS ENUM ('ANOTACION', 'RESUMEN', 'GUIA_ESTUDIO', 'EJERCICIOS', 'PRESENTACION', 'VIDEO', 'AUDIO', 'DOCUMENTO', 'ENLACE', 'TIP');

-- CreateEnum
CREATE TYPE "TipoMeta" AS ENUM ('PROMEDIO_GENERAL', 'MATERIAS_APROBADAS', 'CREDITOS_COMPLETADOS', 'SEMESTRE_ESPECIFICO', 'MATERIA_ESPECIFICA', 'HORAS_ESTUDIO');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT DEFAULT '/globe.svg',
    "password" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CLIENT',
    "isTwoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorPreferredMethod" TEXT NOT NULL DEFAULT 'TOTP',
    "twoFactorEmailFallbackEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "apellido" TEXT,
    "ciudadDeResidencia" TEXT,
    "estadoDeResidencia" TEXT,
    "onboardingStatus" "OnboardingStatus" NOT NULL DEFAULT 'PENDIENTE',
    "telefono" TEXT,
    "expediente" TEXT,
    "materiasActuales" TEXT,
    "semestreActual" TEXT,
    "semestreActualManual" BOOLEAN NOT NULL DEFAULT false,
    "caletaTutorialCompleted" BOOLEAN NOT NULL DEFAULT false,
    "universidadId" TEXT,
    "carreraId" TEXT,
    "profileBio" TEXT,
    "profileBannerUrl" TEXT,
    "profileGalleryUrls" JSONB,
    "referralCode" TEXT,
    "referredByUserId" TEXT,
    "walletBalanceCents" INTEGER NOT NULL DEFAULT 0,
    "iaConsumptionDiscountPercent" INTEGER NOT NULL DEFAULT 0,
    "iaModelChat" TEXT,
    "iaModelHeavy" TEXT,
    "iaModelCronograma" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralBoost" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "ReferralBoostKind" NOT NULL,
    "status" "ReferralBoostStatus" NOT NULL DEFAULT 'PENDING',
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "triggeredByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralBoost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletLedger" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deltaCents" INTEGER NOT NULL,
    "balanceAfterCents" INTEGER NOT NULL,
    "reason" VARCHAR(64) NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFollow" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserFollow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Historia" (
    "id" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "mediaUrl" TEXT NOT NULL,
    "mediaType" "HistoriaMediaType" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Historia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ba_session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ba_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ba_account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ba_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ba_verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ba_verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ba_twoFactor" (
    "id" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "backupCodes" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ba_twoFactor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "passkey" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "publicKey" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "credentialID" TEXT NOT NULL,
    "counter" INTEGER NOT NULL,
    "deviceType" TEXT NOT NULL,
    "backedUp" BOOLEAN NOT NULL,
    "transports" TEXT,
    "createdAt" TIMESTAMP(3),
    "aaguid" TEXT,

    CONSTRAINT "passkey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("provider","providerAccountId")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TwoFactorToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TwoFactorToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TwoFactorConfirmation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "TwoFactorConfirmation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StripeCustomer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripeCustomerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StripeCustomer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subscriptionTypeId" TEXT,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "stripeCurrentPeriodEnd" TIMESTAMP(3),
    "iaIncludedTokensUsed" INTEGER NOT NULL DEFAULT 0,
    "iaMeterPeriodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL,
    "period" TEXT NOT NULL,
    "billingKind" TEXT NOT NULL DEFAULT 'stripe_recurring',
    "minWalletTopUpCents" INTEGER NOT NULL DEFAULT 0,
    "includedIaTokensPerPeriod" INTEGER,
    "iaTokenOverflowPolicy" TEXT NOT NULL DEFAULT 'wallet',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IaFeatureCatalog" (
    "id" TEXT NOT NULL,
    "featureKey" TEXT NOT NULL,
    "displayNameEs" TEXT NOT NULL,
    "descriptionEs" TEXT,
    "vercelPricingUrl" TEXT NOT NULL,
    "listInputUsdPer1M" DOUBLE PRECISION,
    "listOutputUsdPer1M" DOUBLE PRECISION,
    "referenceModelIds" TEXT,
    "freeInTrial" BOOLEAN NOT NULL DEFAULT false,
    "meteredAfterTrial" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "IaFeatureCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionTypeIaAccess" (
    "id" TEXT NOT NULL,
    "subscriptionTypeId" TEXT NOT NULL,
    "iaFeatureCatalogId" TEXT NOT NULL,
    "accessKind" TEXT NOT NULL DEFAULT 'consumption',
    "notesEs" TEXT,

    CONSTRAINT "SubscriptionTypeIaAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Universidad" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "siglas" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "website" TEXT,
    "estado" TEXT NOT NULL,
    "ciudad" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'PÚBLICA',
    "ranking" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "password" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Universidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Carrera" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descripcion" TEXT,
    "duracion" INTEGER NOT NULL,
    "creditos" INTEGER NOT NULL,
    "universidadId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Carrera_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PensumVersion" (
    "id" TEXT NOT NULL,
    "universidadId" TEXT NOT NULL,
    "carreraId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "status" "PensumVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "snapshot" JSONB NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "PensumVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Materia" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descripcion" TEXT,
    "creditos" INTEGER NOT NULL,
    "semestre" "Semestre" NOT NULL,
    "horasTeoria" INTEGER NOT NULL,
    "horasPractica" INTEGER NOT NULL,
    "carreraId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Materia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MateriaPrerrequisito" (
    "id" TEXT NOT NULL,
    "materiaId" TEXT NOT NULL,
    "prerrequisitoId" TEXT NOT NULL,
    "tipoPrerrequisito" "TipoPrerrequisito" NOT NULL DEFAULT 'OBLIGATORIO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MateriaPrerrequisito_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MateriaEstudiante" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "materiaId" TEXT NOT NULL,
    "estado" "EstadoMateria" NOT NULL DEFAULT 'NO_CURSADA',
    "nota" DOUBLE PRECISION,
    "semestreCursado" TEXT,
    "fechaInicio" TIMESTAMP(3),
    "fechaFin" TIMESTAMP(3),
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MateriaEstudiante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogPost" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT,
    "content" TEXT,
    "imageUrl" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "authorId" TEXT NOT NULL,
    "categoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "titleMeta" TEXT,

    CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "BlogCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Curso" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "slug" TEXT,
    "descripcion" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "urlVideo" TEXT,
    "imagenUrl" TEXT,
    "tema" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "autorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Curso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recurso" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "tipo" "TipoRecurso" NOT NULL,
    "contenido" TEXT NOT NULL,
    "archivoUrl" TEXT,
    "archivoSizeBytes" INTEGER,
    "materiaId" TEXT,
    "universidadId" TEXT,
    "autorId" TEXT NOT NULL,
    "calificacion" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "numCalificaciones" INTEGER NOT NULL DEFAULT 0,
    "numVistas" INTEGER NOT NULL DEFAULT 0,
    "numDescargas" INTEGER NOT NULL DEFAULT 0,
    "esPublico" BOOLEAN NOT NULL DEFAULT true,
    "esAnonimo" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recurso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BibliotecaObra" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descripcion" TEXT,
    "cuerpo" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BibliotecaObra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TesisDocumento" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "cuerpo" TEXT NOT NULL,
    "headerTemplate" TEXT NOT NULL DEFAULT '{{title}}',
    "footerTemplate" TEXT NOT NULL DEFAULT 'Página {{page}} de {{pages}}',
    "paperSize" TEXT NOT NULL DEFAULT 'a4',
    "paperMode" TEXT NOT NULL DEFAULT 'light',
    "zoom" INTEGER NOT NULL DEFAULT 100,
    "fontScale" DOUBLE PRECISION NOT NULL DEFAULT 0.92,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" TEXT NOT NULL,

    CONSTRAINT "TesisDocumento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalificacionRecurso" (
    "id" TEXT NOT NULL,
    "recursoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "calificacion" INTEGER NOT NULL,
    "comentario" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CalificacionRecurso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComentarioRecurso" (
    "id" TEXT NOT NULL,
    "recursoId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "esRespuesta" BOOLEAN NOT NULL DEFAULT false,
    "comentarioPadreId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComentarioRecurso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VistaRecurso" (
    "id" TEXT NOT NULL,
    "recursoId" TEXT NOT NULL,
    "usuarioId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VistaRecurso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DescargaRecurso" (
    "id" TEXT NOT NULL,
    "recursoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DescargaRecurso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetaAcademica" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" "TipoMeta" NOT NULL,
    "valorObjetivo" DOUBLE PRECISION NOT NULL,
    "valorActual" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fechaLimite" TIMESTAMP(3),
    "completada" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MetaAcademica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManualPayment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subscriptionTypeId" TEXT NOT NULL,
    "amountBs" INTEGER NOT NULL,
    "reference" TEXT NOT NULL,
    "proofUrl" TEXT,
    "status" "ManualPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManualPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subscriptionTypeId" TEXT,
    "source" "PaymentSource" NOT NULL,
    "status" "ManualPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amountBs" INTEGER,
    "amountUsdCents" INTEGER,
    "reference" TEXT,
    "operationCode" TEXT,
    "rejectionReason" TEXT,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "manualPaymentId" TEXT,
    "stripeInvoiceId" TEXT,
    "stripePaymentIntentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorito" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "recursoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorito_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiUsageLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "endpoint" TEXT NOT NULL,
    "promptTokens" INTEGER NOT NULL DEFAULT 0,
    "completionTokens" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiUsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_telefono_key" ON "User"("telefono");

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_universidadId_idx" ON "User"("universidadId");

-- CreateIndex
CREATE INDEX "User_referredByUserId_idx" ON "User"("referredByUserId");

-- CreateIndex
CREATE INDEX "ReferralBoost_userId_status_idx" ON "ReferralBoost"("userId", "status");

-- CreateIndex
CREATE INDEX "ReferralBoost_kind_status_idx" ON "ReferralBoost"("kind", "status");

-- CreateIndex
CREATE INDEX "WalletLedger_userId_createdAt_idx" ON "WalletLedger"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "CalendarEvent_userId_startAt_idx" ON "CalendarEvent"("userId", "startAt");

-- CreateIndex
CREATE INDEX "CalendarEvent_userId_endAt_idx" ON "CalendarEvent"("userId", "endAt");

-- CreateIndex
CREATE INDEX "UserFollow_followerId_idx" ON "UserFollow"("followerId");

-- CreateIndex
CREATE INDEX "UserFollow_followingId_idx" ON "UserFollow"("followingId");

-- CreateIndex
CREATE UNIQUE INDEX "UserFollow_followerId_followingId_key" ON "UserFollow"("followerId", "followingId");

-- CreateIndex
CREATE INDEX "Historia_expiresAt_idx" ON "Historia"("expiresAt");

-- CreateIndex
CREATE INDEX "Historia_autorId_expiresAt_idx" ON "Historia"("autorId", "expiresAt");

-- CreateIndex
CREATE INDEX "ba_session_userId_idx" ON "ba_session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ba_session_token_key" ON "ba_session"("token");

-- CreateIndex
CREATE INDEX "ba_account_userId_idx" ON "ba_account"("userId");

-- CreateIndex
CREATE INDEX "ba_verification_identifier_idx" ON "ba_verification"("identifier");

-- CreateIndex
CREATE INDEX "ba_twoFactor_secret_idx" ON "ba_twoFactor"("secret");

-- CreateIndex
CREATE INDEX "ba_twoFactor_userId_idx" ON "ba_twoFactor"("userId");

-- CreateIndex
CREATE INDEX "passkey_userId_idx" ON "passkey"("userId");

-- CreateIndex
CREATE INDEX "passkey_credentialID_idx" ON "passkey"("credentialID");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_email_token_key" ON "VerificationToken"("email", "token");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_email_token_key" ON "PasswordResetToken"("email", "token");

-- CreateIndex
CREATE UNIQUE INDEX "TwoFactorToken_token_key" ON "TwoFactorToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "TwoFactorToken_email_token_key" ON "TwoFactorToken"("email", "token");

-- CreateIndex
CREATE UNIQUE INDEX "TwoFactorConfirmation_userId_key" ON "TwoFactorConfirmation"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "StripeCustomer_userId_key" ON "StripeCustomer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "StripeCustomer_stripeCustomerId_key" ON "StripeCustomer"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "UserSubscription_userId_idx" ON "UserSubscription"("userId");

-- CreateIndex
CREATE INDEX "UserSubscription_subscriptionTypeId_idx" ON "UserSubscription"("subscriptionTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "IaFeatureCatalog_featureKey_key" ON "IaFeatureCatalog"("featureKey");

-- CreateIndex
CREATE INDEX "SubscriptionTypeIaAccess_subscriptionTypeId_idx" ON "SubscriptionTypeIaAccess"("subscriptionTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionTypeIaAccess_subscriptionTypeId_iaFeatureCatalo_key" ON "SubscriptionTypeIaAccess"("subscriptionTypeId", "iaFeatureCatalogId");

-- CreateIndex
CREATE UNIQUE INDEX "Universidad_nombre_key" ON "Universidad"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Universidad_siglas_key" ON "Universidad"("siglas");

-- CreateIndex
CREATE UNIQUE INDEX "Carrera_codigo_key" ON "Carrera"("codigo");

-- CreateIndex
CREATE INDEX "Carrera_universidadId_idx" ON "Carrera"("universidadId");

-- CreateIndex
CREATE INDEX "PensumVersion_universidadId_idx" ON "PensumVersion"("universidadId");

-- CreateIndex
CREATE INDEX "PensumVersion_carreraId_idx" ON "PensumVersion"("carreraId");

-- CreateIndex
CREATE INDEX "PensumVersion_status_idx" ON "PensumVersion"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PensumVersion_carreraId_versionNumber_key" ON "PensumVersion"("carreraId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Materia_codigo_key" ON "Materia"("codigo");

-- CreateIndex
CREATE INDEX "Materia_carreraId_idx" ON "Materia"("carreraId");

-- CreateIndex
CREATE INDEX "MateriaPrerrequisito_materiaId_idx" ON "MateriaPrerrequisito"("materiaId");

-- CreateIndex
CREATE INDEX "MateriaPrerrequisito_prerrequisitoId_idx" ON "MateriaPrerrequisito"("prerrequisitoId");

-- CreateIndex
CREATE UNIQUE INDEX "MateriaPrerrequisito_materiaId_prerrequisitoId_key" ON "MateriaPrerrequisito"("materiaId", "prerrequisitoId");

-- CreateIndex
CREATE INDEX "MateriaEstudiante_userId_idx" ON "MateriaEstudiante"("userId");

-- CreateIndex
CREATE INDEX "MateriaEstudiante_materiaId_idx" ON "MateriaEstudiante"("materiaId");

-- CreateIndex
CREATE UNIQUE INDEX "MateriaEstudiante_userId_materiaId_key" ON "MateriaEstudiante"("userId", "materiaId");

-- CreateIndex
CREATE UNIQUE INDEX "BlogPost_slug_key" ON "BlogPost"("slug");

-- CreateIndex
CREATE INDEX "BlogPost_authorId_idx" ON "BlogPost"("authorId");

-- CreateIndex
CREATE INDEX "BlogPost_categoryId_idx" ON "BlogPost"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "BlogCategory_name_key" ON "BlogCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Curso_slug_key" ON "Curso"("slug");

-- CreateIndex
CREATE INDEX "Curso_autorId_idx" ON "Curso"("autorId");

-- CreateIndex
CREATE INDEX "Curso_tema_idx" ON "Curso"("tema");

-- CreateIndex
CREATE INDEX "Recurso_materiaId_idx" ON "Recurso"("materiaId");

-- CreateIndex
CREATE INDEX "Recurso_universidadId_idx" ON "Recurso"("universidadId");

-- CreateIndex
CREATE INDEX "Recurso_autorId_idx" ON "Recurso"("autorId");

-- CreateIndex
CREATE INDEX "Recurso_tipo_idx" ON "Recurso"("tipo");

-- CreateIndex
CREATE INDEX "Recurso_esPublico_idx" ON "Recurso"("esPublico");

-- CreateIndex
CREATE INDEX "Recurso_esAnonimo_idx" ON "Recurso"("esAnonimo");

-- CreateIndex
CREATE UNIQUE INDEX "BibliotecaObra_slug_key" ON "BibliotecaObra"("slug");

-- CreateIndex
CREATE INDEX "BibliotecaObra_isPublished_idx" ON "BibliotecaObra"("isPublished");

-- CreateIndex
CREATE INDEX "BibliotecaObra_orden_idx" ON "BibliotecaObra"("orden");

-- CreateIndex
CREATE INDEX "TesisDocumento_ownerId_idx" ON "TesisDocumento"("ownerId");

-- CreateIndex
CREATE INDEX "TesisDocumento_updatedAt_idx" ON "TesisDocumento"("updatedAt");

-- CreateIndex
CREATE INDEX "CalificacionRecurso_recursoId_idx" ON "CalificacionRecurso"("recursoId");

-- CreateIndex
CREATE INDEX "CalificacionRecurso_usuarioId_idx" ON "CalificacionRecurso"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "CalificacionRecurso_recursoId_usuarioId_key" ON "CalificacionRecurso"("recursoId", "usuarioId");

-- CreateIndex
CREATE INDEX "ComentarioRecurso_recursoId_idx" ON "ComentarioRecurso"("recursoId");

-- CreateIndex
CREATE INDEX "ComentarioRecurso_autorId_idx" ON "ComentarioRecurso"("autorId");

-- CreateIndex
CREATE INDEX "VistaRecurso_recursoId_idx" ON "VistaRecurso"("recursoId");

-- CreateIndex
CREATE INDEX "VistaRecurso_usuarioId_idx" ON "VistaRecurso"("usuarioId");

-- CreateIndex
CREATE INDEX "DescargaRecurso_recursoId_idx" ON "DescargaRecurso"("recursoId");

-- CreateIndex
CREATE INDEX "DescargaRecurso_usuarioId_idx" ON "DescargaRecurso"("usuarioId");

-- CreateIndex
CREATE INDEX "MetaAcademica_usuarioId_idx" ON "MetaAcademica"("usuarioId");

-- CreateIndex
CREATE INDEX "MetaAcademica_tipo_idx" ON "MetaAcademica"("tipo");

-- CreateIndex
CREATE INDEX "MetaAcademica_completada_idx" ON "MetaAcademica"("completada");

-- CreateIndex
CREATE INDEX "ManualPayment_userId_idx" ON "ManualPayment"("userId");

-- CreateIndex
CREATE INDEX "ManualPayment_subscriptionTypeId_idx" ON "ManualPayment"("subscriptionTypeId");

-- CreateIndex
CREATE INDEX "ManualPayment_status_idx" ON "ManualPayment"("status");

-- CreateIndex
CREATE INDEX "ManualPayment_reviewedById_idx" ON "ManualPayment"("reviewedById");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentRecord_manualPaymentId_key" ON "PaymentRecord"("manualPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentRecord_stripeInvoiceId_key" ON "PaymentRecord"("stripeInvoiceId");

-- CreateIndex
CREATE INDEX "PaymentRecord_userId_idx" ON "PaymentRecord"("userId");

-- CreateIndex
CREATE INDEX "PaymentRecord_subscriptionTypeId_idx" ON "PaymentRecord"("subscriptionTypeId");

-- CreateIndex
CREATE INDEX "PaymentRecord_status_idx" ON "PaymentRecord"("status");

-- CreateIndex
CREATE INDEX "PaymentRecord_source_idx" ON "PaymentRecord"("source");

-- CreateIndex
CREATE INDEX "PaymentRecord_periodEnd_idx" ON "PaymentRecord"("periodEnd");

-- CreateIndex
CREATE INDEX "Favorito_usuarioId_idx" ON "Favorito"("usuarioId");

-- CreateIndex
CREATE INDEX "Favorito_recursoId_idx" ON "Favorito"("recursoId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorito_usuarioId_recursoId_key" ON "Favorito"("usuarioId", "recursoId");

-- CreateIndex
CREATE INDEX "AiUsageLog_createdAt_idx" ON "AiUsageLog"("createdAt");

-- CreateIndex
CREATE INDEX "AiUsageLog_endpoint_idx" ON "AiUsageLog"("endpoint");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_universidadId_fkey" FOREIGN KEY ("universidadId") REFERENCES "Universidad"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_carreraId_fkey" FOREIGN KEY ("carreraId") REFERENCES "Carrera"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_referredByUserId_fkey" FOREIGN KEY ("referredByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralBoost" ADD CONSTRAINT "ReferralBoost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletLedger" ADD CONSTRAINT "WalletLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFollow" ADD CONSTRAINT "UserFollow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFollow" ADD CONSTRAINT "UserFollow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Historia" ADD CONSTRAINT "Historia_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ba_session" ADD CONSTRAINT "ba_session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ba_account" ADD CONSTRAINT "ba_account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ba_twoFactor" ADD CONSTRAINT "ba_twoFactor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passkey" ADD CONSTRAINT "passkey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TwoFactorConfirmation" ADD CONSTRAINT "TwoFactorConfirmation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StripeCustomer" ADD CONSTRAINT "StripeCustomer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSubscription" ADD CONSTRAINT "UserSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSubscription" ADD CONSTRAINT "UserSubscription_subscriptionTypeId_fkey" FOREIGN KEY ("subscriptionTypeId") REFERENCES "SubscriptionType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionTypeIaAccess" ADD CONSTRAINT "SubscriptionTypeIaAccess_subscriptionTypeId_fkey" FOREIGN KEY ("subscriptionTypeId") REFERENCES "SubscriptionType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionTypeIaAccess" ADD CONSTRAINT "SubscriptionTypeIaAccess_iaFeatureCatalogId_fkey" FOREIGN KEY ("iaFeatureCatalogId") REFERENCES "IaFeatureCatalog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Carrera" ADD CONSTRAINT "Carrera_universidadId_fkey" FOREIGN KEY ("universidadId") REFERENCES "Universidad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PensumVersion" ADD CONSTRAINT "PensumVersion_universidadId_fkey" FOREIGN KEY ("universidadId") REFERENCES "Universidad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PensumVersion" ADD CONSTRAINT "PensumVersion_carreraId_fkey" FOREIGN KEY ("carreraId") REFERENCES "Carrera"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PensumVersion" ADD CONSTRAINT "PensumVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Materia" ADD CONSTRAINT "Materia_carreraId_fkey" FOREIGN KEY ("carreraId") REFERENCES "Carrera"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MateriaPrerrequisito" ADD CONSTRAINT "MateriaPrerrequisito_materiaId_fkey" FOREIGN KEY ("materiaId") REFERENCES "Materia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MateriaPrerrequisito" ADD CONSTRAINT "MateriaPrerrequisito_prerrequisitoId_fkey" FOREIGN KEY ("prerrequisitoId") REFERENCES "Materia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MateriaEstudiante" ADD CONSTRAINT "MateriaEstudiante_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MateriaEstudiante" ADD CONSTRAINT "MateriaEstudiante_materiaId_fkey" FOREIGN KEY ("materiaId") REFERENCES "Materia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "BlogCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Curso" ADD CONSTRAINT "Curso_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recurso" ADD CONSTRAINT "Recurso_materiaId_fkey" FOREIGN KEY ("materiaId") REFERENCES "Materia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recurso" ADD CONSTRAINT "Recurso_universidadId_fkey" FOREIGN KEY ("universidadId") REFERENCES "Universidad"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recurso" ADD CONSTRAINT "Recurso_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TesisDocumento" ADD CONSTRAINT "TesisDocumento_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalificacionRecurso" ADD CONSTRAINT "CalificacionRecurso_recursoId_fkey" FOREIGN KEY ("recursoId") REFERENCES "Recurso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalificacionRecurso" ADD CONSTRAINT "CalificacionRecurso_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComentarioRecurso" ADD CONSTRAINT "ComentarioRecurso_recursoId_fkey" FOREIGN KEY ("recursoId") REFERENCES "Recurso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComentarioRecurso" ADD CONSTRAINT "ComentarioRecurso_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VistaRecurso" ADD CONSTRAINT "VistaRecurso_recursoId_fkey" FOREIGN KEY ("recursoId") REFERENCES "Recurso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VistaRecurso" ADD CONSTRAINT "VistaRecurso_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DescargaRecurso" ADD CONSTRAINT "DescargaRecurso_recursoId_fkey" FOREIGN KEY ("recursoId") REFERENCES "Recurso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DescargaRecurso" ADD CONSTRAINT "DescargaRecurso_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetaAcademica" ADD CONSTRAINT "MetaAcademica_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManualPayment" ADD CONSTRAINT "ManualPayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManualPayment" ADD CONSTRAINT "ManualPayment_subscriptionTypeId_fkey" FOREIGN KEY ("subscriptionTypeId") REFERENCES "SubscriptionType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManualPayment" ADD CONSTRAINT "ManualPayment_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRecord" ADD CONSTRAINT "PaymentRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRecord" ADD CONSTRAINT "PaymentRecord_subscriptionTypeId_fkey" FOREIGN KEY ("subscriptionTypeId") REFERENCES "SubscriptionType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRecord" ADD CONSTRAINT "PaymentRecord_manualPaymentId_fkey" FOREIGN KEY ("manualPaymentId") REFERENCES "ManualPayment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorito" ADD CONSTRAINT "Favorito_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorito" ADD CONSTRAINT "Favorito_recursoId_fkey" FOREIGN KEY ("recursoId") REFERENCES "Recurso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

