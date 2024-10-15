import { Body, Controller, Delete, Get, Param, Post, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { ProjetoPrisma } from './projeto.prisma';
import { Projeto } from '@core/index';

@Controller('projetos')
export class ProjetoController {
  constructor(private readonly repo: ProjetoPrisma) { }

  // Salvar ou criar um projeto
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async salvarProjeto(@Body() projeto: Omit<Projeto, 'createdAt' | 'updatedAt'>): Promise<Projeto> {
    try {
      return await this.repo.salvar(projeto);
    } catch (error) {
      throw new BadRequestException(error.message); // Retornando uma resposta adequada em caso de erro
    }
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

  // Obter um projeto específico pelo ID
  @Get('projetocomescolas/:id')
  async obterProjetoComEscolas(@Param('id') id: string): Promise<Projeto> {
    return this.repo.obterPorIdEscolas(+id);
  }

  // Excluir um projeto específico pelo ID
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) // Indica que não há conteúdo após a exclusão
  async excluirProjeto(@Param('id') id: string): Promise<any> {
    try {
        return await this.repo.excluir(+id);
    } catch (error) {
        throw new BadRequestException(error.message); // Retornando uma resposta adequada em caso de erro
    }
  }
}
