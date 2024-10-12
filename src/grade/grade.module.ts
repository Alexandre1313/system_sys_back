import { Module } from '@nestjs/common';
import { GradeController } from './grade.controller';
import { DbModule } from '../db/db.module';
import { GradePrisma } from './grade.prisma';

@Module({
  imports: [DbModule],
  controllers: [GradeController],
  providers: [GradePrisma],
})

export class GradeModule {}
