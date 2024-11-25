-- AlterTable
ALTER TABLE "Caixa" ADD COLUMN     "userId" INTEGER;

-- AlterTable
ALTER TABLE "EntryInput" ADD COLUMN     "userId" INTEGER;

-- AlterTable
ALTER TABLE "Grade" ADD COLUMN     "tipo" TEXT;

-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "composicao" TEXT;

-- AlterTable
ALTER TABLE "OutInput" ADD COLUMN     "userId" INTEGER;

-- AddForeignKey
ALTER TABLE "Caixa" ADD CONSTRAINT "Caixa_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntryInput" ADD CONSTRAINT "EntryInput_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutInput" ADD CONSTRAINT "OutInput_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
