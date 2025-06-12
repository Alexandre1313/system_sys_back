import { Caixa } from '@core/index';
import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { CaixaPrisma } from './Caixa.prisma';

@Controller('caixas')
export class CaixaController {
  constructor(private readonly repo: CaixaPrisma) { }

  @Get('getcaixas/:id')
  async getCaixasporG(@Param('id') id: string): Promise<Caixa[]> {
    const caixas = await this.repo.getCaixasComItensPorGradeId(+id);
    if (!caixas) {
      return [];
    }
    return caixas;
  }

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
