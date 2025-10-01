-- =====================================================
-- QUERY PARA DETECTAR INCONSISTÊNCIAS NO ESTOQUE
-- =====================================================
-- 
-- Esta query compara:
-- 1. Estoque.quantidade (valor atual na tabela)
-- 2. Estoque CALCULADO (EntryInput - OutInput)
-- 
-- Se houver diferença, há inconsistência!
-- =====================================================

WITH EstoqueCalculado AS (
  SELECT 
    it.id as item_tamanho_id,
    i.nome as item_nome,
    t.nome as tamanho,
    it."isKit",
    
    -- Total de ENTRADAS
    COALESCE(SUM(ei.quantidade), 0) as total_entradas,
    
    -- Total de SAÍDAS
    COALESCE(SUM(oi.quantidade), 0) as total_saidas,
    
    -- Estoque CALCULADO (Entradas - Saídas)
    COALESCE(SUM(ei.quantidade), 0) - COALESCE(SUM(oi.quantidade), 0) as estoque_calculado,
    
    -- Estoque ATUAL na tabela
    e.quantidade as estoque_na_tabela,
    
    -- DIFERENÇA (se != 0, há inconsistência!)
    e.quantidade - (COALESCE(SUM(ei.quantidade), 0) - COALESCE(SUM(oi.quantidade), 0)) as diferenca
    
  FROM "ItemTamanho" it
  JOIN "Item" i ON it."itemId" = i.id
  JOIN "Tamanho" t ON it."tamanhoId" = t.id
  LEFT JOIN "Estoque" e ON e."itemTamanhoId" = it.id
  LEFT JOIN "EntryInput" ei ON ei."itemTamanhoId" = it.id
  LEFT JOIN "OutInput" oi ON oi."itemTamanhoId" = it.id
  
  WHERE it."isKit" = false  -- Apenas itens normais (não kits)
  
  GROUP BY 
    it.id, 
    i.nome, 
    t.nome, 
    it."isKit",
    e.quantidade
)

-- Mostrar APENAS os que têm inconsistência
SELECT 
  item_tamanho_id,
  item_nome,
  tamanho,
  total_entradas,
  total_saidas,
  estoque_calculado,
  estoque_na_tabela,
  diferenca,
  CASE 
    WHEN diferenca > 0 THEN '⚠️ ESTOQUE ESTÁ MAIOR QUE DEVERIA'
    WHEN diferenca < 0 THEN '❌ ESTOQUE ESTÁ MENOR QUE DEVERIA'
    ELSE '✅ OK'
  END as status
FROM EstoqueCalculado
WHERE ABS(diferenca) > 0.001  -- Ignorar diferenças muito pequenas (arredondamento)
ORDER BY ABS(diferenca) DESC;

-- =====================================================
-- RESUMO GERAL
-- =====================================================

SELECT 
  COUNT(*) as total_itens,
  SUM(CASE WHEN ABS(diferenca) > 0.001 THEN 1 ELSE 0 END) as itens_com_inconsistencia,
  SUM(CASE WHEN diferenca > 0 THEN 1 ELSE 0 END) as estoque_maior_que_deveria,
  SUM(CASE WHEN diferenca < 0 THEN 1 ELSE 0 END) as estoque_menor_que_deveria,
  SUM(ABS(diferenca)) as diferenca_total_absoluta
FROM EstoqueCalculado;


