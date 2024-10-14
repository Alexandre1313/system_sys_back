import { Genero, PrismaClient } from '@prisma/client';
import utilities from '../core/utils/utilities';
import { DataInserction } from '@core/interfaces';
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

async function seed() {
    try {
        async function inserirDadosNoBanco(dados: DataInserction[]) {
            let barcodeCounter = 0; // Contador para gerar barcodes (de 000 a 999)

            // Recupera o último barcode do banco de dados, se houver
            const lastBarcode = await prisma.barcode.findFirst({
                orderBy: { codigo: 'desc' },
            });

            if (lastBarcode) {
                barcodeCounter = parseInt(lastBarcode.codigo, 10) + 1; // Continua a contagem a partir do último barcode
            }

            console.log('Iniciando a inserção de dados...'); // Mensagem de confirmação no início da inserção

            for (const dado of dados) {
                console.log('Inserindo dados:', dado); // Exibe os dados que estão sendo inseridos

                // 1. Criar ou conectar ao Projeto
                const projeto = await prisma.projeto.upsert({
                    where: { nome: dado.projeto },
                    update: {},
                    create: { nome: dado.projeto, descricao: 'Descrição do projeto' },
                });
                console.log('Projeto inserido/atualizado:', projeto);               

                const escola = await prisma.escola.upsert({
                    where: {
                        projetoId_nome: { projetoId: projeto.id, nome: dado.escola },
                    },
                    update: {},
                    create: { nome: dado.escola, projetoId: projeto.id },
                });
                console.log('Escola inserida/atualizada:', escola);              

                // 3. Criar ou conectar ao Item (com gênero)
                const item = await prisma.item.upsert({
                    where: {
                        nome_projetoId_genero: {
                            nome: dado.item,
                            projetoId: projeto.id,
                            genero: dado.genero as Genero,
                        },
                    },
                    update: {},
                    create: {
                        nome: dado.item,
                        genero: dado.genero as Genero,
                        projetoId: projeto.id,
                    },
                });
                console.log('Item inserido/atualizado:', item);               

                const grade = await prisma.grade.create({
                    data: {
                        escolaId: escola.id,
                        finalizada: false,
                    },
                });
                console.log('Grade criada:', grade);              

                // 4. Para cada par Tamanho/Quantidade na planilha
                for (const tamanhoQtd of dado.tamanhos) {
                    console.log('Inserindo tamanho e quantidade:', tamanhoQtd); // Log para cada tamanho e quantidade

                    // 4.1. Criar ou conectar ao Tamanho
                    const tamanho = await prisma.tamanho.upsert({
                        where: { nome: String(tamanhoQtd.tamanho) },
                        update: {},
                        create: { nome: String(tamanhoQtd.tamanho) },
                    });
                    console.log('Tamanho inserido/atualizado:', tamanho);                 

                    // 4.2. Verificar se o ItemTamanho já existe
                    let itemTamanho = await prisma.itemTamanho.findUnique({
                        where: { itemId_tamanhoId: { itemId: item.id, tamanhoId: tamanho.id } },
                    });

                    if (!itemTamanho) {
                        // 4.3. Criar o ItemTamanho (se não existir)
                        itemTamanho = await prisma.itemTamanho.create({
                            data: {
                                tamanhoId: tamanho.id,
                                itemId: item.id,
                            },
                        });

                        // 4.4. Gerar um Barcode (formato: 000 a 999) e associar ao ItemTamanho
                        const barcode = String(barcodeCounter).padStart(3, '0');
                        barcodeCounter = (barcodeCounter + 1) % 1000; // Incrementa e volta para 000 após 999

                        await prisma.barcode.create({
                            data: {
                                codigo: barcode,
                                itemTamanhoId: itemTamanho.id,
                            },
                        });
                        console.log('Barcode criado:', barcode);                      

                        // 4.5. Criar um registro de Estoque com quantidade 0
                        await prisma.estoque.create({
                            data: {
                                itemTamanhoId: itemTamanho.id,
                                quantidade: 0, // Estoque inicial zero
                            },
                        });
                    }

                    // 4.6. Sempre criar Grade e GradeItem, mesmo se o ItemTamanho já existir
                    await prisma.gradeItem.create({
                        data: {
                            gradeId: grade.id,
                            itemTamanhoId: itemTamanho.id,
                            quantidade: tamanhoQtd.quantidade,
                            quantidadeExpedida: 0
                        },
                    });
                    console.log('GradeItem criada:', {
                        gradeId: grade.id,
                        itemTamanhoId: itemTamanho.id,
                        quantidade: tamanhoQtd.quantidade,
                    });                    
                }
                console.clear(); // Limpa o console após criar o objeto
            }
            console.log('Inserção de dados concluída!'); // Mensagem final após concluir a inserção
        }

        const dados = utilities();

        const confirmation = await askQuestion('Você deseja iniciar a inserção de dados no BD? (Y/N) ');

        if (confirmation !== 'Y') {
            console.clear();
            console.log('Inserção abortada pelo usuário.');
            return; // Sai da função se o usuário não quiser continuar
        }

        console.clear(); // Limpa o console após processar a planilha

        // Chama a função para inserir dados no banco
        await inserirDadosNoBanco(dados);

    } catch (error) {
        console.error('Erro ao executar o seed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seed();
