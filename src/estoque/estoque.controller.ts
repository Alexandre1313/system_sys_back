import { Body, Controller, Delete, Get, Param, Post, HttpCode, HttpStatus, BadRequestException, NotFoundException } from '@nestjs/common';
import { EstoquePrisma } from './estoque.prisma';
import { Estoque } from '@core/index';

@Controller('estoques')
export class EstoqueController {
  constructor(private readonly repo: EstoquePrisma) {}

  // Salvar ou criar um estoque
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async salvarEstoque(@Body() estoque: Omit<Estoque, 'createdAt' | 'updatedAt'>): Promise<Estoque> {
    try {
      return await this.repo.salvar(estoque);
    } catch (error) {
      throw new BadRequestException('Erro ao salvar o estoque: ' + error.message);
    }
  }

  // Obter todos os estoques
  @Get()
  async obterEstoques(): Promise<Estoque[]> {
    return this.repo.obter();
  }

  // Obter um estoque específico pelo ID
  @Get(':id')
  async obterEstoque(@Param('id') id: string): Promise<Estoque> {
    const estoque = await this.repo.obterPorId(+id);
    if (!estoque) {
      throw new NotFoundException(`Estoque com ID ${id} não encontrado.`);
    }
    return estoque;
  }

  // Excluir um estoque específico pelo ID
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async excluirEstoque(@Param('id') id: string): Promise<void> {
    const estoque = await this.repo.obterPorId(+id);
    if (!estoque) {
      throw new NotFoundException(`Estoque com ID ${id} não encontrado.`);
    }
    try {
      await this.repo.excluir(+id);
    } catch (error) {
      throw new BadRequestException('Erro ao excluir o estoque: ' + error.message);
    }
  }
}
