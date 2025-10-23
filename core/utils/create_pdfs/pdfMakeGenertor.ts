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

function formatDateSP(date: string | null): string {
  if (!date) return '';
  const pad = date.split('-');
  return `${pad[2]}/${pad[1]}/${pad[0]}`;
}

export async function gerarPDFExpedicaoComEscola(resumo: ExpedicaoResumoPDGrouped[]): Promise<Buffer> {
  if (!Array.isArray(resumo) || resumo.length === 0) {
    throw new Error('O resumo está vazio ou inválido. Não é possível gerar PDF.');
  }

  const now = new Date();
  const formattedDateTime = formatDateTime(now);

  // 🎨 Paleta de cores moderna e profissional
  const COLORS = {
    // Status - cores mais suaves e intuitivas
    DESPACHADA: { bg: '#e3f2fd', text: '#1565c0', border: '#2196f3' },
    EXPEDIDA: { bg: '#e8f5e8', text: '#2e7d32', border: '#4caf50' },
    PRONTA: { bg: '#fff3e0', text: '#ef6c00', border: '#ff9800' },
    
    // Hierarquia visual
    PROJECT_HEADER: '#37474f',
    SCHOOL_HEADER: '#eceff1',
    DATE_SEPARATOR: '#f5f5f5',
    
    // Totais com gradiente sutil
    TOTAL_SCHOOL: '#fff8e1',
    TOTAL_DATE: '#e8f5e8',
    TOTAL_GENERAL: '#e1f5fe',
    
    // Estados de diferença
    NEGATIVE_DIFF: '#ffebee',
    POSITIVE_DIFF: '#e8f5e8',
    NEUTRAL: '#fafafa'
  };

  // 📋 Cabeçalho da tabela com design moderno
  const headers = [
    { text: 'Data', bold: true, fontSize: 10, margin: [0, 3, 0, 3], fillColor: '#546e7a', color: 'white' },
    { text: 'Item', bold: true, fontSize: 10, margin: [0, 3, 0, 3], fillColor: '#546e7a', color: 'white' },
    { text: 'Gênero', bold: true, fontSize: 10, margin: [0, 3, 0, 3], fillColor: '#546e7a', color: 'white' },
    { text: 'Tamanho', bold: true, fontSize: 10, margin: [0, 3, 0, 3], fillColor: '#546e7a', color: 'white' },
    { text: 'Previsto', bold: true, alignment: 'right', fontSize: 10, margin: [0, 3, 0, 3], fillColor: '#546e7a', color: 'white' },
    { text: 'Expedido', bold: true, alignment: 'right', fontSize: 10, margin: [0, 3, 0, 3], fillColor: '#546e7a', color: 'white' },
    { text: 'Diferença', bold: true, alignment: 'right', fontSize: 10, margin: [0, 3, 0, 3], fillColor: '#546e7a', color: 'white' }
  ];

  const body: any[] = [];

  resumo.forEach(grupo => {
    // 🏢 Cabeçalho do projeto com design moderno
    body.push([
      {
        text: `📋 PROJETO: ${grupo.projectname}`,
        colSpan: 4,
        bold: true,
        fontSize: 11,
        fillColor: COLORS.PROJECT_HEADER,
        color: 'white',
        margin: [0, 4, 0, 4]
      },
      null,
      null,
      null,
      {
        text: `🕒 Gerado em: ${formattedDateTime}`,
        colSpan: 3,
        fontSize: 8,
        italics: true,
        alignment: 'right',
        fillColor: COLORS.PROJECT_HEADER,
        color: 'white',
        margin: [0, 4, 0, 4]
      },
      null,
      null
    ]);

    // Adiciona o cabeçalho da tabela
    body.push(headers);

    grupo.groupedItems.forEach(dataGroup => {
      // Procura linha de status no grupo de itens
      const statusRow = dataGroup.items.find(i => i.item?.startsWith('STATUS:'));
      const isStatusHeader = !!statusRow;

      if (isStatusHeader) {
        const statusText = statusRow?.item || '';

        // 🎨 Define cores modernas baseadas no status
        let statusColors = { bg: COLORS.NEUTRAL, text: '#616161' };

        if (statusText.toUpperCase().includes('DESPACHADA')) {
          statusColors = { bg: COLORS.DESPACHADA.bg, text: COLORS.DESPACHADA.text };
        } else if (statusText.toUpperCase().includes('EXPEDIDA')) {
          statusColors = { bg: COLORS.EXPEDIDA.bg, text: COLORS.EXPEDIDA.text };
        } else if (statusText.toUpperCase().includes('PRONTA')) {
          statusColors = { bg: COLORS.PRONTA.bg, text: COLORS.PRONTA.text };
        }

        function traduzirStatus(status: string): string {
          const cleanStatus = status.replace('STATUS:', '').trim().toUpperCase();
          switch (cleanStatus) {
            case 'DESPACHADA':
              return '🚚 REMETIDO AO CLIENTE - DESPACHADA';
            case 'EXPEDIDA':
              return '📦 FINALIZADO - AGUARDANDO ENVIO';
            case 'PRONTA':
              return '⚙️ EM ANDAMENTO';
            default:
              return status;
          }
        }

        // ✨ Linha separadora elegante antes do status
        body.push([
          { text: '', colSpan: 7, margin: [0, 2, 0, 2], fillColor: COLORS.DATE_SEPARATOR },
          null,
          null,
          null,
          null,
          null,
          null
        ]);

        // 🏷️ Linha de status com design moderno
        body.push([
          {
            text: traduzirStatus(statusText),
            colSpan: 7,
            fontSize: 10,
            bold: true,
            fillColor: statusColors.bg,
            color: statusColors.text,
            margin: [0, 5, 0, 5],
          },
          null,
          null,
          null,
          null,
          null,
          null
        ]);

        return;
      }

      // Agora as linhas normais do grupo
      dataGroup.items.forEach(item => {
        const isSubtotal = item.item === 'Total';
        const isTotalGeral = item.item === 'Total Geral';
        const isTotalData = item.item === 'Total da Data';
        const isEscolaHeader = item.item?.startsWith('ESCOLA:');
        const isTotalEscola = item.item?.startsWith('Total ') && !isTotalGeral && !isTotalData;
        const isTotalStatus = item.item?.startsWith('📊 Total '); // ✅ NOVO: Total por status

        let diff = item.expedido - item.previsto;

        if (isEscolaHeader) {
          // 🏫 Linha destacada para escola com design moderno
          const escolaText = item.item?.replace('ESCOLA:', '🏫') || '';
          body.push([
            { text: '', margin: [0, 1, 0, 1] },
            {
              text: escolaText,
              colSpan: 6,
              bold: true,
              fontSize: 10,
              fillColor: COLORS.SCHOOL_HEADER,
              color: '#37474f',
              margin: [0, 4, 0, 4]
            },
            null,
            null,
            null,
            null,
            null
          ]);
        } else if (isSubtotal || isTotalGeral || isTotalData || isTotalEscola || isTotalStatus) {
          // 📊 Linha total/subtotal com design moderno
          let bgColor = COLORS.NEUTRAL;
          let textPrefix = '📄 ';
          
          if (isTotalGeral) {
            bgColor = COLORS.TOTAL_GENERAL;
            textPrefix = '📋 ';
          } else if (isTotalData) {
            bgColor = COLORS.TOTAL_DATE;
            textPrefix = '📅 ';
          } else if (isTotalEscola) {
            bgColor = COLORS.TOTAL_SCHOOL;
            textPrefix = '🏫 ';
          } else if (isTotalStatus) {
            bgColor = '#f3e5f5'; // ✅ NOVO: Cor roxa para total por status
            textPrefix = '📊 ';
          }

          if (isTotalEscola || isTotalStatus) {
            // Para Total da Escola, mesclar as 4 primeiras células para evitar quebra de linha
            body.push([
              {
                text: textPrefix + item.item,
                colSpan: 4,
                bold: true,
                fontSize: 9,
                fillColor: bgColor,
                color: '#37474f',
                margin: [0, 3, 0, 3]
              },
              null,
              null,
              null,
              {
                text: item.previsto.toString(),
                alignment: 'right',
                bold: true,
                fontSize: 9,
                fillColor: bgColor,
                margin: [0, 2, 0, 2]
              },
              {
                text: item.expedido.toString(),
                alignment: 'right',
                bold: true,
                fontSize: 9,
                fillColor: bgColor,
                margin: [0, 2, 0, 2]
              },
              {
                text: diff === 0 ? '' : diff.toString(),
                alignment: 'right',
                bold: true,
                fontSize: 9,
                fillColor: bgColor,
                margin: [0, 2, 0, 2],
                color: diff < 0 ? 'red' : diff === 0 ? 'transparent' : 'black'
              }
            ]);
          } else {
            // Para outros totais, com design aprimorado
            body.push([
              { text: '', margin: [0, 1, 0, 1] },
              { text: '' },
              {
                text: textPrefix + item.item,
                bold: true,
                fontSize: 9,
                fillColor: bgColor,
                color: '#37474f',
                margin: [0, 3, 0, 3]
              },
              { text: '', fillColor: bgColor },
              {
                text: item.previsto.toString(),
                alignment: 'right',
                bold: true,
                fontSize: 9,
                fillColor: bgColor,
                margin: [0, 2, 0, 2]
              },
              {
                text: item.expedido.toString(),
                alignment: 'right',
                bold: true,
                fontSize: 9,
                fillColor: bgColor,
                margin: [0, 2, 0, 2]
              },
              {
                text: diff === 0 ? '' : diff.toString(),
                alignment: 'right',
                bold: true,
                fontSize: 9,
                fillColor: bgColor,
                margin: [0, 2, 0, 2],
                color: diff < 0 ? 'red' : diff === 0 ? 'transparent' : 'black'
              }
            ]);
          }
        } else {
          // ✨ Linhas normais de itens com design aprimorado
          let diffBgColor = COLORS.NEUTRAL;
          let diffTextColor = '#616161';
          
          if (diff < 0) {
            diffBgColor = COLORS.NEGATIVE_DIFF;
            diffTextColor = '#d32f2f';
          } else if (diff > 0) {
            diffBgColor = COLORS.POSITIVE_DIFF;
            diffTextColor = '#2e7d32';
          }

          body.push([
            { text: formatDateSP(item.data) || '', fontSize: 8, margin: [0, 2, 0, 2] },
            { text: item.item, fontSize: 8, margin: [0, 2, 0, 2] },
            { text: item.genero, fontSize: 8, margin: [0, 2, 0, 2] },
            { text: item.tamanho, fontSize: 8, margin: [0, 2, 0, 2], alignment: 'center' },
            {
              text: item.previsto.toString(),
              alignment: 'right',
              fontSize: 8,
              margin: [0, 2, 0, 2]
            },
            {
              text: item.expedido.toString(),
              alignment: 'right',
              fontSize: 8,
              margin: [0, 2, 0, 2]
            },
            {
              text: diff === 0 ? '—' : diff.toString(),
              alignment: 'right',
              bold: diff !== 0,
              fontSize: 8,
              fillColor: diffBgColor,
              color: diffTextColor,
              margin: [0, 2, 0, 2]
            }
          ]);
        }
      });
    });
  });

  const docDefinition: any = {
    pageSize: 'A4',
    pageMargins: [15, 20, 15, 20],
    header: (currentPage: number, _pageCount: number) => ({
      margin: [15, 10, 15, 0],
      columns: [
        { text: 'RESUMO EXPEDIÇÃO POR ESCOLA/DATA/PROJETO', style: 'header' },
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
          widths: ['auto', '*', '*', 'auto', 'auto', 'auto', 'auto'],
          body
        },
        layout: {
          fillColor: (rowIndex: number) => {
            if (rowIndex === 0 || rowIndex === 1) return '#dddddd'; // cabeçalho projeto e colunas
            if (rowIndex % 2 === 0) return '#fafafa'; // linhas pares
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
      header: {
        fontSize: 12,
        bold: true
      },
      tableStyle: {
        margin: [0, 5, 0, 15]
      }
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

export async function gerarPDFExpedicao(resumo: ExpedicaoResumoPDGrouped[]): Promise<Buffer> {
  if (!Array.isArray(resumo) || resumo.length === 0) {
    throw new Error('O resumo está vazio ou inválido. Não é possível gerar PDF.');
  }

  const now = new Date();
  const formattedDateTime = formatDateTime(now);

  // Cabeçalho da tabela SEM coluna Status
  const headers = [
    { text: 'Data', bold: true, fontSize: 9, margin: [0, 1, 0, 1] },
    { text: 'Item', bold: true, fontSize: 9, margin: [0, 1, 0, 1] },
    { text: 'Gênero', bold: true, fontSize: 9, margin: [0, 1, 0, 1] },
    { text: 'Tamanho', bold: true, fontSize: 9, margin: [0, 1, 0, 1] },
    { text: 'Previsto', bold: true, alignment: 'right', fontSize: 9, margin: [0, 1, 0, 1] },
    { text: 'Expedido', bold: true, alignment: 'right', fontSize: 9, margin: [0, 1, 0, 1] },
    { text: 'Diferença', bold: true, alignment: 'right', fontSize: 9, margin: [0, 1, 0, 1] }
  ];

  const body: any[] = [];

  resumo.forEach(grupo => {
    // Cabeçalho do projeto e data/hora de geração
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
        colSpan: 3,
        fontSize: 7,
        italics: true,
        alignment: 'right',
        fillColor: '#dddddd',
        margin: [0, 2, 0, 2]
      },
      null,
      null
    ]);

    // Adiciona o cabeçalho da tabela (sem status)
    body.push(headers);

    grupo.groupedItems.forEach(dataGroup => {
      // Procura linha de status no grupo de itens
      const statusRow = dataGroup.items.find(i => i.item?.startsWith('STATUS:'));
      const isStatusHeader = !!statusRow;

      if (isStatusHeader) {
        const statusText = statusRow?.item || '';

        // Define cor de fundo baseado no status
        let fillColor = '#d0d0d0';  // cor padrão
        let fillOpacity = 0.3;

        if (statusText.toUpperCase().includes('DESPACHADA')) {
          fillColor = '#0000ff';  // azul
        } else if (statusText.toUpperCase().includes('EXPEDIDA')) {
          fillColor = '#008000';  // verde
        } else if (statusText.toUpperCase().includes('PRONTA')) {
          fillColor = '#FFFF00';
        }

        function traduzirStatus(status: string): string {
          const cleanStatus = status.replace('STATUS:', '').trim().toUpperCase();
          switch (cleanStatus) {
            case 'DESPACHADA':
              return 'REMETIDO AO CLIENTE - DESPACHADA';
            case 'EXPEDIDA':
              return 'FINALIZADO - AGUARDANDO ENVIO';
            case 'PRONTA':
              return 'EM ANDAMENTO';
            default:
              return status; // retorna como está se não reconhecer
          }
        }

        // Linha em branco antes do status
        body.push([
          { text: '', colSpan: 7, margin: [0, 3, 0, 3], fillColor: '#f3f3f3' },
          null,
          null,
          null,
          null,
          null,
          null
        ]);

        // Linha de status destacada, ocupando todas as colunas da tabela
        body.push([
          {
            text: traduzirStatus(statusText),
            colSpan: 7,
            fontSize: 9,
            bold: true,
            fillColor,
            fillOpacity,
            margin: [0, 4, 0, 4],
          },
          null,
          null,
          null,
          null,
          null,
          null
        ]);

        return; // pula as linhas seguintes deste grupo pois status não tem dados
      }

      // Agora as linhas normais do grupo
      dataGroup.items.forEach(item => {
        const isSubtotal = item.item === 'Total';
        const isTotalGeral = item.item === 'Total Geral';
        const isTotalStatus = item.item?.startsWith('📊 Total '); // ✅ NOVO: Total por status
        let diff = item.expedido - item.previsto;

        if (isSubtotal || isTotalGeral || isTotalStatus) {
          // Linha total/subtotal com destaque
          body.push([
            { text: '', margin: [0, 1, 0, 1] },
            { text: '' },
            {
              text: item.item,
              bold: true,
              fontSize: 9,
              fillColor: '#bbbbbb',
              margin: [0, 2, 0, 2]
            },
            { text: '', fillColor: '#bbbbbb' },
            {
              text: item.previsto.toString(),
              alignment: 'right',
              bold: true,
              fontSize: 9,
              fillColor: '#bbbbbb',
              margin: [0, 2, 0, 2]
            },
            {
              text: item.expedido.toString(),
              alignment: 'right',
              bold: true,
              fontSize: 9,
              fillColor: '#bbbbbb',
              margin: [0, 2, 0, 2]
            },
            {
              text: diff === 0 ? '' : diff.toString(),
              alignment: 'right',
              bold: true,
              fontSize: 9,
              fillColor: '#bbbbbb',
              margin: [0, 2, 0, 2],
              color: diff < 0 ? 'red' : diff === 0 ? 'transparent' : 'black'
            }
          ]);
        } else {
          // Linhas normais: sem coluna status
          body.push([
            { text: formatDateSP(item.data) || '', fontSize: 8, margin: [0, 1, 0, 1] },
            { text: item.item, fontSize: 8, margin: [0, 1, 0, 1] },
            { text: item.genero, fontSize: 8, margin: [0, 1, 0, 1] },
            { text: item.tamanho, fontSize: 8, margin: [0, 1, 0, 1] },
            {
              text: item.previsto.toString(),
              alignment: 'right',
              fontSize: 8,
              margin: [0, 1, 0, 1]
            },
            {
              text: item.expedido.toString(),
              alignment: 'right',
              fontSize: 8,
              margin: [0, 1, 0, 1]
            },
            {
              text: diff === 0 ? '' : diff.toString(),
              alignment: 'right',
              bold: true,
              fontSize: 9,
              fillColor: '#bbbbbb',
              margin: [0, 1, 0, 1],
              color: diff < 0 ? 'red' : diff === 0 ? 'transparent' : 'black'
            }
          ]);
        }
      });
    });
  });

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
          widths: ['auto', '*', '*', 'auto', 'auto', 'auto', 'auto'],
          body
        },
        layout: {
          fillColor: (rowIndex: number) => {
            if (rowIndex === 0 || rowIndex === 1) return '#dddddd'; // cabeçalho projeto e colunas
            if (rowIndex % 2 === 0) return '#fafafa'; // linhas pares
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
      header: {
        fontSize: 12,
        bold: true
      },
      tableStyle: {
        margin: [0, 5, 0, 15]
      }
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
