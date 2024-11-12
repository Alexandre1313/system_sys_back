import { EntryInput, QtyEmbDay } from '@core/index';
import { Injectable } from '@nestjs/common';
import { PrismaProvider } from 'src/db/prisma.provider';

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
        const quantidadeEstoque = await this.prisma.estoque.findUnique({
            where: {
                id: itemTamanhoId,
            },
            select: {
                quantidade: true,
            },
        });
    
        return {
            quantidadeTotalEmbalagem: somaQuantidadesEmbalagem._sum.quantidade || 0,
            quantidadeTotalItem: somaQuantidadesItem._sum.quantidade || 0,
            quantidadeEstoque: quantidadeEstoque ? quantidadeEstoque.quantidade : 0,
        };
    }   
    
}
