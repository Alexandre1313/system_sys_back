import { Escola } from '@core/index';
import { Injectable } from '@nestjs/common';
import { PrismaProvider } from 'src/db/prisma.provider';

@Injectable()
export class EscolaPrisma {
    constructor(readonly prisma: PrismaProvider) { }

    async salvar(escola: Escola): Promise<Escola> {
        const { id, projeto, grades, ...dadosDaEscola } = escola;

        // Verifica se já existe uma escola com o mesmo nome para o mesmo projeto
        const escolaExistente = await this.prisma.escola.findFirst({
            where: {
                nome: dadosDaEscola.nome,
                projetoId: dadosDaEscola.projetoId,
            },
        });

        // Se uma escola com o mesmo nome e projeto já existe e não é a atual, lance um erro
        if (escolaExistente && escolaExistente.id !== id) {
            throw new Error('Já existe uma escola com este nome associada a este projeto.');
        }

        // Realiza o upsert no banco de dados
        const escolaSalva = await this.prisma.escola.upsert({
            where: {
                id: id !== undefined ? +id : -1, // Usar -1 para id inexistente
            },
            update: {
                ...dadosDaEscola,
            },
            create: {
                ...dadosDaEscola,
            },
        });

        return escolaSalva; // Retorne a escola salva
    }

    async obter(): Promise<Escola[]> {
        const escolas = await this.prisma.escola.findMany();
        return escolas;
    }

    async obterPorId(id: number): Promise<Escola | null> {
        const escola = await this.prisma.escola.findUnique({
            where: { id },
            include: {
                projeto: true,
                grades: true,
            },
        });
        return (escola as Escola) ?? null;
    }

    async encontrarEscolaPorIdCompleta(id: number): Promise<Escola> {
        const escola = await this.prisma.escola.findUnique({
            where: { id },
            include: {
                projeto: true,
                grades: {
                    take: 6, // Limitar a 6 grades
                    orderBy: {
                        createdAt: 'desc', // Ordenar por data de criação, mais recentes primeiro
                    },
                    include: {
                        itensGrade: {
                            include: {
                                itemTamanho: {
                                    include: {
                                        item: true,
                                        tamanho: true,
                                        barcode: true,
                                        estoque: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!escola) {
            throw new Error('Escola não encontrada');
        }
        console.log(JSON.stringify(escola, null, 2));
        return escola as Escola;
    }

    async getGradesWithItemsAndStock(id: number) {
        const escolaComGrades = await this.prisma.escola.findUnique({
            where: { id },
            include: {
                projeto: true,
                grades: {
                    include: {
                        gradeCaixas: {
                            include: {
                                caixaItem: true,
                            }
                        },
                        itensGrade: {
                            include: {
                                itemTamanho: {
                                    include: {
                                        item: true, // Inclui os detalhes do item
                                        tamanho: true, // Inclui os detalhes do tamanho                         
                                        estoque: true, // Inclui o estoque associado a este item/tamanho
                                        barcode: true
                                    },
                                },
                            },
                            orderBy: {
                                itemTamanho: { // Primeiro ordena os itens pelo nome
                                    item: {
                                        nome: 'asc', // Ordena os itens pelo nome
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
    
        // Processar e ordenar os dados
        escolaComGrades.grades.forEach((grade) => {
            // Ordena os itensGrade
            grade.itensGrade = grade.itensGrade.sort((a, b) => {
                // Ordenar por item.nome e item.genero
                if (a.itemTamanho.item.nome !== b.itemTamanho.item.nome) {
                    return a.itemTamanho.item.nome.localeCompare(b.itemTamanho.item.nome);
                }
                if (a.itemTamanho.item.genero !== b.itemTamanho.item.genero) {
                    return a.itemTamanho.item.genero.localeCompare(b.itemTamanho.item.genero);
                }
    
                // Ordenar os tamanhos
                const sortTamanho = (tamanho: string): number => {
                    const numericRegex = /^\d+$/; // Verifica se é numérico
                    const sizeOrder = ['PP', 'P', 'M', 'G', 'GG', 'EG', 'EGG', 'XGG', 'EXG']; // Ordem para tamanhos literais
    
                    if (numericRegex.test(tamanho)) {
                        return parseInt(tamanho, 10); // Valores numéricos
                    } else if (sizeOrder.includes(tamanho)) {
                        return sizeOrder.indexOf(tamanho) + 1000; // Literais com peso fixo após numéricos
                    } else {
                        return tamanho.charCodeAt(0) + 2000; // Outros tamanhos
                    }
                };
    
                return sortTamanho(a.itemTamanho.tamanho.nome) - sortTamanho(b.itemTamanho.tamanho.nome);
            });
        });
    
        return escolaComGrades;
    }    

    async excluir(id: number): Promise<void> {
        try {
            // Tente excluir o item com o ID fornecido
            await this.prisma.escola.delete({ where: { id } });
        } catch (error) {
            // Aqui você pode capturar e tratar o erro
            console.error('Erro ao excluir a escola:', error);

            // Lançar um erro apropriado ou lançar uma exceção
            if (error.code === 'P2025') {
                // Erro específico quando o registro não é encontrado
                throw new Error('O escola não foi encontrada.');
            } else {
                // Lidar com outros erros genéricos
                throw new Error('Erro ao tentar excluir a escola. Por favor, tente novamente.');
            }
        }
    }
}
