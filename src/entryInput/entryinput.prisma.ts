import { EntryInput } from '@core/index';
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

    async buscarEntradasDoDiaPorEmbalagem(embalagemId: number) {
        // Data atual em São Paulo (ajustada para UTC)
        const agora = new Date();
        
        // Início do dia em UTC (equivalente a 00:00 em São Paulo)
        const inicioDoDiaUTC = new Date(agora);
        inicioDoDiaUTC.setHours(inicioDoDiaUTC.getHours() - 3); // Ajusta para UTC-3
        inicioDoDiaUTC.setHours(0, 0, 0, 0); // Define o início do dia (meia-noite)
    
        // Fim do dia em UTC (equivalente a 23:59 em São Paulo)
        const fimDoDiaUTC = new Date(inicioDoDiaUTC);
        fimDoDiaUTC.setHours(23, 59, 59, 999); // Define o fim do dia
    
        // Consultar o banco de dados para buscar as entradas
        const entradas = await this.prisma.entryInput.findMany({
            where: {
                embalagemId: embalagemId,
                createdAt: {
                    gte: inicioDoDiaUTC,
                    lte: fimDoDiaUTC,
                },
            },
            include: {
                embalagem: true,
                itemTamanho: true,
                estoque: true,
            },
        });    
        // Consultar o banco de dados para somar as quantidades
        const somaQuantidades = await this.prisma.entryInput.aggregate({
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
        return {
            entradas,
            somaQuantidades: somaQuantidades._sum.quantidade || 0, // Se for null, retorna 0
        };
    }  

    async buscarEntradasDoDiaPorEmbalagem2(embalagemId: number) {
        // Data atual em São Paulo (ajustada para UTC)
        const agora = new Date();
        
        // Início do dia em UTC (equivalente a 00:00 em São Paulo)
        const inicioDoDiaUTC = new Date(agora);
        inicioDoDiaUTC.setHours(inicioDoDiaUTC.getHours() - 3); // Ajusta para UTC-3
        inicioDoDiaUTC.setHours(0, 0, 0, 0); // Define o início do dia (meia-noite)
    
        // Fim do dia em UTC (equivalente a 23:59 em São Paulo)
        const fimDoDiaUTC = new Date(inicioDoDiaUTC);
        fimDoDiaUTC.setHours(23, 59, 59, 999); // Define o fim do dia
    
        // Consultar o banco de dados para buscar as entradas
        const entradas = await this.prisma.entryInput.findMany({
            where: {
                embalagemId: embalagemId,
                createdAt: {
                    gte: inicioDoDiaUTC,
                    lte: fimDoDiaUTC,
                },
            },
            include: {
                embalagem: true,
                itemTamanho: true,
                estoque: true,
            },
        });
    
        // Consultar o banco de dados para somar as quantidades
        const somaQuantidades = await this.prisma.entryInput.aggregate({
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
        return {
            entradas,
            somaQuantidades: somaQuantidades._sum.quantidade || 0, // Se for null, retorna 0
        };
    }  
}
