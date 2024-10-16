import { Body, Controller, Delete, Get, Param, Post, HttpCode, HttpStatus, BadRequestException, NotFoundException } from '@nestjs/common';
import { ItemTamanhoPrisma } from './itemTamanho.prisma';
import { ItemTamanho } from '@core/index';

@Controller('itenstamanho') // Corrigido para "itens-tamanho" para seguir boas práticas de nomenclatura
export class ItemTamanhoController {
  constructor(private readonly repo: ItemTamanhoPrisma) {}

  // Salvar ou criar um itemTamanho
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async salvarItemTamanho(@Body() itemTamanho: Omit<ItemTamanho, 'createdAt' | 'updatedAt'>): Promise<ItemTamanho> {
    try {
      return await this.repo.salvar(itemTamanho);
    } catch (error) {
      throw new BadRequestException('Erro ao salvar o item tamanho: ' + error.message);
    }
  }

  // Obter todos os itensTamanho
  @Get()
  async obterItensTamanho(): Promise<ItemTamanho[]> {
    return this.repo.obter();
  }

  // Obter um itemTamanho específico pelo ID
  @Get(':id')
  async obterItemTamanho(@Param('id') id: string): Promise<ItemTamanho> {
    const itemTamanho = await this.repo.obterPorId(+id);
    if (!itemTamanho) {
      throw new NotFoundException(`Item Tamanho com ID ${id} não encontrado.`);
    }
    return itemTamanho;
  }

  // Excluir um itemTamanho específico pelo ID
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) // Indica que não há conteúdo após a exclusão
  async excluirItemTamanho(@Param('id') id: string): Promise<void> {
    const itemTamanho = await this.repo.obterPorId(+id);
    if (!itemTamanho) {
      throw new NotFoundException(`Item Tamanho com ID ${id} não encontrado.`);
    }
    try {
      await this.repo.excluir(+id);
    } catch (error) {
      throw new BadRequestException('Erro ao excluir o item tamanho: ' + error.message);
    }
  }
}
