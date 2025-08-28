import { ExpedicaoResumoPDGrouped } from '@core/interfaces';
import * as path from 'path';
const PdfPrinter = require('pdfmake');

const fonts = {
  Arial: {
    normal: path.join(process.cwd(), 'core/utils/create_pdfs/fonts/ARIAL.TTF'),
    bold: path.join(process.cwd(), 'core/utils/create_pdfs/fonts/ARIALBD.TTF'),
    italics: path.join(process.cwd(), 'core/utils/create_pdfs/fonts/ARIALI.TTF'),
    bolditalics: path.join(process.cwd(), 'core/utils/create_pdfs/fonts/ARIALBI.TTF')
  }
};

const printer = new PdfPrinter(fonts);

function formatDateTime(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export async function gerarPDFExpedicao(resumo: ExpedicaoResumoPDGrouped[]): Promise<Buffer> {
  if (!Array.isArray(resumo) || resumo.length === 0) {
    throw new Error('O resumo está vazio ou inválido. Não é possível gerar PDF.');
  }

  const now = new Date();
  const formattedDateTime = formatDateTime(now);

  const headers = [
    { text: 'Data', bold: true, fontSize: 9, margin: [0, 1, 0, 1] },
    { text: 'Item', bold: true, fontSize: 9, margin: [0, 1, 0, 1] },
    { text: 'Gênero', bold: true, fontSize: 9, margin: [0, 1, 0, 1] },
    { text: 'Tamanho', bold: true, fontSize: 9, margin: [0, 1, 0, 1] },
    { text: 'Previsto', bold: true, alignment: 'right', fontSize: 9, margin: [0, 1, 0, 1] },
    { text: 'Expedido', bold: true, alignment: 'right', fontSize: 9, margin: [0, 1, 0, 1] }
  ];

  const body: any[] = [];

  for (const grupo of resumo) {
    if (!grupo || typeof grupo !== 'object') {
      console.warn('Grupo inválido ignorado:', grupo);
      continue;
    }

    if (!Array.isArray(grupo.groupedItems) || grupo.groupedItems.length === 0) {
      console.warn(`Grupo "${grupo.projectname}" ignorado por não ter groupedItems válidos.`);
      continue;
    }

    // Linha do projeto + data/hora geração
    body.push([
      {
        text: `PROJETO: ${grupo.projectname}`,
        colSpan: 4,
        bold: true,
        fontSize: 9,
        fillColor: '#dddddd',
        margin: [0, 2, 0, 2]
      },
      null,
      null,
      null,
      {
        text: `DATA E HORA DE GERAÇÃO: ${formattedDateTime}`,
        colSpan: 2,
        fontSize: 7,
        italics: true,
        alignment: 'right',
        fillColor: '#dddddd',
        margin: [0, 2, 0, 2]
      },
      null,
    ]);

    // Cabeçalhos da tabela
    body.push(headers);

    for (const dataGroup of grupo.groupedItems) {
      if (!dataGroup || typeof dataGroup !== 'object' || !Array.isArray(dataGroup.items) || dataGroup.items.length === 0) {
        console.warn(`DataGroup ignorado no projeto "${grupo.projectname}" por estar vazio ou inválido.`);
        continue;
      }

      const statusRow = dataGroup.items.find(i => i.item?.startsWith('STATUS:'));
      const isStatusHeader = !!statusRow;

      if (isStatusHeader) {
        // Linha de espaçamento e status
        body.push([
          { text: '', colSpan: 6, margin: [0, 3, 0, 3], fillColor: '#f3f3f3' },
          null, null, null, null, null
        ]);

        body.push([
          {
            text: statusRow?.item || '',
            colSpan: 6,
            fontSize: 9,
            bold: true,
            fillColor: '#d0d0d0',
            margin: [0, 4, 0, 4],
          },
          null, null, null, null, null
        ]);

        continue; // pula para próximo dataGroup
      }

      for (const item of dataGroup.items) {
        if (!item || typeof item !== 'object') {
          console.warn(`Item inválido ignorado no projeto "${grupo.projectname}".`);
          continue;
        }

        const isSubtotal = item.item === 'Total';
        const isTotalGeral = item.item === 'Total Geral';

        if (isSubtotal || isTotalGeral) {
          body.push([
            { text: '', margin: [0, 1, 0, 1] },
            {
              text: item.item,
              bold: true,
              fontSize: 9,
              fillColor: '#bbbbbb',
              margin: [0, 2, 0, 2]
            },
            { text: '', fillColor: '#bbbbbb' },
            { text: '', fillColor: '#bbbbbb' },
            {
              text: item.previsto?.toString() || '0',
              alignment: 'right',
              bold: true,
              fontSize: 9,
              fillColor: '#bbbbbb',
              margin: [0, 2, 0, 2]
            },
            {
              text: item.expedido?.toString() || '0',
              alignment: 'right',
              bold: true,
              fontSize: 9,
              fillColor: '#bbbbbb',
              margin: [0, 2, 0, 2]
            }
          ]);
        } else {
          body.push([
            { text: item.data || '', fontSize: 8, margin: [0, 1, 0, 1] },
            { text: item.item || '', fontSize: 8, margin: [0, 1, 0, 1] },
            { text: item.genero || '', fontSize: 8, margin: [0, 1, 0, 1] },
            { text: item.tamanho || '', fontSize: 8, margin: [0, 1, 0, 1] },
            {
              text: item.previsto?.toString() || '0',
              alignment: 'right',
              fontSize: 8,
              margin: [0, 1, 0, 1]
            },
            {
              text: item.expedido?.toString() || '0',
              alignment: 'right',
              fontSize: 8,
              margin: [0, 1, 0, 1]
            }
          ]);
        }
      }
    }
  }

  if (body.length === 0) {
    throw new Error('Nenhum dado válido encontrado nos projetos. O conteúdo do PDF está vazio.');
  }

  const docDefinition: any = {
    pageSize: 'A4',
    pageMargins: [15, 20, 15, 20],
    header: (currentPage: number, _pageCount: number) => ({
      margin: [15, 10, 15, 0],
      columns: [
        { text: 'RESUMO EXPEDIÇÃO POR DATA DE SAÍDA/PROJETO', style: 'header' },
        { text: formattedDateTime, alignment: 'right', fontSize: 9 }
      ]
    }),
    footer: (currentPage: number, pageCount: number) => ({
      margin: [15, 0, 15, 10],
      columns: [
        { text: `Página ${currentPage} de ${pageCount}`, alignment: 'center', fontSize: 8 }
      ]
    }),
    content: [
      {
        style: 'tableStyle',
        table: {
          headerRows: 2,
          widths: ['auto', '*', '*', 'auto', 'auto', 'auto'],
          body
        },
        layout: {
          fillColor: (rowIndex: number) => {
            if (rowIndex === 0 || rowIndex === 1) return '#dddddd';
            if (rowIndex % 2 === 0) return '#fafafa';
            return null;
          },
          hLineWidth: () => 0.8,
          vLineWidth: () => 0.8,
          hLineColor: () => '#aaa',
          vLineColor: () => '#aaa',
          paddingLeft: () => 4,
          paddingRight: () => 4,
          paddingTop: () => 1,
          paddingBottom: () => 1,
        }
      }
    ],
    styles: {
      header: { fontSize: 12, bold: true },
      tableStyle: { margin: [0, 5, 0, 15] }
    },
    defaultStyle: {
      font: 'Arial',
      fontSize: 8,
      lineHeight: 1.1
    }
  };

  const pdfDoc = printer.createPdfKitDocument(docDefinition);

  return new Promise<Buffer>((resolve, reject) => {
    try {
      const chunks: Buffer[] = [];
      pdfDoc.on('data', chunk => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', reject);
      pdfDoc.end();
    } catch (error) {
      reject(error);
    }
  });
}
