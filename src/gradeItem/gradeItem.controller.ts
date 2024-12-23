import { GradeItem } from '@core/index';
import { BadRequestException, Body, Controller, Delete, Get, HttpCode, HttpStatus, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { GradeItemPrisma } from './gradeItem.prisma';

@Controller('gradeitens')
export class GradeItemController {
  constructor(private readonly repo: GradeItemPrisma) { }

  // Modificar um item de grade
  @Patch('alterarquantidade')
  @HttpCode(HttpStatus.OK)
  async salvarGradeItemModify(@Body() data: { id: number, quantidadeExpedida: number }): Promise<GradeItem | null> {
    try {
      // Verifica se os dados necessários estão presentes
      if (!data.id || data.quantidadeExpedida === undefined) {
        throw new BadRequestException('ID ou quantidade expedida não fornecidos');
      }

      // Chama a função de atualização
      const gradeItemAtualizado = await this.repo.updateItem(data);

      if (!gradeItemAtualizado) {
        throw new BadRequestException('Item de grade não encontrado ou não pode ser atualizado');
      }

      return gradeItemAtualizado; // Retorna o item de grade atualizado
    } catch (error) {
      throw new BadRequestException('Erro ao atualizar o item de grade: ' + error.message);
    }
  }

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
  @HttpCode(HttpStatus.OK)
  async excluirGradeItem(@Param('id') id: string): Promise<GradeItem | null> {
    const gradeItem = await this.repo.obterPorId(+id);
    if (!gradeItem) {
      throw new NotFoundException(`Item de grade com ID ${id} não encontrado.`);
    }
    try {
      await this.repo.excluir(gradeItem.id);
      return gradeItem
    } catch (error) {
      throw new BadRequestException('Erro ao excluir o item de grade: ' + error.message);
    }
  }
}
