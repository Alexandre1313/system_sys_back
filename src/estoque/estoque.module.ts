import { Module } from '@nestjs/common';
import { EstoqueController } from './estoque.controller';
import { DbModule } from '../db/db.module';
import { EstoquePrisma } from './estoque.prisma';

@Module({
  imports: [DbModule],
  controllers: [EstoqueController],
  providers: [EstoquePrisma],
})
export class EstoqueModule {}
