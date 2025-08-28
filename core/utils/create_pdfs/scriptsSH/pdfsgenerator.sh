#!/bin/bash

# Pasta onde os PDFs serão salvos
OUTPUT_DIR="/home/ac/projetos/projeto_back/project-beck_ventura/core/utils/create_pdfs/pdfDIR"

# URLs da API
API_BASE_URL_PROJECTS_GET="http://192.168.1.169:4997/projetos/projetossimp"
API_BASE_URL_PDF_GENERATOR="http://192.168.1.169:4997/grades/saidaspdataresumpdf"

# Limpa a pasta de saída
echo "Limpando pasta de saída: $OUTPUT_DIR"
rm -f "$OUTPUT_DIR"/*
mkdir -p "$OUTPUT_DIR"

# Busca projetos (id e nome)
echo "Buscando projetos disponíveis..."
PROJECTS=$(curl -s "$API_BASE_URL_PROJECTS_GET")

# Garante que veio algo
if [ -z "$PROJECTS" ] || [ "$PROJECTS" = "[]" ]; then
    echo "Nenhum projeto encontrado. Saindo..."
    exit 1
fi

COUNT=$(echo "$PROJECTS" | jq '. | length')
echo "Foram encontrados $COUNT projetos."

# Itera pelos projetos
echo "$PROJECTS" | jq -c '.[]' | while read -r project; do
    ID=$(echo "$project" | jq -r '.id')
    NAME=$(echo "$project" | jq -r '.nome')

    # Sanitiza nome para usar no arquivo
    SAFE_NAME=$(echo "$NAME" | iconv -f utf8 -t ascii//TRANSLIT | sed 's/ /_/g' | sed 's/[^A-Za-z0-9_-]//g')

    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    FILE_PATH="$OUTPUT_DIR/resumo_${ID}_${SAFE_NAME}_${TIMESTAMP}.pdf"

    echo "Gerando PDF para projeto $ID ($NAME)..."

    # Usa arquivo temporário para evitar PDF corrompido
    TMP_FILE=$(mktemp)

    HTTP_STATUS=$(curl -s -H "Accept: application/pdf" -w "%{http_code}" -o "$TMP_FILE" "$API_BASE_URL_PDF_GENERATOR/$ID/1/-1")

    if [ "$HTTP_STATUS" -eq 200 ]; then
        mv "$TMP_FILE" "$FILE_PATH"
        echo "Projeto $ID ($NAME) gerado com sucesso: $FILE_PATH"
    else
        echo "Falha ao gerar PDF do projeto $ID ($NAME). Status HTTP: $HTTP_STATUS"
        rm -f "$TMP_FILE"  # Remove arquivo temporário
    fi
done

echo "Todos os PDFs foram processados."
