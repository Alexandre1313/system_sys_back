import { Escola } from '@core/index';
import { Injectable } from '@nestjs/common';
import { PrismaProvider } from 'src/db/prisma.provider';

@Injectable()
export class EscolaPrisma {
    constructor(readonly prisma: PrismaProvider) { }

    async salvar(escola: Escola): Promise<Escola> {
        const { id, projeto, grades, ...dadosDaEscola } = escola;
    
        // Verifica se já existe uma escola com o mesmo nome para o mesmo projeto
        const escolaExistente = await this.prisma.escola.findFirst({
            where: {
                nome: dadosDaEscola.nome,
                projetoId: dadosDaEscola.projetoId,
            },
        });
    
        // Se uma escola com o mesmo nome e projeto já existe e não é a atual, lance um erro
        if (escolaExistente && escolaExistente.id !== id) {
            throw new Error('Já existe uma escola com este nome associada a este projeto.');
        }
    
        // Realiza o upsert no banco de dados
        const escolaSalva = await this.prisma.escola.upsert({
            where: {
                id: id !== undefined ? +id : -1, // Usar -1 para id inexistente
            },
            update: {
                ...dadosDaEscola,               
            },
            create: {
                ...dadosDaEscola,              
            },
        });
    
        return escolaSalva; // Retorne a escola salva
    }

    async obter(): Promise<Escola[]> {
        const escolas = await this.prisma.escola.findMany({
            include: {
                projeto: true, // Inclui os dados do projeto associado a cada escola
            },
        });
        return escolas;
    }

    async obterPorId(id: number): Promise<Escola | null> {
        const escola = await this.prisma.escola.findUnique({ where: { id } });
        return (escola as any) ?? null;
    }

    async excluir(id: number): Promise<void> {
        await this.prisma.escola.delete({ where: { id } });
    }
}
