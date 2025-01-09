import { DataInserction, TamanhoQuantidade } from "@core/interfaces";
import * as XLSX from 'xlsx';

export default function utilities(caminhoPlanilha: string = 'core/utils/distribuicao.xlsx'): DataInserction[] {
    function tratarValor(valor: any, valorPadrao: string | null = null): string | null {
        if (valor === undefined || valor === null || String(valor).trim() === "") {
          return valorPadrao;
        }
        return String(valor).toUpperCase().trim();
    }
    
    const workbook = XLSX.readFile(caminhoPlanilha);
    const sheetName = workbook.SheetNames[0];

    // Carregar a planilha como uma matriz (Array<Array<any>>)
    const worksheet: any[][] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });

    const dadosProcessados: DataInserction[] = [];

    // Garantir que temos uma linha de cabeçalho
    if (worksheet.length === 0) {
        return dadosProcessados; // Se a planilha estiver vazia, retorna um array vazio
    }

    // Identificar as colunas que contêm tamanhos (linha de cabeçalho)
    const headerRow = worksheet[0];

    // Percorrer cada linha da planilha, começando pela segunda (índice 1)
    for (let i = 1; i < worksheet.length; i++) {
        const linha = worksheet[i];
        const numeroEscola = String(linha[0]).toUpperCase().trim();
        const escola = String(linha[1]).toUpperCase().trim();
        const projeto = String(linha[2]).toUpperCase().trim();
        const item = String(linha[3]).toUpperCase().trim();
        const genero = String(linha[4]).toUpperCase().trim();
        const numberJoin = tratarValor(linha[5]);

        const tamanhos: TamanhoQuantidade[] = [];

        // Processar as colunas de tamanhos a partir da quinta coluna
        for (let j = 6; j < linha.length; j++) {
            const quantidade = linha[j];
            const tamanho = headerRow[j]; // O valor do cabeçalho é o tamanho (ex: 2, 4, P, M, etc)

            // Verificar se a quantidade é um número válido, ou seja, maior que 0
            if (quantidade !== undefined && quantidade !== null && !isNaN(quantidade) && quantidade > 0) {
                tamanhos.push({
                    tamanho: String(tamanho).toUpperCase().trim(),
                    quantidade: Number(quantidade)
                });
            }
        }

        // Só adicionar o registro se houver tamanhos válidos
        if (tamanhos.length > 0) {
            dadosProcessados.push({
                numeroEscola: numeroEscola,
                escola: escola,
                numberJoin: numberJoin,
                projeto: projeto,
                item: item,
                genero: genero,
                tamanhos: tamanhos // Apenas tamanhos válidos com quantidades
            });
        }
    }
    console.dir(dadosProcessados, { depth: null, maxArrayLength: null });
    return dadosProcessados;
}
