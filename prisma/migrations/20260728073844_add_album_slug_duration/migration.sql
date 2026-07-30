/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Album` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `Album` table without a default value. This is not possible if the table is not empty.
  - Added the required column `duration` to the `Track` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AlbumStatus" AS ENUM ('PROCESSING', 'READY', 'BLOCKED', 'DELETED');

-- AlterTable
ALTER TABLE "Album" ADD COLUMN     "slug" TEXT NOT NULL,
ADD COLUMN     "status" "AlbumStatus" NOT NULL DEFAULT 'PROCESSING';

-- AlterTable
ALTER TABLE "Track" ADD COLUMN     "duration" INTEGER NOT NULL,
ADD COLUMN     "trackNumber" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Album_slug_key" ON "Album"("slug");
