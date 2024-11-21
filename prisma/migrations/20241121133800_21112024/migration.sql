-- CreateTable
CREATE TABLE "TelephonesSchool" (
    "id" SERIAL NOT NULL,
    "telefone" VARCHAR(15) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "escolaId" INTEGER NOT NULL,

    CONSTRAINT "TelephonesSchool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AddressSchool" (
    "id" SERIAL NOT NULL,
    "street" TEXT NOT NULL,
    "number" TEXT,
    "complement" TEXT,
    "neighborhood" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "escolaId" INTEGER NOT NULL,

    CONSTRAINT "AddressSchool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(200) NOT NULL,
    "email" VARCHAR(200) NOT NULL,
    "cnpj" VARCHAR(17),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelephonesCompany" (
    "id" SERIAL NOT NULL,
    "telefone" VARCHAR(15) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" INTEGER NOT NULL,

    CONSTRAINT "TelephonesCompany_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AddressCompany" (
    "id" SERIAL NOT NULL,
    "street" TEXT NOT NULL,
    "number" TEXT,
    "complement" TEXT,
    "neighborhood" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" INTEGER NOT NULL,

    CONSTRAINT "AddressCompany_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ops" (
    "id" SERIAL NOT NULL,
    "op" VARCHAR(10) NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "seloImpresso" BOOLEAN NOT NULL DEFAULT false,
    "faccaoId" INTEGER NOT NULL,
    "itemTamanhoId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Faccoes" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(200) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Faccoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelephonesFaccoes" (
    "id" SERIAL NOT NULL,
    "telefone" VARCHAR(15) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "faccaoId" INTEGER NOT NULL,

    CONSTRAINT "TelephonesFaccoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_nome_key" ON "Company"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Company_email_key" ON "Company"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Company_cnpj_key" ON "Company"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "Ops_op_key" ON "Ops"("op");

-- CreateIndex
CREATE UNIQUE INDEX "Faccoes_nome_key" ON "Faccoes"("nome");

-- AddForeignKey
ALTER TABLE "TelephonesSchool" ADD CONSTRAINT "TelephonesSchool_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "Escola"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AddressSchool" ADD CONSTRAINT "AddressSchool_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "Escola"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelephonesCompany" ADD CONSTRAINT "TelephonesCompany_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AddressCompany" ADD CONSTRAINT "AddressCompany_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ops" ADD CONSTRAINT "Ops_faccaoId_fkey" FOREIGN KEY ("faccaoId") REFERENCES "Faccoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ops" ADD CONSTRAINT "Ops_itemTamanhoId_fkey" FOREIGN KEY ("itemTamanhoId") REFERENCES "ItemTamanho"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelephonesFaccoes" ADD CONSTRAINT "TelephonesFaccoes_faccaoId_fkey" FOREIGN KEY ("faccaoId") REFERENCES "Faccoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
