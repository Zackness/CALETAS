DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BlogCategory')
     AND NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LegacyBlogCategory') THEN
    ALTER TYPE "BlogCategory" RENAME TO "LegacyBlogCategory";
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "BlogCategory" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  CONSTRAINT "BlogCategory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "BlogCategory_name_key" ON "BlogCategory"("name");

ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "isPublished" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "categoryId" TEXT;
ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "titleMeta" TEXT;

INSERT INTO "BlogCategory" ("id", "name")
SELECT DISTINCT
  'legacy-' || lower(replace(category::text, '_', '-')),
  initcap(replace(category::text, '_', ' '))
FROM "BlogPost"
WHERE category IS NOT NULL
ON CONFLICT ("name") DO NOTHING;

UPDATE "BlogPost"
SET "description" = COALESCE("description", excerpt);

UPDATE "BlogPost"
SET "titleMeta" = COALESCE("titleMeta", "metaTitle");

UPDATE "BlogPost"
SET "isPublished" = CASE WHEN status::text = 'PUBLISHED' THEN true ELSE false END;

UPDATE "BlogPost"
SET "categoryId" = COALESCE("categoryId", 'legacy-' || lower(replace(category::text, '_', '-')))
WHERE category IS NOT NULL;

CREATE INDEX IF NOT EXISTS "BlogPost_categoryId_idx" ON "BlogPost"("categoryId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BlogPost_categoryId_fkey') THEN
    ALTER TABLE "BlogPost"
      ADD CONSTRAINT "BlogPost_categoryId_fkey"
      FOREIGN KEY ("categoryId") REFERENCES "BlogCategory"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
