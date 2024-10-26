/*
  Warnings:

  - A unique constraint covering the columns `[gradeId,caixaNumber]` on the table `Caixa` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Caixa" ALTER COLUMN "caixaNumber" SET DATA TYPE TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Caixa_gradeId_caixaNumber_key" ON "Caixa"("gradeId", "caixaNumber");
