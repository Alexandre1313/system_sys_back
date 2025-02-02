import { Genero, PrismaClient } from '@prisma/client';
import utilities2 from '../core/utils/utilities2';
import { DataInserctionUni } from '@core/interfaces';
import * as readline from 'readline';

const prisma = new PrismaClient();

// Função para perguntar ao usuário
const askQuestion = (question) => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => rl.question(question, (answer) => {
        rl.close();
        resolve(answer.toUpperCase()); // Converte a resposta para maiúsculas
    }));
};

async function seed2() {
    try {
        async function inserirDadosNoBanco(dados: DataInserctionUni[]) {
            let barcodeCounter = 0;

            const lastBarcode = await prisma.barcode.findFirst({
                orderBy: { codigo: 'desc' },
            });

            if (lastBarcode) {
                barcodeCounter = parseInt(lastBarcode.codigo, 10) + 1;
            }

            console.log('Iniciando a inserção de dados...');

            for (const dado of dados) {
                console.log(`\nVerificando ou criando projeto: ${dado.projeto}`);
                const projeto = await prisma.projeto.upsert({
                    where: { nome: dado.projeto },
                    update: {},
                    create: { nome: dado.projeto, descricao: `UNIFORMES DE ${dado.projeto}` },
                });
                console.log(`Projeto ${projeto.nome} (ID: ${projeto.id}) processado.`);

                for (const escolaData of dado.escolas) {
                    console.log(`\nVerificando ou criando escola: ${escolaData.nome}`);
                    const escola = await prisma.escola.upsert({
                        where: {
                            projetoId_nome: { projetoId: projeto.id, nome: escolaData.nome },
                        },
                        update: { numberJoin: escolaData.numberJoin, },
                        create: {
                            numeroEscola: escolaData.numeroEscola,
                            nome: escolaData.nome,
                            numberJoin: escolaData.numberJoin,
                            projetoId: projeto.id,
                        },
                    });
                    console.log(`Escola ${escola.nome} (ID: ${escola.id}) processada.`);

                    console.log(`\nCriando grade para a escola ${escola.nome}`);
                    const grade = await prisma.grade.create({
                        data: {
                            escolaId: escola.id,
                            finalizada: false,
                            companyId: 2,
                            createdAt: "2025-01-28T19:39:00.739Z", 
                            updatedAt: "2025-01-28T19:39:00.739Z" 
                        },
                    });
                    console.log(`Grade (ID: ${grade.id}) criada.`);

                    for (const itemData of escolaData.itens) {
                        console.log(`\nVerificando ou criando item: ${itemData.nome}`);
                        const item = await prisma.item.upsert({
                            where: {
                                nome_projetoId_genero: {
                                    nome: itemData.nome,
                                    projetoId: projeto.id,
                                    genero: itemData.genero as Genero,
                                },
                            },
                            update: {},
                            create: {
                                nome: itemData.nome,
                                genero: itemData.genero as Genero,
                                projetoId: projeto.id,
                            },
                        });
                        console.log(`Item ${item.nome} (ID: ${item.id}) processado.`);

                        for (const tamanhoQtd of itemData.tamanhos) {
                            console.log(`\nVerificando ou criando tamanho: ${tamanhoQtd.tamanho}`);
                            const tamanho = await prisma.tamanho.upsert({
                                where: { nome: String(tamanhoQtd.tamanho) },
                                update: {},
                                create: { nome: String(tamanhoQtd.tamanho) },
                            });
                            console.log(`Tamanho ${tamanho.nome} (ID: ${tamanho.id}) processado.`);

                            console.log(`\nVerificando ou criando itemTamanho para item ${item.nome} e tamanho ${tamanho.nome}`);
                            let itemTamanho = await prisma.itemTamanho.findUnique({
                                where: { itemId_tamanhoId: { itemId: item.id, tamanhoId: tamanho.id } },
                            });

                            if (!itemTamanho) {
                                itemTamanho = await prisma.itemTamanho.create({
                                    data: {
                                        itemId: item.id,
                                        tamanhoId: tamanho.id,
                                    },
                                });
                                console.log(`ItemTamanho criado com ID: ${itemTamanho.id}`);

                                const barcode = String(barcodeCounter).padStart(5, '0');
                                barcodeCounter = (barcodeCounter + 1) % 100000;

                                await prisma.barcode.create({
                                    data: {
                                        codigo: barcode,
                                        itemTamanhoId: itemTamanho.id,
                                    },
                                });
                                console.log(`Barcode ${barcode} criado para ItemTamanho ID: ${itemTamanho.id}`);

                                await prisma.estoque.create({
                                    data: {
                                        itemTamanhoId: itemTamanho.id,
                                        quantidade: 0,
                                    },
                                });
                                console.log(`Estoque criado para ItemTamanho ID: ${itemTamanho.id}`);
                            } else {
                                console.log(`ItemTamanho já existe com ID: ${itemTamanho.id}`);
                            }

                            console.log(`\nCriando GradeItem para Grade ID: ${grade.id} e ItemTamanho ID: ${itemTamanho.id}`);
                            await prisma.gradeItem.create({
                                data: {
                                    gradeId: grade.id,
                                    itemTamanhoId: itemTamanho.id,
                                    quantidade: tamanhoQtd.quantidade,
                                    quantidadeExpedida: 0,
                                },
                            });
                            console.log(`GradeItem criado para Grade ID: ${grade.id}`);
                        }
                    }
                    console.clear();
                }
            }
            console.log('Inserção de dados concluída!');
        }

        const dados = utilities2();
        const confirmation = await askQuestion('Você deseja iniciar a inserção de grades poli no BD? (Y/N) ');

        if (confirmation !== 'Y') {
            console.clear();
            console.log('Inserção abortada pelo usuário.');
            return; // Sai da função se o usuário não quiser continuar
        }

        await inserirDadosNoBanco(dados);
    } catch (error) {
        console.error('Erro ao executar o seed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seed2();
