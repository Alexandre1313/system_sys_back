import { Body, Controller, Delete, Get, Param, Post, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { BarcodePrisma } from './barCode.prisma';
import { Barcode } from '@core/index';

@Controller('barcodes')
export class BarcodeController {
  constructor(private readonly repo: BarcodePrisma) { }

  // Salvar ou criar um código de barras
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async salvarBarcode(@Body() barcode: Omit<Barcode, 'createdAt' | 'updatedAt'>): Promise<Barcode> {
    try {
      return await this.repo.salvar(barcode);
    } catch (error) {
      throw new BadRequestException(error.message); // Retornando uma resposta adequada em caso de erro
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
    return this.repo.obterPorId(+id);
  }

  // Excluir um código de barras específico pelo ID
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) // Indica que não há conteúdo após a exclusão
  async excluirBarcode(@Param('id') id: string): Promise<any> {
    try {
        return await this.repo.excluir(+id);
    } catch (error) {
        throw new BadRequestException(error.message); // Retornando uma resposta adequada em caso de erro
    }
  }
}
