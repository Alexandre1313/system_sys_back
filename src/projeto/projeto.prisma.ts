import { Projeto } from '@core/index';
import { Injectable } from '@nestjs/common';
import { PrismaProvider } from 'src/db/prisma.provider';

@Injectable()
export class ProjetoPrisma {
  constructor(readonly prisma: PrismaProvider) { }

  async salvar(projeto: Projeto): Promise<Projeto> {
    const { id, escolas, itens, ...dadosDoProjeto } = projeto;

    const projetoSalvo = await this.prisma.projeto.upsert({
      where: {
        id: id !== undefined ? +id : -1,
      },
      update: {
        ...dadosDoProjeto,
        // Aqui você pode adicionar lógica específica para atualizar itens ou escolas se necessário
      },
      create: {
        ...dadosDoProjeto,
        // Aqui você pode adicionar lógica específica para criar itens ou escolas se necessário
      },
    });
    return projetoSalvo; // Retorne o projeto salvo
  }

  async obter(): Promise<Projeto[]> {
    const projetos = await this.prisma.projeto.findMany();
    return projetos;
  }

  async obterPorId(id: number): Promise<Projeto | null> {
    const projeto = await this.prisma.projeto.findUnique({ where: { id } });
    return (projeto as Projeto) ?? null;
  }

  async obterPorIdEscolas(id: number): Promise<Projeto> {
    return await this.prisma.projeto.findUnique({
      where: {
        id: id,
      },
      include: {
        escolas: true,
      },
    });
  }

  async excluir(id: number): Promise<void> {
    try {
      // Tente excluir o item com o ID fornecido
      await this.prisma.projeto.delete({ where: { id } });
    } catch (error) {
      // Aqui você pode capturar e tratar o erro
      console.error('Erro ao excluir o projeto:', error);

      // Lançar um erro apropriado ou lançar uma exceção
      if (error.code === 'P2025') {
        // Erro específico quando o registro não é encontrado
        throw new Error('O projeto não foi encontrado.');
      } else {
        // Lidar com outros erros genéricos
        throw new Error('Erro ao tentar excluir o projeto. Por favor, tente novamente.');
      }
    }
  }
}
