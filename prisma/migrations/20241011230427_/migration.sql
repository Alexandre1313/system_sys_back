/*
  Warnings:

  - A unique constraint covering the columns `[projetoId,nome]` on the table `Escola` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Escola_projetoId_nome_key" ON "Escola"("projetoId", "nome");
