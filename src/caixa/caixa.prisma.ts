import { Caixa } from '@core/index';
import { Injectable } from '@nestjs/common';
import { PrismaProvider } from 'src/db/prisma.provider';

@Injectable()
export class CaixaPrisma {
  constructor(private readonly prisma: PrismaProvider) { }

  async inserirCaixaEItens(caixaData: Caixa): Promise<Caixa> {
    const { caixaItem, itensGrade, userId, ...dadosDaCaixa } = caixaData;
    try {
      // Usa uma transação Prisma para garantir atomicidade
      const result = await this.prisma.$transaction(async (prisma) => {
        // 1. Cria a caixa no banco de dados e armazena o ID
        const novaCaixa = await prisma.caixa.create({
          data: {
            gradeId: +dadosDaCaixa.gradeId,
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

        // 2. Insere os itens da caixa incluindo `itemTamanhoId`
        const itensCriados = await Promise.all(
          caixaItem.map((item) => {
            return prisma.caixaItem.create({
              data: {
                itemName: item.itemName,
                itemGenero: item.itemGenero,
                itemTam: item.itemTam,
                itemQty: item.itemQty,
                itemTamanhoId: item.itemTamanhoId,
                caixaId: novaCaixa.id,
              },
            });
          })
        );

        await Promise.all(
          itensGrade.map(async (item) => {
            // Busca o item antes da atualização
            const itemDB = await prisma.gradeItem.findUnique({
              where: { id: item.id }
            });

            if (!itemDB) {
              throw new Error(`Item com ID ${item.id} não encontrado.`);
            }

            // Verifica se a quantidade expedida não ultrapassa o limite permitido
            if (item.quantidadeExpedida > itemDB.quantidade) {
              throw new Error(`A quantidade expedida (${item.quantidadeExpedida}) não pode ser maior que a quantidade solicitada (${itemDB.quantidade}) para o item ${item.id}.`);
            }

            // Atualiza o item na grade
            return prisma.gradeItem.update({
              where: { id: item.id },
              data: { quantidadeExpedida: item.quantidadeExpedida },
            });
          })
        );

        // 4. Atualiza o estoque com base no `itemTamanhoId` em caixaItem e insere as movimentações de saída
        await Promise.all(
          caixaItem.map(async (item) => {
            const { itemTamanhoId, itemQty } = item;

            if (itemTamanhoId) {
              const estoqueAtual = await prisma.estoque.findUnique({
                where: { itemTamanhoId: itemTamanhoId },
              });

              const novaQuantidade = (estoqueAtual?.quantidade || 0) - itemQty;

              // Atualiza o estoque
              await prisma.estoque.update({
                where: { itemTamanhoId: itemTamanhoId },
                data: { quantidade: novaQuantidade },
              });

              // Insere a movimentação de saída na tabela `OutInput`
              await prisma.outInput.create({
                data: {
                  itemTamanhoId: itemTamanhoId,
                  estoqueId: estoqueAtual.id,
                  quantidade: itemQty,
                  userId: userId,
                  gradeId: +dadosDaCaixa.gradeId,
                  caixaId: novaCaixa.id,
                },
              });
            }
          })
        );

        const itensDaGrade = await prisma.gradeItem.findMany({
          where: { gradeId: +dadosDaCaixa.gradeId }
        });

        const todosExpedidos = itensDaGrade.every(item => item.quantidadeExpedida === item.quantidade);

        if (todosExpedidos) {
          // Atualiza a grade para EXPEDIDA e finalizada = true
          await prisma.grade.update({
            where: { id: +dadosDaCaixa.gradeId },
            data: { status: "EXPEDIDA", finalizada: true }
          });
        }

        // Retorna a nova caixa com os itens associados
        return {
          ...novaCaixa,
          caixaItem: itensCriados,
          itensGrade: [],
        };
      },
        {
          maxWait: 5000, // default: 2000
          timeout: 20000, // default: 5000     
        }
      );
      return result;
    } catch (error) {
      throw new Error('Erro ao inserir a caixa e itens no banco de dados.');
    }
  }
}
