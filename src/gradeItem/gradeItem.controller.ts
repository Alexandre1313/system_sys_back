import { Body, Controller, Delete, Get, Param, Post, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { GradeItemPrisma } from './gradeItem.prisma';
import { GradeItem } from '@core/index';

@Controller('gradeitens')
export class GradeItemController {
  constructor(private readonly repo: GradeItemPrisma) { }

  // Salvar ou criar um gradeItem
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async salvarGradeItem(@Body() gradeItem: Omit<GradeItem, 'createdAt' | 'updatedAt'>): Promise<GradeItem> {
    try {
        return await this.repo.salvar(gradeItem);
    } catch (error) {
        throw new BadRequestException(error.message); // Retornando uma resposta adequada em caso de erro
    }
  }
   
  // Obter todas os gradeItems
  @Get()
  async obterGradeItems(): Promise<GradeItem[]> {
    return this.repo.obter();
  }

  // Obter ua gradeItem específica pelo ID
  @Get(':id')
  async obterGradeItem(@Param('id') id: string): Promise<GradeItem> {
    return this.repo.obterPorId(+id);
  }

  // Excluir uma gradeItem específica pelo ID 
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) // Indica que não há conteúdo após a exclusão
  async excluirGradeItem(@Param('id') id: string): Promise<any> {
    try {
        return await this.repo.excluir(+id);
    } catch (error) {
        throw new BadRequestException(error.message); // Retornando uma resposta adequada em caso de erro
    }
  }
}
