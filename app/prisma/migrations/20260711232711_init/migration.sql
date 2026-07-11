-- CreateTable
CREATE TABLE "Play" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "titleNorm" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "authorLast" TEXT,
    "type" TEXT,
    "publication" TEXT,
    "driveFileId" TEXT,
    "linkSource" TEXT,
    "castSize" INTEGER,
    "maleCount" INTEGER,
    "femaleCount" INTEGER,
    "flexibleCount" INTEGER,
    "genre" TEXT,
    "runtime" TEXT,
    "synopsis" TEXT,
    "extractedText" TEXT,
    "metadataBackfilled" BOOLEAN NOT NULL DEFAULT false,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "seen" BOOLEAN NOT NULL DEFAULT false,
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AllowedUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "Play_titleNorm_idx" ON "Play"("titleNorm");

-- CreateIndex
CREATE INDEX "Play_authorLast_idx" ON "Play"("authorLast");

-- CreateIndex
CREATE INDEX "Play_genre_idx" ON "Play"("genre");

-- CreateIndex
CREATE UNIQUE INDEX "AllowedUser_email_key" ON "AllowedUser"("email");
