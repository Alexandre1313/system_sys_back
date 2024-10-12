import { Module } from '@nestjs/common';
import { ItemTamanhoController } from './itemTamanho.controller';
import { DbModule } from '../db/db.module';
import { ItemTamanhoPrisma } from './itemTamanho.prisma';

@Module({
  imports: [DbModule],
  controllers: [ItemTamanhoController],
  providers: [ItemTamanhoPrisma],
})
export class ItemTamanhoModule {}
