import { Body, Controller, Delete, Get, Param, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ProjetoPrisma } from './projeto.prisma';
import { Projeto } from '@core/index';

@Controller('projetos')
export class ProjetoController {
  constructor(private readonly repo: ProjetoPrisma) { }

  // Salvar ou criar um projeto
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async salvarProjeto(@Body() projeto: Omit<Projeto, 'createdAt' | 'updatedAt'>): Promise<Projeto> {
    return this.repo.salvar(projeto); // Chamando a função salvar
  }

  // Obter todos os projetos
  @Get()
  async obterProjetos(): Promise<Projeto[]> {
    return this.repo.obter();
  }

  // Obter um projeto específico pelo ID
  @Get(':id')
  async obterProjeto(@Param('id') id: string): Promise<Projeto> {
    return this.repo.obterPorId(+id);
  }

  // Excluir um projeto específico pelo ID
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) // Indica que não há conteúdo após a exclusão
  async excluirProjeto(@Param('id') id: string): Promise<void> {
    await this.repo.excluir(+id);
  }
}
