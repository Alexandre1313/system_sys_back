import { ProjectItems, Projeto, ProjetosSimp } from '@core/index';
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

  async obterProjetosSimp(): Promise<ProjetosSimp[]> {
    const projetos: ProjetosSimp[] = await this.prisma.projeto.findMany({
      select: {
        id: true,
        nome: true,
      },
    });
    return projetos;
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

  async getItemsProjects(id: number): Promise<ProjectItems> {
    try {
      const projeto = await this.prisma.projeto.findUnique({
        where: { id },
        select: {
          id: true,
          nome: true,
          itens: {
            select: {
              tamanhos: {
                select: {
                  id: true, // ID da relação ItemTamanho
                  item: {
                    select: {
                      nome: true, // Nome do item
                    },
                  },
                  tamanho: {
                    select: {
                      nome: true, // Nome do tamanho
                    },
                  },
                  barcode: {
                    select: {
                      codigo: true, // Código de barras (opcional)
                    },
                  },
                },
              },
            },
          },
        },
      });      

      if (!projeto) return null; // Retorna null se o projeto não for encontrado

      // Transformação dos dados para a estrutura desejada
      const resultado = {
        id: projeto.id,
        nome: projeto.nome,
        itensProject: projeto.itens.flatMap((item) =>
          item.tamanhos.map((tamanho) => ({
            id: tamanho.id,  // ID da relação ItemTamanho
            nome: tamanho.item.nome,
            tamanho: tamanho.tamanho.nome,
            barcode: tamanho.barcode?.codigo || null,
          }))
        ),
      };

      // Ordenar os itens por nome do item e depois pelo nome do tamanho
      resultado.itensProject.sort((a, b) => {
        const itemCompare = a.nome.localeCompare(b.nome);
        return itemCompare !== 0 ? itemCompare : a.tamanho.localeCompare(b.tamanho);
      });

      return resultado; // Retorna o objeto diretamente
    } catch (error) {
      throw new Error('Erro ao tentar obter itens do projeto. Por favor, tente novamente.');
    }
  }

}
