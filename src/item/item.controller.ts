import { Body, Controller, Delete, Get, Param, Post, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { ItemPrisma } from './item.prisma';
import { Item } from '@core/index';

@Controller('itens')
export class ItemController {
  constructor(private readonly repo: ItemPrisma) { }

  // Salvar ou criar um Item
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async salvarItem(@Body() item: Omit<Item, 'createdAt' | 'updatedAt'>): Promise<Item> {
    try {
        return await this.repo.salvar(item);
    } catch (error) {
        throw new BadRequestException(error.message); // Retornando uma resposta adequada em caso de erro
    }
  }
   
  // Obter todas os itens
  @Get()
  async obterItens(): Promise<Item[]> {
    return this.repo.obter();
  }

  // Obter um item específico pelo ID
  @Get(':id')
  async obterItem(@Param('id') id: string): Promise<Item> {
    return this.repo.obterPorId(+id);
  }

  // Excluir um item específico pelo ID 
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) // Indica que não há conteúdo após a exclusão
  async excluirItem(@Param('id') id: string): Promise<any> {
    try {
        return await this.repo.excluir(+id);
    } catch (error) {
        throw new BadRequestException(error.message); // Retornando uma resposta adequada em caso de erro
    }
  }
}
