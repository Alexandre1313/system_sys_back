import { Usuarios } from '@core/index';
import { Injectable } from '@nestjs/common';
import { PrismaProvider } from 'src/db/prisma.provider';

@Injectable()
export class UsuarioPrisma {
  constructor(readonly prisma: PrismaProvider) { }

  async salvar(usuario: Usuarios): Promise<Usuarios> {
    const { id, entryInput, caixa, outInput, ...dadosDoUsuario } = usuario;

    const usuarioSalvo = await this.prisma.usuarios.upsert({
      where: {
        id: id !== undefined ? +id : -1,
      },
      update: {
        ...dadosDoUsuario,
        // Aqui você pode adicionar lógica específica para atualizar usuários se necessário
      },
      create: {
        ...dadosDoUsuario,
        // Aqui você pode adicionar lógica específica para criar usuários se necessário
      },
    });
    return usuarioSalvo; // Retorne o usuário salvo
  }

  async obter(): Promise<Usuarios[]> {
    const usuarios = await this.prisma.usuarios.findMany();
    return usuarios;
  }

  async obterPorId(id: number): Promise<Usuarios | null> {
    const usuario = await this.prisma.usuarios.findUnique({ where: { id } });
    return (usuario as Usuarios) ?? null;
  }

  async excluir(id: number): Promise<void> {
    try {
      // Tente excluir o usuário com o ID fornecido
      await this.prisma.usuarios.delete({ where: { id } });
    } catch (error) {
      // Aqui você pode capturar e tratar o erro
      console.error('Erro ao excluir o usuário:', error);

      // Lançar um erro apropriado ou lançar uma exceção
      if (error.code === 'P2025') {
        // Erro específico quando o registro não é encontrado
        throw new Error('O usuário não foi encontrado.');
      } else {
        // Lidar com outros erros genéricos
        throw new Error('Erro ao tentar excluir o usuário. Por favor, tente novamente.');
      }
    }
  }
}
