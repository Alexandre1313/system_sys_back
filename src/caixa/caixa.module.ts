import { Module } from '@nestjs/common';
import { CaixaController } from './Caixa.controller';
import { DbModule } from '../db/db.module';
import { CaixaPrisma } from './Caixa.prisma';

@Module({
  imports: [DbModule],
  controllers: [CaixaController],
  providers: [CaixaPrisma],
})

export class CaixaModule {}
