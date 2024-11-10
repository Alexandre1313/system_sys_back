/*
  Warnings:

  - Added the required column `estoqueId` to the `EntryInput` table without a default value. This is not possible if the table is not empty.
  - Added the required column `estoqueId` to the `OutInput` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "EntryInput" ADD COLUMN     "estoqueId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "OutInput" ADD COLUMN     "estoqueId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "EntryInput" ADD CONSTRAINT "EntryInput_estoqueId_fkey" FOREIGN KEY ("estoqueId") REFERENCES "Estoque"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutInput" ADD CONSTRAINT "OutInput_estoqueId_fkey" FOREIGN KEY ("estoqueId") REFERENCES "Estoque"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
