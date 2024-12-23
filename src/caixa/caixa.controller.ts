import { Caixa } from '@core/index';
import { BadRequestException, Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CaixaPrisma } from './Caixa.prisma';

@Controller('caixas')
export class CaixaController {
  constructor(private readonly repo: CaixaPrisma) {}

  // Salvar ou criar uma caixa
  @Post('/inserir')
  @HttpCode(HttpStatus.CREATED)
  async salvarCaixa(@Body() caixa: Omit<Caixa, 'createdAt' | 'updatedAt'>): Promise<Caixa> {
    try {
      return await this.repo.inserirCaixaEItens(caixa);
    } catch (error) {
      throw new BadRequestException('Erro ao salvar o caixa: ' + error.message);
    }
  }  
}
