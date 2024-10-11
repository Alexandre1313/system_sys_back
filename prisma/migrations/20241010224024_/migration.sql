/*
  Warnings:

  - You are about to drop the column `itemProjetoTamanhoId` on the `Estoque` table. All the data in the column will be lost.
  - You are about to drop the column `codigoBarra` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the `GradeDistribuicao` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GradeDistribuicaoItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ItemProjetoTamanho` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[projetoId,nome]` on the table `Escola` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nome]` on the table `Projeto` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `itemId` to the `Estoque` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tamanhoId` to the `Estoque` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Estoque` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Estoque" DROP CONSTRAINT "Estoque_itemProjetoTamanhoId_fkey";

-- DropForeignKey
ALTER TABLE "GradeDistribuicao" DROP CONSTRAINT "GradeDistribuicao_escolaId_fkey";

-- DropForeignKey
ALTER TABLE "GradeDistribuicaoItem" DROP CONSTRAINT "GradeDistribuicaoItem_gradeDistribuicaoId_fkey";

-- DropForeignKey
ALTER TABLE "GradeDistribuicaoItem" DROP CONSTRAINT "GradeDistribuicaoItem_itemProjetoTamanhoId_fkey";

-- DropForeignKey
ALTER TABLE "ItemProjetoTamanho" DROP CONSTRAINT "ItemProjetoTamanho_itemId_fkey";

-- DropIndex
DROP INDEX "Estoque_itemProjetoTamanhoId_key";

-- DropIndex
DROP INDEX "Item_codigoBarra_key";

-- AlterTable
ALTER TABLE "Estoque" DROP COLUMN "itemProjetoTamanhoId",
ADD COLUMN     "itemId" INTEGER NOT NULL,
ADD COLUMN     "tamanhoId" INTEGER NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Item" DROP COLUMN "codigoBarra";

-- DropTable
DROP TABLE "GradeDistribuicao";

-- DropTable
DROP TABLE "GradeDistribuicaoItem";

-- DropTable
DROP TABLE "ItemProjetoTamanho";

-- CreateTable
CREATE TABLE "Tamanho" (
    "id" SERIAL NOT NULL,
    "valor" TEXT NOT NULL,
    "itemId" INTEGER NOT NULL,

    CONSTRAINT "Tamanho_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Grade" (
    "id" SERIAL NOT NULL,
    "escolaId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "tamanhoId" INTEGER NOT NULL,
    "totalExpedir" INTEGER NOT NULL,
    "expedido" INTEGER NOT NULL DEFAULT 0,
    "expedicaoAtiva" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Grade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tamanho_itemId_valor_key" ON "Tamanho"("itemId", "valor");

-- CreateIndex
CREATE UNIQUE INDEX "Escola_projetoId_nome_key" ON "Escola"("projetoId", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "Projeto_nome_key" ON "Projeto"("nome");

-- AddForeignKey
ALTER TABLE "Tamanho" ADD CONSTRAINT "Tamanho_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "Escola"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_tamanhoId_fkey" FOREIGN KEY ("tamanhoId") REFERENCES "Tamanho"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Estoque" ADD CONSTRAINT "Estoque_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Estoque" ADD CONSTRAINT "Estoque_tamanhoId_fkey" FOREIGN KEY ("tamanhoId") REFERENCES "Tamanho"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
