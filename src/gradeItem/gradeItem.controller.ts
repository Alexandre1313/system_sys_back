import { Body, Controller, Delete, Get, Param, Post, HttpCode, HttpStatus, BadRequestException, NotFoundException } from '@nestjs/common';
import { GradeItemPrisma } from './gradeItem.prisma';
import { GradeItem } from '@core/index';

@Controller('gradeitens')
export class GradeItemController {
  constructor(private readonly repo: GradeItemPrisma) {}

  // Salvar ou criar um item de grade
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async salvarGradeItem(@Body() gradeItem: Omit<GradeItem, 'createdAt' | 'updatedAt'>): Promise<GradeItem> {
    try {
      return await this.repo.salvar(gradeItem);
    } catch (error) {
      throw new BadRequestException('Erro ao salvar o item de grade: ' + error.message);
    }
  }

  // Obter todos os itens de grade
  @Get()
  async obterGradeItems(): Promise<GradeItem[]> {
    return this.repo.obter();
  }

  // Obter um item de grade específico pelo ID
  @Get(':id')
  async obterGradeItem(@Param('id') id: string): Promise<GradeItem> {
    const gradeItem = await this.repo.obterPorId(+id);
    if (!gradeItem) {
      throw new NotFoundException(`Item de grade com ID ${id} não encontrado.`);
    }
    return gradeItem;
  }

  // Excluir um item de grade específico pelo ID
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async excluirGradeItem(@Param('id') id: string): Promise<void> {
    const gradeItem = await this.repo.obterPorId(+id);
    if (!gradeItem) {
      throw new NotFoundException(`Item de grade com ID ${id} não encontrado.`);
    }
    try {
      await this.repo.excluir(+id);
    } catch (error) {
      throw new BadRequestException('Erro ao excluir o item de grade: ' + error.message);
    }
  }
}
