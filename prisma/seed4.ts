import { Genero, PrismaClient } from '@prisma/client';
import { ItemsInserction2 } from '@core/interfaces';
import * as readline from 'readline';
import insertItems2 from '../core/utils/InsertItens2';

const prisma = new PrismaClient();

// Função para perguntar ao usuário
const askQuestion = (question: string) => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise<string>((resolve) => rl.question(question, (answer) => {
        rl.close();
        resolve(answer.toUpperCase()); // Converte a resposta para maiúsculas
    }));
};

async function seed4() {
    try {
        async function inserirDadosNoBanco(dados: ItemsInserction2[]) {
            let barcodeCounter = 0; // Contador para gerar barcodes (de 00000 a 99999)

            // Recupera o último barcode do banco de dados, se houver
            const lastBarcode = await prisma.barcode.findFirst({
                orderBy: { codigo: 'desc' },
            });

            if (lastBarcode) {
                barcodeCounter = parseInt(lastBarcode.codigo, 10) + 1; // Continua a contagem a partir do último barcode
            }

            console.log('Iniciando a inserção de dados...');

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

                // 3. Para cada tamanho
                for (const tamanho of dado.tamanhos) {
                    console.log('Inserindo tamanho:', tamanho);

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
                                isKit: dado.isKit,
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

                        // Criar um registro de Estoque com quantidade 0
                        await prisma.estoque.create({
                            data: {
                                itemTamanhoId: itemTamanho.id,
                                quantidade: 0,
                            },
                        });
                    }

                    if (!dado.isKit) {
                        // Para itens normais, só continua a lógica que já existia
                        console.log('Inserção de estoque e barcode concluída para o item e tamanho:', itemTamanho);
                        continue;
                    }

                    // SE FOR KIT — Tratar componentes

                    // Pega a composição para esse tamanho
                    const composicao = dado.composicao?.[tamanho] ?? [];

                    if (composicao.length === 0) {
                        console.log(`⚠️ Kit "${dado.item}" (${tamanho}) ignorado: não possui composição.`);

                        // Excluir registros dependentes
                        await prisma.barcode.deleteMany({
                            where: { itemTamanhoId: itemTamanho.id }
                        });

                        await prisma.estoque.deleteMany({
                            where: { itemTamanhoId: itemTamanho.id }
                        });

                        // Excluir o próprio itemTamanho
                        await prisma.itemTamanho.delete({
                            where: { id: itemTamanho.id }
                        });

                        // Voltar o contador do barcode
                        barcodeCounter = (barcodeCounter - 1 + 100000) % 100000;

                        continue;
                    }

                    let todosComponentesValidos = true;
                    const componentesProntos: { componenteId: number; quantidade: number }[] = [];

                    // Validar todos os componentes do kit (eles devem existir como ItemTamanho)
                    for (const componente of composicao) {
                        const itemTamanhoComponente = await prisma.itemTamanho.findFirst({
                            where: {
                                item: {
                                    nome: componente.item,
                                    genero: componente.genero as Genero,
                                    projetoId: projeto.id,
                                },
                                tamanho: {
                                    nome: componente.tamanho,
                                },
                            },
                        });

                        if (!itemTamanhoComponente) {
                            console.log(`❌ Kit "${dado.item}" (${tamanho}) ignorado: componente não encontrado -> item "${componente.item}", tamanho "${componente.tamanho}"`);
                            todosComponentesValidos = false;
                            break;
                        }

                        componentesProntos.push({
                            componenteId: itemTamanhoComponente.id,
                            quantidade: componente.quantidade,
                        });
                    }

                    if (!todosComponentesValidos) {
                        // Remove o kit criado (ItemTamanho + Barcode + Estoque + kititems) para não deixar lixo
                        await prisma.kitItem.deleteMany({ where: { kitId: itemTamanho.id } });
                        await prisma.barcode.deleteMany({ where: { itemTamanhoId: itemTamanho.id } });
                        await prisma.estoque.deleteMany({ where: { itemTamanhoId: itemTamanho.id } });
                        await prisma.itemTamanho.delete({ where: { id: itemTamanho.id } });
                        console.log(`🗑️ Kit inválido "${dado.item}" (${tamanho}) removido do banco.`);
                        continue; // Próximo tamanho
                    }

                    // Cadastrar as relações kit-componentes
                    for (const comp of componentesProntos) {
                        await prisma.kitItem.upsert({
                            where: {
                                kitId_componentId: {
                                    kitId: itemTamanho.id,
                                    componentId: comp.componenteId,
                                },
                            },
                            update: {},
                            create: {
                                kitId: itemTamanho.id,
                                componentId: comp.componenteId,
                                quantidade: comp.quantidade,
                            },
                        });
                    }

                    console.log(`✅ Kit "${dado.item}" (${tamanho}) cadastrado com ${componentesProntos.length} componente(s).`);
                }

                console.clear(); // Limpa o console após processar cada dado
            }

            console.log('Inserção de dados concluída!');
        }

        // Obter dados da planilha
        const dados = insertItems2();

        // Perguntar ao usuário se deseja continuar
        const confirmation = await askQuestion('Você deseja iniciar a inserção de itens/kits no BD? (Y/N) ');

        if (confirmation !== 'Y') {
            console.clear();
            console.log('Inserção abortada pelo usuário.');
            return; // Sai da função se o usuário não quiser continuar
        }

        console.clear(); // Limpa o console após a confirmação do usuário

        // Chama a função para inserir os dados no banco
        await inserirDadosNoBanco(dados);

    } catch (error) {
        console.error('Erro ao executar o seed4:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seed4();
