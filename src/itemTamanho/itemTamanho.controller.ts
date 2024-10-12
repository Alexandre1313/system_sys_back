import { Body, Controller, Delete, Get, Param, Post, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { ItemTamanhoPrisma } from './itemTamanho.prisma';
import { ItemTamanho } from '@core/index';

@Controller('itenstamanho')
export class ItemTamanhoController {
  constructor(private readonly repo: ItemTamanhoPrisma) { }

  // Salvar ou criar um itemTamanho
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async salvarItemTamanho(@Body() itemTamanho: Omit<ItemTamanho, 'createdAt' | 'updatedAt'>): Promise<ItemTamanho> {
    try {
      return await this.repo.salvar(itemTamanho);
    } catch (error) {
      throw new BadRequestException(error.message); // Retornando uma resposta adequada em caso de erro
    }
  }

  // Obter todos os itensTamanho
  @Get()
  async obterItenstamanho(): Promise<ItemTamanho[]> {
    return this.repo.obter();
  }

  // Obter um itemTamanho específico pelo ID
  @Get(':id')
  async obterItemTamanho(@Param('id') id: string): Promise<ItemTamanho> {
    return this.repo.obterPorId(+id);
  }

  // Excluir um itemTamanho específico pelo ID
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) // Indica que não há conteúdo após a exclusão
  async excluirItemTamanho(@Param('id') id: string): Promise<any> {
    try {
        return await this.repo.excluir(+id);
    } catch (error) {
        throw new BadRequestException(error.message); // Retornando uma resposta adequada em caso de erro
    }
  }
}
