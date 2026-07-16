-- AlterTable
ALTER TABLE "Play" ADD COLUMN     "themes" TEXT[] DEFAULT ARRAY[]::TEXT[];
