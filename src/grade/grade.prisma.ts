import { Grade } from '@core/index';
import { Injectable } from '@nestjs/common';
import { PrismaProvider } from 'src/db/prisma.provider';

@Injectable()
export class GradePrisma {
  constructor(readonly prisma: PrismaProvider) { }

  async salvar(grade: Grade): Promise<Grade> {
    const { id, finalizada, itensGrade, escola, company, gradeCaixas, ...dadosDaGrade } = grade;

    const gradeSalva = await this.prisma.grade.upsert({
      where: {
        id: id !== undefined ? +id : -1,
      },
      update: {
        ...dadosDaGrade,
        // Aqui você pode adicionar lógica específica para atualizar grades se necessário
      },
      create: {
        ...dadosDaGrade,
        // Aqui você pode adicionar lógica específica para criar grades se necessário
      },
    });
    return gradeSalva; // Retorne o grade salva
  }

  // Atualiza apenas a propriedade "finalizada" para true dentro de uma transação
  async finalizarGrade(id: number): Promise<Grade> {
    return await this.prisma.$transaction(async (prisma) => {
      try {
        const gradeAtualizada = await prisma.grade.update({
          where: { id },
          data: { finalizada: true },
        });
        return gradeAtualizada;
      } catch (error) {
        throw new Error(`Erro ao atualizar a grade: ${error.message}`);
      }
    });
  }

  async obter(): Promise<Grade[]> {
    const grades = await this.prisma.grade.findMany();
    return grades;
  }

  async obterPorId(id: number): Promise<Grade | null> {
    const grade = await this.prisma.grade.findUnique({ where: { id } });
    return (grade as Grade) ?? null;
  }  

  async excluir(id: number): Promise<void> {
    try {
      // Tente excluir a grade com o ID fornecido
      await this.prisma.grade.delete({ where: { id } });
    } catch (error) {
      // Aqui você pode capturar e tratar o erro
      console.error('Erro ao excluir a grade:', error);

      // Lançar um erro apropriado ou lançar uma exceção
      if (error.code === 'P2025') {
        // Erro específico quando o registro não é encontrado
        throw new Error('A grade não foi encontrada.');
      } else {
        // Lidar com outros erros genéricos
        throw new Error('Erro ao tentar excluir a grade. Por favor, tente novamente.');
      }
    }
  }
}
