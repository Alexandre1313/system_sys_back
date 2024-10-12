import { Tamanho } from '@core/index';
import { Injectable } from '@nestjs/common';
import { PrismaProvider } from 'src/db/prisma.provider';

@Injectable()
export class TamanhoPrisma {
    constructor(readonly prisma: PrismaProvider) { }

    async salvar(tamanho: Tamanho): Promise<Tamanho> {
        const { id, itens, ...dadosDoTamanho } = tamanho;
    
        // Verifica se já existe um tamanho com o mesmo nome
        const tamanhoExistente = await this.prisma.tamanho.findFirst({
            where: {
                nome: dadosDoTamanho.nome,
            },
        });
    
        // Se um tamanho com o mesmo nome já existe e não é o atual, lance um erro
        if (tamanhoExistente && tamanhoExistente.id !== id) {
            throw new Error('Já existe este tamanho cadastrado.');
        }
    
        // Realiza o upsert no banco de dados
        const tamanhoSalvo = await this.prisma.tamanho.upsert({
            where: {
                id: id !== undefined ? id : -1, // Usar -1 para id inexistente
            },
            update: {
                ...dadosDoTamanho,
            },
            create: {
                ...dadosDoTamanho,
            },
        });
    
        return tamanhoSalvo; // Retorne o tamanho salvo
    }

    async obter(): Promise<Tamanho[]> {
        const tamanhos = await this.prisma.tamanho.findMany({
            include: {
                itens: true, // Inclui os dados dos itens associados a cada tamanho
            },
        });
        return tamanhos;
    }

    async obterPorId(id: number): Promise<Tamanho | null> {
        const tamanho = await this.prisma.tamanho.findUnique({ where: { id } });
        return (tamanho as Tamanho) ?? null;
    }

    async excluir(id: number): Promise<void> {
        try {
            // Tente excluir o item com o ID fornecido
            await this.prisma.tamanho.delete({ where: { id } });
        } catch (error) {
            // Aqui você pode capturar e tratar o erro
            console.error('Erro ao excluir o tamanho:', error);
            
            // Lançar um erro apropriado ou lançar uma exceção
            if (error.code === 'P2025') {
                // Erro específico quando o registro não é encontrado
                throw new Error('O tamanho não foi encontrado.');
            } else {
                // Lidar com outros erros genéricos
                throw new Error('Erro ao tentar excluir o tamanho. Por favor, tente novamente.');
            }
        }
    }
}
