/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Track` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Track_slug_key" ON "Track"("slug");
