import { Body, Controller, Delete, Get, Param, Post, HttpCode, HttpStatus, BadRequestException, NotFoundException } from '@nestjs/common';
import { GradePrisma } from './grade.prisma';
import { Grade } from '@core/index';

@Controller('grades')
export class GradeController {
  constructor(private readonly repo: GradePrisma) {}

  // Salvar ou criar uma grade
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async salvarGrade(@Body() grade: Omit<Grade, 'createdAt' | 'updatedAt'>): Promise<Grade> {
    try {
      return await this.repo.salvar(grade);
    } catch (error) {
      throw new BadRequestException('Erro ao salvar a grade: ' + error.message);
    }
  }

  // Obter todas as grades
  @Get()
  async obterGrades(): Promise<Grade[]> {
    return this.repo.obter();
  }

  // Obter uma grade específica pelo ID
  @Get(':id')
  async obterGrade(@Param('id') id: string): Promise<Grade> {
    const grade = await this.repo.obterPorId(+id);
    if (!grade) {
      throw new NotFoundException(`Grade com ID ${id} não encontrada.`);
    }
    return grade;
  }

  // Excluir uma grade específica pelo ID
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async excluirGrade(@Param('id') id: string): Promise<void> {
    const grade = await this.repo.obterPorId(+id);
    if (!grade) {
      throw new NotFoundException(`Grade com ID ${id} não encontrada.`);
    }
    try {
      await this.repo.excluir(+id);
    } catch (error) {
      throw new BadRequestException('Erro ao excluir a grade: ' + error.message);
    }
  }
}
