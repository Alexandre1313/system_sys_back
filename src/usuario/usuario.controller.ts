import { Body, Controller, Delete, Get, Param, Post, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { UsuarioPrisma } from './usuario.prisma';
import { Usuarios } from '@core/index';

@Controller('usuarios')
export class UsuarioController {
  constructor(private readonly repo: UsuarioPrisma) { }

  // Salvar ou criar um usuário
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async salvarUsuario(@Body() usuario: Omit<Usuarios, 'createdAt' | 'updatedAt'>): Promise<Usuarios> {
    try {
      return await this.repo.salvar(usuario);
    } catch (error) {
      throw new BadRequestException(error.message); // Retornando uma resposta adequada em caso de erro
    }
  }

  // Obter todos os usuários
  @Get()
  async obterItenstamanho(): Promise<Usuarios[]> {
    return this.repo.obter();
  }

  // Obter um usuário específico pelo ID
  @Get(':id')
  async obterUsuario(@Param('id') id: string): Promise<Usuarios> {
    return this.repo.obterPorId(+id);
  }

  // Excluir um usuario específico pelo ID
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) // Indica que não há conteúdo após a exclusão
  async excluirUsuario(@Param('id') id: string): Promise<any> {
    try {
        return await this.repo.excluir(+id);
    } catch (error) {
        throw new BadRequestException(error.message); // Retornando uma resposta adequada em caso de erro
    }
  }
}
