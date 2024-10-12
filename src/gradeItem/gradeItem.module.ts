import { Module } from '@nestjs/common';
import { GradeItemController } from './gradeItem.controller';
import { DbModule } from '../db/db.module';
import { GradeItemPrisma } from './gradeItem.prisma';

@Module({
  imports: [DbModule],
  controllers: [GradeItemController],
  providers: [GradeItemPrisma],
})

export class GradeItemModule {}
