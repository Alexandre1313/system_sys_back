import { convertSPTime, GradeOpenBySchool, GradesRomaneio, ProjectItems, Projeto, ProjetosSimp, ProjetoStockItems } from '@core/index';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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
        escolas: {
          include: {
            grades: {
              orderBy: {
                createdAt: 'desc', // Ordena pela data de criação da grade (as mais recentes primeiro)
              },
              take: 2, // Limita a 2 grades mais recentes              
            },
          },
        },
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
      // Buscar as 13 datas mais recentes de inserção de grades para o projeto
      const uniqueDates = await this.prisma.$queryRaw<
        { createdAt: Date }[] // Retorna o campo completo de createdAt
      >(
        Prisma.sql`
        SELECT DISTINCT ON (DATE("Grade"."createdAt")) "Grade"."createdAt"
        FROM "Grade"
        INNER JOIN "Escola" ON "Grade"."escolaId" = "Escola"."id"
        WHERE "Escola"."projetoId" = ${projectId}
        ORDER BY DATE("Grade"."createdAt") DESC, "Grade"."createdAt" DESC
        LIMIT 13
      `
      );

      // Retorna as 13 datas mais recentes como estão no banco de dados
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
          composicao: itemGrade.itemTamanho.item.composicao,
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
          numberJoin: grade.escola.numberJoin,
          telefoneCompany: grade.company.telefone?.map(tel => tel.telefone).join(', ') || "",  // Telefones da empresa
          emailCompany: grade.company.email || "",   // E-mail da empresa (agora no modelo Company)
          telefoneEscola: grade.escola.telefone?.map(tel => tel.telefone).join(', ') || "", // Telefones da escola
          create: convertSPTime(String(grade.createdAt)),
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

  // Função para buscar os itens e somar as entradas e saídas
  async getProjetoItensComEntradasSaidas(projetoId: number): Promise<ProjetoStockItems | null> {
    try {
      // Função para ordenar tamanhos
      const ordenarTamanhos = (tamanhos: string[]) => {
        const numTamanhos = tamanhos.filter(tamanho => /^[0-9]+$/.test(tamanho)); // Filtra tamanhos numéricos
        const letraTamanhos = tamanhos.filter(tamanho => !/^[0-9]+$/.test(tamanho)); // Filtra tamanhos com letras

        numTamanhos.sort((a, b) => parseInt(a) - parseInt(b)); // Ordena tamanhos numéricos
        letraTamanhos.sort((a, b) => {
          const ordem = ['P', 'M', 'G', 'GG', 'XG', 'EG', 'EX', 'EGG', 'EXG', 'XGG', 'G1', 'G2', 'G3', 'EG/LG'];
          return ordem.indexOf(a) - ordem.indexOf(b);
        });

        return [...numTamanhos, ...letraTamanhos];
      };

      // Buscando o projeto
      const projeto = await this.prisma.projeto.findUnique({
        where: { id: projetoId },
        include: {
          itens: {
            include: {
              tamanhos: {
                include: {
                  tamanho: true,
                  entryInput: {
                    select: {
                      quantidade: true,
                    },
                  },
                  outInput: {
                    select: {
                      quantidade: true,
                    },
                  },
                  estoque: true,
                },
              },
            },
          },
        },
      });

      // Se o projeto não for encontrado, retorna null
      if (!projeto) {
        return null;
      }

      // Mapeando os itens e tamanhos
      const itensComEntradasSaidas = projeto.itens.map((item) => {
        const tamanhosComSomas = item.tamanhos.map((itemTamanho) => {
          // Soma das entradas e saídas
          const somaEntradas = itemTamanho.entryInput.reduce((total, entry) => total + entry.quantidade, 0);
          const somaSaidas = itemTamanho.outInput.reduce((total, out) => total + out.quantidade, 0);

          // Estoque
          const estoque = itemTamanho.estoque ? itemTamanho.estoque.quantidade : 0;

          return {
            tamanho: itemTamanho.tamanho.nome,
            estoque,
            entradas: somaEntradas,
            saidas: somaSaidas,
          };
        });

        // Ordenando tamanhos por critérios específicos
        const tamanhosOrdenados = ordenarTamanhos(
          item.tamanhos.map((itemTamanho) => itemTamanho.tamanho.nome)
        );

        return {
          nome: item.nome,
          genero: item.genero,
          tamanhos: tamanhosOrdenados.map(tamanho => {
            const tamanhoData = tamanhosComSomas.find(t => t.tamanho === tamanho);
            return tamanhoData ? tamanhoData : {
              tamanho,
              entradas: 0,
              saidas: 0,
              estoque: 0,
            };
          }),
        };
      });

      return {
        projetoId: projeto.id,
        nome: projeto.nome,
        itens: itensComEntradasSaidas,
      };
    } catch (error) {
      // Captura e exibe o erro
      console.error('Erro ao buscar projeto e itens:', error);
      return null;
    }
  }

  async getOpenGradesBySchool(projetoId: number, dateStr: string): Promise<GradeOpenBySchool[] | null> {
    if (!projetoId || !dateStr) {
      console.error("Projeto ID ou data inválidos.");
      return null;
    }

    try {
      // Converte a string para um objeto Date
      const startOfDay = new Date(dateStr);
      startOfDay.setUTCHours(0, 0, 0, 0);

      const endOfDay = new Date(dateStr);
      endOfDay.setUTCHours(23, 59, 59, 999);

      const projeto = await this.prisma.projeto.findUnique({
        where: {
          id: projetoId,
        },
        include: {
          escolas: {
            include: {
              grades: {
                where: {
                  createdAt: {
                    gte: startOfDay,
                    lte: endOfDay,
                  },
                },
                include: {
                  escola: true, // Incluindo os dados da Escola
                  gradeCaixas: {
                    include: {
                      caixaItem: true, // Incluindo os itens das caixas
                    },
                  },
                  itensGrade: {
                    include: {
                      itemTamanho: {
                        include: {
                          item: true, // Incluindo detalhes do Item
                          tamanho: true, // Incluindo o Tamanho
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Verificar se o projeto existe
      if (!projeto) {
        return null;
      }

      // Função para ordenar tamanhos
      const ordenarTamanhos = (tamanhos: string[]): string[] => {
        const numTamanhos = tamanhos.filter(tamanho => /^[0-9]+$/.test(tamanho)); // Filtra tamanhos numéricos
        const letraTamanhos = tamanhos.filter(tamanho => !/^[0-9]+$/.test(tamanho)); // Filtra tamanhos com letras

        // Ordena tamanhos numéricos (convertendo para inteiro)
        numTamanhos.sort((a, b) => parseInt(a) - parseInt(b));

        // Ordena tamanhos com letras conforme a ordem desejada
        const ordem = ['P', 'M', 'G', 'GG', 'XG', 'EG', 'EX', 'EGG', 'EXG', 'XGG', 'G1', 'G2', 'G3', 'EG/LG'];
        letraTamanhos.sort((a, b) => ordem.indexOf(a) - ordem.indexOf(b));

        return [...numTamanhos, ...letraTamanhos];
      };

      // Processar as grades e caixas
      const result: GradeOpenBySchool[] = projeto.escolas.flatMap((escola) => {
        return escola.grades.map((grade) => {
          const itens = grade.itensGrade.map((itemGrade) => {
            const caixas = grade.gradeCaixas.flatMap((caixa) =>
              caixa.caixaItem.filter(
                (caixaItem) => caixaItem.itemTamanhoId === itemGrade.itemTamanho.id
              )
            );

            const quantidadeExpedida = caixas.reduce((sum, caixaItem) => sum + caixaItem.itemQty, 0);

            // Definir o status de expedição com os valores restritos
            const statusExpedicao: "Concluído" | "Pendente" | "Inicializado" = quantidadeExpedida == itemGrade.quantidade ?
              "Concluído" : quantidadeExpedida == 0 ? "Pendente" : "Inicializado";

            return {
              gradeId: grade.id,
              itemNome: `${itemGrade.itemTamanho.item.nome} / ${itemGrade.itemTamanho.item.genero}`,
              tamanho: itemGrade.itemTamanho.tamanho.nome,
              quantidadePrevista: itemGrade.quantidade,
              quantidadeExpedida,
              quantidadeRestante: itemGrade.quantidade - quantidadeExpedida,
              statusExpedicao,  // Garantir que este valor seja restrito a "Concluído" ou "Pendente" ou "Inicializado"
            };
          });

          // Ordenando os itens
          itens.sort((a, b) => {
            // Primeiro ordenar pelo nome do item (itemNome)
            if (a.itemNome < b.itemNome) return -1;
            if (a.itemNome > b.itemNome) return 1;

            // Se os nomes forem iguais, ordenar pelo tamanho usando a função ordenarTamanhos
            const tamanhos = [a.tamanho, b.tamanho];
            const tamanhosOrdenados = ordenarTamanhos(tamanhos);
            return tamanhosOrdenados.indexOf(a.tamanho) - tamanhosOrdenados.indexOf(b.tamanho);
          });

          return {
            projetoName: projeto.nome,
            escolaNome: `${grade.escola.nome} - ${grade.escola.numeroEscola}`,
            data: convertSPTime(String(grade.createdAt)),
            itens,
          };
        });
      });

      return result;

    } catch (error) {
      console.error('Erro ao obter os dados das grades:', error);
      throw new Error('Erro ao tentar obter as grades. Por favor, tente novamente.');
    }
  }

}
