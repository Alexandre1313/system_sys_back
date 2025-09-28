#!/bin/bash
# =============================================
# SCRIPT PARA EXECUTAR NO TERMINAL PSQL
# =============================================

echo "🚀 Executando VIEWs de Consistência no PostgreSQL..."

# Conectar ao PostgreSQL e executar os arquivos
psql -U $DB_USER -d $DB_NAME << EOF
\i view_consistencia_grades.sql
\i view_consistencia_resumo.sql

-- Teste se funcionou
SELECT 'VIEWs criadas com sucesso!' as status;
SELECT COUNT(*) as total_grades FROM vw_consistencia_resumo;
EOF

echo "✅ Concluído! Teste com: SELECT * FROM vw_consistencia_resumo;"

