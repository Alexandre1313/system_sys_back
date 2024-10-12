import { Estoque } from '@core/index';
import { Injectable } from '@nestjs/common';
import { PrismaProvider } from 'src/db/prisma.provider';

@Injectable()
export class EstoquePrisma {
  constructor(readonly prisma: PrismaProvider) { }

  async salvar(estoque: Estoque): Promise<Estoque> {
    const { id, itemTamanho, ...dadosDoEstoque } = estoque;

    const estoqueSalvo = await this.prisma.estoque.upsert({
      where: {
        id: id !== undefined ? +id : -1,
      },
      update: {
        ...dadosDoEstoque,
        // Aqui você pode adicionar lógica específica para atualizar itens se necessário
      },
      create: {
        ...dadosDoEstoque,
        // Aqui você pode adicionar lógica específica para criar itens se necessário
      },
    });
    return estoqueSalvo; // Retorne o estoque salvo
  }

  async obter(): Promise<Estoque[]> {
    const estoques = await this.prisma.estoque.findMany(
        {
            include: {
                itemTamanho: true, // Inclui os dados do itemTamanho associado a cada estoque
            },
        }
    );
    return estoques;
  }

  async obterPorId(id: number): Promise<Estoque | null> {
    const estoque = await this.prisma.estoque.findUnique({ where: { id } });
    return (estoque as Estoque) ?? null;
  }

  async excluir(id: number): Promise<void> {
    try {
      // Tente excluir o estoque com o ID fornecido
      await this.prisma.estoque.delete({ where: { id } });
    } catch (error) {
      // Aqui você pode capturar e tratar o erro
      console.error('Erro ao excluir o estoque:', error);

      // Lançar um erro apropriado ou lançar uma exceção
      if (error.code === 'P2025') {
        // Erro específico quando o registro não é encontrado
        throw new Error('O estoque não foi encontrado.');
      } else {
        // Lidar com outros erros genéricos
        throw new Error('Erro ao tentar excluir o estoque. Por favor, tente novamente.');
      }
    }
  }
}
