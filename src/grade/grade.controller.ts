import { Body, Controller, Delete, Get, Param, Post, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { GradePrisma } from './grade.prisma';
import { Grade } from '@core/index';

@Controller('grades')
export class GradeController {
  constructor(private readonly repo: GradePrisma) { }

  // Salvar ou criar um grade
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async salvarGrade(@Body() grade: Omit<Grade, 'createdAt' | 'updatedAt'>): Promise<Grade> {
    try {
        return await this.repo.salvar(grade);
    } catch (error) {
        throw new BadRequestException(error.message); // Retornando uma resposta adequada em caso de erro
    }
  }
   
  // Obter todas os grades
  @Get()
  async obterGrades(): Promise<Grade[]> {
    return this.repo.obter();
  }

  // Obter ua grade específica pelo ID
  @Get(':id')
  async obterGrade(@Param('id') id: string): Promise<Grade> {
    return this.repo.obterPorId(+id);
  }

  // Excluir uma grade específica pelo ID 
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) // Indica que não há conteúdo após a exclusão
  async excluirGrade(@Param('id') id: string): Promise<any> {
    try {
        return await this.repo.excluir(+id);
    } catch (error) {
        throw new BadRequestException(error.message); // Retornando uma resposta adequada em caso de erro
    }
  }
}
