/*
  Warnings:

  - You are about to alter the column `email` on the `Embalagem` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(200)`.
  - A unique constraint covering the columns `[nome,email]` on the table `Embalagem` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Embalagem_email_key";

-- DropIndex
DROP INDEX "Embalagem_nome_key";

-- AlterTable
ALTER TABLE "Embalagem" ALTER COLUMN "email" SET DATA TYPE VARCHAR(200);

-- CreateIndex
CREATE UNIQUE INDEX "Embalagem_nome_email_key" ON "Embalagem"("nome", "email");
