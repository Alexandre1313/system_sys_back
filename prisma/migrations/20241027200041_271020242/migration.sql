/*
  Warnings:

  - Added the required column `escolaNumber` to the `Caixa` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Caixa" ADD COLUMN     "escolaNumber" TEXT NOT NULL;
