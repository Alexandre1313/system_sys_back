import { Body, Controller, Delete, Get, Param, Post, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { EscolaPrisma } from './escola.prisma';
import { Escola } from '@core/index';

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
        throw new BadRequestException(error.message); // Retornando uma resposta adequada em caso de erro
    }
  }
   
  // Obter todos as escolas
  @Get()
  async obterProjetos(): Promise<Escola[]> {
    return this.repo.obter();
  }

  // Obter uma escola específica pelo ID
  @Get(':id')
  async obterEscola(@Param('id') id: string): Promise<Escola> {
    return this.repo.obterPorId(+id);
  }

  // Excluir uma escola específica pelo ID
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) // Indica que não há conteúdo após a exclusão
  async excluirEscola(@Param('id') id: string): Promise<void> {
    await this.repo.excluir(+id);
  }
}
