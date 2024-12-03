import { PrismaClient } from "@prisma/client";
import * as bcrypt from 'bcrypt';
import * as readline from "readline";

const prisma = new PrismaClient();

// Função para gerar o hash da senha
const gerarHashSenha = async (senha: string) => {
  try {
    const saltRounds = 10;
    console.log(`Gerando hash para a senha: ${senha}`); // Verifique o valor da senha aqui
    return await bcrypt.hash(senha, saltRounds);
  } catch (error) {
    console.error('Erro ao gerar o hash da senha:', error);
    throw error; // Re-throw para capturar no fluxo principal
  }
};

// Função para perguntar ao usuário de forma assíncrona
const askQuestion = (question: string): Promise<string> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
};

// Função para cadastrar usuário
const cadastrarUsuario = async () => {
  const nome = (await askQuestion('Digite o nome do usuário: ')).toUpperCase(); // Nome em uppercase
  const email = (await askQuestion('Digite o email do usuário: ')).toLowerCase(); // Email em lowercase
  let senha = await askQuestion('Digite a senha do usuário: '); // Senha

  // Verificar se o usuário com o mesmo email já existe
  const usuarioExistente = await prisma.usuarios.findUnique({
    where: { email: email },
  });

  if (usuarioExistente) {
    console.log(`Já existe um usuário com o email ${email}`);
    return;
  }

  // Gerar o hash da senha
  try {
    const senhaHash = await gerarHashSenha(senha);

    // Inserir usuário no banco de dados
    const usuario = await prisma.usuarios.create({
      data: {
        nome: nome,
        email: email,
        password: senhaHash,
      },
    });

    console.log(`Usuário ${usuario.nome} criado com sucesso!`);
  } catch (error) {
    console.error('Erro ao cadastrar o usuário:', error.message);
  }
};

// Função para continuar ou finalizar
const continuarOuFinalizar = async () => {
  const resposta = (await askQuestion('Deseja continuar cadastrando usuários? (s/n): ')).toLowerCase();
  return resposta === 's';
};

// Função principal para execução do seed
const run = async () => {
  let continuar = true;

  while (continuar) {
    await cadastrarUsuario(); // Cadastrar um usuário
    continuar = await continuarOuFinalizar(); // Perguntar se deseja continuar
  }

  console.log('Processo de cadastro finalizado!');
  await prisma.$disconnect(); // Desconectar do banco
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
