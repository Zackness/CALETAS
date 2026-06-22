-- Blog CALETAS: enum (sin tabla legacy) y categorías orientadas a vida estudiantil.
-- Resuelve el conflicto "BlogCategory" tabla + tipo que rompe `prisma db push`.

-- Quitar tabla legacy (mismo nombre que el enum; confunde al motor de Prisma)
ALTER TABLE "BlogPost" DROP CONSTRAINT IF EXISTS "BlogPost_categoryId_fkey";
ALTER TABLE "BlogPost" DROP COLUMN IF EXISTS "categoryId";
DROP TABLE IF EXISTS "BlogCategory" CASCADE;

DO $$ BEGIN
  CREATE TYPE "BlogPostStatus" AS ENUM ('DRAFT', 'PUBLISHED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "excerpt" TEXT;
ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "metaTitle" TEXT;
ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "metaDescription" TEXT;
ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "coverImage" TEXT;
ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "status" "BlogPostStatus" DEFAULT 'DRAFT';
ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP(3);

-- Migrar enum StartupVen → categorías CALETAS (si el enum viejo existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'BlogCategory'
      AND e.enumlabel = 'INFRAESTRUCTURA_DIGITAL'
  ) THEN
    ALTER TYPE "BlogCategory" RENAME TO "BlogCategory_legacy";

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

    ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "category" "BlogCategory";

    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'BlogPost'
        AND column_name = 'category'
        AND udt_name = 'BlogCategory_legacy'
    ) THEN
      ALTER TABLE "BlogPost"
        ALTER COLUMN "category" TYPE "BlogCategory"
        USING (
          CASE "category"::text
            WHEN 'INFRAESTRUCTURA_DIGITAL' THEN 'TECNOLOGIA'
            WHEN 'EVOLUCION_DIGITAL' THEN 'NOVEDADES'
            WHEN 'IA_AUTOMATIZACION' THEN 'TECNOLOGIA'
            WHEN 'ARQUITECTURA_SAAS' THEN 'TECNOLOGIA'
            WHEN 'ECOSISTEMAS_EMPRESARIALES' THEN 'COMUNIDAD'
            WHEN 'TECNOLOGIA_APLICADA' THEN 'RECURSOS_ACADEMICOS'
            WHEN 'CASOS_ARQUITECTURAS' THEN 'TUTORIALES'
            WHEN 'FUTURO_DIGITAL' THEN 'CARRERA'
            ELSE 'CONSEJOS_ESTUDIO'
          END::"BlogCategory"
        );
    ELSE
      UPDATE "BlogPost"
      SET "category" = 'CONSEJOS_ESTUDIO'::"BlogCategory"
      WHERE "category" IS NULL;
    END IF;

    DROP TYPE "BlogCategory_legacy";
  ELSIF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BlogCategory') THEN
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

    ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "category" "BlogCategory";
    UPDATE "BlogPost"
    SET "category" = 'CONSEJOS_ESTUDIO'::"BlogCategory"
    WHERE "category" IS NULL;
  END IF;
END $$;

UPDATE "BlogPost"
SET
  "excerpt" = COALESCE(NULLIF(TRIM("excerpt"), ''), LEFT(COALESCE("content", ''), 280), ''),
  "status" = COALESCE("status", 'DRAFT'::"BlogPostStatus"),
  "category" = COALESCE("category", 'CONSEJOS_ESTUDIO'::"BlogCategory"),
  "slug" = COALESCE(NULLIF(TRIM("slug"), ''), "id"),
  "content" = COALESCE("content", '')
WHERE "excerpt" IS NULL
   OR "category" IS NULL
   OR "status" IS NULL
   OR "slug" IS NULL
   OR "content" IS NULL;

ALTER TABLE "BlogPost" DROP COLUMN IF EXISTS "imageUrl";
ALTER TABLE "BlogPost" DROP COLUMN IF EXISTS "isPublished";
ALTER TABLE "BlogPost" DROP COLUMN IF EXISTS "description";
ALTER TABLE "BlogPost" DROP COLUMN IF EXISTS "titleMeta";

CREATE INDEX IF NOT EXISTS "BlogPost_status_publishedAt_idx" ON "BlogPost"("status", "publishedAt");
CREATE INDEX IF NOT EXISTS "BlogPost_category_status_idx" ON "BlogPost"("category", "status");
