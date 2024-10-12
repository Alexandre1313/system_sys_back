import { Module } from '@nestjs/common';
import { ItemController } from './item.controller';
import { DbModule } from '../db/db.module';
import { ItemPrisma } from './item.prisma';

@Module({
  imports: [DbModule],
  controllers: [ItemController],
  providers: [ItemPrisma],
})
export class ItemModule {}
