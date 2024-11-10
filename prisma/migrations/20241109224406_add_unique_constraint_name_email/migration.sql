/*
  Warnings:

  - A unique constraint covering the columns `[nome]` on the table `Embalagem` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `Embalagem` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Embalagem_nome_email_key";

-- CreateIndex
CREATE UNIQUE INDEX "Embalagem_nome_key" ON "Embalagem"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Embalagem_email_key" ON "Embalagem"("email");
