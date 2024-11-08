import { Module } from '@nestjs/common';
import { EmbalagemController } from './embalagem.controller';
import { DbModule } from '../db/db.module';
import { EmbalagemPrisma } from './embalagem.prisma';

@Module({
  imports: [DbModule],
  controllers: [EmbalagemController],
  providers: [EmbalagemPrisma],
})

export class EmbalagemModule {}
