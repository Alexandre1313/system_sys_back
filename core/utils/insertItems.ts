import { ItemsInserction } from '@core/interfaces';
import * as XLSX from 'xlsx';

export default function insertItems(caminhoPlanilha: string = 'core/utils/cadastrodeitens.xlsx'): ItemsInserction[] {
  const workbook = XLSX.readFile(caminhoPlanilha);
  const sheetName = workbook.SheetNames[0];

  // Carregar a planilha como uma matriz (Array<Array<any>>)
  const worksheet: any[][] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });

  const dadosProcessados: ItemsInserction[] = [];

  // Garantir que temos uma linha de cabeçalho
  if (worksheet.length === 0) {
    return dadosProcessados; // Se a planilha estiver vazia, retorna um array vazio
  }

  // Identificar as colunas que contêm tamanhos (linha de cabeçalho)
  const headerRow = worksheet[0];

  // Percorrer cada linha da planilha, começando pela segunda (índice 1)
  for (let i = 1; i < worksheet.length; i++) {
    const linha = worksheet[i];
    
    // Extrair dados gerais e garantir que estão em maiúsculas
    const projeto = String(linha[0]).toUpperCase().trim();
    const item = String(linha[1]).toUpperCase().trim();
    const genero = String(linha[2]).toUpperCase().trim();

    // Criar o array de tamanhos
    const tamanhos: string[] = [];

    // Processar as colunas de tamanhos a partir da quarta coluna
    for (let j = 3; j < linha.length; j++) {
      const marcacao = linha[j];
      const tamanho = headerRow[j]; // O valor do cabeçalho é o tamanho (ex: 2, 4, P, M, etc)

      // Verificar se a célula contém um "x" (indicando que o tamanho é válido)
      if (marcacao && String(marcacao).toUpperCase().trim() === 'X') {
        tamanhos.push(String(tamanho).toUpperCase().trim()); // Adiciona o tamanho se houver "x"
      }
    }

    // Só adicionar o registro se houver tamanhos válidos
    if (tamanhos.length > 0) {
      dadosProcessados.push({
        projeto,
        item,
        genero,
        tamanhos // Apenas tamanhos válidos
      });
    }
  }

  // Retorna os dados processados
  console.dir(dadosProcessados, { depth: null, maxArrayLength: null });
  return dadosProcessados;
}
