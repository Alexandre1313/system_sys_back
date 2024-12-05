import { GradesRomaneio, ProjectItems, Projeto, ProjetosSimp } from '@core/index';
import { Injectable } from '@nestjs/common';
import { PrismaProvider } from 'src/db/prisma.provider';
import { Prisma } from '@prisma/client';

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
      orderBy: {
        nome: 'asc',
      },
    });
    return projetos;
  }

  async obter(): Promise<Projeto[]> {
    const projetos = await this.prisma.projeto.findMany();
    return projetos;
  }

  async obterAll(): Promise<Projeto[]> {
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
              genero: true, // Seleciona o campo de gênero             
              tamanhos: {
                select: {
                  id: true, // ID da relação ItemTamanho
                  item: {
                    select: {
                      nome: true, // Nome do item
                      composicao: true,
                    },
                  },
                  tamanho: {
                    select: {
                      nome: true, // Nome do tamanho
                    },
                  },
                  estoque: {
                    select: {
                      id: true,
                      quantidade: true, // Código de barras (opcional)
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
            genero: item.genero, // Inclui o gênero na transformação
            composicao: tamanho.item.composicao,
            tamanho: tamanho.tamanho.nome,
            estoqueId: tamanho.estoque.id,
            estoque: tamanho.estoque.quantidade,
            barcode: tamanho.barcode?.codigo || null,
          }))
        ),
      };

      // Ordenar os itens por nome do item, depois pelo gênero, e depois pelo nome do tamanho
      resultado.itensProject.sort((a, b) => {
        const itemCompare = a.nome.localeCompare(b.nome);
        if (itemCompare !== 0) return itemCompare;

        const generoCompare = a.genero.localeCompare(b.genero);
        if (generoCompare !== 0) return generoCompare;

        return a.tamanho.localeCompare(b.tamanho);
      });

      return resultado; // Retorna o objeto diretamente
    } catch (error) {
      throw new Error('Erro ao tentar obter itens do projeto. Por favor, tente novamente.');
    }
  }

  async getOptimizedUniqueGradeDatesByProject(projectId: number): Promise<Date[]> {
    if (!projectId) {
      console.error('ID do projeto é inválido.');
      return []; // Retorna um array vazio se o ID for inválido
    }

    try {
      // Obter a escola com mais grades do projeto
      const topEscola = await this.prisma.escola.findFirst({
        where: {
          projetoId: projectId,
        },
        orderBy: {
          grades: {
            _count: 'desc',
          },
        },
        select: {
          id: true,
        },
      });

      if (!topEscola) {
        console.warn(`Nenhuma escola encontrada para o projeto ${projectId}.`);
        return [];
      }

      // Buscar datas únicas ignorando horas, mas retornando o campo completo
      const uniqueDates = await this.prisma.$queryRaw<
        { createdAt: Date }[] // Retornando o campo original do banco
      >(
        Prisma.sql`
        SELECT DISTINCT ON (DATE("createdAt")) "createdAt"
        FROM "Grade"
        WHERE "escolaId" = ${topEscola.id}
        ORDER BY DATE("createdAt"), "createdAt"
      `
      );

      // Retorna as datas completas exatamente como estão no banco
      return uniqueDates.map((row) => row.createdAt);
    } catch (error) {
      console.error(`Erro ao buscar as datas únicas das grades para o projeto ${projectId}:`, error);
      return [];
    }
  }

  async getFormattedGradesByDateAndProject(projectId: number, dateStr: string): Promise<GradesRomaneio[]> {
    if (!projectId || !dateStr) {
      console.error("Projeto ID ou data inválidos.");
      return [];
    }
  
    try {
      // Converte a string para um objeto Date
      const startOfDay = new Date(dateStr);
      startOfDay.setUTCHours(0, 0, 0, 0);
  
      const endOfDay = new Date(dateStr);
      endOfDay.setUTCHours(23, 59, 59, 999);
  
      // Busca as grades
      const grades = await this.prisma.grade.findMany({
        where: {
          escola: {
            projetoId: projectId,
          },
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
          //finalizada: true || false,
        },
        include: {
          escola: {
            include: {
              address: true,
              telefone: true,  // Incluindo telefones da escola
              projeto: true,
            },
          },
          company: {
            include: {
              address: true,
              telefone: true,  // Incluindo telefones da empresa
              // O email está no próprio modelo 'Company'
            },
          },
          gradeCaixas: {
            include: {
              caixaItem: true,  // Incluindo itens de cada caixa
            },
          },
          itensGrade: {
            include: {
              itemTamanho: {
                include: {
                  item: true,
                  tamanho: true,
                },
              },
            },
          },
        },
      });
  
      // Formatação das grades
      const formattedGrades: GradesRomaneio[] = grades.map((grade) => {
        // Inclui nome do item em tamanhosEQuantidades
        const tamanhosEQuantidades = grade.itensGrade.map((itemGrade) => ({
          item: itemGrade.itemTamanho.item.nome, // Nome do item específico
          genero: itemGrade.itemTamanho.item.genero,
          tamanho: itemGrade.itemTamanho.tamanho.nome, // Nome do tamanho
          quantidade: itemGrade.quantidadeExpedida,   // Quantidade expedida
        }));

        tamanhosEQuantidades.sort((a, b) => {
          // Comparar 'item' primeiro
          if (a.item < b.item) return -1;
          if (a.item > b.item) return 1;
      
          // Se os 'items' forem iguais, comparar 'genero'
          if (a.genero < b.genero) return -1;
          if (a.genero > b.genero) return 1;
      
          return 0; // São iguais em ambos os critérios
      });
  
        // Adicionando o array de caixas (com seus itens)
        const caixas = grade.gradeCaixas;  
        return {
          id: grade.id,
          isPrint: grade.finalizada,
          company: grade.company.nome,
          cnpjCompany: grade.company.cnpj,
          projectname: grade.escola.projeto?.nome || "",
          escola: grade.escola.nome,
          tipo: grade.tipo,
          numeroEscola: grade.escola.numeroEscola || "",  // Número da escola
          telefoneCompany: grade.company.telefone?.map(tel => tel.telefone).join(', ') || "",  // Telefones da empresa
          emailCompany: grade.company.email || "",   // E-mail da empresa (agora no modelo Company)
          telefoneEscola: grade.escola.telefone?.map(tel => tel.telefone).join(', ') || "", // Telefones da escola
          create:grade.createdAt,
          enderecoschool: {
            rua: grade.escola.address[0]?.street || "",
            numero: grade.escola.address[0]?.number || "",
            complemento: grade.escola.address[0]?.complement || "",
            bairro: grade.escola.address[0]?.neighborhood || "",
            cidade: grade.escola.address[0]?.city || "",
            estado: grade.escola.address[0]?.state || "",
            postalCode: grade.escola.address[0]?.postalCode || "",
            country: grade.escola.address[0]?.country || "",
          },
          tamanhosQuantidades: tamanhosEQuantidades, // Informações de tamanhos e quantidades
          caixas: caixas,  // Array com as caixas e seus itens
          enderecocompany: {
            rua: grade.company.address[0]?.street || "",
            numero: grade.company.address[0]?.number || "",
            complemento: grade.company.address[0]?.complement || "",
            bairro: grade.company.address[0]?.neighborhood || "",
            cidade: grade.company.address[0]?.city || "",
            estado: grade.company.address[0]?.state || "",
            postalCode: grade.company.address[0]?.postalCode || "",
            country: grade.company.address[0]?.country || "",
          },
        };
      });

      formattedGrades.sort((a, b) => {
        const numeroA = parseInt(a.numeroEscola, 10) || 0; // Converte para número ou usa 0 como fallback
        const numeroB = parseInt(b.numeroEscola, 10) || 0;
        return numeroA - numeroB; // Ordem crescente
      });
  
      return formattedGrades;
    } catch (error) {
      console.error(
        `Erro ao buscar grades para o projeto ${projectId} na data ${dateStr}:`,
        error
      );
      return [];
    }
  }

}
