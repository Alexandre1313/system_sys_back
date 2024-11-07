import { Body, Controller, Delete, Get, Param, Post, HttpCode, HttpStatus, BadRequestException, NotFoundException } from '@nestjs/common';
import { ProjetoPrisma } from './projeto.prisma';
import { ProjectItems, Projeto, ProjetosSimp } from '@core/index';

@Controller('projetos')
export class ProjetoController {
  constructor(private readonly repo: ProjetoPrisma) {}

  // Salvar ou criar um projeto
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async salvarProjeto(@Body() projeto: Omit<Projeto, 'createdAt' | 'updatedAt'>): Promise<Projeto> {
    try {
      return await this.repo.salvar(projeto);
    } catch (error) {
      throw new BadRequestException('Erro ao salvar o projeto: ' + error.message);
    }
  }

  // Obter todos os projetos
 @Get()
  async obterProjetos(): Promise<Projeto[]> {
  return this.repo.obter();
  }

  @Get('projetossimp')
  async getProjectSimp(): Promise<ProjetosSimp[]> {   
    const projetosimp: ProjetosSimp[] = await this.repo.obterProjetosSimp();
    if (!projetosimp) {
      throw new NotFoundException(`Não foram encontrados projetos.`);
    }
    return projetosimp;
  }

  @Get('itens/:id')
  async getItems(@Param('id') id: string): Promise<ProjectItems> {   
    const projetoItems = await this.repo.getItemsProjects(+id);
    if (!projetoItems) {
      throw new NotFoundException(`Não foram encontrados itens para os projetos.`);
    }
    return projetoItems;
  }

  // Obter um projeto específico pelo ID
  @Get(':id')
  async obterProjeto(@Param('id') id: string): Promise<Projeto> {
    
    const projeto = await this.repo.obterPorId(+id);
    if (!projeto) {
      throw new NotFoundException(`Projeto com ID ${id} não encontrado.`);
    }
    return projeto;
  }

  // Obter um projeto específico pelo ID com escolas associadas
  @Get('comescolas/:id')
  async obterProjetoComEscolas(@Param('id') id: string): Promise<Projeto> {
    const projeto = await this.repo.obterPorIdEscolas(+id);
    if (!projeto) {
      throw new NotFoundException(`Projeto com ID ${id} e suas escolas não encontrado.`);
    }
    return projeto;
  }  

  // Excluir um projeto específico pelo ID
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) // Indica que não há conteúdo após a exclusão
  async excluirProjeto(@Param('id') id: string): Promise<void> {
    const projeto = await this.repo.obterPorId(+id);
    if (!projeto) {
      throw new NotFoundException(`Projeto com ID ${id} não encontrado.`);
    }
    try {
      await this.repo.excluir(+id);
    } catch (error) {
      throw new BadRequestException('Erro ao excluir o projeto: ' + error.message);
    }
  }
}
