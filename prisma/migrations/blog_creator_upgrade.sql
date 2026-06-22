-- Migración del blog al creador estilo StartupVen (PostgreSQL)
-- Preferir: npm run blog:migrate  (categorías CALETAS + fix enum)
-- O: prisma migrate deploy

CREATE TYPE "BlogPostStatus" AS ENUM ('DRAFT', 'PUBLISHED');

CREATE TYPE "BlogCategory" AS ENUM (
  'NOVEDADES',
  'CONSEJOS_ESTUDIO',
  'VIDA_UNIVERSITARIA',
  'RECURSOS_ACADEMICOS',
  'CARRERA',
  'TECNOLOGIA',
  'TUTORIALES',
  'COMUNIDAD'
);

ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "excerpt" TEXT;
ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "metaTitle" TEXT;
ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "metaDescription" TEXT;
ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "coverImage" TEXT;
ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "category" "BlogCategory";
ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "status" "BlogPostStatus" DEFAULT 'DRAFT';
ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP(3);

UPDATE "BlogPost"
SET
  "excerpt" = COALESCE(NULLIF(TRIM("description"), ''), LEFT(COALESCE("content", ''), 280), ''),
  "metaTitle" = "titleMeta",
  "metaDescription" = "description",
  "coverImage" = "imageUrl",
  "status" = CASE WHEN "isPublished" = true THEN 'PUBLISHED'::"BlogPostStatus" ELSE 'DRAFT'::"BlogPostStatus" END,
  "publishedAt" = CASE WHEN "isPublished" = true THEN COALESCE("updatedAt", "createdAt") ELSE NULL END,
  "category" = COALESCE("category", 'CONSEJOS_ESTUDIO'::"BlogCategory"),
  "slug" = COALESCE(NULLIF(TRIM("slug"), ''), "id"),
  "content" = COALESCE("content", '')
WHERE "excerpt" IS NULL OR "category" IS NULL OR "status" IS NULL;

ALTER TABLE "BlogPost" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "BlogPost" ALTER COLUMN "excerpt" SET NOT NULL;
ALTER TABLE "BlogPost" ALTER COLUMN "content" SET NOT NULL;
ALTER TABLE "BlogPost" ALTER COLUMN "category" SET NOT NULL;
ALTER TABLE "BlogPost" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "BlogPost" ALTER COLUMN "status" SET DEFAULT 'DRAFT';

ALTER TABLE "BlogPost" DROP CONSTRAINT IF EXISTS "BlogPost_categoryId_fkey";
ALTER TABLE "BlogPost" DROP COLUMN IF EXISTS "categoryId";
ALTER TABLE "BlogPost" DROP COLUMN IF EXISTS "imageUrl";
ALTER TABLE "BlogPost" DROP COLUMN IF EXISTS "isPublished";
ALTER TABLE "BlogPost" DROP COLUMN IF EXISTS "description";
ALTER TABLE "BlogPost" DROP COLUMN IF EXISTS "titleMeta";

DROP TABLE IF EXISTS "BlogCategory";

CREATE TABLE IF NOT EXISTS "MediaAsset" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "path" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "folder" TEXT NOT NULL,
  "filename" TEXT NOT NULL,
  "mimeType" TEXT,
  "sizeBytes" INTEGER,
  "title" VARCHAR(191),
  "altText" VARCHAR(191),
  "description" TEXT,
  "uploadedById" TEXT,
  CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MediaAsset_path_key" ON "MediaAsset"("path");
CREATE INDEX IF NOT EXISTS "MediaAsset_folder_idx" ON "MediaAsset"("folder");
CREATE INDEX IF NOT EXISTS "MediaAsset_createdAt_idx" ON "MediaAsset"("createdAt");

ALTER TABLE "MediaAsset" DROP CONSTRAINT IF EXISTS "MediaAsset_uploadedById_fkey";
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_uploadedById_fkey"
  FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "BlogPost_status_publishedAt_idx" ON "BlogPost"("status", "publishedAt");
CREATE INDEX IF NOT EXISTS "BlogPost_category_status_idx" ON "BlogPost"("category", "status");
