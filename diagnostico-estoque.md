# 🔍 DIAGNÓSTICO - Problemas de Estoque na função updateItensByBox

## ✅ CORREÇÃO PRINCIPAL IDENTIFICADA:

### 🔴 ERRO NA LINHA 395 do arquivo `caixa.prisma.ts`:

```typescript
// ❌ CÓDIGO ATUAL (ERRADO):
increment: -diffComponentes  // Comentário diz "Negativo de negativo = positivo"

// ✅ CÓDIGO CORRETO:
increment: diffComponentes   // diffComponentes já tem o sinal correto!
```

---

## 📊 COMO VALIDAR SE O PROBLEMA EXISTE:

### Teste Manual 1: Reduzir Kit

**Cenário:**
- Caixa tem 10 kits
- Kit tem 2 componentes (A e B), 1 de cada por kit
- Você REDUZ para 5 kits

**Comportamento ESPERADO:**
- OutInput dos componentes: 10 → 5 (cada)
- Estoque componente A: deve AUMENTAR em 5
- Estoque componente B: deve AUMENTAR em 5

**Comportamento ATUAL (com bug):**
```
diff = 10 - 5 = 5 (positivo)
diffComponentes = 5 * 1 = 5 (positivo)
increment: -5  ❌ RETIRA do estoque (ERRADO!)
```

**Resultado:** Estoque fica NEGATIVO ou muito baixo!

---

### Teste Manual 2: Aumentar Kit

**Cenário:**
- Caixa tem 5 kits
- Você AUMENTA para 10 kits

**Comportamento ESPERADO:**
- OutInput dos componentes: 5 → 10 (cada)
- Estoque componente A: deve DIMINUIR em 5
- Estoque componente B: deve DIMINUIR em 5

**Comportamento ATUAL (com bug):**
```
diff = 5 - 10 = -5 (negativo)
diffComponentes = -5 * 1 = -5 (negativo)
increment: -(-5) = 5  ❌ ADICIONA ao estoque (ERRADO!)
```

**Resultado:** Estoque fica POSITIVO demais (estoque "magicamente" aumenta)!

---

## 🛠️ SOLUÇÃO:

Aplique esta mudança no arquivo `src/caixa/caixa.prisma.ts`:

```typescript
// LOCALIZAR LINHA ~388-400 (seção de KIT, quando itemQty !== 0)

// Ajustar estoque se houver diferença
if (diffComponentes !== 0) {
  await prisma.estoque.update({
    where: { id: outInputComponente.estoqueId },
    data: {
      quantidade: {
        increment: diffComponentes  // ✅ REMOVER O SINAL NEGATIVO!
      }
    }
  });
}
```

---

## 🧪 QUERY SQL PARA VERIFICAR INCONSISTÊNCIAS:

Execute esta query no seu banco para detectar problemas:

```sql
-- Ver inconsistências entre OutInput e Estoque
SELECT 
  it.id as item_tamanho_id,
  i.nome as item_nome,
  t.nome as tamanho,
  e.quantidade as estoque_atual,
  COALESCE(SUM(oi.quantidade), 0) as total_saidas,
  COALESCE(SUM(ei.quantidade), 0) as total_entradas,
  (COALESCE(SUM(ei.quantidade), 0) - COALESCE(SUM(oi.quantidade), 0)) as estoque_calculado,
  e.quantidade - (COALESCE(SUM(ei.quantidade), 0) - COALESCE(SUM(oi.quantidade), 0)) as diferenca
FROM "ItemTamanho" it
JOIN "Item" i ON it."itemId" = i.id
JOIN "Tamanho" t ON it."tamanhoId" = t.id
LEFT JOIN "Estoque" e ON e."itemTamanhoId" = it.id
LEFT JOIN "OutInput" oi ON oi."itemTamanhoId" = it.id
LEFT JOIN "EntryInput" ei ON ei."itemTamanhoId" = it.id
WHERE it."isKit" = false  -- Ver apenas componentes
GROUP BY it.id, i.nome, t.nome, e.quantidade
HAVING ABS(e.quantidade - (COALESCE(SUM(ei.quantidade), 0) - COALESCE(SUM(oi.quantidade), 0))) > 0.001
ORDER BY diferenca DESC;
```

**Se retornar linhas:** Você tem inconsistências!

---

## 📋 CHECKLIST PARA CORREÇÃO:

- [ ] 1. Fazer backup do banco de dados
- [ ] 2. Anotar valores de estoque ANTES da correção
- [ ] 3. Aplicar correção na linha 395: `increment: diffComponentes`
- [ ] 4. Fazer um teste em ambiente de desenvolvimento
- [ ] 5. Executar query SQL acima para validar
- [ ] 6. Se necessário, recalcular estoques manualmente

---

## 🔄 SCRIPT PARA RECALCULAR ESTOQUES (SE NECESSÁRIO):

Se você aplicar a correção mas o estoque já está inconsistente, use este script:

```sql
-- ⚠️ CUIDADO: Execute em DESENVOLVIMENTO primeiro!
BEGIN;

-- Para cada ItemTamanho, recalcula o estoque baseado em EntryInput e OutInput
UPDATE "Estoque" e
SET quantidade = (
  SELECT 
    COALESCE(SUM(ei.quantidade), 0) - COALESCE(SUM(oi.quantidade), 0)
  FROM "ItemTamanho" it
  LEFT JOIN "EntryInput" ei ON ei."itemTamanhoId" = it.id
  LEFT JOIN "OutInput" oi ON oi."itemTamanhoId" = it.id
  WHERE it.id = e."itemTamanhoId"
)
WHERE EXISTS (
  SELECT 1 
  FROM "ItemTamanho" it 
  WHERE it.id = e."itemTamanhoId"
);

-- Verificar resultado
SELECT 
  it.id,
  i.nome,
  t.nome as tamanho,
  e.quantidade as estoque_recalculado
FROM "ItemTamanho" it
JOIN "Item" i ON it."itemId" = i.id
JOIN "Tamanho" t ON it."tamanhoId" = t.id
JOIN "Estoque" e ON e."itemTamanhoId" = it.id
ORDER BY i.nome, t.nome;

-- Se estiver OK:
COMMIT;

-- Se estiver errado:
-- ROLLBACK;
```

---

## 📞 PRÓXIMOS PASSOS:

1. **APLIQUE A CORREÇÃO** no arquivo `caixa.prisma.ts` linha 395
2. **TESTE** ajustando uma caixa com kit em DEV
3. **VALIDE** com a query SQL de verificação
4. **SE NECESSÁRIO**, recalcule os estoques com o script SQL

---

## 💡 RESUMO:

O problema é matemático e simples:

- `diff = quantidadeAtual - itemQty`
- `diffComponentes = diff * qtdPorKit`
- Se `diff > 0`: estamos reduzindo → devolver para estoque (POSITIVO)
- Se `diff < 0`: estamos aumentando → retirar do estoque (NEGATIVO)

`increment` do Prisma aceita valores negativos, então **NÃO precisa inverter o sinal**!

A linha 395 está invertendo quando não deveria: `increment: -diffComponentes` ❌  
Correto é: `increment: diffComponentes` ✅


