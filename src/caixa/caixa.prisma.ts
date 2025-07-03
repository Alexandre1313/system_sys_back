import { Caixa, CaixaAjuste, convertSPTime } from '@core/index';
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

        /*const caixasDaGrade = await prisma.caixa.findMany({
          where: { gradeId: gradeId },
          select: { caixaNumber: true },
        });

        const maiorNumero = caixasDaGrade
          .map(c => Number(c.caixaNumber))
          .filter(n => !isNaN(n))
          .sort((a, b) => b - a)[0] ?? 0;

        const proximaCaixaNumber = String(maiorNumero + 1).padStart(2, "0");*/

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

        if (!novaCaixa) throw new Error("Caixa não criada !");

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
              where: { itemTamanhoId: itemTamanhoId },
            });

            if (!estoqueAtual) {
              throw new Error(
                `Estoque com itemTamanhoId ${itemTamanhoId} não encontrado.`
              );
            }

            const novaQuantidade = estoqueAtual.quantidade - itemQty;

            await prisma.estoque.update({
              where: { itemTamanhoId: itemTamanhoId },
              data: { quantidade: novaQuantidade },
            });

            await prisma.outInput.create({
              data: {
                itemTamanhoId: itemTamanhoId,
                estoqueId: estoqueAtual.id,
                quantidade: itemQty,
                userId: userId,
                gradeId: gradeId,
                caixaId: novaCaixa.id,
              },
            });
          }
        }

        const itensDaGrade = await prisma.gradeItem.findMany({
          where: { gradeId: gradeId },
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

        console.log(novaCaixa)

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
      console.error("", error);
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

  async getCaixaById(caixaId: number): Promise<CaixaAjuste | null> {
    try {
      const caixa = await this.prisma.caixa.findUnique({
        where: {
          id: caixaId,
        },
        include: {
          caixaItem: true, // inclui os itens da caixa
          grade: {
            include: {
              escola: {
                include: {
                  projeto: true, // inclui o projeto ao qual a escola pertence
                },
              },
            },
          },
        },
      });

      if (!caixa) {
        return null;
      }

      return {
        id: caixa.id,
        gradeId: caixa.gradeId,
        status: String(caixa.grade.status),
        caixaNumber: caixa.caixaNumber,
        qtyCaixa: caixa.qtyCaixa,
        createdAt: convertSPTime(String(caixa.createdAt)),
        updatedAt: convertSPTime(String(caixa.updatedAt)),
        projeto: caixa.grade.escola.projeto.nome,
        escola: caixa.grade.escola.nome,
        escolaNumero: caixa.grade.escola.numeroEscola,
        itens: caixa.caixaItem.map((item) => ({
          id: item.id,
          caixaId: item.caixaId,
          itemName: item.itemName,
          itemGenero: item.itemGenero,
          itemTam: item.itemTam,
          itemQty: item.itemQty,
          itemTamanhoId: item.itemTamanhoId,
          updatedAt: convertSPTime(String(item.updatedAt)),
          createdAt: convertSPTime(String(item.createdAt)),
        })),
      };
    } catch (error) {
      console.error('Erro ao buscar a caixa:', error);
      throw error;
    }
  }

  async updateItensByBox(caixaData: CaixaAjuste): Promise<CaixaAjuste | null> {
    if (!caixaData) return null;

    const { id, gradeId, itens } = caixaData;

    try {
      const retorno = await this.prisma.$transaction(async (prisma) => {

        const itensModify = [];
        let isModification = false;

        for (const item of itens) {
          const { itemTamanhoId, itemQty } = item;

          const outInput = await prisma.outInput.findFirst({
            where: {
              caixaId: id,
              itemTamanhoId: itemTamanhoId,
              gradeId: gradeId,
            }
          });

          if (outInput) {
            if (outInput.quantidade !== itemQty) {

              const objectItens = {
                stockIdentifier: outInput.estoqueId,
                itemTamanhoIdIdentifier: outInput.itemTamanhoId,
                gradeIdentifier: outInput.gradeId,
                boxIdentifier: outInput.caixaId,
                exclude: itemQty === 0 ? true : false,
                diff: outInput.quantidade - itemQty,
                qtyNew: itemQty,
              };

              itensModify.push(objectItens);

              if (objectItens.exclude) {
                await prisma.outInput.delete({ where: { id: outInput.id } });
                continue;
              }

              if (objectItens.diff <= 0) continue;

              if (!objectItens.exclude) {
                await prisma.outInput.update({
                  where: { id: outInput.id }, data: { quantidade: itemQty }
                })
              }

            }
          }
        }

        for (const item of itensModify) {
          const { stockIdentifier, itemTamanhoIdIdentifier, gradeIdentifier, boxIdentifier, exclude, diff, qtyNew } = item;

          if (diff <= 0) {
            continue
          }

          if (diff > 0) {
            const gradeItens = await prisma.gradeItem.findFirst(
              {
                where: {
                  itemTamanhoId: itemTamanhoIdIdentifier,
                  gradeId: gradeIdentifier
                }
              },
            )

            if (gradeItens) {
              await prisma.gradeItem.update({
                where: { id: gradeItens.id },
                data: { quantidadeExpedida: gradeItens.quantidadeExpedida - diff }
              })
            }
          }

          if (diff > 0) {
            const caixaItem = await prisma.caixaItem.findFirst(
              {
                where: {
                  itemTamanhoId: itemTamanhoIdIdentifier,
                  caixaId: boxIdentifier
                }
              },
            )

            if (caixaItem) {
              if (exclude) {
                await prisma.caixaItem.delete({ where: { id: caixaItem.id } });
              }
              if (!exclude) {
                await prisma.caixaItem.update({
                  where: { id: caixaItem.id }, data: { itemQty: qtyNew }
                })
              }
            }

          }

          if (diff > 0) {
            const stock = await prisma.estoque.findFirst(
              {
                where: {
                  id: stockIdentifier,
                }
              },
            )
            if (stock) {
              await prisma.estoque.update({
                where: { id: stock.id }, data: { quantidade: stock.quantidade - diff }
              })
            }
          }
        }

        if (itensModify.length > 0) isModification = true;

        if (isModification) {
          const qtyPCaixa = itensModify.reduce((acc, item) => acc + item.qtyNew, 0);
          const box = await prisma.caixa.findFirst(
            {
              where: {
                id: id,
              }
            },
          )
          if (box) {
            await prisma.caixa.update({
              where: { id: id }, data: { qtyCaixa: qtyPCaixa }
            })
          }
        }
        return await this.getCaixaById(id);
      }, { maxWait: 5000, timeout: 20000, });
      return retorno ? retorno : null;
    } catch (error: any) {
      console.error("", error);
      throw new Error("Erro ao modificar dados da caixa: " + error.message);
    }
  }

}
