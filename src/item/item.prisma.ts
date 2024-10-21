import { Item as PrismaItem, Genero as PrismaGenero } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { PrismaProvider } from 'src/db/prisma.provider';
import { Item } from '@core/index';
import { Genero } from '@core/interfaces/Genero';

@Injectable()
export class ItemPrisma {
    constructor(readonly prisma: PrismaProvider) { }

    async salvar(item: Item): Promise<Item> {
        const { id, tamanhos, projeto, ...dadosDoItem } = item;

        // Converta o Genero de sua interface personalizada para o tipo Prisma
        const dadosParaSalvar = {
            ...dadosDoItem,
            genero: this.convertToPrismaGenero(item.genero),
        };

        const itemSalvo = await this.prisma.item.upsert({
            where: {
                id: id !== undefined ? +id : -1,
            },
            update: {
                ...dadosParaSalvar,
            },
            create: {
                ...dadosParaSalvar,
            },
        });

        return {
            ...itemSalvo,
            genero: this.convertToCustomGenero(itemSalvo.genero), // Converta de volta para o seu tipo personalizado
        };
    }

    async obter(): Promise<Item[]> {
        const itens = await this.prisma.item.findMany({
            include: {
                tamanhos: true,
                projeto: true,               
            },
        });

        // Converta o tipo de Genero para a interface personalizada
        return itens.map((item) => ({
            ...item,
            genero: this.convertToCustomGenero(item.genero),
        }));
    }

    async obterPorId(id: number): Promise<Item | null> {
        const item = await this.prisma.item.findUnique({ where: { id } });
        return (item as Item) ?? null;
    }

    async excluir(id: number): Promise<void> {
        try {
            // Tente excluir o item com o ID fornecido
            await this.prisma.item.delete({ where: { id } });
        } catch (error) {
            // Aqui você pode capturar e tratar o erro
            console.error('Erro ao excluir o item:', error);

            // Lançar um erro apropriado ou lançar uma exceção
            if (error.code === 'P2025') {
                // Erro específico quando o registro não é encontrado
                throw new Error('O item não foi encontrado.');
            } else {
                // Lidar com outros erros genéricos
                throw new Error('Erro ao tentar excluir o item. Por favor, tente novamente.');
            }
        }
    }

    private convertToPrismaGenero(genero: Genero): PrismaGenero {
        switch (genero) {
            case Genero.MASCULINO:
                return PrismaGenero.MASCULINO;
            case Genero.FEMININO:
                return PrismaGenero.FEMININO;
            case Genero.UNISSEX:
                return PrismaGenero.UNISSEX;
            default:
                throw new Error('Gênero inválido');
        }
    }

    private convertToCustomGenero(genero: PrismaGenero): Genero {
        switch (genero) {
            case PrismaGenero.MASCULINO:
                return Genero.MASCULINO;
            case PrismaGenero.FEMININO:
                return Genero.FEMININO;
            case PrismaGenero.UNISSEX:
                return Genero.UNISSEX;
            default:
                throw new Error('Gênero inválido');
        }
    }
}
