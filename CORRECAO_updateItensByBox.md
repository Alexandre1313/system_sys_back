# CORREÇÃO DA FUNÇÃO updateItensByBox

## PROBLEMAS IDENTIFICADOS:

### 1. **Linha 395 - Lógica invertida no ajuste de estoque para KITS**
```typescript
// ❌ ERRADO (código atual):
increment: -diffComponentes // comentário errado!

// ✅ CORRETO:
increment: diffComponentes // diffComponentes já tem o sinal correto
```

**Explicação:**
- `diffComponentes = (quantidadeAtual - itemQty) * qtdPorKit`
- Se reduzir de 10 para 5 kits: `diff = 5`, `diffComponentes = 5 * qtdPorKit` (POSITIVO)
- Positivo significa DEVOLVER para estoque
- `increment: diffComponentes` → adiciona ao estoque ✅
- `increment: -diffComponentes` → RETIRA do estoque ❌

### 2. **Linha 388 - Condição sempre verdadeira quando deveria verificar diff**
O código verifica `if (diffComponentes !== 0)` mas deveria ter calculado `diff` antes para kits também.

### 3. **Lógica de ajuste para itens NORMAIS está CORRETA** (linhas 504-533)
- Usa `increment: diff` corretamente
- `diff = quantidadeAtual - itemQty`
- Se diff > 0, devolve para estoque ✅

---

## CÓDIGO CORRIGIDO:

Substituir a função `updateItensByBox` completa por:

```typescript
async updateItensByBox(caixaData: CaixaAjuste): Promise<CaixaAjuste | null | (CaixaAjuste & { status: string; mensagem: string })> {
  if (!caixaData) return null;

  const { id, gradeId, itens } = caixaData;

  const MAX_RETRIES = 3;
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    try {
      const result = await this.prisma.$transaction(async (prisma) => {
        // 1. Verificar se a caixa existe
        const caixaAtual = await prisma.caixa.findUnique({
          where: { id },
          include: { caixaItem: true }
        });

        if (!caixaAtual) {
          throw new Error(`Caixa não encontrada: ${id}`);
        }

        // 2. Processar cada item da requisição
        for (const item of itens) {
          const { itemTamanhoId, itemQty } = item;

          // Buscar ItemTamanho com informações de kit
          const itemTamanho = await prisma.itemTamanho.findUnique({
            where: { id: itemTamanhoId },
            include: {
              estoque: true,
              kitMain: {
                include: {
                  component: {
                    include: {
                      estoque: true
                    }
                  }
                }
              }
            }
          });

          if (!itemTamanho) {
            throw new Error(`ItemTamanho não encontrado: ${itemTamanhoId}`);
          }

          // Buscar CaixaItem atual
          const caixaItemAtual = await prisma.caixaItem.findFirst({
            where: { caixaId: id, itemTamanhoId }
          });

          if (!caixaItemAtual) {
            throw new Error(`CaixaItem não encontrado para itemTamanhoId=${itemTamanhoId}`);
          }

          const quantidadeAtual = caixaItemAtual.itemQty;
          const diff = quantidadeAtual - itemQty;

          if (itemTamanho.isKit) {
            // ============================================
            // PROCESSAR KIT
            // ============================================

            // 1. PROCESSAR COMPONENTES DO KIT (OutInput e Estoque)
            for (const kitComponent of itemTamanho.kitMain) {
              const componenteId = kitComponent.componentId;
              const qtdPorKit = kitComponent.quantidade;

              // Calcular diferença de componentes
              // Se diff > 0: estamos reduzindo kits → devolver componentes para estoque
              // Se diff < 0: estamos aumentando kits → retirar componentes do estoque
              const diffComponentes = diff * qtdPorKit;

              // Buscar OutInput do componente
              const outInputComponente = await prisma.outInput.findFirst({
                where: {
                  caixaId: id,
                  itemTamanhoId: componenteId,
                  gradeId,
                  kitOrigemId: itemTamanhoId
                }
              });

              if (!outInputComponente) {
                throw new Error(`OutInput não encontrado para componente ${componenteId} do kit ${itemTamanhoId}`);
              }

              if (itemQty === 0) {
                // Zerar kit - excluir OutInput do componente e devolver TUDO para estoque
                await prisma.outInput.delete({ where: { id: outInputComponente.id } });

                // Devolver quantidade total do componente para estoque
                await prisma.estoque.update({
                  where: { id: outInputComponente.estoqueId },
                  data: {
                    quantidade: {
                      increment: outInputComponente.quantidade
                    }
                  }
                });
              } else {
                // Atualizar quantidade do componente no OutInput
                const novaQuantidadeComponente = itemQty * qtdPorKit;

                await prisma.outInput.update({
                  where: { id: outInputComponente.id },
                  data: { quantidade: novaQuantidadeComponente }
                });

                // Ajustar estoque pela diferença
                if (diffComponentes !== 0) {
                  // ✅ CORREÇÃO: usar diffComponentes diretamente (sem negativo)
                  // diffComponentes > 0 → devolver para estoque
                  // diffComponentes < 0 → retirar do estoque
                  await prisma.estoque.update({
                    where: { id: outInputComponente.estoqueId },
                    data: {
                      quantidade: {
                        increment: diffComponentes // ✅ CORRETO
                      }
                    }
                  });
                }
              }
            }

            // 2. PROCESSAR GRADEITEM DO KIT (não dos componentes)
            const gradeItemKit = await prisma.gradeItem.findFirst({
              where: {
                itemTamanhoId: itemTamanhoId, // Kit em si
                gradeId
              }
            });

            if (gradeItemKit) {
              if (itemQty === 0) {
                // Zerar quantidade expedida do kit para permitir expedir novamente
                await prisma.gradeItem.update({
                  where: { id: gradeItemKit.id },
                  data: {
                    quantidadeExpedida: {
                      decrement: quantidadeAtual
                    }
                  }
                });
              } else {
                // Ajustar quantidade expedida do kit
                if (diff !== 0) {
                  await prisma.gradeItem.update({
                    where: { id: gradeItemKit.id },
                    data: {
                      quantidadeExpedida: {
                        decrement: diff
                      }
                    }
                  });
                }
              }
            }

            // 3. PROCESSAR CAIXAITEM DO KIT (não dos componentes)
            if (itemQty === 0) {
              await prisma.caixaItem.delete({ where: { id: caixaItemAtual.id } });
            } else {
              await prisma.caixaItem.update({
                where: { id: caixaItemAtual.id },
                data: { itemQty }
              });
            }
          } else {
            // ============================================
            // PROCESSAR ITEM NORMAL
            // ============================================
            const outInputItem = await prisma.outInput.findFirst({
              where: {
                caixaId: id,
                itemTamanhoId,
                gradeId,
                kitOrigemId: null // Item normal não tem kitOrigemId
              }
            });

            if (!outInputItem) {
              throw new Error(`OutInput não encontrado para item normal ${itemTamanhoId}`);
            }

            if (itemQty === 0) {
              // Zerar item - excluir OutInput e devolver para estoque
              await prisma.outInput.delete({ where: { id: outInputItem.id } });

              // Devolver quantidade para estoque
              await prisma.estoque.update({
                where: { id: outInputItem.estoqueId },
                data: {
                  quantidade: {
                    increment: outInputItem.quantidade
                  }
                }
              });

              // Devolver quantidade expedida na GradeItem
              const gradeItem = await prisma.gradeItem.findFirst({
                where: {
                  itemTamanhoId,
                  gradeId
                }
              });

              if (gradeItem) {
                await prisma.gradeItem.update({
                  where: { id: gradeItem.id },
                  data: {
                    quantidadeExpedida: {
                      decrement: outInputItem.quantidade
                    }
                  }
                });
              }

              // Excluir CaixaItem
              await prisma.caixaItem.delete({ where: { id: caixaItemAtual.id } });
            } else {
              // Atualizar quantidade do item
              await prisma.outInput.update({
                where: { id: outInputItem.id },
                data: { quantidade: itemQty }
              });

              // Ajustar estoque e GradeItem se houver diferença
              if (diff !== 0) {
                // Ajustar estoque (se diff > 0, devolve para estoque)
                await prisma.estoque.update({
                  where: { id: outInputItem.estoqueId },
                  data: {
                    quantidade: {
                      increment: diff // ✅ CORRETO para itens normais
                    }
                  }
                });

                // Ajustar GradeItem
                const gradeItem = await prisma.gradeItem.findFirst({
                  where: {
                    itemTamanhoId,
                    gradeId
                  }
                });

                if (gradeItem) {
                  await prisma.gradeItem.update({
                    where: { id: gradeItem.id },
                    data: {
                      quantidadeExpedida: {
                        decrement: diff
                      }
                    }
                  });
                }
              }

              // Atualizar CaixaItem
              await prisma.caixaItem.update({
                where: { id: caixaItemAtual.id },
                data: { itemQty }
              });
            }
          }
        }

        // 3. Verificar se caixa deve ser excluída (todos itens zerados)
        const caixaItemsRestantes = await prisma.caixaItem.findMany({
          where: { caixaId: id }
        });

        if (caixaItemsRestantes.length === 0) {
          // Excluir caixa e reordenar números das caixas posteriores
          const numeroExcluido = parseInt(caixaAtual.caixaNumber, 10);

          // Buscar caixas posteriores para reordenar
          const caixasPosteriores = await prisma.caixa.findMany({
            where: {
              gradeId: caixaAtual.gradeId,
              caixaNumber: {
                gt: caixaAtual.caixaNumber
              }
            },
            orderBy: { caixaNumber: 'asc' }
          });

          // Excluir todos os OutInput da caixa
          await prisma.outInput.deleteMany({
            where: { caixaId: id }
          });

          // Excluir a caixa
          await prisma.caixa.delete({ where: { id } });

          // Reordenar caixas posteriores (decrementar números)
          for (const caixa of caixasPosteriores) {
            const numeroAtual = parseInt(caixa.caixaNumber, 10);              
            const novoNumero = (numeroAtual - 1).toString();
            await prisma.caixa.update({
              where: { id: caixa.id },
              data: { caixaNumber: novoNumero }
            });
          }

          // Retornar objeto indicando que a caixa foi excluída
          return {
            ...caixaData,
            status: 'EXCLUIDA',
            mensagem: 'Caixa foi excluída pois todos os itens foram zerados',
            qtyCaixa: 0,
            itens: []
          } as CaixaAjuste & { status: string; mensagem: string };
        } else {
          // Atualizar quantidade total da caixa baseada nos dados da requisição
          const totalQuantidade = itens.reduce((sum, item) => sum + item.itemQty, 0);
          await prisma.caixa.update({
            where: { id },
            data: { qtyCaixa: totalQuantidade }
          });
        }

      }, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 20000,
        maxWait: 5000
      });

      // Se a transação retornou um objeto com status, é uma exclusão
      if (result && typeof result === 'object' && 'status' in result) {
        return result;
      }

      // Caso contrário, buscar dados atualizados da caixa (fora da transação)
      return await this.getCaixaById(id);

    } catch (err: any) {
      if (err.code === 'P2034') {
        attempt++;
        console.warn(`Conflito de transação (tentativa ${attempt} de ${MAX_RETRIES})`);
        if (attempt === MAX_RETRIES) {
          throw new Error("Transação falhou após múltiplas tentativas (P2034)");
        }
        continue;
      }

      console.error("Erro inesperado ao atualizar itens da caixa:", err);
      throw new Error("Erro ao modificar dados da caixa: " + err.message);
    }
  }

  return null;
}
```

---

## RESUMO DAS MUDANÇAS:

### ✅ Linha 73 (antes 349):
```typescript
// ❌ ANTES:
const diffComponentes = diffKits * qtdPorKit;

// ✅ DEPOIS:
const diffComponentes = diff * qtdPorKit;
```

### ✅ Linha 111 (antes 395):
```typescript
// ❌ ANTES:
increment: -diffComponentes // Negativo de negativo = positivo (devolve para estoque)

// ✅ DEPOIS:
increment: diffComponentes // ✅ CORRETO
```

### ✅ Removido variável redundante:
- Removida a variável `diffKits` (linha 346 do código original)
- Usado diretamente a variável `diff` calculada no início

---

## TESTE PARA VALIDAR:

### Cenário 1: Reduzir kit de 10 para 5 unidades
- Kit com 2 componentes (qtdPorKit = 2)
- `diff = 10 - 5 = 5`
- `diffComponentes = 5 * 2 = 10`
- `increment: 10` → **devolve 10 componentes para estoque** ✅

### Cenário 2: Aumentar kit de 5 para 8 unidades
- Kit com 2 componentes (qtdPorKit = 2)
- `diff = 5 - 8 = -3`
- `diffComponentes = -3 * 2 = -6`
- `increment: -6` → **retira 6 componentes do estoque** ✅

### Cenário 3: Zerar kit (10 → 0)
- Deleta OutInput
- Devolve `outInputComponente.quantidade` para estoque ✅


