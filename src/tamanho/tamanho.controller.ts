import { Body, Controller, Delete, Get, Param, Post, HttpCode, HttpStatus, BadRequestException, NotFoundException } from '@nestjs/common';
import { TamanhoPrisma } from './tamanho.prisma';
import { Tamanho } from '@core/index';

@Controller('tamanhos')
export class TamanhoController {
  constructor(private readonly repo: TamanhoPrisma) {}

  // Salvar ou criar um tamanho
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async salvarTamanho(@Body() tamanho: Omit<Tamanho, 'createdAt' | 'updatedAt'>): Promise<Tamanho> {
    try {
      return await this.repo.salvar(tamanho);
    } catch (error) {
      throw new BadRequestException('Erro ao salvar o tamanho: ' + error.message);
    }
  }

  // Obter todos os tamanhos
  @Get()
  async obterTamanhos(): Promise<Tamanho[]> {
    return this.repo.obter();
  }

  // Obter um tamanho específico pelo ID
  @Get(':id')
  async obterTamanho(@Param('id') id: string): Promise<Tamanho> {
    const tamanho = await this.repo.obterPorId(+id);
    if (!tamanho) {
      throw new NotFoundException(`Tamanho com ID ${id} não encontrado.`);
    }
    return tamanho;
  }

  // Excluir um tamanho específico pelo ID
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) // Indica que não há conteúdo após a exclusão
  async excluirTamanho(@Param('id') id: string): Promise<void> {
    const tamanho = await this.repo.obterPorId(+id);
    if (!tamanho) {
      throw new NotFoundException(`Tamanho com ID ${id} não encontrado.`);
    }
    try {
      await this.repo.excluir(+id);
    } catch (error) {
      throw new BadRequestException('Erro ao excluir o tamanho: ' + error.message);
    }
  }
}
