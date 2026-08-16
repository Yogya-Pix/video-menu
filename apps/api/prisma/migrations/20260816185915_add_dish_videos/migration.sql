-- CreateTable
CREATE TABLE "DishVideo" (
    "id" TEXT NOT NULL,
    "videoKey" TEXT NOT NULL,
    "thumbnailKey" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "menuItemId" TEXT NOT NULL,

    CONSTRAINT "DishVideo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DishVideo_menuItemId_idx" ON "DishVideo"("menuItemId");

-- AddForeignKey
ALTER TABLE "DishVideo" ADD CONSTRAINT "DishVideo_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DataMigration: preserve each MenuItem's existing single video/thumbnail as
-- its first DishVideo row, before the old columns are dropped below.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO "DishVideo" ("id", "videoKey", "thumbnailKey", "sortOrder", "createdAt", "menuItemId")
SELECT gen_random_uuid()::text, "videoKey", "thumbnailKey", 0, now(), "id"
FROM "MenuItem"
WHERE "videoKey" IS NOT NULL;

-- AlterTable
ALTER TABLE "MenuItem" DROP COLUMN "thumbnailKey",
DROP COLUMN "videoKey",
DROP COLUMN "videoStatus";

-- DropEnum
DROP TYPE "VideoStatus";
