import { GradeItem } from '@core/index';
import { Injectable } from '@nestjs/common';
import { PrismaProvider } from 'src/db/prisma.provider';

@Injectable()
export class GradeItemPrisma {
  constructor(readonly prisma: PrismaProvider) { }

  async salvar(gradeItem: GradeItem): Promise<GradeItem> {
    const { id, itemTamanho, grade, ...dadosDaGradeItem } = gradeItem;

    const gradeItemSalva = await this.prisma.gradeItem.upsert({
      where: {
        id: id !== undefined ? +id : -1,
      },
      update: {
        ...dadosDaGradeItem,
        // Aqui você pode adicionar lógica específica para atualizar gradeItems se necessário
      },
      create: {
        ...dadosDaGradeItem,
        // Aqui você pode adicionar lógica específica para criar gradeItems se necessário
      },
    });
    return gradeItemSalva; // Retorne o gradeItem salva
  }

  async updateItem(data: any): Promise<GradeItem | null> {
    const { id, quantidadeExpedida } = data;

    // Verificar se o id e quantidadeExpedida foram fornecidos
    if (!id || quantidadeExpedida === undefined) {
      return null;
    }

    try {
      // Usa uma transação Prisma para garantir atomicidade
      const result = await this.prisma.$transaction(
        async (prisma) => {
          // Tenta atualizar a quantidade do item de grade com o valor de quantidadeExpedida
          const gradeItemAtualizado = await prisma.gradeItem.update({
            where: {
              id: id !== undefined ? +id : -1, // Garante que o id seja numérico
            },
            data: {
              quantidade: quantidadeExpedida, // Atualiza somente a quantidade com o valor expedido
            },
          });

          // Retorna o item de grade atualizado
          return gradeItemAtualizado;
        },
        {
          maxWait: 5000,  // Tempo máximo de espera para adquirir um bloqueio na transação (default: 2000)
          timeout: 20000, // Tempo máximo de execução da transação (default: 5000)
        }
      );

      return result; // Retorna o resultado da transação
    } catch (error) {
      console.error('Erro ao atualizar o item de grade:', error);
      return null; // Retorna null em caso de erro (por exemplo, se o item não for encontrado)
    }
  }

  async obter(): Promise<GradeItem[]> {
    const gradeItems = await this.prisma.gradeItem.findMany();
    return gradeItems;
  }

  async obterPorId(id: number): Promise<GradeItem | null> {
    const gradeItem = await this.prisma.gradeItem.findUnique({ where: { id } });
    return (gradeItem as GradeItem) ?? null;
  }

  async excluir(id: number): Promise<void> {
    try {
      // Usa uma transação Prisma para garantir atomicidade
      await this.prisma.$transaction(
        async (prisma) => {
          // Tente excluir a gradeItem com o ID fornecido
          await prisma.gradeItem.delete({ where: { id } });
        },
        {
          maxWait: 5000,  // Tempo máximo de espera para adquirir um bloqueio na transação (default: 2000)
          timeout: 20000, // Tempo máximo de execução da transação (default: 5000)
        }
      );
    } catch (error) {
      console.error('Erro ao excluir a gradeItem:', error);

      // Lançar um erro apropriado ou lançar uma exceção
      if (error.code === 'P2025') {
        // Erro específico quando o registro não é encontrado
        throw new Error('A gradeItem não foi encontrada.');
      } else {
        // Lidar com outros erros genéricos
        throw new Error('Erro ao tentar excluir a gradeItem. Por favor, tente novamente.');
      }
    }
  }

}
