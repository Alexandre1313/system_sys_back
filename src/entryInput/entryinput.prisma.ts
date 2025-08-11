import { EntryInput, QtyEmbDay, StockGenerate } from '@core/index';
import { Injectable } from '@nestjs/common';
import { PrismaProvider } from 'src/db/prisma.provider';
import { Prisma } from '@prisma/client';
import { calcularEstoqueDeKit } from '@core/utils/utils';

@Injectable()
export class EntryInputPrisma {
    constructor(readonly prisma: PrismaProvider) { }

    async obter(): Promise<EntryInput[]> {
        const entryInputs = await this.prisma.entryInput.findMany();
        return entryInputs;
    }

    async obterPorId(id: number): Promise<EntryInput | null> {
        const entryInput = await this.prisma.entryInput.findUnique({
            where: { id },
            include: {
                estoque: true,
                itemTamanho: true,
            },
        });
        return (entryInput as EntryInput) ?? null;
    }

    async buscarEntradasDoDiaPorEmbalagemEItem(embalagemId: number, itemTamanhoId: number): Promise<QtyEmbDay> {
        // Data atual em São Paulo (ajustada para UTC)
        const agora = new Date();

        // Início do dia em UTC (equivalente a 00:00 em São Paulo)
        const inicioDoDiaUTC = new Date(agora);
        inicioDoDiaUTC.setHours(inicioDoDiaUTC.getHours() - 3); // Ajusta para UTC-3
        inicioDoDiaUTC.setHours(0, 0, 0, 0); // Define o início do dia (meia-noite)

        // Fim do dia em UTC (equivalente a 23:59 em São Paulo)
        const fimDoDiaUTC = new Date(inicioDoDiaUTC);
        fimDoDiaUTC.setHours(23, 59, 59, 999); // Define o fim do dia    

        // 1. Total de entradas pela embalagem específica (independente do item)
        const somaQuantidadesEmbalagem = await this.prisma.entryInput.aggregate({
            _sum: {
                quantidade: true,
            },
            where: {
                embalagemId: embalagemId,
                createdAt: {
                    gte: inicioDoDiaUTC,
                    lte: fimDoDiaUTC,
                },
            },
        });

        // 2. Total de entradas pelo item específico no mesmo período
        const somaQuantidadesItem = await this.prisma.entryInput.aggregate({
            _sum: {
                quantidade: true,
            },
            where: {
                itemTamanhoId: itemTamanhoId,
                embalagemId: embalagemId,
                createdAt: {
                    gte: inicioDoDiaUTC,
                    lte: fimDoDiaUTC,
                },
            },
        });

        // 3. Quantidade de estoque do item específico
        const itemTamanho = await this.prisma.itemTamanho.findUnique({
            where: { id: itemTamanhoId },
            include: {
                estoque: true,
                kitMain: {
                    include: {
                        component: {
                            include: {
                                estoque: true,
                            },
                        },
                    },
                },
            },
        });

        if (!itemTamanho) {
            throw new Error(`ItemTamanho com ID ${itemTamanhoId} não encontrado.`);
        }

        let estoqueFinal = 0;

        if (itemTamanho.isKit && itemTamanho.kitMain.length > 0) {
            estoqueFinal = calcularEstoqueDeKit(itemTamanho.kitMain);
        } else {
            estoqueFinal = itemTamanho.estoque?.quantidade ?? 0;
        }

        return {
            quantidadeTotalEmbalagem: somaQuantidadesEmbalagem._sum.quantidade || 0,
            quantidadeTotalItem: somaQuantidadesItem._sum.quantidade || 0,
            quantidadeEstoque: estoqueFinal,
        };
    }

    async inserirQtyNoEstoque(stock: StockGenerate): Promise<EntryInput | null> {
        const { embalagemId, itemTamanhoId, estoqueId, userId, quantidade } = stock;

        try {
            const result = await this.prisma.$transaction(async (prisma) => {
                // 1. Verifica se o itemTamanhoId é um kit
                const itemTamanho = await prisma.itemTamanho.findUnique({
                    where: { id: itemTamanhoId },
                    include: { kitMain: true },
                });

                if (!itemTamanho) {
                    throw new Error(`ItemTamanho com id ${itemTamanhoId} não encontrado.`);
                }               

                // Se for kit, atualiza estoque e cria entry para cada componente do kit
                if (itemTamanho.isKit) {
                    const entradas: EntryInput[] = [];

                    for (const componente of itemTamanho.kitMain) {
                        // Calcula a quantidade para o componente
                        const quantidadeComponente = quantidade * componente.quantidade;

                        // Atualiza estoque do componente
                        const estoqueAtual = await prisma.estoque.findUnique({
                            where: { itemTamanhoId: componente.componentId },
                        });

                        if (!estoqueAtual) {
                            throw new Error(`Estoque para componente id ${componente.componentId} não encontrado.`);
                        }

                        await prisma.estoque.update({
                            where: { itemTamanhoId: componente.componentId },
                            data: {
                                quantidade: estoqueAtual.quantidade + quantidadeComponente,
                            },
                        });

                        // Cria entrada EntryInput para o componente
                        const newEntry = await prisma.entryInput.create({
                            data: {
                                embalagemId,
                                itemTamanhoId: componente.componentId,
                                estoqueId: estoqueAtual.id,
                                quantidade: quantidadeComponente,
                                userId,
                                kitInput: true,
                                kitOrigemId: itemTamanho.id,
                            },
                        });                       

                        entradas.push(newEntry);
                    }

                    // Retorna a primeira entrada como exemplo (ou pode retornar todas)
                    return entradas[0] || null;

                } else {
                    // Fluxo atual para item normal
                    const estoqueAtual = await prisma.estoque.findUnique({
                        where: { itemTamanhoId },
                    });

                    if (!estoqueAtual) {
                        throw new Error(`Estoque com itemTamanhoId ${itemTamanhoId} não encontrado.`);
                    }

                    const novaQuantidade = estoqueAtual.quantidade + quantidade;

                    await prisma.estoque.update({
                        where: { itemTamanhoId },
                        data: { quantidade: novaQuantidade },
                    });

                    const newEntry = await prisma.entryInput.create({
                        data: {
                            embalagemId,
                            itemTamanhoId,
                            estoqueId,
                            quantidade,
                            userId,
                        },
                    });

                    return newEntry;
                }
            }, {
                isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
                maxWait: 5000,
                timeout: 20000,
            });

            return result;
        } catch (error) {
            console.error('Erro ao inserir quantidade no estoque:', error);
            throw new Error(`Falha ao inserir no estoque: ${error instanceof Error ? error.message : error}`);
        }
    }

}
