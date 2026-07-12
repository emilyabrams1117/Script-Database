-- CreateTable
CREATE TABLE "Play" (
    "id" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Play_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AllowedUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AllowedUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Play_titleNorm_idx" ON "Play"("titleNorm");

-- CreateIndex
CREATE INDEX "Play_authorLast_idx" ON "Play"("authorLast");

-- CreateIndex
CREATE INDEX "Play_genre_idx" ON "Play"("genre");

-- CreateIndex
CREATE UNIQUE INDEX "AllowedUser_email_key" ON "AllowedUser"("email");
