import { Body, Controller, Delete, Get, Param, Post, HttpCode, HttpStatus, BadRequestException, NotFoundException } from '@nestjs/common';
import { BarcodePrisma } from './barCode.prisma';
import { Barcode } from '@core/index';

@Controller('barcodes')
export class BarcodeController {
  constructor(private readonly repo: BarcodePrisma) {}

  // Salvar ou criar um código de barras
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async salvarBarcode(@Body() barcode: Omit<Barcode, 'createdAt' | 'updatedAt'>): Promise<Barcode> {
    try {
      return await this.repo.salvar(barcode);
    } catch (error) {
      throw new BadRequestException('Erro ao salvar o código de barras: ' + error.message);
    }
  }

  // Obter todos os códigos de barras
  @Get()
  async obterBarcodes(): Promise<Barcode[]> {
    return this.repo.obter();
  }

  // Obter um código de barras específico pelo ID
  @Get(':id')
  async obterBarcode(@Param('id') id: string): Promise<Barcode> {
    const barcode = await this.repo.obterPorId(+id);
    if (!barcode) {
      throw new NotFoundException(`Código de barras com ID ${id} não encontrado.`);
    }
    return barcode;
  }

  // Excluir um código de barras específico pelo ID
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) // Indica que não há conteúdo após a exclusão
  async excluirBarcode(@Param('id') id: string): Promise<void> {
    const barcode = await this.repo.obterPorId(+id);
    if (!barcode) {
      throw new NotFoundException(`Código de barras com ID ${id} não encontrado.`);
    }
    try {
      await this.repo.excluir(+id);
    } catch (error) {
      throw new BadRequestException('Erro ao excluir o código de barras: ' + error.message);
    }
  }
}
