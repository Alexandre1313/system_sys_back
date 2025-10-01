-- =====================================================
-- SCRIPT PARA CORRIGIR ESTOQUE INCONSISTENTE
-- =====================================================
-- ⚠️ ATENÇÃO: Faça BACKUP antes de executar!
-- ⚠️ Execute primeiro a query de verificação para ver as inconsistências
-- =====================================================

-- PRIMEIRO: Ver o que será corrigido
SELECT 
  it.id as item_tamanho_id,
  i.nome as item_nome,
  t.nome as tamanho,
  e.quantidade as estoque_atual,
  (COALESCE(SUM(ei.quantidade), 0) - COALESCE(SUM(oi.quantidade), 0)) as estoque_correto,
  e.quantidade - (COALESCE(SUM(ei.quantidade), 0) - COALESCE(SUM(oi.quantidade), 0)) as diferenca
FROM "ItemTamanho" it
JOIN "Item" i ON it."itemId" = i.id
JOIN "Tamanho" t ON it."tamanhoId" = t.id
LEFT JOIN "Estoque" e ON e."itemTamanhoId" = it.id
LEFT JOIN "EntryInput" ei ON ei."itemTamanhoId" = it.id
LEFT JOIN "OutInput" oi ON oi."itemTamanhoId" = it.id
WHERE it."isKit" = false
GROUP BY it.id, i.nome, t.nome, e.quantidade
HAVING ABS(e.quantidade - (COALESCE(SUM(ei.quantidade), 0) - COALESCE(SUM(oi.quantidade), 0))) > 0.001
ORDER BY ABS(e.quantidade - (COALESCE(SUM(ei.quantidade), 0) - COALESCE(SUM(oi.quantidade), 0))) DESC;

-- =====================================================
-- CORREÇÃO (descomente para executar)
-- =====================================================

/*
BEGIN;

-- Atualizar estoque para o valor correto baseado em EntryInput e OutInput
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
    AND it."isKit" = false
);

-- Verificar resultado
SELECT 
  COUNT(*) as total_corrigido
FROM "Estoque" e
JOIN "ItemTamanho" it ON it.id = e."itemTamanhoId"
WHERE it."isKit" = false;

-- Se estiver OK, faça COMMIT
-- COMMIT;

-- Se estiver errado, faça ROLLBACK
-- ROLLBACK;
*/


