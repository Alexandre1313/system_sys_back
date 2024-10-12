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
      // Tente excluir a gradeItem com o ID fornecido
      await this.prisma.gradeItem.delete({ where: { id } });
    } catch (error) {
      // Aqui você pode capturar e tratar o erro
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
