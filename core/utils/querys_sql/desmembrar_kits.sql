-- ============================
-- Script: Desmembrar entradas de kits em componentes
-- Contexto: projetoId = 6
-- Autor: [ALEXANDRE CORDEIRO]
-- Data: [09/08/2025]
-- ============================

-- SIMULAÇÃO: visualize as novas entradas dos componentes ANTES de inserir
SELECT
  ki."componentId" AS "itemTamanhoId",
  (ei."quantidade" * ki."quantidade") AS "quantidade",
  ei."createdAt",
  ei."updatedAt",
  e."id" AS "estoqueId",
  ei."userId",
  TRUE AS "kitInput",
  ei."embalagemId"
FROM "EntryInput" ei
JOIN "ItemTamanho" it ON ei."itemTamanhoId" = it."id"
JOIN "Item" i ON it."itemId" = i."id"
JOIN "KitItem" ki ON ki."kitId" = it."id"
JOIN "Estoque" e ON e."itemTamanhoId" = ki."componentId"
WHERE i."projetoId" = 6
  AND it."isKit" = TRUE;

-- ============================
-- EXECUÇÃO REAL
-- ============================

BEGIN;

-- INSERT: criar entradas para os componentes dos kits
INSERT INTO "EntryInput" (
  "itemTamanhoId",
  "quantidade",
  "createdAt",
  "updatedAt",
  "estoqueId",
  "userId",
  "kitInput",
  "embalagemId"
)
SELECT
  ki."componentId" AS "itemTamanhoId",
  (ei."quantidade" * ki."quantidade") AS "quantidade",
  ei."createdAt",
  ei."updatedAt",
  e."id" AS "estoqueId",
  ei."userId",
  TRUE AS "kitInput",
  ei."embalagemId"
FROM "EntryInput" ei
JOIN "ItemTamanho" it ON ei."itemTamanhoId" = it."id"
JOIN "Item" i ON it."itemId" = i."id"
JOIN "KitItem" ki ON ki."kitId" = it."id"
JOIN "Estoque" e ON e."itemTamanhoId" = ki."componentId"
WHERE i."projetoId" = 99999999
  AND it."isKit" = TRUE;

-- DELETE: remover as entradas originais dos kits
DELETE FROM "EntryInput"
USING "ItemTamanho" it
JOIN "Item" i ON it."itemId" = i."id"
WHERE "EntryInput"."itemTamanhoId" = it."id"
  AND i."projetoId" = 9999999
  AND it."isKit" = TRUE;

COMMIT;

-- ============================
-- Fim do script
-- ============================
---------------------------------------------------------------------------------------------
-- ============================
-- Script: Desmembrar saídas de kits em componentes
-- Contexto: projetoId = 6
-- Autor: [ALEXANDRE CORDEIRO]
-- Data: [09/08/2025]
-- ============================

-- SIMULAÇÃO: visualize as novas saídas dos componentes ANTES de inserir
SELECT
  ki."componentId" AS "itemTamanhoId",
  (oi."quantidade" * ki."quantidade") AS "quantidade",
  oi."createdAt",
  oi."updatedAt",
  e."id" AS "estoqueId",
  oi."userId",
  TRUE AS "kitOutput",
  oi."gradeId",
  oi."caixaId"
FROM "OutInput" oi
JOIN "ItemTamanho" it ON oi."itemTamanhoId" = it."id"
JOIN "Item" i ON it."itemId" = i."id"
JOIN "KitItem" ki ON ki."kitId" = it."id"
JOIN "Estoque" e ON e."itemTamanhoId" = ki."componentId"
WHERE i."projetoId" = 6
  AND it."isKit" = TRUE;

-- ============================
-- EXECUÇÃO REAL
-- ============================

BEGIN;

-- INSERT: criar saídas para os componentes dos kits
INSERT INTO "OutInput" (
  "itemTamanhoId",
  "quantidade",
  "createdAt",
  "updatedAt",
  "estoqueId",
  "userId",
  "kitOutput",
  "gradeId",
  "caixaId"
)
SELECT
  ki."componentId" AS "itemTamanhoId",
  (oi."quantidade" * ki."quantidade") AS "quantidade",
  oi."createdAt",
  oi."updatedAt",
  e."id" AS "estoqueId",
  oi."userId",
  TRUE AS "kitOutput",
  oi."gradeId",
  oi."caixaId"
FROM "OutInput" oi
JOIN "ItemTamanho" it ON oi."itemTamanhoId" = it."id"
JOIN "Item" i ON it."itemId" = i."id"
JOIN "KitItem" ki ON ki."kitId" = it."id"
JOIN "Estoque" e ON e."itemTamanhoId" = ki."componentId"
WHERE i."projetoId" = 9999999
  AND it."isKit" = TRUE;

-- DELETE: remover as saídas originais dos kits
DELETE FROM "OutInput"
USING "ItemTamanho" it
JOIN "Item" i ON it."itemId" = i."id"
WHERE "OutInput"."itemTamanhoId" = it."id"
  AND i."projetoId" = 999999
  AND it."isKit" = TRUE;

COMMIT;

-- ============================
-- Fim do script
-- ============================
