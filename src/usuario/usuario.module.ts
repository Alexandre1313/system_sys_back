import { Module } from '@nestjs/common';
import { UsuarioController } from './usuario.controller';
import { DbModule } from '../db/db.module';
import { UsuarioPrisma } from './usuario.prisma';

@Module({
  imports: [DbModule],
  controllers: [UsuarioController],
  providers: [UsuarioPrisma],
})
export class UsuarioModule {}
