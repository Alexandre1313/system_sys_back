import { Body, Controller, Delete, Get, Param, Post, HttpCode, HttpStatus, BadRequestException, NotFoundException } from '@nestjs/common';
import { EscolaPrisma } from './escola.prisma';
import { Escola } from '@core/index';

@Controller('escolas')
export class EscolaController {
  constructor(private readonly repo: EscolaPrisma) {}

  // Salvar ou criar uma escola
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async salvarEscola(@Body() escola: Omit<Escola, 'createdAt' | 'updatedAt'>): Promise<Escola> {
    try {
      return await this.repo.salvar(escola);
    } catch (error) {
      throw new BadRequestException('Erro ao salvar a escola: ' + error.message);
    }
  }

  // Obter todas as escolas
  @Get()
  async obterEscolas(): Promise<Escola[]> {
    return this.repo.obter();
  }

  // Obter uma escola específica pelo ID
  @Get(':id')
  async obterEscola(@Param('id') id: string): Promise<Escola> {
    const escola = await this.repo.obterPorId(+id);
    if (!escola) {
      throw new NotFoundException(`Escola com ID ${id} não encontrada.`);
    }
    return escola;
  }

  // Obter uma escola específica pelo ID (completa)
  @Get('full/:id')
  async obterEscolaCompleta(@Param('id') id: string): Promise<Escola> {
    const escola = await this.repo.encontrarEscolaPorIdCompleta(+id);
    if (!escola) {
      throw new NotFoundException(`Escola completa com ID ${id} não encontrada.`);
    }
    return escola;
  }

  // Excluir uma escola específica pelo ID
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async excluirEscola(@Param('id') id: string): Promise<void> {
    const escola = await this.repo.obterPorId(+id);
    if (!escola) {
      throw new NotFoundException(`Escola com ID ${id} não encontrada.`);
    }
    try {
      await this.repo.excluir(+id);
    } catch (error) {
      throw new BadRequestException('Erro ao excluir a escola: ' + error.message);
    }
  }
}
