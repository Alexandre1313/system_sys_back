/*
  Warnings:

  - You are about to drop the column `itemId` on the `Estoque` table. All the data in the column will be lost.
  - You are about to drop the column `tamanhoId` on the `Estoque` table. All the data in the column will be lost.
  - You are about to drop the column `expedicaoAtiva` on the `Grade` table. All the data in the column will be lost.
  - You are about to drop the column `expedido` on the `Grade` table. All the data in the column will be lost.
  - You are about to drop the column `itemId` on the `Grade` table. All the data in the column will be lost.
  - You are about to drop the column `tamanhoId` on the `Grade` table. All the data in the column will be lost.
  - You are about to drop the column `totalExpedir` on the `Grade` table. All the data in the column will be lost.
  - You are about to drop the column `itemId` on the `Tamanho` table. All the data in the column will be lost.
  - You are about to drop the column `valor` on the `Tamanho` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[itemTamanhoId]` on the table `Estoque` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Escola` table without a default value. This is not possible if the table is not empty.
  - Added the required column `itemTamanhoId` to the `Estoque` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Projeto` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nome` to the `Tamanho` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Estoque" DROP CONSTRAINT "Estoque_itemId_fkey";

-- DropForeignKey
ALTER TABLE "Estoque" DROP CONSTRAINT "Estoque_tamanhoId_fkey";

-- DropForeignKey
ALTER TABLE "Grade" DROP CONSTRAINT "Grade_itemId_fkey";

-- DropForeignKey
ALTER TABLE "Grade" DROP CONSTRAINT "Grade_tamanhoId_fkey";

-- DropForeignKey
ALTER TABLE "Tamanho" DROP CONSTRAINT "Tamanho_itemId_fkey";

-- DropIndex
DROP INDEX "Escola_projetoId_nome_key";

-- DropIndex
DROP INDEX "Tamanho_itemId_valor_key";

-- AlterTable
ALTER TABLE "Escola" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Estoque" DROP COLUMN "itemId",
DROP COLUMN "tamanhoId",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "itemTamanhoId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Grade" DROP COLUMN "expedicaoAtiva",
DROP COLUMN "expedido",
DROP COLUMN "itemId",
DROP COLUMN "tamanhoId",
DROP COLUMN "totalExpedir",
ADD COLUMN     "finalizada" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Projeto" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "descricao" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Tamanho" DROP COLUMN "itemId",
DROP COLUMN "valor",
ADD COLUMN     "nome" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "ItemTamanho" (
    "id" SERIAL NOT NULL,
    "itemId" INTEGER NOT NULL,
    "tamanhoId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemTamanho_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Barcode" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "itemTamanhoId" INTEGER NOT NULL,

    CONSTRAINT "Barcode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GradeItem" (
    "id" SERIAL NOT NULL,
    "gradeId" INTEGER NOT NULL,
    "itemTamanhoId" INTEGER NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "quantidadeExpedida" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GradeItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Barcode_codigo_key" ON "Barcode"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Barcode_itemTamanhoId_key" ON "Barcode"("itemTamanhoId");

-- CreateIndex
CREATE UNIQUE INDEX "Estoque_itemTamanhoId_key" ON "Estoque"("itemTamanhoId");

-- AddForeignKey
ALTER TABLE "ItemTamanho" ADD CONSTRAINT "ItemTamanho_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemTamanho" ADD CONSTRAINT "ItemTamanho_tamanhoId_fkey" FOREIGN KEY ("tamanhoId") REFERENCES "Tamanho"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Barcode" ADD CONSTRAINT "Barcode_itemTamanhoId_fkey" FOREIGN KEY ("itemTamanhoId") REFERENCES "ItemTamanho"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Estoque" ADD CONSTRAINT "Estoque_itemTamanhoId_fkey" FOREIGN KEY ("itemTamanhoId") REFERENCES "ItemTamanho"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeItem" ADD CONSTRAINT "GradeItem_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeItem" ADD CONSTRAINT "GradeItem_itemTamanhoId_fkey" FOREIGN KEY ("itemTamanhoId") REFERENCES "ItemTamanho"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
