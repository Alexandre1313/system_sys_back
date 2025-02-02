import { Escola, EscolaGradesItems } from '@core/index';
import { BadRequestException, Body, Controller, Delete, Get, HttpCode, HttpStatus, NotFoundException, Param, Post } from '@nestjs/common';
import { EscolaPrisma } from './escola.prisma';

@Controller('escolas')
export class EscolaController {
  constructor(private readonly repo: EscolaPrisma) { }

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

  // Obter grade itemns de uma escola específica
  @Get('escolagrades/:id')
  async obterEscolaGrade(@Param('id') id: string): Promise<any> {    
    const escolagrade = await this.repo.getGradesWithItemsAndStock(+id);
    if (!escolagrade) {
      throw new NotFoundException(`Escola grade com ID ${id} não encontrada.`)
    }
    return escolagrade;
  }

  // Obter grade itemns de uma escola específica
  @Get('escolagradesByItems/:id')
  async obterEscolaGradeByItemsAndGrades(@Param('id') id: string): Promise<EscolaGradesItems | null> {  
    const escolagradeItems = await this.repo.buscarDadosEscolaByItemsAndGrades(+id);
    if (!escolagradeItems) {
      throw new NotFoundException(`Escola grade e items com ID ${id} não encontrada.`)
    }
    console.log(escolagradeItems)
    return escolagradeItems || null;
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
