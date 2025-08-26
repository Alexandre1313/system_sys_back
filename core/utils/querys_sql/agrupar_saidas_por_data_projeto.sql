-- ============================
-- Script: Listar saídas por data/projeto (com kitOrigemId)
-- Contexto: projetoId = 1
-- Autor: [ALEXANDRE CORDEIRO]
-- Data: [26/08/2025]
-- ============================

WITH base AS (
  SELECT
    g."updatedAt"::date         AS data_update,
    i.nome                      AS item_nome,
    i.genero::text              AS item_genero,
    t.nome                      AS tamanho,
    SUM(gi."quantidadeExpedida") AS quantidade
  FROM public."GradeItem" gi
  JOIN public."Grade" g ON gi."gradeId" = g.id
  JOIN public."ItemTamanho" it ON gi."itemTamanhoId" = it.id
  JOIN public."Item" i ON it."itemId" = i.id
  JOIN public."Tamanho" t ON it."tamanhoId" = t.id
  WHERE g."tipo" IS NULL
    AND i."projetoId" = 1
  GROUP BY g."updatedAt", i.nome, i.genero, t.nome
),

ordenado AS (
  SELECT
    *,
    CASE
      WHEN tamanho ~ '^\d+$' THEN LPAD(tamanho, 2, '0')  -- ex: '4' vira '04' para ordenar certo
      WHEN tamanho = 'P'     THEN '17'
      WHEN tamanho = 'M'     THEN '18'
      WHEN tamanho = 'G'     THEN '19'
      WHEN tamanho = 'GG'    THEN '20'
      WHEN tamanho = 'XG'    THEN '21'
      WHEN tamanho = 'XGG'   THEN '22'
      WHEN tamanho = 'EG/LG' THEN '23'
      ELSE '99'
    END AS tamanho_ordem
  FROM base
),

detalhes AS (
  SELECT
    data_update,
    item_nome,
    item_genero,
    tamanho,
    quantidade,
    0 AS ordem,
    tamanho_ordem
  FROM ordenado
),

subtotais AS (
  SELECT
    data_update,
    'Total'     AS item_nome,
    ''          AS item_genero,
    ''          AS tamanho,
    SUM(quantidade) AS quantidade,
    1 AS ordem,
    'ZZ' AS tamanho_ordem
  FROM base
  GROUP BY data_update
),

totalgeral AS (
  SELECT
    NULL::date  AS data_update,
    'Total Geral' AS item_nome,
    ''          AS item_genero,
    ''          AS tamanho,
    SUM(quantidade) AS quantidade,
    2 AS ordem,
    'ZZZ' AS tamanho_ordem
  FROM base
)

SELECT
  data_update,
  item_nome,
  item_genero,
  tamanho,
  quantidade
FROM (
  SELECT * FROM detalhes
  UNION ALL
  SELECT * FROM subtotais
  UNION ALL
  SELECT * FROM totalgeral
) final
ORDER BY
  data_update,
  ordem,
  item_nome,
  tamanho_ordem;

-- ============================
-- Fim do script
-- ============================
