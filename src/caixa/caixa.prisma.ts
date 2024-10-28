import { Caixa } from '@core/index';
import { Injectable } from '@nestjs/common';
import { PrismaProvider } from 'src/db/prisma.provider';

@Injectable()
export class CaixaPrisma {
  constructor(private readonly prisma: PrismaProvider) {}

  async inserirCaixaEItens(caixaData: Caixa): Promise<Caixa> {
    const { caixaItem, itensGrade, ...dadosDaCaixa } = caixaData; // Extrai caixaItem e itensGrade

    try {
      // Usa uma transação Prisma para garantir atomicidade
      const result = await this.prisma.$transaction(async (prisma) => {
        // 1. Cria a caixa no banco de dados e armazena o ID
        const novaCaixa = await prisma.caixa.create({
          data: {
            gradeId: +dadosDaCaixa.gradeId,
            escolaNumber: dadosDaCaixa.escolaNumber,
            projeto: dadosDaCaixa.projeto,
            escolaCaixa: dadosDaCaixa.escolaCaixa,
            caixaNumber: dadosDaCaixa.caixaNumber,
          },
        });

        // 2. Insere os itens da caixa, associando-os ao ID da caixa recém-criada
        const itensCriados = await Promise.all(
          caixaItem.map((item) =>
            prisma.caixaItem.create({
              data: {
                itemName: item.itemName,
                itemGenero: item.itemGenero,
                itemTam: item.itemTam,
                itemQty: item.itemQty,
                caixaId: novaCaixa.id,
              },
            })
          )
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

        // Retorna a nova caixa com os itens associados
        return {
          ...novaCaixa,
          caixaItem: itensCriados,
          itensGrade: [],
        };
      });
      return result;
    } catch (error) {
      throw new Error('Erro ao inserir a caixa e itens no banco de dados.');
    }
  }
}
