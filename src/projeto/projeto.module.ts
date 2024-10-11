import { Module } from '@nestjs/common';
import { ProjetoController } from './projeto.controller';
import { DbModule } from '../db/db.module';
import { ProjetoPrisma } from './projeto.prisma';

@Module({
  imports: [DbModule],
  controllers: [ProjetoController],
  providers: [ProjetoPrisma],
})
export class ProjetoModule {}
