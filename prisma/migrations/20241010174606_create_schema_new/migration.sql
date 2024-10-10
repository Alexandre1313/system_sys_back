-- CreateEnum
CREATE TYPE "Genero" AS ENUM ('MASCULINO', 'FEMININO', 'UNISSEX');

-- CreateTable
CREATE TABLE "Usuarios" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Escola" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "projetoId" INTEGER NOT NULL,

    CONSTRAINT "Escola_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Projeto" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "Projeto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "projetoId" INTEGER NOT NULL,
    "codigoBarra" INTEGER NOT NULL,
    "genero" "Genero" NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemProjetoTamanho" (
    "id" SERIAL NOT NULL,
    "itemId" INTEGER NOT NULL,
    "tamanho" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,

    CONSTRAINT "ItemProjetoTamanho_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Estoque" (
    "id" SERIAL NOT NULL,
    "itemProjetoTamanhoId" INTEGER NOT NULL,
    "quantidade" INTEGER NOT NULL,

    CONSTRAINT "Estoque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GradeDistribuicao" (
    "id" SERIAL NOT NULL,
    "escolaId" INTEGER NOT NULL,
    "dataDistribuicao" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GradeDistribuicao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GradeDistribuicaoItem" (
    "id" SERIAL NOT NULL,
    "gradeDistribuicaoId" INTEGER NOT NULL,
    "itemProjetoTamanhoId" INTEGER NOT NULL,
    "quantidadeDistribuida" INTEGER NOT NULL,

    CONSTRAINT "GradeDistribuicaoItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuarios_email_key" ON "Usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Item_codigoBarra_key" ON "Item"("codigoBarra");

-- CreateIndex
CREATE UNIQUE INDEX "Estoque_itemProjetoTamanhoId_key" ON "Estoque"("itemProjetoTamanhoId");

-- AddForeignKey
ALTER TABLE "Escola" ADD CONSTRAINT "Escola_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemProjetoTamanho" ADD CONSTRAINT "ItemProjetoTamanho_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Estoque" ADD CONSTRAINT "Estoque_itemProjetoTamanhoId_fkey" FOREIGN KEY ("itemProjetoTamanhoId") REFERENCES "ItemProjetoTamanho"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeDistribuicao" ADD CONSTRAINT "GradeDistribuicao_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "Escola"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeDistribuicaoItem" ADD CONSTRAINT "GradeDistribuicaoItem_gradeDistribuicaoId_fkey" FOREIGN KEY ("gradeDistribuicaoId") REFERENCES "GradeDistribuicao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeDistribuicaoItem" ADD CONSTRAINT "GradeDistribuicaoItem_itemProjetoTamanhoId_fkey" FOREIGN KEY ("itemProjetoTamanhoId") REFERENCES "ItemProjetoTamanho"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
