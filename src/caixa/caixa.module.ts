import { Module } from '@nestjs/common';
import { CaixaController } from './caixa.controller';
import { DbModule } from '../db/db.module';
import { CaixaPrisma } from './caixa.prisma';

@Module({
  imports: [DbModule],
  controllers: [CaixaController],
  providers: [CaixaPrisma],
})

export class CaixaModule {}
