import { Genero, PrismaClient } from '@prisma/client';
import { ItemsInserction } from '@core/interfaces';
import * as readline from 'readline';
import insertItems from '../core/utils/insertItems';

const prisma = new PrismaClient();

// Função para perguntar ao usuário
const askQuestion = (question: string) => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => rl.question(question, (answer) => {
        rl.close();
        resolve(answer.toUpperCase()); // Converte a resposta para maiúsculas
    }));
};

async function seed3() {
    try {
        async function inserirDadosNoBanco(dados: ItemsInserction[]) {
            let barcodeCounter = 0; // Contador para gerar barcodes (de 000 a 999)

            // Recupera o último barcode do banco de dados, se houver
            const lastBarcode = await prisma.barcode.findFirst({
                orderBy: { codigo: 'desc' },
            });

            if (lastBarcode) {
                barcodeCounter = parseInt(lastBarcode.codigo, 10) + 1; // Continua a contagem a partir do último barcode
            }

            console.log('Iniciando a inserção de dados...');

            // Itera sobre cada dado da planilha
            for (const dado of dados) {
                console.log('Inserindo dados:', dado);

                // 1. Criar ou conectar ao Projeto
                const projeto = await prisma.projeto.upsert({
                    where: { nome: dado.projeto },
                    update: {},
                    create: { nome: dado.projeto, descricao: `UNIFORMES DE ${dado.projeto}` },
                });
                console.log('Projeto inserido/atualizado:', projeto);

                // 2. Criar ou conectar ao Item (com gênero)
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

                // 3. Para cada Tamanho
                for (const tamanho of dado.tamanhos) {
                    console.log('Inserindo tamanho:', tamanho); // Log para cada tamanho

                    // 3.1. Criar ou conectar ao Tamanho
                    const tamanhoObj = await prisma.tamanho.upsert({
                        where: { nome: String(tamanho) },
                        update: {},
                        create: { nome: String(tamanho) },
                    });
                    console.log('Tamanho inserido/atualizado:', tamanhoObj);

                    // 3.2. Verificar se o ItemTamanho já existe
                    let itemTamanho = await prisma.itemTamanho.findUnique({
                        where: { itemId_tamanhoId: { itemId: item.id, tamanhoId: tamanhoObj.id } },
                    });

                    if (!itemTamanho) {
                        // 3.3. Criar o ItemTamanho (se não existir)
                        itemTamanho = await prisma.itemTamanho.create({
                            data: {
                                tamanhoId: tamanhoObj.id,
                                itemId: item.id,
                            },
                        });

                        // Gerar um Barcode (formato: 00000 a 99999) e associar ao ItemTamanho
                        const barcode = String(barcodeCounter).padStart(5, '0');  // Gera um barcode com 5 dígitos
                        barcodeCounter = (barcodeCounter + 1) % 100000;  // Incrementa e volta para 00000 após 99999

                        await prisma.barcode.create({
                            data: {
                                codigo: barcode,
                                itemTamanhoId: itemTamanho.id,
                            },
                        });
                        console.log('Barcode criado:', barcode);

                        // 3.4. Criar um registro de Estoque com quantidade 0
                        await prisma.estoque.create({
                            data: {
                                itemTamanhoId: itemTamanho.id,
                                quantidade: 0, // Estoque inicial zero
                            },
                        });
                    }

                    console.log('Inserção de estoque e barcode concluída para o item e tamanho:', itemTamanho);
                }

                console.clear(); // Limpa o console após processar os dados
            }

            console.log('Inserção de dados concluída!');
        }

        // Obter dados da planilha
        const dados = insertItems();

        // Perguntar ao usuário se deseja continuar
        const confirmation = await askQuestion('Você deseja iniciar a inserção de itens no BD? (Y/N) ');

        if (confirmation !== 'Y') {
            console.clear();
            console.log('Inserção abortada pelo usuário.');
            return; // Sai da função se o usuário não quiser continuar
        }

        console.clear(); // Limpa o console após a confirmação do usuário

        // Chama a função para inserir os dados no banco
        await inserirDadosNoBanco(dados);

    } catch (error) {
        console.error('Erro ao executar o seed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seed3();
