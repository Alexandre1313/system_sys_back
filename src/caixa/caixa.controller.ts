import { Caixa, CaixaAjuste } from '@core/index';
import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { CaixaPrisma } from './caixa.prisma';

@Controller('caixas')
export class CaixaController {
  constructor(private readonly repo: CaixaPrisma) { }

  @Get('getcaixaajust/:id')
  async getCaixasporId(@Param('id') id: string): Promise<CaixaAjuste | null> {
    const caixa = await this.repo.getCaixaById(+id);
    if (!caixa) {
      return null;
    }
    return caixa;
  }

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

  // Modificar itens da caixa
  @Post('/updatedbox')
  @HttpCode(HttpStatus.CREATED)
  async modificarQuantidadesDaCaixa(@Body() caixa: CaixaAjuste): Promise<CaixaAjuste | null> {
    try {
      return await this.repo.updateItensByBox(caixa);
    } catch (error) {
      throw new BadRequestException('Erro ao modificar os itens da caixa: ' + error.message);
    }
  }

}
