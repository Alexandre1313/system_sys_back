import { Body, Controller, Delete, Get, Param, Post, HttpCode, HttpStatus, BadRequestException, NotFoundException } from '@nestjs/common';
import { UsuarioPrisma } from './usuario.prisma';
import { Usuarios } from '@core/index';

@Controller('usuarios')
export class UsuarioController {
  constructor(private readonly repo: UsuarioPrisma) {}

  // Salvar ou criar um usuário
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async salvarUsuario(@Body() usuario: Omit<Usuarios, 'createdAt' | 'updatedAt'>): Promise<Usuarios> {
    try {
      return await this.repo.salvar(usuario);
    } catch (error) {
      throw new BadRequestException('Erro ao salvar o usuário: ' + error.message);
    }
  }

  // Obter todos os usuários
  @Get()
  async obterUsuarios(): Promise<Usuarios[]> {
    return this.repo.obter();
  }

  // Obter um usuário específico pelo ID
  @Get(':id')
  async obterUsuario(@Param('id') id: string): Promise<Usuarios> {
    const usuario = await this.repo.obterPorId(+id);
    if (!usuario) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado.`);
    }
    return usuario;
  }

  // Excluir um usuário específico pelo ID
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) // Indica que não há conteúdo após a exclusão
  async excluirUsuario(@Param('id') id: string): Promise<void> {
    const usuario = await this.repo.obterPorId(+id);
    if (!usuario) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado.`);
    }
    try {
      await this.repo.excluir(+id);
    } catch (error) {
      throw new BadRequestException('Erro ao excluir o usuário: ' + error.message);
    }
  }
}
