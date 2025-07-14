import { FinalyGrade, Grade } from '@core/index';
import { Injectable } from '@nestjs/common';
import { GradeItem, Prisma, Status } from '@prisma/client';
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
  async finalizarGrade(finalyGrade: FinalyGrade): Promise<Grade> {
    const { id, finalizada, status } = finalyGrade;
    return await this.prisma.$transaction(async (prisma) => {
      try {
        const gradeAtualizada = await prisma.grade.update({
          where: { id },
          data: { finalizada: finalizada, status: status },
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
    const grade = await this.prisma.grade.findUnique({ where: { id }, include: { itensGrade: true } });
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

  async replicarGrade(id: number): Promise<Grade | null> {
    try {
      return await this.prisma.$transaction(
        async (prisma) => {
          const grade = await prisma.grade.findUnique({
            where: { id },
            include: { itensGrade: true },
          });

          if (!grade || grade.status !== "PRONTA") {
            return null;
          }

          let itemsParaCriarNovaGrade: GradeItem[] = [];
          let houveAjuste = false;

          // Verifica se existe algum item com quantidadeExpedida > 0
          const algumItemExpedido = grade.itensGrade.some(
            (item) => item.quantidadeExpedida > 0
          );

          if (!algumItemExpedido) {
            return null;
          }

          // Ajuste e coleta de itens para a nova grade
          for (const item of grade.itensGrade) {
            const quantidadeRestante = item.quantidade - item.quantidadeExpedida;

            if (quantidadeRestante > 0 && algumItemExpedido) {
              // Adiciona o item na nova grade com a quantidade restante
              itemsParaCriarNovaGrade.push({
                ...item,
                quantidade: quantidadeRestante,
                quantidadeExpedida: 0, // Início sem nada expedido
              });

              // Atualiza o item original para igualar quantidade e quantidadeExpedida
              await prisma.gradeItem.update({
                where: { id: item.id },
                data: { quantidade: item.quantidadeExpedida },
              });

              houveAjuste = true;
            }

            if (algumItemExpedido && item.quantidadeExpedida === 0) {
              // Exclui o item se quantidadeExpedida for igual a 0 e algum item já foi expedido
              await prisma.gradeItem.delete({
                where: { id: item.id },
              });
            }
          }

          // Finaliza a grade original apenas se houve ajuste
          if (houveAjuste) {
            await prisma.grade.update({
              where: { id: grade.id },
              data: {
                finalizada: true,
                status: 'EXPEDIDA' as Status,
              },
            });
          }

          // Criação de nova grade, se necessário
          if (itemsParaCriarNovaGrade.length > 0 && houveAjuste) {
            const novaGrade: Grade = {
              companyId: grade.companyId,
              escolaId: grade.escolaId,
              finalizada: false,
              tipo: grade.tipo?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase() === 'REPOSICAO' ? 'REPOSIÇÃO' : null,
              status: 'PRONTA' as Status,
              remessa: grade.remessa,
              itensGrade: itemsParaCriarNovaGrade,
            };

            const { itensGrade, ...dadosDaGrade } = novaGrade;

            // Cria a nova grade
            const gradeReplicada = await prisma.grade.create({
              data: {
                escolaId: dadosDaGrade.escolaId,
                companyId: dadosDaGrade.companyId,
                finalizada: dadosDaGrade.finalizada,
                tipo: dadosDaGrade.tipo,
                remessa: dadosDaGrade.remessa,
                status: dadosDaGrade.status as Status,
              },
            });

            // Adiciona os itens à nova grade
            if (itensGrade.length > 0) {
              await Promise.all(
                itensGrade.map(async (item) => {
                  await prisma.gradeItem.create({
                    data: {
                      gradeId: gradeReplicada.id,
                      itemTamanhoId: item.itemTamanhoId,
                      quantidade: item.quantidade,
                      quantidadeExpedida: item.quantidadeExpedida,
                    },
                  });
                })
              );
            }

            // Retorna a nova grade com os itens criados
            const novaGradeComItens = await prisma.grade.findUnique({
              where: { id: gradeReplicada.id },
              include: {
                itensGrade: true,
              },
            });

            return novaGradeComItens as Grade;
          }

          // Caso não haja itens para replicar, retorna null
          return null;
        },
        {
          maxWait: 10000, // Tempo máximo para aguardar o início da transação
          timeout: 20000, // Tempo máximo para execução da transação
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        }
      );
    } catch (error: any) {
      console.error("", error);
      throw new Error("Erro ao replicar grade: " + error.message);
    }
  }

  async atualizarStatusParaDespachada(gradeIds: number[]): Promise<number[]> {
    // Busca as grades no banco de dados, garantindo que estejam com status "EXPEDIDA"
    const gradesExpedidas = await this.prisma.grade.findMany({
      where: {
        id: { in: gradeIds },
        status: "EXPEDIDA",
      },
      select: { id: true },
    });

    // Se não encontrar nenhuma grade expedida, retorna um array vazio
    if (gradesExpedidas.length === 0) return [];

    // Extrai os IDs das grades que serão alteradas
    const idsParaAtualizar = gradesExpedidas.map(grade => grade.id);

    // Atualiza o status das grades encontradas para "DESPACHADA"
    await this.prisma.grade.updateMany({
      where: { id: { in: idsParaAtualizar } },
      data: { status: "DESPACHADA" },
    });

    // Retorna os IDs das grades que foram alteradas
    return idsParaAtualizar;
  }

}
