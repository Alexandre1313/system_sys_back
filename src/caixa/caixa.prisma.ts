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
            qtyCaixa: dadosDaCaixa.qtyCaixa,
            projeto: dadosDaCaixa.projeto,
            escolaCaixa: dadosDaCaixa.escolaCaixa,
            caixaNumber: dadosDaCaixa.caixaNumber,
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

        // 3. Atualiza os itens da grade com a nova quantidade expedida
        await Promise.all(
          itensGrade.map((item) =>
            prisma.gradeItem.update({
              where: { id: item.id },
              data: { quantidadeExpedida: item.quantidadeExpedida },
            })
          )
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
                },
              });
            }
          })
        );

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
