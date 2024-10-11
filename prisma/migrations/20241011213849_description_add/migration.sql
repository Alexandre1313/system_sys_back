/*
  Warnings:

  - Made the column `descricao` on table `Projeto` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Projeto" ALTER COLUMN "descricao" SET NOT NULL;
