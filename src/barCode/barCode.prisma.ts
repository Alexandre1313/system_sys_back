import { Barcode } from '@core/index';
import { Injectable } from '@nestjs/common';
import { PrismaProvider } from 'src/db/prisma.provider';

@Injectable()
export class BarcodePrisma {
  constructor(readonly prisma: PrismaProvider) { }

  async salvar(barcode: Barcode): Promise<Barcode> {
    const { id, ...dadosDoBarcode } = barcode;

    const barcodeSalvo = await this.prisma.barcode.upsert({
      where: {
        id: id !== undefined ? +id : -1,
      },
      update: {
        ...dadosDoBarcode,
        // Aqui você pode adicionar lógica específica para atualizar itens se necessário
      },
      create: {
        ...dadosDoBarcode,
        // Aqui você pode adicionar lógica específica para criar itens se necessário
      },
    });
    return barcodeSalvo; // Retorne o barcode salvo
  }

  async obter(): Promise<Barcode[]> {
    const barcodes = await this.prisma.barcode.findMany();
    return barcodes;
  }

  async obterPorId(id: number): Promise<Barcode | null> {
    const barcode = await this.prisma.barcode.findUnique({ where: { id } });
    return (barcode as Barcode) ?? null;
  }

  async excluir(id: number): Promise<void> {
    try {
      // Tente excluir o item com o ID fornecido
      await this.prisma.barcode.delete({ where: { id } });
    } catch (error) {
      // Aqui você pode capturar e tratar o erro
      console.error('Erro ao excluir o código de barras:', error);

      // Lançar um erro apropriado ou lançar uma exceção
      if (error.code === 'P2025') {
        // Erro específico quando o registro não é encontrado
        throw new Error('O código de barras não foi encontrado.');
      } else {
        // Lidar com outros erros genéricos
        throw new Error('Erro ao tentar excluir o código de barras. Por favor, tente novamente.');
      }
    }
  }
}
