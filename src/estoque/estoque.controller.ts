import { Body, Controller, Delete, Get, Param, Post, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { EstoquePrisma } from './estoque.prisma';
import { Estoque } from '@core/index';

@Controller('estoques')
export class EstoqueController {
  constructor(private readonly repo: EstoquePrisma) { }

  // Salvar ou criar um estoque
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async salvarEstoque(@Body() estoque: Omit<Estoque, 'createdAt' | 'updatedAt'>): Promise<Estoque> {
    try {
      return await this.repo.salvar(estoque);
    } catch (error) {
      throw new BadRequestException(error.message); // Retornando uma resposta adequada em caso de erro
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
    return this.repo.obterPorId(+id);
  }

  // Excluir um estoque específico pelo ID
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) // Indica que não há conteúdo após a exclusão
  async excluirEstoque(@Param('id') id: string): Promise<any> {
    try {
        return await this.repo.excluir(+id);
    } catch (error) {
        throw new BadRequestException(error.message); // Retornando uma resposta adequada em caso de erro
    }
  }
}
