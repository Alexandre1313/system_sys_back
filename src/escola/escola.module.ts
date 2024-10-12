import { Module } from '@nestjs/common';
import { EscolaController } from './escola.controller';
import { DbModule } from '../db/db.module';
import { EscolaPrisma } from './escola.prisma';

@Module({
  imports: [DbModule],
  controllers: [EscolaController],
  providers: [EscolaPrisma],
})

export class EscolaModule {}
