/**
 * TESTES COMPLETOS PARA VALIDAR AJUSTES DE ESTOQUE
 * 
 * Este arquivo testa todos os cenários possíveis de ajuste de caixa
 * para garantir que o estoque e quantidades expedidas estão consistentes
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CaixaPrisma } from './caixa.prisma';
import { PrismaProvider } from '../db/prisma.provider';
import { CaixaAjuste } from '@core/index';

describe('CaixaPrisma - updateItensByBox - TESTES DE ESTOQUE', () => {
  let service: CaixaPrisma;
  let prisma: PrismaProvider;

  // IDs de teste (você deve ajustar para IDs reais do seu banco)
  let testGradeId: number;
  let testCaixaId: number;
  let testItemNormalId: number;
  let testItemKitId: number;
  let testComponenteKitId1: number;
  let testComponenteKitId2: number;
  let testUserId: number;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CaixaPrisma, PrismaProvider],
    }).compile();

    service = module.get<CaixaPrisma>(CaixaPrisma);
    prisma = module.get<PrismaProvider>(PrismaProvider);

    // Setup inicial: criar dados de teste
    await setupTestData();
  });

  afterAll(async () => {
    // Limpar dados de teste
    await cleanupTestData();
    await prisma.$disconnect();
  });

  /**
   * SETUP: Criar dados de teste no banco
   */
  async function setupTestData() {
    // Criar usuário de teste
    const user = await prisma.usuarios.create({
      data: {
        nome: 'Teste Estoque',
        email: 'teste.estoque@test.com',
        password: 'teste123'
      }
    });
    testUserId = user.id;

    // Criar projeto, escola e grade
    const projeto = await prisma.projeto.create({
      data: {
        nome: 'Projeto Teste Estoque',
        descricao: 'Projeto para testes de estoque'
      }
    });

    const escola = await prisma.escola.create({
      data: {
        nome: 'Escola Teste',
        numeroEscola: 'ESC001',
        projetoId: projeto.id
      }
    });

    const company = await prisma.company.create({
      data: {
        nome: 'Company Teste',
        email: 'company.teste@test.com'
      }
    });

    const grade = await prisma.grade.create({
      data: {
        escolaId: escola.id,
        companyId: company.id,
        status: 'PRONTA',
        finalizada: false
      }
    });
    testGradeId = grade.id;

    // Criar item normal
    const itemNormal = await prisma.item.create({
      data: {
        nome: 'Camiseta Teste',
        genero: 'UNISSEX',
        projetoId: projeto.id
      }
    });

    // Buscar ou criar tamanho M
    let tamanhoM = await prisma.tamanho.findFirst({
      where: { nome: 'M' }
    });
    
    if (!tamanhoM) {
      tamanhoM = await prisma.tamanho.create({
        data: { nome: 'M' }
      });
    }

    const itemTamanhoNormal = await prisma.itemTamanho.create({
      data: {
        itemId: itemNormal.id,
        tamanhoId: tamanhoM.id,
        isKit: false
      }
    });
    testItemNormalId = itemTamanhoNormal.id;

    // Criar estoque para item normal (100 unidades)
    await prisma.estoque.create({
      data: {
        itemTamanhoId: testItemNormalId,
        quantidade: 100
      }
    });

    // Criar item kit (Uniforme = Camiseta + Calça)
    const itemKit = await prisma.item.create({
      data: {
        nome: 'Uniforme Completo',
        genero: 'UNISSEX',
        projetoId: projeto.id
      }
    });

    const itemTamanhoKit = await prisma.itemTamanho.create({
      data: {
        itemId: itemKit.id,
        tamanhoId: tamanhoM.id,
        isKit: true
      }
    });
    testItemKitId = itemTamanhoKit.id;

    // Criar componentes do kit
    const camiseta = await prisma.item.create({
      data: {
        nome: 'Camiseta Uniforme',
        genero: 'UNISSEX',
        projetoId: projeto.id
      }
    });

    const itemTamanhoCamiseta = await prisma.itemTamanho.create({
      data: {
        itemId: camiseta.id,
        tamanhoId: tamanhoM.id,
        isKit: false
      }
    });
    testComponenteKitId1 = itemTamanhoCamiseta.id;

    await prisma.estoque.create({
      data: {
        itemTamanhoId: testComponenteKitId1,
        quantidade: 200 // 200 camisetas disponíveis
      }
    });

    const calca = await prisma.item.create({
      data: {
        nome: 'Calça Uniforme',
        genero: 'UNISSEX',
        projetoId: projeto.id
      }
    });

    const itemTamanhoCalca = await prisma.itemTamanho.create({
      data: {
        itemId: calca.id,
        tamanhoId: tamanhoM.id,
        isKit: false
      }
    });
    testComponenteKitId2 = itemTamanhoCalca.id;

    await prisma.estoque.create({
      data: {
        itemTamanhoId: testComponenteKitId2,
        quantidade: 200 // 200 calças disponíveis
      }
    });

    // Criar relacionamento kit -> componentes
    // 1 kit = 1 camiseta + 1 calça
    await prisma.kitItem.create({
      data: {
        kitId: testItemKitId,
        componentId: testComponenteKitId1,
        quantidade: 1
      }
    });

    await prisma.kitItem.create({
      data: {
        kitId: testItemKitId,
        componentId: testComponenteKitId2,
        quantidade: 1
      }
    });

    // Criar GradeItems
    await prisma.gradeItem.create({
      data: {
        gradeId: testGradeId,
        itemTamanhoId: testItemNormalId,
        quantidade: 50,
        quantidadeExpedida: 0
      }
    });

    await prisma.gradeItem.create({
      data: {
        gradeId: testGradeId,
        itemTamanhoId: testItemKitId,
        quantidade: 30,
        quantidadeExpedida: 0
      }
    });
  }

  /**
   * CLEANUP: Remover dados de teste
   */
  async function cleanupTestData() {
    // Deletar em ordem inversa das dependências
    if (testCaixaId) {
      await prisma.outInput.deleteMany({ where: { caixaId: testCaixaId } });
      await prisma.caixaItem.deleteMany({ where: { caixaId: testCaixaId } });
      await prisma.caixa.delete({ where: { id: testCaixaId } });
    }

    await prisma.gradeItem.deleteMany({ where: { gradeId: testGradeId } });
    await prisma.kitItem.deleteMany({
      where: {
        OR: [
          { kitId: testItemKitId },
          { componentId: testComponenteKitId1 },
          { componentId: testComponenteKitId2 }
        ]
      }
    });

    await prisma.estoque.deleteMany({
      where: {
        itemTamanhoId: {
          in: [testItemNormalId, testComponenteKitId1, testComponenteKitId2]
        }
      }
    });

    await prisma.itemTamanho.deleteMany({
      where: {
        id: {
          in: [testItemNormalId, testItemKitId, testComponenteKitId1, testComponenteKitId2]
        }
      }
    });

    await prisma.grade.delete({ where: { id: testGradeId } });
  }

  /**
   * HELPER: Criar caixa inicial
   */
  async function criarCaixaInicial(qtdItemNormal: number, qtdKit: number) {
    const caixa = await prisma.caixa.create({
      data: {
        gradeId: testGradeId,
        caixaNumber: '01',
        escolaNumber: 'ESC001',
        numberJoin: '001',
        qtyCaixa: qtdItemNormal + qtdKit,
        projeto: 'Projeto Teste',
        escolaCaixa: 'Escola Teste',
        userId: testUserId
      }
    });
    testCaixaId = caixa.id;

    // Criar CaixaItems
    if (qtdItemNormal > 0) {
      await prisma.caixaItem.create({
        data: {
          caixaId: caixa.id,
          itemTamanhoId: testItemNormalId,
          itemName: 'Camiseta Teste',
          itemGenero: 'Unissex',
          itemTam: 'M',
          itemQty: qtdItemNormal
        }
      });

      // Atualizar estoque
      await prisma.estoque.update({
        where: { itemTamanhoId: testItemNormalId },
        data: { quantidade: { decrement: qtdItemNormal } }
      });

      // Criar OutInput
      const estoque = await prisma.estoque.findUnique({
        where: { itemTamanhoId: testItemNormalId }
      });

      await prisma.outInput.create({
        data: {
          itemTamanhoId: testItemNormalId,
          estoqueId: estoque.id,
          quantidade: qtdItemNormal,
          userId: testUserId,
          gradeId: testGradeId,
          caixaId: caixa.id
        }
      });

      // Atualizar GradeItem
      await prisma.gradeItem.updateMany({
        where: {
          gradeId: testGradeId,
          itemTamanhoId: testItemNormalId
        },
        data: { quantidadeExpedida: { increment: qtdItemNormal } }
      });
    }

    if (qtdKit > 0) {
      await prisma.caixaItem.create({
        data: {
          caixaId: caixa.id,
          itemTamanhoId: testItemKitId,
          itemName: 'Uniforme Completo',
          itemGenero: 'Unissex',
          itemTam: 'M',
          itemQty: qtdKit
        }
      });

      // Atualizar estoque dos componentes
      await prisma.estoque.update({
        where: { itemTamanhoId: testComponenteKitId1 },
        data: { quantidade: { decrement: qtdKit * 1 } } // 1 camiseta por kit
      });

      await prisma.estoque.update({
        where: { itemTamanhoId: testComponenteKitId2 },
        data: { quantidade: { decrement: qtdKit * 1 } } // 1 calça por kit
      });

      // Criar OutInput dos componentes
      const estoqueCamiseta = await prisma.estoque.findUnique({
        where: { itemTamanhoId: testComponenteKitId1 }
      });

      await prisma.outInput.create({
        data: {
          itemTamanhoId: testComponenteKitId1,
          estoqueId: estoqueCamiseta.id,
          quantidade: qtdKit * 1,
          userId: testUserId,
          gradeId: testGradeId,
          caixaId: caixa.id,
          kitOutput: true,
          kitOrigemId: testItemKitId
        }
      });

      const estoqueCalca = await prisma.estoque.findUnique({
        where: { itemTamanhoId: testComponenteKitId2 }
      });

      await prisma.outInput.create({
        data: {
          itemTamanhoId: testComponenteKitId2,
          estoqueId: estoqueCalca.id,
          quantidade: qtdKit * 1,
          userId: testUserId,
          gradeId: testGradeId,
          caixaId: caixa.id,
          kitOutput: true,
          kitOrigemId: testItemKitId
        }
      });

      // Atualizar GradeItem do kit
      await prisma.gradeItem.updateMany({
        where: {
          gradeId: testGradeId,
          itemTamanhoId: testItemKitId
        },
        data: { quantidadeExpedida: { increment: qtdKit } }
      });
    }

    return caixa;
  }

  /**
   * HELPER: Obter estado atual do estoque
   */
  async function getEstoqueAtual() {
    const estoqueNormal = await prisma.estoque.findUnique({
      where: { itemTamanhoId: testItemNormalId }
    });

    const estoqueCamiseta = await prisma.estoque.findUnique({
      where: { itemTamanhoId: testComponenteKitId1 }
    });

    const estoqueCalca = await prisma.estoque.findUnique({
      where: { itemTamanhoId: testComponenteKitId2 }
    });

    return {
      itemNormal: estoqueNormal?.quantidade || 0,
      camiseta: estoqueCamiseta?.quantidade || 0,
      calca: estoqueCalca?.quantidade || 0
    };
  }

  /**
   * HELPER: Obter quantidades expedidas
   */
  async function getQuantidadesExpedidas() {
    const gradeItemNormal = await prisma.gradeItem.findFirst({
      where: {
        gradeId: testGradeId,
        itemTamanhoId: testItemNormalId
      }
    });

    const gradeItemKit = await prisma.gradeItem.findFirst({
      where: {
        gradeId: testGradeId,
        itemTamanhoId: testItemKitId
      }
    });

    return {
      itemNormal: gradeItemNormal?.quantidadeExpedida || 0,
      kit: gradeItemKit?.quantidadeExpedida || 0
    };
  }

  // ========================================
  // TESTES - ITEM NORMAL
  // ========================================

  describe('ITEM NORMAL - Reduzir quantidade', () => {
    it('Deve devolver para estoque ao reduzir de 10 para 5', async () => {
      // Criar caixa com 10 itens normais
      await criarCaixaInicial(10, 0);

      const estoqueAntes = await getEstoqueAtual();
      console.log('📊 Estoque ANTES:', estoqueAntes);
      expect(estoqueAntes.itemNormal).toBe(90); // 100 - 10 = 90

      // Ajustar para 5 itens
      const caixaAjuste: CaixaAjuste = {
        id: testCaixaId,
        gradeId: testGradeId,
        caixaNumber: '01',
        status: 'CRIADA',
        qtyCaixa: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        projeto: 'Projeto Teste',
        escola: 'Escola Teste',
        escolaNumero: 'ESC001',
        itens: [{
          id: 1,
          caixaId: testCaixaId,
          itemTamanhoId: testItemNormalId,
          itemName: 'Camiseta Teste',
          itemGenero: 'Unissex',
          itemTam: 'M',
          itemQty: 5
        }]
      };

      await service.updateItensByBox(caixaAjuste);

      const estoqueDepois = await getEstoqueAtual();
      console.log('📊 Estoque DEPOIS:', estoqueDepois);
      
      // Deve ter devolvido 5 para estoque
      expect(estoqueDepois.itemNormal).toBe(95); // 90 + 5 = 95

      const expedidas = await getQuantidadesExpedidas();
      expect(expedidas.itemNormal).toBe(5); // Foi ajustado de 10 para 5
    });
  });

  describe('ITEM NORMAL - Aumentar quantidade', () => {
    it('Deve retirar do estoque ao aumentar de 10 para 15', async () => {
      // Criar caixa com 10 itens normais
      await criarCaixaInicial(10, 0);

      const estoqueAntes = await getEstoqueAtual();
      console.log('📊 Estoque ANTES:', estoqueAntes);
      expect(estoqueAntes.itemNormal).toBe(90); // 100 - 10 = 90

      // Ajustar para 15 itens
      const caixaAjuste: CaixaAjuste = {
        id: testCaixaId,
        gradeId: testGradeId,
        caixaNumber: '01',
        status: 'CRIADA',
        qtyCaixa: 15,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        projeto: 'Projeto Teste',
        escola: 'Escola Teste',
        escolaNumero: 'ESC001',
        itens: [{
          id: 1,
          caixaId: testCaixaId,
          itemTamanhoId: testItemNormalId,
          itemName: 'Camiseta Teste',
          itemGenero: 'Unissex',
          itemTam: 'M',
          itemQty: 15
        }]
      };

      await service.updateItensByBox(caixaAjuste);

      const estoqueDepois = await getEstoqueAtual();
      console.log('📊 Estoque DEPOIS:', estoqueDepois);
      
      // Deve ter retirado 5 do estoque
      expect(estoqueDepois.itemNormal).toBe(85); // 90 - 5 = 85

      const expedidas = await getQuantidadesExpedidas();
      expect(expedidas.itemNormal).toBe(15); // Foi ajustado de 10 para 15
    });
  });

  describe('ITEM NORMAL - Zerar quantidade', () => {
    it('Deve devolver tudo para estoque ao zerar', async () => {
      // Criar caixa com 10 itens normais
      await criarCaixaInicial(10, 0);

      const estoqueAntes = await getEstoqueAtual();
      console.log('📊 Estoque ANTES:', estoqueAntes);
      expect(estoqueAntes.itemNormal).toBe(90); // 100 - 10 = 90

      // Zerar
      const caixaAjuste: CaixaAjuste = {
        id: testCaixaId,
        gradeId: testGradeId,
        caixaNumber: '01',
        status: 'CRIADA',
        qtyCaixa: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        projeto: 'Projeto Teste',
        escola: 'Escola Teste',
        escolaNumero: 'ESC001',
        itens: [{
          id: 1,
          caixaId: testCaixaId,
          itemTamanhoId: testItemNormalId,
          itemName: 'Camiseta Teste',
          itemGenero: 'Unissex',
          itemTam: 'M',
          itemQty: 0
        }]
      };

      const resultado = await service.updateItensByBox(caixaAjuste);

      const estoqueDepois = await getEstoqueAtual();
      console.log('📊 Estoque DEPOIS:', estoqueDepois);
      
      // Deve ter devolvido tudo
      expect(estoqueDepois.itemNormal).toBe(100); // 90 + 10 = 100

      const expedidas = await getQuantidadesExpedidas();
      expect(expedidas.itemNormal).toBe(0);

      // Caixa deve ter sido excluída
      expect(resultado).toHaveProperty('status', 'EXCLUIDA');
    });
  });

  // ========================================
  // TESTES - KIT
  // ========================================

  describe('KIT - Reduzir quantidade', () => {
    it('Deve devolver componentes para estoque ao reduzir de 10 para 5 kits', async () => {
      // Criar caixa com 10 kits
      await criarCaixaInicial(0, 10);

      const estoqueAntes = await getEstoqueAtual();
      console.log('📊 Estoque ANTES:', estoqueAntes);
      expect(estoqueAntes.camiseta).toBe(190); // 200 - 10 = 190
      expect(estoqueAntes.calca).toBe(190); // 200 - 10 = 190

      // Ajustar para 5 kits
      const caixaAjuste: CaixaAjuste = {
        id: testCaixaId,
        gradeId: testGradeId,
        caixaNumber: '01',
        status: 'CRIADA',
        qtyCaixa: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        projeto: 'Projeto Teste',
        escola: 'Escola Teste',
        escolaNumero: 'ESC001',
        itens: [{
          id: 1,
          caixaId: testCaixaId,
          itemTamanhoId: testItemKitId,
          itemName: 'Uniforme Completo',
          itemGenero: 'Unissex',
          itemTam: 'M',
          itemQty: 5
        }]
      };

      await service.updateItensByBox(caixaAjuste);

      const estoqueDepois = await getEstoqueAtual();
      console.log('📊 Estoque DEPOIS:', estoqueDepois);
      
      // Deve ter devolvido 5 componentes de cada
      expect(estoqueDepois.camiseta).toBe(195); // 190 + 5 = 195
      expect(estoqueDepois.calca).toBe(195); // 190 + 5 = 195

      const expedidas = await getQuantidadesExpedidas();
      expect(expedidas.kit).toBe(5);
    });
  });

  describe('KIT - Aumentar quantidade', () => {
    it('Deve retirar componentes do estoque ao aumentar de 10 para 15 kits', async () => {
      // Criar caixa com 10 kits
      await criarCaixaInicial(0, 10);

      const estoqueAntes = await getEstoqueAtual();
      console.log('📊 Estoque ANTES:', estoqueAntes);
      expect(estoqueAntes.camiseta).toBe(190); // 200 - 10 = 190
      expect(estoqueAntes.calca).toBe(190); // 200 - 10 = 190

      // Ajustar para 15 kits
      const caixaAjuste: CaixaAjuste = {
        id: testCaixaId,
        gradeId: testGradeId,
        caixaNumber: '01',
        status: 'CRIADA',
        qtyCaixa: 15,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        projeto: 'Projeto Teste',
        escola: 'Escola Teste',
        escolaNumero: 'ESC001',
        itens: [{
          id: 1,
          caixaId: testCaixaId,
          itemTamanhoId: testItemKitId,
          itemName: 'Uniforme Completo',
          itemGenero: 'Unissex',
          itemTam: 'M',
          itemQty: 15
        }]
      };

      await service.updateItensByBox(caixaAjuste);

      const estoqueDepois = await getEstoqueAtual();
      console.log('📊 Estoque DEPOIS:', estoqueDepois);
      
      // Deve ter retirado 5 componentes de cada
      expect(estoqueDepois.camiseta).toBe(185); // 190 - 5 = 185
      expect(estoqueDepois.calca).toBe(185); // 190 - 5 = 185

      const expedidas = await getQuantidadesExpedidas();
      expect(expedidas.kit).toBe(15);
    });
  });

  describe('KIT - Zerar quantidade', () => {
    it('Deve devolver todos componentes para estoque ao zerar', async () => {
      // Criar caixa com 10 kits
      await criarCaixaInicial(0, 10);

      const estoqueAntes = await getEstoqueAtual();
      console.log('📊 Estoque ANTES:', estoqueAntes);
      expect(estoqueAntes.camiseta).toBe(190); // 200 - 10 = 190
      expect(estoqueAntes.calca).toBe(190); // 200 - 10 = 190

      // Zerar
      const caixaAjuste: CaixaAjuste = {
        id: testCaixaId,
        gradeId: testGradeId,
        caixaNumber: '01',
        status: 'CRIADA',
        qtyCaixa: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        projeto: 'Projeto Teste',
        escola: 'Escola Teste',
        escolaNumero: 'ESC001',
        itens: [{
          id: 1,
          caixaId: testCaixaId,
          itemTamanhoId: testItemKitId,
          itemName: 'Uniforme Completo',
          itemGenero: 'Unissex',
          itemTam: 'M',
          itemQty: 0
        }]
      };

      const resultado = await service.updateItensByBox(caixaAjuste);

      const estoqueDepois = await getEstoqueAtual();
      console.log('📊 Estoque DEPOIS:', estoqueDepois);
      
      // Deve ter devolvido tudo
      expect(estoqueDepois.camiseta).toBe(200); // 190 + 10 = 200
      expect(estoqueDepois.calca).toBe(200); // 190 + 10 = 200

      const expedidas = await getQuantidadesExpedidas();
      expect(expedidas.kit).toBe(0);

      // Caixa deve ter sido excluída
      expect(resultado).toHaveProperty('status', 'EXCLUIDA');
    });
  });

  // ========================================
  // TESTES - MISTO (Item normal + Kit)
  // ========================================

  describe('MISTO - Ajustar caixa com item normal e kit', () => {
    it('Deve ajustar corretamente ambos os tipos', async () => {
      // Criar caixa com 10 itens normais + 5 kits
      await criarCaixaInicial(10, 5);

      const estoqueAntes = await getEstoqueAtual();
      console.log('📊 Estoque ANTES:', estoqueAntes);
      expect(estoqueAntes.itemNormal).toBe(90); // 100 - 10
      expect(estoqueAntes.camiseta).toBe(195); // 200 - 5
      expect(estoqueAntes.calca).toBe(195); // 200 - 5

      // Ajustar: reduzir item normal (10→5), aumentar kit (5→8)
      const caixaAjuste: CaixaAjuste = {
        id: testCaixaId,
        gradeId: testGradeId,
        caixaNumber: '01',
        status: 'CRIADA',
        qtyCaixa: 13,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        projeto: 'Projeto Teste',
        escola: 'Escola Teste',
        escolaNumero: 'ESC001',
        itens: [
          {
            id: 1,
            caixaId: testCaixaId,
            itemTamanhoId: testItemNormalId,
            itemName: 'Camiseta Teste',
            itemGenero: 'Unissex',
            itemTam: 'M',
            itemQty: 5
          },
          {
            id: 2,
            caixaId: testCaixaId,
            itemTamanhoId: testItemKitId,
            itemName: 'Uniforme Completo',
            itemGenero: 'Unissex',
            itemTam: 'M',
            itemQty: 8
          }
        ]
      };

      await service.updateItensByBox(caixaAjuste);

      const estoqueDepois = await getEstoqueAtual();
      console.log('📊 Estoque DEPOIS:', estoqueDepois);
      
      expect(estoqueDepois.itemNormal).toBe(95); // 90 + 5 (devolveu)
      expect(estoqueDepois.camiseta).toBe(192); // 195 - 3 (retirou)
      expect(estoqueDepois.calca).toBe(192); // 195 - 3 (retirou)
    });
  });
});

