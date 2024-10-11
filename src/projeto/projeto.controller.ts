import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ProjetoPrisma } from './projeto.prisma';
import { Projeto } from '@core/index';

@Controller('projetos')
export class ProjetoController {
  constructor(private readonly repo: ProjetoPrisma) {}

  @Post()
  salvarProjeto(@Body() projeto: Projeto): Promise<void> {
    return this.repo.salvar(projeto);
  }

  @Get()
  obterProjetos(): Promise<Projeto[]> {
    return this.repo.obter();
  }

  @Get(':id')
  obterProjeto(@Param('id') id: string): Promise<Projeto> {
    return this.repo.obterPorId(+id);
  }

  @Delete(':id')
  excluirProjeto(@Param('id') id: string): Promise<void> {
    return this.repo.excluir(+id);
  }
}
