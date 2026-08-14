/*
  Warnings:

  - The values [READY,DELETED] on the enum `AlbumStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [READY,DELETED] on the enum `TrackStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AlbumStatus_new" AS ENUM ('PROCESSING', 'REALEASE', 'BLOCKED');
ALTER TABLE "public"."Album" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Album" ALTER COLUMN "status" TYPE "AlbumStatus_new" USING ("status"::text::"AlbumStatus_new");
ALTER TYPE "AlbumStatus" RENAME TO "AlbumStatus_old";
ALTER TYPE "AlbumStatus_new" RENAME TO "AlbumStatus";
DROP TYPE "public"."AlbumStatus_old";
ALTER TABLE "Album" ALTER COLUMN "status" SET DEFAULT 'PROCESSING';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "TrackStatus_new" AS ENUM ('PROCESSING', 'REALEASE', 'BLOCKED');
ALTER TABLE "public"."Track" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Track" ALTER COLUMN "status" TYPE "TrackStatus_new" USING ("status"::text::"TrackStatus_new");
ALTER TYPE "TrackStatus" RENAME TO "TrackStatus_old";
ALTER TYPE "TrackStatus_new" RENAME TO "TrackStatus";
DROP TYPE "public"."TrackStatus_old";
ALTER TABLE "Track" ALTER COLUMN "status" SET DEFAULT 'PROCESSING';
COMMIT;
