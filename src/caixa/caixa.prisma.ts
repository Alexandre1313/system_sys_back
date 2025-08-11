import { Caixa, CaixaAjuste, convertSPTime } from '@core/index';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

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

          const itemTamanho = await prisma.itemTamanho.findUnique({
            where: { id: itemTamanhoId },
            include: {
              kitMain: {
                include: {
                  component: {
                    include: {
                      estoque: true,
                    },
                  },
                },
              },
            },
          });

          if (!itemTamanho) {
            throw new Error(`ItemTamanho com id ${itemTamanhoId} não encontrado.`);
          }

          console.log('itemTamanho.isKit:', itemTamanho);

          if (itemTamanho.isKit) {
            for (const componente of itemTamanho.kitMain) {
              const estoqueAtual = componente.component.estoque;
              const qtdNecessaria = componente.quantidade * itemQty;

              await prisma.estoque.update({
                where: { itemTamanhoId: componente.componentId },
                data: {
                  quantidade: (estoqueAtual.quantidade) - qtdNecessaria,
                },
              });

              await prisma.outInput.create({
                data: {
                  itemTamanhoId: componente.componentId,
                  estoqueId: estoqueAtual.id,
                  quantidade: qtdNecessaria,
                  userId,
                  gradeId,
                  caixaId: novaCaixa.id,
                  kitOutput: true,
                  kitOrigemId: itemTamanho.id,
                },
              });
            }
          } else {
            const estoqueAtual = await prisma.estoque.findUnique({
              where: { itemTamanhoId },
            });

            const novaQuantidade = (estoqueAtual.quantidade) - itemQty;

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
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
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
      await this.prisma.$transaction(async (prisma) => {

        const itensModify = [];

        for (const item of itens) {
          const { itemTamanhoId, itemQty } = item;

          const outInput = await prisma.outInput.findFirst({
            where: {
              caixaId: id,
              itemTamanhoId: itemTamanhoId,
              gradeId: gradeId,
            }
          });

          if (!outInput) {
            throw new Error(`Saída não encontrada para caixaId=${id}, itemTamanhoId=${itemTamanhoId}, gradeId=${gradeId}`);
          }

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
            } else if (objectItens.diff > 0) {
              await prisma.outInput.update({ where: { id: outInput.id }, data: { quantidade: itemQty } });
            }
          }
        }

        for (const item of itensModify) {
          const { stockIdentifier, itemTamanhoIdIdentifier, gradeIdentifier, boxIdentifier, exclude, diff, qtyNew } = item;

          if (diff <= 0) {
            continue
          }

          const gradeItens = await prisma.gradeItem.findFirst(
            {
              where: {
                itemTamanhoId: itemTamanhoIdIdentifier,
                gradeId: gradeIdentifier
              }
            },
          )

          if (!gradeItens) {
            throw new Error(`GradeItem não encontrado para itemTamanhoId=${itemTamanhoIdIdentifier}, gradeId=${gradeIdentifier}`);
          }

          const novaQuantidadeExpedida = gradeItens.quantidadeExpedida - diff;

          if (novaQuantidadeExpedida < 0) {
            throw new Error("QuantidadeExpedida resultaria em valor negativo");
          }

          await prisma.gradeItem.update({
            where: { id: gradeItens.id },
            data: { quantidadeExpedida: novaQuantidadeExpedida }
          })

          const caixaItem = await prisma.caixaItem.findFirst(
            {
              where: {
                itemTamanhoId: itemTamanhoIdIdentifier,
                caixaId: boxIdentifier
              }
            },
          )

          if (!caixaItem) {
            throw new Error(`CaixaItem não encontrado para itemTamanhoId=${itemTamanhoIdIdentifier}, caixaId=${boxIdentifier}`);
          }

          if (exclude) {
            await prisma.caixaItem.delete({ where: { id: caixaItem.id } });
          }
          if (!exclude) {
            await prisma.caixaItem.update({
              where: { id: caixaItem.id }, data: { itemQty: qtyNew }
            })
          }

          const stock = await prisma.estoque.findFirst(
            {
              where: {
                id: stockIdentifier,
              }
            },
          )

          if (!stock) {
            throw new Error(`Estoque não encontrado para estoqueId=${stockIdentifier}`);
          }

          await prisma.estoque.update({
            where: { id: stock.id }, data: { quantidade: stock.quantidade + diff }
          })
        }

        if (itensModify.length > 0) {

          const qtyPCaixa = itens.reduce((acc, item) => acc + item.itemQty, 0);
          const box = await prisma.caixa.findFirst(
            {
              where: {
                id: id,
              }
            },
          )

          if (!box) {
            throw new Error(`Caixa não encontrada para caixaId=${id}`);
          }
          await prisma.caixa.update({
            where: { id: id }, data: { qtyCaixa: qtyPCaixa }
          })
        }

      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 5000, timeout: 20000, });
      const newBox = await this.getCaixaById(id);
      //console.log(newBox)
      return newBox ? newBox : null;
    } catch (error: any) {
      console.error("", error);
      throw new Error("Erro ao modificar dados da caixa: " + error.message);
    }
  }

  async updateItensByBoxOrExclud(caixaData: CaixaAjuste): Promise<CaixaAjuste | null> {
    if (!caixaData) return null;

    const { id, gradeId, itens } = caixaData;

    const caixaExclud = {
      ...caixaData,
      id: 0,
      status: "EXCLUÍDA PERMANENTEMENTE",
      caixaNumber: `ESTA ERA A CAIXA Nº ${caixaData.caixaNumber}`,
      qtyCaixa: 0,
      itens: itens.map(item => ({
        ...item,
        itemQty: 0
      }))
    };

    let resultBox: CaixaAjuste | null = null;

    try {
      await this.prisma.$transaction(async (prisma) => {

        const itensModify = [];
        const itensModifyExclud = [];

        for (const item of itens) {
          const { itemTamanhoId, itemQty } = item;

          const outInput = await prisma.outInput.findFirst({
            where: {
              caixaId: id,
              itemTamanhoId: itemTamanhoId,
              gradeId: gradeId,
            }
          });

          if (!outInput) {
            throw new Error(`Saída não encontrada para caixaId=${id}, itemTamanhoId=${itemTamanhoId}, gradeId=${gradeId}`);
          }

          if (outInput.quantidade !== itemQty) {

            const objectItens = {
              stockIdentifier: outInput.estoqueId,
              itemTamanhoIdIdentifier: outInput.itemTamanhoId,
              gradeIdentifier: outInput.gradeId,
              boxIdentifier: outInput.caixaId,
              exclude: itemQty === 0 ? true : false,
              qtyExclud: outInput.quantidade,
              diff: outInput.quantidade - itemQty,
              qtyNew: itemQty,
            };

            itensModify.push(objectItens);

            if (objectItens.exclude) {
              itensModifyExclud.push(objectItens.qtyNew);
              await prisma.outInput.delete({ where: { id: outInput.id } });
            } else if (objectItens.diff > 0) {
              await prisma.outInput.update({ where: { id: outInput.id }, data: { quantidade: itemQty } });
            } else if (objectItens.diff < 0) {
              await prisma.outInput.update({ where: { id: outInput.id }, data: { quantidade: itemQty } });
            }
          }
        }

        if (itensModify.length === 0) {
          return null;
        }

        if (itensModifyExclud.length === itensModify.length) {

          for (const item of itensModify) {
            const { stockIdentifier, itemTamanhoIdIdentifier, gradeIdentifier, boxIdentifier, qtyExclud } = item;

            const gradeItens = await prisma.gradeItem.findFirst(
              {
                where: {
                  itemTamanhoId: itemTamanhoIdIdentifier,
                  gradeId: gradeIdentifier
                }
              },
            )

            if (!gradeItens) {
              throw new Error(`GradeItem não encontrado para itemTamanhoId=${itemTamanhoIdIdentifier}, gradeId=${gradeIdentifier}`);
            }

            const novaQuantidadeExpedida = gradeItens.quantidadeExpedida - qtyExclud;

            if (novaQuantidadeExpedida < 0) {
              throw new Error("QuantidadeExpedida resultaria em valor negativo ou positivo");
            }

            await prisma.gradeItem.update({
              where: { id: gradeItens.id },
              data: { quantidadeExpedida: novaQuantidadeExpedida }
            })

            const caixaItem = await prisma.caixaItem.findFirst(
              {
                where: {
                  itemTamanhoId: itemTamanhoIdIdentifier,
                  caixaId: boxIdentifier
                }
              },
            )

            if (!caixaItem) {
              throw new Error(`CaixaItem não encontrado para itemTamanhoId=${itemTamanhoIdIdentifier}, caixaId=${boxIdentifier}`);
            }

            await prisma.caixaItem.delete({ where: { id: caixaItem.id } });

            const stock = await prisma.estoque.findFirst(
              {
                where: {
                  id: stockIdentifier,
                }
              },
            )

            if (!stock) {
              throw new Error(`Estoque não encontrado para estoqueId=${stockIdentifier}`);
            }

            await prisma.estoque.update({
              where: { id: stock.id }, data: { quantidade: stock.quantidade + qtyExclud }
            })

          }

          const box = await prisma.caixa.findFirst({ where: { id: id, } },)

          if (!box) {
            throw new Error(`Caixa não encontrada para caixaId=${id}`);
          }

          await prisma.caixa.delete({ where: { id: id } });

          const deletedBox = box; // Já buscada anteriormente

          // Converte o número da caixa excluída para inteiro
          const numeroExcluido = parseInt(deletedBox.caixaNumber, 10);

          // Buscar todas as caixas da mesma grade com número maior que a caixa excluída
          const caixasParaReordenar = await prisma.caixa.findMany({
            where: {
              gradeId: deletedBox.gradeId,
            },
            orderBy: {
              caixaNumber: 'asc'
            }
          });

          // Filtra as caixas que possuem número maior que o excluído
          const caixasPosteriores = caixasParaReordenar.filter(caixa => {
            const numeroAtual = parseInt(caixa.caixaNumber, 10);
            return numeroAtual > numeroExcluido;
          });

          // Reordena as caixas decrementando o número e mantendo formato com dois dígitos
          for (const caixa of caixasPosteriores) {
            const numeroAtual = parseInt(caixa.caixaNumber, 10);
            const novoNumero = (numeroAtual - 1).toString().padStart(2, '0');

            await prisma.caixa.update({
              where: { id: caixa.id },
              data: {
                caixaNumber: novoNumero
              }
            });
          }

        } else if (itensModify.length !== itensModifyExclud.length) {

          for (const item of itensModify) {
            const { stockIdentifier, itemTamanhoIdIdentifier, gradeIdentifier, boxIdentifier, exclude, diff, qtyNew } = item;

            if (diff === 0) {
              continue
            } else if (diff > 0) {

              const gradeItens = await prisma.gradeItem.findFirst(
                {
                  where: {
                    itemTamanhoId: itemTamanhoIdIdentifier,
                    gradeId: gradeIdentifier
                  }
                },
              )

              if (!gradeItens) {
                throw new Error(`GradeItem não encontrado para itemTamanhoId=${itemTamanhoIdIdentifier}, gradeId=${gradeIdentifier}`);
              }

              const novaQuantidadeExpedida = gradeItens.quantidadeExpedida - diff;

              if (novaQuantidadeExpedida < 0) {
                throw new Error("QuantidadeExpedida resultaria em valor negativo");
              }

              await prisma.gradeItem.update({
                where: { id: gradeItens.id },
                data: { quantidadeExpedida: novaQuantidadeExpedida }
              })

              const caixaItem = await prisma.caixaItem.findFirst(
                {
                  where: {
                    itemTamanhoId: itemTamanhoIdIdentifier,
                    caixaId: boxIdentifier
                  }
                },
              )

              if (!caixaItem) {
                throw new Error(`CaixaItem não encontrado para itemTamanhoId=${itemTamanhoIdIdentifier}, caixaId=${boxIdentifier}`);
              }

              if (exclude) {
                await prisma.caixaItem.delete({ where: { id: caixaItem.id } });
              }

              if (!exclude) {
                await prisma.caixaItem.update({
                  where: { id: caixaItem.id }, data: { itemQty: qtyNew }
                })
              }

              const stock = await prisma.estoque.findFirst(
                {
                  where: {
                    id: stockIdentifier,
                  }
                },
              )

              if (!stock) {
                throw new Error(`Estoque não encontrado para estoqueId=${stockIdentifier}`);
              }

              await prisma.estoque.update({
                where: { id: stock.id }, data: { quantidade: stock.quantidade + diff }
              })

            } else if (diff < 0) {

              const somaOutputs = await prisma.outInput.aggregate({
                _sum: { quantidade: true },
                where: {
                  gradeId: gradeIdentifier,
                  itemTamanhoId: itemTamanhoIdIdentifier
                }
              });

              const gradeItens = await prisma.gradeItem.findFirst(
                {
                  where: {
                    itemTamanhoId: itemTamanhoIdIdentifier,
                    gradeId: gradeIdentifier
                  }
                },
              )

              if (!gradeItens) {
                throw new Error(`GradeItem não encontrado para itemTamanhoId=${itemTamanhoIdIdentifier}, gradeId=${gradeIdentifier}`);
              }

              const novaQuantidadeExpedida = gradeItens.quantidadeExpedida + Math.abs(diff);

              if ((somaOutputs._sum.quantidade ?? 0) > gradeItens.quantidade) {
                throw new Error("A nova soma de saídas excede a quantidade disponível da grade.");
              }

              await prisma.gradeItem.update({
                where: { id: gradeItens.id },
                data: { quantidadeExpedida: novaQuantidadeExpedida }
              })

              const caixaItem = await prisma.caixaItem.findFirst(
                {
                  where: {
                    itemTamanhoId: itemTamanhoIdIdentifier,
                    caixaId: boxIdentifier
                  }
                },
              )

              if (!caixaItem) {
                throw new Error(`CaixaItem não encontrado para itemTamanhoId=${itemTamanhoIdIdentifier}, caixaId=${boxIdentifier}`);
              }

              if (exclude) {
                await prisma.caixaItem.delete({ where: { id: caixaItem.id } });
              }
              if (!exclude) {
                await prisma.caixaItem.update({
                  where: { id: caixaItem.id }, data: { itemQty: qtyNew }
                })
              }

              const stock = await prisma.estoque.findFirst(
                {
                  where: {
                    id: stockIdentifier,
                  }
                },
              )

              if (!stock) {
                throw new Error(`Estoque não encontrado para estoqueId=${stockIdentifier}`);
              }

              await prisma.estoque.update({
                where: { id: stock.id }, data: { quantidade: stock.quantidade - Math.abs(diff) }
              })
            }



          }

          if (itensModify.length > 0) {

            const qtyPCaixa = itens.reduce((acc, item) => acc + item.itemQty, 0);
            const box = await prisma.caixa.findFirst(
              {
                where: {
                  id: id,
                }
              },
            )

            if (!box) {
              throw new Error(`Caixa não encontrada para caixaId=${id}`);
            }
            await prisma.caixa.update({
              where: { id: id }, data: { qtyCaixa: qtyPCaixa }
            })
          }

        }

      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 5000, timeout: 20000, });

      resultBox = await this.getCaixaById(id) || caixaExclud;
    } catch (error: any) {
      console.error("", error);
      throw new Error("Erro ao modificar dados da caixa ou excluí-la: " + error.message);
    }

    return resultBox ?? null;
  }
}
