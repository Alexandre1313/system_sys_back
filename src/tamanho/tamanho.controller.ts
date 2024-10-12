import { Body, Controller, Delete, Get, Param, Post, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { TamanhoPrisma } from './tamanho.prisma';
import { Tamanho } from '@core/index';

@Controller('tamanhos')
export class TamanhoController {
  constructor(private readonly repo: TamanhoPrisma) { }

  // Salvar ou criar um tamanho
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async salvarTamanho(@Body() tamanho: Omit<Tamanho, 'createdAt' | 'updatedAt'>): Promise<Tamanho> {
    try {
        return await this.repo.salvar(tamanho);
    } catch (error) {
        throw new BadRequestException(error.message); // Retornando uma resposta adequada em caso de erro
    }
  }
   
  // Obter todos os tamanhos
  @Get()
  async obterTamanhos(): Promise<Tamanho[]> {
    return this.repo.obter();
  }

  // Obter um tamanho específica pelo ID
  @Get(':id')
  async obterTamanho(@Param('id') id: string): Promise<Tamanho> {
    return this.repo.obterPorId(+id);
  }

  // Excluir um tamanho específico pelo ID
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) // Indica que não há conteúdo após a exclusão
  async excluirTamanho(@Param('id') id: string): Promise<any> {
    try {
        return await this.repo.excluir(+id);
    } catch (error) {
        throw new BadRequestException(error.message); // Retornando uma resposta adequada em caso de erro
    }
  }
}
