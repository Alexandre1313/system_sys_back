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

          if (itemTamanho.isKit) {
            for (const componente of itemTamanho.kitMain) {
              const estoqueAtual = componente.component.estoque;
              const qtdNecessaria = componente.quantidade * itemQty;
              const novaQuantidade = estoqueAtual.quantidade - qtdNecessaria;

              await prisma.estoque.update({
                where: { itemTamanhoId: componente.componentId },
                data: {
                  quantidade: novaQuantidade,
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
          grade: {select: { updatedAt: true, status: true, createdAt: true }},
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

    const MAX_RETRIES = 3;
    let attempt = 0;

    while (attempt < MAX_RETRIES) {
      try {
        await this.prisma.$transaction(async (prisma) => {
          const itensModify = [];

          for (const item of itens) {
            const { itemTamanhoId, itemQty } = item;

            const itemTamanho = await prisma.itemTamanho.findUnique({
              where: { id: itemTamanhoId },
            });

            if (!itemTamanho) throw new Error(`ItemTamanho não encontrado: ${itemTamanhoId}`);

            // 📦 Caso: Item Comum (não é kit)
            if (!itemTamanho.isKit) {
              const outInput = await prisma.outInput.findFirst({
                where: { caixaId: id, itemTamanhoId, gradeId },
              });

              if (!outInput) throw new Error(`Saída não encontrada para item normal`);

              if (outInput.quantidade !== itemQty) {
                const objectItens = {
                  stockIdentifier: outInput.estoqueId,
                  itemTamanhoIdIdentifier: outInput.itemTamanhoId,
                  gradeIdentifier: outInput.gradeId,
                  boxIdentifier: outInput.caixaId,
                  exclude: itemQty === 0,
                  diff: outInput.quantidade - itemQty,
                  qtyNew: itemQty,
                  iskit: false,
                };

                itensModify.push(objectItens);

                if (objectItens.exclude) {
                  await prisma.outInput.delete({ where: { id: outInput.id } });
                } else if (objectItens.diff > 0) {
                  await prisma.outInput.update({
                    where: { id: outInput.id },
                    data: { quantidade: itemQty },
                  });
                }
              }

            } else {
              // 📦 Caso: Kit
              const itemTamanhosOut: any = await prisma.$queryRaw`
                SELECT 
                  o.id AS "outInputId",
                  o."quantidade" AS "outQuantidade",
                  o."itemTamanhoId" AS "componenteId",
                  o."caixaId",
                  o."gradeId",
                  o."kitOrigemId",
                  it.id AS "itemTamanhoId",                               
                  ki.quantidade AS "kitQuantidade"
                FROM "OutInput" o
                JOIN "ItemTamanho" it ON it.id = o."itemTamanhoId"
                LEFT JOIN "KitItem" ki 
                  ON ki."componentId" = o."itemTamanhoId"
                  AND ki."kitId" = o."kitOrigemId"
                WHERE o."caixaId" = ${id}
                  AND o."gradeId" = ${gradeId}
                  AND o."kitOrigemId" = ${itemTamanho.id}
                ORDER BY o.id;
              `;

              console.log(itemTamanhosOut)

              const totalComponentes = itemTamanhosOut.reduce((sum: number, kq: any) => {
                return sum + (kq.kitQuantidade || 0); // caso seja null
              }, 0);

              let totalItemsDespachados2 = 0;


              // Para cada registro de outInput, iterar os componentes do kit
              for (const componente of itemTamanhosOut) {
                const componenteId = componente.componentId;
                const qtdPorKit = componente.kitQuantidade;
                const qtdTotal = itemQty * qtdPorKit;

                const outInputComp = await prisma.outInput.findFirst({
                  where: {
                    caixaId: id,
                    itemTamanhoId: componenteId,
                    gradeId,
                    kitOrigemId: itemTamanhoId,
                  },
                });

                if (!outInputComp) {
                  throw new Error(`Componente não encontrado para kit itemTamanhoId=${itemTamanhoId}`);
                }

                if (outInputComp.quantidade !== qtdTotal) {
                  const objectItens = {
                    stockIdentifier: outInputComp.estoqueId,
                    itemTamanhoIdIdentifier: componenteId,
                    kitItemTamanhoId: itemTamanhoId,
                    gradeIdentifier: outInputComp.gradeId,
                    boxIdentifier: outInputComp.caixaId,
                    exclude: qtdTotal === 0,
                    diff: outInputComp.quantidade - qtdTotal,
                    qtyNew: qtdTotal,
                    iskit: true,
                  };

                  itensModify.push(objectItens);

                  if (objectItens.exclude) {
                    await prisma.outInput.delete({ where: { id: outInputComp.id } });
                  } else if (objectItens.diff > 0) {
                    await prisma.outInput.update({
                      where: { id: outInputComp.id },
                      data: { quantidade: qtdTotal },
                    });
                    totalItemsDespachados2 += qtdTotal;
                  }
                }
              }


              const totalKitsL = totalItemsDespachados2 / totalComponentes;
              const diffKitsL = totalKitsL - itemQty;

              const gradeItem = await prisma.gradeItem.findFirst({
                where: { itemTamanhoId, gradeId },
              });

              if (!gradeItem) {
                throw new Error(`GradeItem não encontrado para itemTamanhoId=${itemTamanhoId}, gradeId=${gradeId}`);
              }

              const novaQuantidadeExpedida = gradeItem.quantidadeExpedida - diffKitsL;
              if (novaQuantidadeExpedida < 0) {
                throw new Error("QuantidadeExpedida resultaria em valor negativo");
              }

              await prisma.gradeItem.update({
                where: { id: gradeItem.id },
                data: { quantidadeExpedida: novaQuantidadeExpedida },
              });

              const caixaItem = await prisma.caixaItem.findFirst({
                where: { itemTamanhoId, caixaId: id },
              });

              if (!caixaItem) {
                throw new Error(`CaixaItem não encontrado para itemTamanhoId=${itemTamanhoId}, caixaId=${id}`);
              }

              if (itemQty === 0) {
                await prisma.caixaItem.delete({ where: { id: caixaItem.id } });
              } else {
                await prisma.caixaItem.update({
                  where: { id: caixaItem.id },
                  data: { itemQty },
                });
              }
            }
          }

          // 🔄 Ajustes baseados em itens modificados
          for (const item of itensModify) {
            const {
              stockIdentifier,
              itemTamanhoIdIdentifier,
              gradeIdentifier,
              boxIdentifier,
              exclude,
              diff,
              qtyNew,
            } = item;

            if (diff <= 0) continue;

            const gradeItem = await prisma.gradeItem.findFirst({
              where: { itemTamanhoId: itemTamanhoIdIdentifier, gradeId: gradeIdentifier },
            });

            if (!gradeItem) {
              throw new Error(`GradeItem não encontrado para itemTamanhoId=${itemTamanhoIdIdentifier}, gradeId=${gradeIdentifier}`);
            }

            const novaQuantidadeExpedida = gradeItem.quantidadeExpedida - diff;
            if (novaQuantidadeExpedida < 0) {
              throw new Error("QuantidadeExpedida negativa");
            }

            await prisma.gradeItem.update({
              where: { id: gradeItem.id },
              data: { quantidadeExpedida: novaQuantidadeExpedida },
            });

            const caixaItem = await prisma.caixaItem.findFirst({
              where: { itemTamanhoId: itemTamanhoIdIdentifier, caixaId: boxIdentifier },
            });

            if (!caixaItem) {
              throw new Error(`CaixaItem não encontrado para itemTamanhoId=${itemTamanhoIdIdentifier}, caixaId=${boxIdentifier}`);
            }

            if (exclude) {
              await prisma.caixaItem.delete({ where: { id: caixaItem.id } });
            } else {
              await prisma.caixaItem.update({
                where: { id: caixaItem.id },
                data: { itemQty: qtyNew },
              });
            }

            const estoque = await prisma.estoque.findFirst({ where: { id: stockIdentifier } });
            if (!estoque) throw new Error(`Estoque não encontrado: ${stockIdentifier}`);

            await prisma.estoque.update({
              where: { id: estoque.id },
              data: { quantidade: estoque.quantidade + diff },
            });
          }

          // 📦 Atualização da quantidade total na caixa
          if (itensModify.length > 0) {
            const excludeBox = itensModify.every(e => e.exclude);
            const qtyCaixa = itens.reduce((acc, item) => acc + item.itemQty, 0);

            const box = await prisma.caixa.findFirst({ where: { id } });

            if (!box) throw new Error(`Caixa não encontrada: ${id}`);

            if (excludeBox) {
              // Converte o número da caixa excluída para inteiro
              const numeroExcluido = parseInt(box.caixaNumber, 10);

              // Buscar todas as caixas da mesma grade com número maior que a caixa excluída
              const caixasParaReordenar = await prisma.caixa.findMany({
                where: {
                  gradeId: box.gradeId,
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

              await prisma.caixa.delete({ where: { id: box.id } })
            } else {
              await prisma.caixa.update({
                where: { id: box.id },
                data: { qtyCaixa },
              });
            }

          }

        }, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          timeout: 20000,
          maxWait: 5000,
        });

        const novaCaixa = await this.getCaixaById(id);
        return novaCaixa ?? null;

      } catch (err: any) {
        if (err.code === 'P2034') {
          attempt++;
          console.warn(`Conflito de transação (tentativa ${attempt} de ${MAX_RETRIES})`);
          if (attempt === MAX_RETRIES) throw new Error("Transação falhou após múltiplas tentativas (P2034)");
          continue; // tenta novamente
        }

        console.error("Erro inesperado ao atualizar itens da caixa:", err);
        throw new Error("Erro ao modificar dados da caixa: " + err.message);
      }
    }

    return null; // falha final
  }

}
