import { ItemsInserction2, ComponenteDoKit } from '@core/interfaces';
import { limparString } from './utils';
import * as path from 'path';
import * as XLSX from 'xlsx';

const baseDir = path.join(process.cwd(), 'core', 'utils', 'docs_proj_items');
const filename = `cadastrodeitens2.xlsx`;
const filePath = path.join(baseDir, filename);

export default function insertItems2(caminhoPlanilha: string = filePath): ItemsInserction2[] {
  const workbook = XLSX.readFile(caminhoPlanilha);
  const sheetName = workbook.SheetNames[0];
  const worksheet: any[][] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });

  const dadosProcessados: ItemsInserction2[] = [];

  if (worksheet.length === 0) return dadosProcessados;

  const headerRow = worksheet[0];
  const colunasTamanhoInicio = 6; // colunas: [projeto, item, genero, ehKit, componente, qtd, ...tamanhos]

  const linhasKits: any[][] = [];
  const linhasItensSimples: any[][] = [];

  // Separar linhas de itens simples e kits
  for (let i = 1; i < worksheet.length; i++) {
    const linha = worksheet[i];
    const ehKit = limparString(String(linha[3] || '')) === 'Y';
    const temTamanhoX = linha.slice(colunasTamanhoInicio, headerRow.length).some(celula => limparString(String(celula || '')) === 'X');
    if (temTamanhoX) {
      if (ehKit) {
        linhasKits.push(linha);
      } else {
        linhasItensSimples.push(linha);
      }
    }
  }

  // 🧩 Processar Itens Simples
  for (const linha of linhasItensSimples) {
    const [projeto, item, genero] = [linha[0], linha[1], linha[2]].map(v => limparString(String(v || '')));
    const tamanhos: string[] = [];

    for (let j = colunasTamanhoInicio; j < headerRow.length; j++) {
      const marca = linha[j];
      const tamanho = headerRow[j];
      if (marca && limparString(String(marca)) === 'X') {
        const valorTamanho = limparString(String(tamanho));
        // Verifica se é um número puro (ex: "2", "10") sem letras
        if (/^\d+$/.test(valorTamanho)) {
          tamanhos.push(valorTamanho.padStart(2, '0')); // adiciona zero à esquerda se for número
        } else {
          tamanhos.push(valorTamanho); // mantém como está se for "06M", "P", etc
        }
      }
    }

    if (tamanhos.length > 0) {
      dadosProcessados.push({
        projeto,
        item,
        genero,
        isKit: false,
        tamanhos
      });
    }
  }

  // 🧩 Agrupar linhas de kits por nome + gênero
  const gruposDeKits: Record<string, any[][]> = {};
  const chavesNomeGenero: Record<string, { nome: string; genero: string }> = {};

  for (const linha of linhasKits) {
    const nomeKit = limparString(String(linha[1]));
    const generoKit = limparString(String(linha[2]));
    const chave = `${nomeKit}__${generoKit}`; // chave combinada

    if (!gruposDeKits[chave]) {
      gruposDeKits[chave] = [];
      chavesNomeGenero[chave] = { nome: nomeKit, genero: generoKit };
    }
    gruposDeKits[chave].push(linha);
  }

  // 🧱 Processar Kits

  // 1. Descobrir a primeira linha onde aparece um kit na planilha original
  const indicePrimeiroKit = worksheet.findIndex((linha, idx) => {
    if (idx === 0) return false; // pular o header
    return limparString(String(linha[3] || '')) === 'Y';
  });

  // 2. Obter todas as linhas de itens candidatos a componentes
  const linhasItensPossiveis: any[][] = worksheet.slice(1, indicePrimeiroKit); // ignora o header

  for (const chave in gruposDeKits) {
    const linhasDoKit = gruposDeKits[chave];
    const primeira = linhasDoKit[0];
    const projeto = limparString(String(primeira[0]));
    const { nome: nomeKit, genero: generoKit } = chavesNomeGenero[chave];

    const tamanhos: string[] = [];
    for (let j = colunasTamanhoInicio; j < headerRow.length; j++) {
      const marca = primeira[j];
      const tamanho = headerRow[j];
      if (marca && limparString(String(marca)) === 'X') {
        tamanhos.push(limparString(String(tamanho)));
      }
    }

    const composicao: Record<string, ComponenteDoKit[]> = {};

    for (const tamanhoKit of tamanhos) {
      composicao[tamanhoKit] = [];

      for (const linhaComp of linhasItensPossiveis) {
        const nomeComponente = limparString(String(linhaComp[1] || null));
        const generoComp = limparString(String(linhaComp[2] || null));
        const qtd = parseInt(String(linhaComp[5] || 0), 10);
        const marca = linhaComp[headerRow.indexOf(tamanhoKit)];

        if (!nomeComponente || isNaN(qtd) || qtd <= 0 || !marca || !generoComp || limparString(String(marca)) !== 'X') continue;

        const incluirComponente =
          generoKit === 'UNISSEX' ||
          generoComp === 'UNISSEX' ||
          generoKit === generoComp;

        if (incluirComponente) {
          composicao[tamanhoKit].push({
            item: nomeComponente,
            genero: generoComp,
            quantidade: qtd,
            tamanho: tamanhoKit
          });
        }
      }
    }

    dadosProcessados.push({
      projeto,
      item: nomeKit,
      genero: generoKit,
      isKit: true,
      tamanhos,
      composicao
    });
  }

  console.log(JSON.stringify(dadosProcessados, null, 2));
  return dadosProcessados;
}
