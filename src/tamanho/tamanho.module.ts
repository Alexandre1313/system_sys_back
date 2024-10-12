import { Module } from '@nestjs/common';
import { TamanhoController } from './tamanho.controller';
import { DbModule } from '../db/db.module';
import { TamanhoPrisma } from './tamanho.prisma';

@Module({
  imports: [DbModule],
  controllers: [TamanhoController],
  providers: [TamanhoPrisma],
})
export class TamanhoModule {}
