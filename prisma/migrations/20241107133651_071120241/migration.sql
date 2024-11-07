-- CreateTable
CREATE TABLE "Embalagem" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(200) NOT NULL,
    "email" TEXT NOT NULL,
    "nomefantasia" VARCHAR(200),
    "telefone" VARCHAR(15),
    "whats" VARCHAR(15) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Embalagem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntryInput" (
    "id" SERIAL NOT NULL,
    "embalagemId" INTEGER NOT NULL,
    "itemTamanhoId" INTEGER NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EntryInput_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutInput" (
    "id" SERIAL NOT NULL,
    "itemTamanhoId" INTEGER NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutInput_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Embalagem_nome_key" ON "Embalagem"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Embalagem_email_key" ON "Embalagem"("email");

-- AddForeignKey
ALTER TABLE "EntryInput" ADD CONSTRAINT "EntryInput_embalagemId_fkey" FOREIGN KEY ("embalagemId") REFERENCES "Embalagem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntryInput" ADD CONSTRAINT "EntryInput_itemTamanhoId_fkey" FOREIGN KEY ("itemTamanhoId") REFERENCES "ItemTamanho"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutInput" ADD CONSTRAINT "OutInput_itemTamanhoId_fkey" FOREIGN KEY ("itemTamanhoId") REFERENCES "ItemTamanho"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
