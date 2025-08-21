-- ============================
-- Script: Buscar itens de uma grade por seu ID (com detalhamento por itens e totais)
-- Contexto: gradeId = 3931
-- Autor: [ALEXANDRE CORDEIRO]
-- Data: [21/09/2025]
-- ============================

-- Parte 1: Detalhado por item e tamanho
SELECT
  i.nome AS nome_item,
  t.nome AS tamanho,
  SUM(oi.quantidade) AS quantidade_total
FROM
  "OutInput" oi
JOIN "ItemTamanho" it ON oi."itemTamanhoId" = it.id
JOIN "Item" i ON it."itemId" = i.id
JOIN "Tamanho" t ON it."tamanhoId" = t.id
WHERE
  oi."gradeId" = 3931
GROUP BY
  i.nome, t.nome

UNION ALL

-- Parte 2: Total por item (independente do tamanho)
SELECT
  i.nome AS nome_item,
  'TOTAL' AS tamanho,
  SUM(oi.quantidade) AS quantidade_total
FROM
  "OutInput" oi
JOIN "ItemTamanho" it ON oi."itemTamanhoId" = it.id
JOIN "Item" i ON it."itemId" = i.id
WHERE
  oi."gradeId" = 3931
GROUP BY
  i.nome

ORDER BY
  nome_item,
  tamanho;
  
-- ============================
-- Fim do script
-- ============================
