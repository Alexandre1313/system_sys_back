import { ItemTamanho } from '@core/index';
import { Injectable } from '@nestjs/common';
import { PrismaProvider } from 'src/db/prisma.provider';

@Injectable()
export class ItemTamanhoPrisma {
  constructor(readonly prisma: PrismaProvider) { }

  async salvar(itemTamanho: ItemTamanho): Promise<ItemTamanho> {
    const { id, GradeItem, estoque, barcode, tamanho, item, ...dadosDoItemTamanho } = itemTamanho;

    const ItemTamanhoSalvo = await this.prisma.itemTamanho.upsert({
      where: {
        id: id !== undefined ? +id : -1,
      },
      update: {
        ...dadosDoItemTamanho,
        // Aqui você pode adicionar lógica específica para atualizar itens se necessário
      },
      create: {
        ...dadosDoItemTamanho,
        // Aqui você pode adicionar lógica específica para criar itens se necessário
      },
    });
    return ItemTamanhoSalvo; // Retorne o itemTamanho salvo
  }

  async obter(): Promise<ItemTamanho[]> {
    const itensTamanho = await this.prisma.itemTamanho.findMany();
    return itensTamanho;
  }

  async obterPorId(id: number): Promise<ItemTamanho | null> {
    const itemtamanho = await this.prisma.itemTamanho.findUnique({ where: { id } });
    return (itemtamanho as ItemTamanho) ?? null;
  }

  async excluir(id: number): Promise<void> {
    try {
      // Tente excluir o item com o ID fornecido
      await this.prisma.itemTamanho.delete({ where: { id } });
    } catch (error) {
      // Aqui você pode capturar e tratar o erro
      console.error('Erro ao excluir o itemTamanho:', error);

      // Lançar um erro apropriado ou lançar uma exceção
      if (error.code === 'P2025') {
        // Erro específico quando o registro não é encontrado
        throw new Error('O itemTamanho não foi encontrado.');
      } else {
        // Lidar com outros erros genéricos
        throw new Error('Erro ao tentar excluir o itemTamanho. Por favor, tente novamente.');
      }
    }
  }
}
