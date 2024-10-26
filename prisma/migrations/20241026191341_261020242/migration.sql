/*
  Warnings:

  - You are about to drop the column `boxes` on the `GradeItem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "GradeItem" DROP COLUMN "boxes";

-- CreateTable
CREATE TABLE "Caixa" (
    "id" SERIAL NOT NULL,
    "gradeId" INTEGER NOT NULL,
    "escolaCaixa" TEXT NOT NULL,
    "caixaNumber" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Caixa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaixaItem" (
    "id" SERIAL NOT NULL,
    "caixaId" INTEGER NOT NULL,
    "itemName" TEXT NOT NULL,
    "itemGenero" TEXT NOT NULL,
    "itemTam" TEXT NOT NULL,
    "itemQty" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaixaItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Caixa" ADD CONSTRAINT "Caixa_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaixaItem" ADD CONSTRAINT "CaixaItem_caixaId_fkey" FOREIGN KEY ("caixaId") REFERENCES "Caixa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
