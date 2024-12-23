import { DataInserctionUni, TamanhoQuantidade } from "@core/interfaces";
import * as XLSX from 'xlsx';

export default function utilities2(caminhoPlanilha: string = 'core/utils/distgradeunificada.xlsx'): DataInserctionUni[] {
  // Lê o arquivo Excel
  const workbook = XLSX.readFile(caminhoPlanilha);

  // Pega o nome da primeira aba da planilha
  const sheetName = workbook.SheetNames[0];

  // Converte a planilha para uma matriz de arrays
  const worksheet: any[][] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });

  const dadosProcessados: any[] = [];

  // Se a planilha estiver vazia, retorna um array vazio
  if (worksheet.length === 0) {
    return dadosProcessados;
  }

  // A primeira linha (cabeçalho) contém os tamanhos
  const headerRow = worksheet[0];

  // Percorre as linhas da planilha, começando pela segunda linha (índice 1)
  for (let i = 1; i < worksheet.length; i++) {
    const linha = worksheet[i];

    // Extração dos dados fixos da linha (número da escola, nome da escola, etc.)
    const numeroEscola = String(linha[2]).toUpperCase().trim();
    const escola = String(linha[1]).toUpperCase().trim();
    const projeto = String(linha[0]).toUpperCase().trim();
    const item = String(linha[3]).toUpperCase().trim();
    const genero = String(linha[4]).toUpperCase().trim();

    // Cria um array para armazenar os tamanhos e quantidades
    const tamanhos: TamanhoQuantidade[] = [];

    // Percorre as colunas de tamanhos (a partir da 5ª coluna)
    for (let j = 5; j < linha.length; j++) {
      const quantidade = linha[j];
      const tamanho = headerRow[j]; // O valor do cabeçalho é o tamanho (ex: 2, 4, P, M, etc)

      // Verifica se a quantidade é um número válido, ou seja, maior que 0
      if (quantidade !== undefined && quantidade !== null && !isNaN(quantidade) && quantidade > 0) {
        tamanhos.push({
          tamanho: String(tamanho).toUpperCase().trim(),
          quantidade: Number(quantidade)
        });
      }
    }

    // Só adiciona o registro se houver tamanhos válidos
    if (tamanhos.length > 0) {
      // Verifica se o projeto já existe na lista de dadosProcessados
      let projetoExistente = dadosProcessados.find(p => p.projeto === projeto);

      if (!projetoExistente) {
        // Se o projeto não existe, cria um novo
        projetoExistente = {
          projeto: projeto,
          escolas: []
        };
        dadosProcessados.push(projetoExistente);
      }

      // Verifica se a escola já existe dentro do projeto
      let escolaExistente = projetoExistente.escolas.find(e => e.numeroEscola === numeroEscola);

      if (!escolaExistente) {
        // Se a escola não existe, cria uma nova
        escolaExistente = {
          nome: escola,
          numeroEscola: numeroEscola,
          itens: []
        };
        projetoExistente.escolas.push(escolaExistente);
      }

      // Agora, para cada item, cria um objeto com tamanhos específicos
      // Cria ou atualiza o item dentro da escola
      let itemExistente = escolaExistente.itens.find(i => i.nome === item && i.genero === genero);

      if (!itemExistente) {
        // Se o item não existe, cria um novo
        itemExistente = {
          nome: item,
          genero: genero,
          tamanhos: []
        };
        escolaExistente.itens.push(itemExistente);
      }

      // Adiciona os tamanhos e quantidades ao item
      itemExistente.tamanhos.push(...tamanhos);
    }
  }

  // Agora criamos a estrutura de saída no formato desejado, com o projeto, escolas, e itens
  const resultadoFinal: DataInserctionUni[] = dadosProcessados.map(projeto => {
    return {
      projeto: projeto.projeto,
      escolas: projeto.escolas.map(escola => {
        return {
          nome: escola.nome,
          numeroEscola: escola.numeroEscola,
          itens: escola.itens.map(item => {
            return {
              nome: item.nome,
              genero: item.genero,
              tamanhos: item.tamanhos
            };
          })
        };
      })
    };
  });

  // Log opcional para inspecionar os dados processados
  console.dir(resultadoFinal, { depth: null, maxArrayLength: null });

  return resultadoFinal;
}
