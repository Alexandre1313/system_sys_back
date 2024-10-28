import { Body, Controller, Delete, Get, Param, Post, HttpCode, HttpStatus, BadRequestException, NotFoundException } from '@nestjs/common';
import { CaixaPrisma } from './Caixa.prisma';
import { Caixa } from '@core/index';

@Controller('caixas')
export class CaixaController {
  constructor(private readonly repo: CaixaPrisma) {}

  // Salvar ou criar um código de barras
  @Post('/inserir')
  @HttpCode(HttpStatus.CREATED)
  async salvarCaixa(@Body() caixa: Omit<Caixa, 'createdAt' | 'updatedAt'>): Promise<Caixa> {
    try {
      return await this.repo.inserirCaixaEItens(caixa);
    } catch (error) {
      throw new BadRequestException('Erro ao salvar o ccaixa: ' + error.message);
    }
  }  
}
