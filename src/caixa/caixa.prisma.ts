import { Caixa } from '@core/index';
import { Injectable } from '@nestjs/common';
import { PrismaProvider } from 'src/db/prisma.provider';

@Injectable()
export class CaixaPrisma {
  constructor(private readonly prisma: PrismaProvider) { }

  async inserirCaixaEItens(caixaData: Caixa): Promise<Caixa> {
    const { caixaItem, itensGrade, userId, ...dadosDaCaixa } = caixaData;

    const gradeId = Number(dadosDaCaixa.gradeId);
    if (isNaN(gradeId)) throw new Error("GradeId inválido.");

    try {
      const result = await this.prisma.$transaction(async (prisma) => {
        const novaCaixa = await prisma.caixa.create({
          data: {
            gradeId: gradeId,
            escolaNumber: dadosDaCaixa.escolaNumber,
            numberJoin: dadosDaCaixa.numberJoin,
            qtyCaixa: dadosDaCaixa.qtyCaixa,
            projeto: dadosDaCaixa.projeto,
            escolaCaixa: dadosDaCaixa.escolaCaixa,
            caixaNumber: dadosDaCaixa.caixaNumber,
            tipoEmbalagemId: dadosDaCaixa.tipoEmbalagemId,
            userId: userId,
          },
        });

        const itensCriados = [];
        
        for (const item of caixaItem) {
          const criado = await prisma.caixaItem.create({
            data: {
              itemName: item.itemName,
              itemGenero: item.itemGenero,
              itemTam: item.itemTam,
              itemQty: item.itemQty,
              itemTamanhoId: item.itemTamanhoId,
              caixaId: novaCaixa.id,
            },
          });
          itensCriados.push(criado);
        }

        for (const item of itensGrade) {
          const itemDB = await prisma.gradeItem.findUnique({
            where: { id: item.id },
          });

          if (!itemDB) {
            throw new Error(`Item com ID ${item.id} não encontrado.`);
          }

          if (item.quantidadeExpedida > itemDB.quantidade) {
            throw new Error(
              `A quantidade expedida (${item.quantidadeExpedida}) não pode ser maior que a quantidade solicitada (${itemDB.quantidade}) para o item ${item.id}.`
            );
          }

          await prisma.gradeItem.update({
            where: { id: item.id },
            data: { quantidadeExpedida: item.quantidadeExpedida },
          });
        }

        for (const item of caixaItem) {
          const { itemTamanhoId, itemQty } = item;

          if (itemTamanhoId) {
            const estoqueAtual = await prisma.estoque.findUnique({
              where: { itemTamanhoId },
            });

            if (!estoqueAtual) {
              throw new Error(
                `Estoque com itemTamanhoId ${itemTamanhoId} não encontrado.`
              );
            }

            const novaQuantidade = estoqueAtual.quantidade - itemQty;

            await prisma.estoque.update({
              where: { itemTamanhoId },
              data: { quantidade: novaQuantidade },
            });

            await prisma.outInput.create({
              data: {
                itemTamanhoId,
                estoqueId: estoqueAtual.id,
                quantidade: itemQty,
                userId,
                gradeId,
                caixaId: novaCaixa.id,
              },
            });
          }
        }

        const itensDaGrade = await prisma.gradeItem.findMany({
          where: { gradeId },
        });

        const todosExpedidos = itensDaGrade.every(
          (item) => item.quantidadeExpedida === item.quantidade
        );

        if (todosExpedidos) {
          await prisma.grade.update({
            where: { id: gradeId },
            data: { status: "EXPEDIDA", finalizada: true },
          });
        }

        return {
          ...novaCaixa,
          caixaItem: itensCriados,
          itensGrade: [],
        };
      }, {
        maxWait: 5000,
        timeout: 20000,
      });

      return result;
    } catch (error: any) {
      console.error("Erro detalhado ao inserir caixa:", error);
      throw new Error("Erro ao inserir a caixa: " + error.message);
    }
  }

  async getCaixasComItensPorGradeId(gradeId: number): Promise<(Omit<Caixa, 'usuario'> & { usuario: string })[]> {
    try {
      const caixas = await this.prisma.caixa.findMany({
        where: { gradeId },
        include: {
          caixaItem: true,
          usuario: {
            select: {
              nome: true,
            },
          },
        },
      });

      if (!caixas) return [];

      const caixasComUsuarioNome = caixas.map((caixa) => ({
        ...caixa,
        usuario: caixa.usuario?.nome ?? 'Desconhecido',
      }));

      // Ordenar de forma numérica decrescente, mesmo sendo texto no banco
      return caixasComUsuarioNome.sort(
        (a, b) => Number(b.caixaNumber) - Number(a.caixaNumber)
      );
    } catch (error) {
      console.error("Erro ao buscar caixas:", error);
      throw error;
    }
  }

}
