/**
 * TESTES DE CONSISTÊNCIA DE ESTOQUE
 * 
 * Estes testes validam matematicamente se os ajustes de estoque
 * estão corretos, garantindo que não há "criação mágica" de itens
 * ou perda de estoque.
 * 
 * REGRA DE OURO:
 * Estoque Final = Estoque Inicial + Entradas - Saídas
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CaixaPrisma } from './caixa.prisma';
import { PrismaProvider } from '../db/prisma.provider';

describe('🔒 TESTES DE CONSISTÊNCIA DE ESTOQUE', () => {
  let service: CaixaPrisma;
  let mockPrisma: any;

  // Spy para rastrear todas as chamadas de increment
  let estoqueIncrements: Array<{ itemTamanhoId: number; increment: number }> = [];

  beforeEach(async () => {
    estoqueIncrements = [];

    // Mock completo do Prisma
    mockPrisma = {
      $transaction: jest.fn(),
      caixa: {
        findUnique: jest.fn().mockResolvedValue({
          id: 1,
          gradeId: 1,
          caixaNumber: '01',
          qtyCaixa: 10,
          createdAt: new Date(),
          updatedAt: new Date(),
          caixaItem: [],
          grade: {
            status: 'PRONTA',
            escola: {
              nome: 'Escola Teste',
              numeroEscola: '001',
              projeto: {
                nome: 'Projeto Teste'
              }
            }
          }
        }),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      caixaItem: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      itemTamanho: {
        findUnique: jest.fn(),
      },
      outInput: {
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
      },
      estoque: {
        update: jest.fn().mockImplementation((args) => {
          // Rastrear todos os increments de estoque
          if (args.data?.quantidade?.increment !== undefined) {
            const itemTamanhoId = args.where.id || args.where.itemTamanhoId;
            estoqueIncrements.push({
              itemTamanhoId,
              increment: args.data.quantidade.increment
            });
          }
          return Promise.resolve({ id: args.where.id, quantidade: 100 });
        }),
      },
      gradeItem: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CaixaPrisma,
        {
          provide: PrismaProvider,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<CaixaPrisma>(CaixaPrisma);
    
    // Mock do método getCaixaById
    jest.spyOn(service, 'getCaixaById').mockResolvedValue({
      id: 1,
      gradeId: 1,
      status: 'PRONTA',
      caixaNumber: '01',
      qtyCaixa: 10,
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
      projeto: 'Projeto Teste',
      escola: 'Escola Teste',
      escolaNumero: '001',
      itens: []
    });
  });

  // ============================================
  // HELPER: Simular transação
  // ============================================
  function mockTransaction(callback: any) {
    mockPrisma.$transaction.mockImplementation(async (cb) => {
      return await cb(mockPrisma);
    });
  }

  // ============================================
  // HELPER: Validar consistência de estoque
  // ============================================
  function validarConsistenciaEstoque(
    quantidadeAtual: number,
    novaQuantidade: number,
    incrementChamado: number,
    tipo: 'ITEM_NORMAL' | 'KIT_COMPONENTE',
    qtdPorKit: number = 1
  ) {
    const diff = quantidadeAtual - novaQuantidade;
    const diffEsperado = tipo === 'KIT_COMPONENTE' ? diff * qtdPorKit : diff;

    console.log(`
    📊 VALIDAÇÃO DE CONSISTÊNCIA:
    Tipo: ${tipo}
    Quantidade Atual: ${quantidadeAtual}
    Nova Quantidade: ${novaQuantidade}
    Diferença: ${diff}
    ${tipo === 'KIT_COMPONENTE' ? `Qtd por Kit: ${qtdPorKit}` : ''}
    Diferença Esperada: ${diffEsperado}
    Increment Chamado: ${incrementChamado}
    ${incrementChamado === diffEsperado ? '✅ CORRETO' : '❌ INCORRETO'}
    `);

    expect(incrementChamado).toBe(diffEsperado);
  }

  // ============================================
  // TESTES: ITEM NORMAL
  // ============================================

  describe('📦 ITEM NORMAL - Consistência de Estoque', () => {
    
    it('✅ Deve DEVOLVER ao estoque quando REDUZ quantidade (10→5)', async () => {
      mockTransaction(null);

      const quantidadeAtual = 10;
      const novaQuantidade = 5;
      const diff = quantidadeAtual - novaQuantidade; // 5 (positivo = devolver)

      // Setup
      mockPrisma.caixa.findUnique.mockResolvedValue({
        id: 1,
        caixaNumber: '01',
        gradeId: 1,
        caixaItem: [{ id: 1, itemTamanhoId: 100, itemQty: quantidadeAtual }]
      });

      mockPrisma.itemTamanho.findUnique.mockResolvedValue({
        id: 100,
        isKit: false,
        estoque: { id: 1, quantidade: 90 },
        kitMain: []
      });

      mockPrisma.caixaItem.findFirst.mockResolvedValue({
        id: 1,
        itemTamanhoId: 100,
        itemQty: quantidadeAtual
      });

      mockPrisma.outInput.findFirst.mockResolvedValue({
        id: 1,
        itemTamanhoId: 100,
        quantidade: quantidadeAtual,
        estoqueId: 1
      });

      mockPrisma.gradeItem.findFirst.mockResolvedValue({
        id: 1,
        itemTamanhoId: 100,
        quantidadeExpedida: quantidadeAtual
      });

      mockPrisma.caixaItem.findMany.mockResolvedValue([
        { id: 1, itemTamanhoId: 100, itemQty: novaQuantidade }
      ]);

      // Executar
      const caixaAjuste = {
        id: 1,
        gradeId: 1,
        caixaNumber: '01',
        status: 'PRONTA',
        qtyCaixa: novaQuantidade,
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
        projeto: 'Teste',
        escola: 'Teste',
        escolaNumero: '001',
        itens: [{
          id: 1,
          caixaId: 1,
          itemTamanhoId: 100,
          itemName: 'Item Teste',
          itemGenero: 'UNISSEX',
          itemTam: 'M',
          itemQty: novaQuantidade
        }]
      };

      await service.updateItensByBox(caixaAjuste);

      // Validar
      expect(estoqueIncrements.length).toBeGreaterThan(0);
      const incrementEstoque = estoqueIncrements[0].increment;
      
      validarConsistenciaEstoque(
        quantidadeAtual,
        novaQuantidade,
        incrementEstoque,
        'ITEM_NORMAL'
      );

      // Deve ser positivo (devolver para estoque)
      expect(incrementEstoque).toBe(5);
      expect(incrementEstoque).toBeGreaterThan(0);
    });

    it('✅ Deve RETIRAR do estoque quando AUMENTA quantidade (5→10)', async () => {
      mockTransaction(null);

      const quantidadeAtual = 5;
      const novaQuantidade = 10;
      const diff = quantidadeAtual - novaQuantidade; // -5 (negativo = retirar)

      // Setup
      mockPrisma.caixa.findUnique.mockResolvedValue({
        id: 1,
        caixaNumber: '01',
        gradeId: 1,
        caixaItem: [{ id: 1, itemTamanhoId: 100, itemQty: quantidadeAtual }]
      });

      mockPrisma.itemTamanho.findUnique.mockResolvedValue({
        id: 100,
        isKit: false,
        estoque: { id: 1, quantidade: 95 },
        kitMain: []
      });

      mockPrisma.caixaItem.findFirst.mockResolvedValue({
        id: 1,
        itemTamanhoId: 100,
        itemQty: quantidadeAtual
      });

      mockPrisma.outInput.findFirst.mockResolvedValue({
        id: 1,
        itemTamanhoId: 100,
        quantidade: quantidadeAtual,
        estoqueId: 1
      });

      mockPrisma.gradeItem.findFirst.mockResolvedValue({
        id: 1,
        itemTamanhoId: 100,
        quantidadeExpedida: quantidadeAtual
      });

      mockPrisma.caixaItem.findMany.mockResolvedValue([
        { id: 1, itemTamanhoId: 100, itemQty: novaQuantidade }
      ]);

      // Executar
      const caixaAjuste = {
        id: 1,
        gradeId: 1,
        caixaNumber: '01',
        status: 'PRONTA',
        qtyCaixa: novaQuantidade,
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
        projeto: 'Teste',
        escola: 'Teste',
        escolaNumero: '001',
        itens: [{
          id: 1,
          caixaId: 1,
          itemTamanhoId: 100,
          itemName: 'Item Teste',
          itemGenero: 'UNISSEX',
          itemTam: 'M',
          itemQty: novaQuantidade
        }]
      };

      await service.updateItensByBox(caixaAjuste);

      // Validar
      expect(estoqueIncrements.length).toBeGreaterThan(0);
      const incrementEstoque = estoqueIncrements[0].increment;
      
      validarConsistenciaEstoque(
        quantidadeAtual,
        novaQuantidade,
        incrementEstoque,
        'ITEM_NORMAL'
      );

      // Deve ser negativo (retirar do estoque)
      expect(incrementEstoque).toBe(-5);
      expect(incrementEstoque).toBeLessThan(0);
    });

  });

  // ============================================
  // TESTES: KIT - CRÍTICOS!
  // ============================================

  describe('🎁 KIT - Consistência de Estoque dos COMPONENTES', () => {
    
    it('✅ Deve DEVOLVER componentes ao estoque quando REDUZ kits (10→5)', async () => {
      mockTransaction(null);

      const quantidadeAtualKits = 10;
      const novaQuantidadeKits = 5;
      const qtdPorKit = 2; // 2 componentes por kit
      const diff = quantidadeAtualKits - novaQuantidadeKits; // 5 kits
      const diffComponentes = diff * qtdPorKit; // 10 componentes

      // Setup
      mockPrisma.caixa.findUnique.mockResolvedValue({
        id: 1,
        caixaNumber: '01',
        gradeId: 1,
        caixaItem: [{ id: 1, itemTamanhoId: 200, itemQty: quantidadeAtualKits }]
      });

      mockPrisma.itemTamanho.findUnique.mockResolvedValue({
        id: 200,
        isKit: true,
        kitMain: [{
          componentId: 201,
          quantidade: qtdPorKit,
          component: {
            id: 201,
            estoque: { id: 2, quantidade: 80 }
          }
        }]
      });

      mockPrisma.caixaItem.findFirst.mockResolvedValue({
        id: 1,
        itemTamanhoId: 200,
        itemQty: quantidadeAtualKits
      });

      mockPrisma.outInput.findFirst.mockResolvedValue({
        id: 2,
        itemTamanhoId: 201, // componente
        quantidade: quantidadeAtualKits * qtdPorKit,
        estoqueId: 2,
        kitOrigemId: 200
      });

      mockPrisma.gradeItem.findFirst.mockResolvedValue({
        id: 2,
        itemTamanhoId: 200,
        quantidadeExpedida: quantidadeAtualKits
      });

      mockPrisma.caixaItem.findMany.mockResolvedValue([
        { id: 1, itemTamanhoId: 200, itemQty: novaQuantidadeKits }
      ]);

      // Executar
      const caixaAjuste = {
        id: 1,
        gradeId: 1,
        caixaNumber: '01',
        status: 'PRONTA',
        qtyCaixa: novaQuantidadeKits,
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
        projeto: 'Teste',
        escola: 'Teste',
        escolaNumero: '001',
        itens: [{
          id: 1,
          caixaId: 1,
          itemTamanhoId: 200,
          itemName: 'Kit Teste',
          itemGenero: 'UNISSEX',
          itemTam: 'M',
          itemQty: novaQuantidadeKits
        }]
      };

      await service.updateItensByBox(caixaAjuste);

      // Validar
      expect(estoqueIncrements.length).toBeGreaterThan(0);
      const incrementEstoque = estoqueIncrements[0].increment;
      
      validarConsistenciaEstoque(
        quantidadeAtualKits,
        novaQuantidadeKits,
        incrementEstoque,
        'KIT_COMPONENTE',
        qtdPorKit
      );

      // 🔴 TESTE CRÍTICO: Deve devolver POSITIVO (10 componentes)
      // Se estiver negativo (-10), o bug está presente!
      expect(incrementEstoque).toBe(diffComponentes); // 10
      expect(incrementEstoque).toBeGreaterThan(0);
      
      console.log(`
      🎯 VALIDAÇÃO CRÍTICA:
      - Reduzimos ${diff} kits (${quantidadeAtualKits}→${novaQuantidadeKits})
      - Cada kit tem ${qtdPorKit} componentes
      - Devemos DEVOLVER ${diffComponentes} componentes para estoque
      - Increment chamado: ${incrementEstoque}
      ${incrementEstoque === diffComponentes ? '✅ CORRETO!' : '❌ BUG DETECTADO! Linha 395 tem sinal invertido!'}
      `);
    });

    it('✅ Deve RETIRAR componentes do estoque quando AUMENTA kits (5→10)', async () => {
      mockTransaction(null);

      const quantidadeAtualKits = 5;
      const novaQuantidadeKits = 10;
      const qtdPorKit = 2;
      const diff = quantidadeAtualKits - novaQuantidadeKits; // -5 kits
      const diffComponentes = diff * qtdPorKit; // -10 componentes

      // Setup
      mockPrisma.caixa.findUnique.mockResolvedValue({
        id: 1,
        caixaNumber: '01',
        gradeId: 1,
        caixaItem: [{ id: 1, itemTamanhoId: 200, itemQty: quantidadeAtualKits }]
      });

      mockPrisma.itemTamanho.findUnique.mockResolvedValue({
        id: 200,
        isKit: true,
        kitMain: [{
          componentId: 201,
          quantidade: qtdPorKit,
          component: {
            id: 201,
            estoque: { id: 2, quantidade: 90 }
          }
        }]
      });

      mockPrisma.caixaItem.findFirst.mockResolvedValue({
        id: 1,
        itemTamanhoId: 200,
        itemQty: quantidadeAtualKits
      });

      mockPrisma.outInput.findFirst.mockResolvedValue({
        id: 2,
        itemTamanhoId: 201,
        quantidade: quantidadeAtualKits * qtdPorKit,
        estoqueId: 2,
        kitOrigemId: 200
      });

      mockPrisma.gradeItem.findFirst.mockResolvedValue({
        id: 2,
        itemTamanhoId: 200,
        quantidadeExpedida: quantidadeAtualKits
      });

      mockPrisma.caixaItem.findMany.mockResolvedValue([
        { id: 1, itemTamanhoId: 200, itemQty: novaQuantidadeKits }
      ]);

      // Executar
      const caixaAjuste = {
        id: 1,
        gradeId: 1,
        caixaNumber: '01',
        status: 'PRONTA',
        qtyCaixa: novaQuantidadeKits,
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
        projeto: 'Teste',
        escola: 'Teste',
        escolaNumero: '001',
        itens: [{
          id: 1,
          caixaId: 1,
          itemTamanhoId: 200,
          itemName: 'Kit Teste',
          itemGenero: 'UNISSEX',
          itemTam: 'M',
          itemQty: novaQuantidadeKits
        }]
      };

      await service.updateItensByBox(caixaAjuste);

      // Validar
      expect(estoqueIncrements.length).toBeGreaterThan(0);
      const incrementEstoque = estoqueIncrements[0].increment;
      
      validarConsistenciaEstoque(
        quantidadeAtualKits,
        novaQuantidadeKits,
        incrementEstoque,
        'KIT_COMPONENTE',
        qtdPorKit
      );

      // 🔴 TESTE CRÍTICO: Deve retirar NEGATIVO (-10 componentes)
      // Se estiver positivo (+10), o bug está presente!
      expect(incrementEstoque).toBe(diffComponentes); // -10
      expect(incrementEstoque).toBeLessThan(0);
      
      console.log(`
      🎯 VALIDAÇÃO CRÍTICA:
      - Aumentamos ${Math.abs(diff)} kits (${quantidadeAtualKits}→${novaQuantidadeKits})
      - Cada kit tem ${qtdPorKit} componentes
      - Devemos RETIRAR ${Math.abs(diffComponentes)} componentes do estoque
      - Increment chamado: ${incrementEstoque}
      ${incrementEstoque === diffComponentes ? '✅ CORRETO!' : '❌ BUG DETECTADO! Linha 395 tem sinal invertido!'}
      `);
    });

    it('✅ Teste com kit de 3 componentes - REDUZ (20→15)', async () => {
      mockTransaction(null);

      const quantidadeAtualKits = 20;
      const novaQuantidadeKits = 15;
      const qtdPorKit = 3; // Kit com 3 componentes
      const diff = quantidadeAtualKits - novaQuantidadeKits; // 5 kits
      const diffComponentes = diff * qtdPorKit; // 15 componentes

      // Setup (simplificado)
      mockPrisma.caixa.findUnique.mockResolvedValue({
        id: 1,
        caixaNumber: '01',
        gradeId: 1,
        caixaItem: [{ id: 1, itemTamanhoId: 300, itemQty: quantidadeAtualKits }]
      });

      mockPrisma.itemTamanho.findUnique.mockResolvedValue({
        id: 300,
        isKit: true,
        kitMain: [{
          componentId: 301,
          quantidade: qtdPorKit,
          component: {
            id: 301,
            estoque: { id: 3, quantidade: 40 }
          }
        }]
      });

      mockPrisma.caixaItem.findFirst.mockResolvedValue({
        id: 1,
        itemTamanhoId: 300,
        itemQty: quantidadeAtualKits
      });

      mockPrisma.outInput.findFirst.mockResolvedValue({
        id: 3,
        itemTamanhoId: 301,
        quantidade: quantidadeAtualKits * qtdPorKit,
        estoqueId: 3,
        kitOrigemId: 300
      });

      mockPrisma.gradeItem.findFirst.mockResolvedValue(null);
      mockPrisma.caixaItem.findMany.mockResolvedValue([{ id: 1 }]);

      // Executar
      await service.updateItensByBox({
        id: 1,
        gradeId: 1,
        caixaNumber: '01',
        status: 'PRONTA',
        qtyCaixa: novaQuantidadeKits,
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
        projeto: 'Teste',
        escola: 'Teste',
        escolaNumero: '001',
        itens: [{
          id: 1,
          caixaId: 1,
          itemTamanhoId: 300,
          itemName: 'Kit 3 Componentes',
          itemGenero: 'UNISSEX',
          itemTam: 'M',
          itemQty: novaQuantidadeKits
        }]
      });

      // Validar
      const incrementEstoque = estoqueIncrements[0].increment;
      
      // Deve devolver 15 componentes (5 kits * 3 componentes)
      expect(incrementEstoque).toBe(15);
      expect(incrementEstoque).toBeGreaterThan(0);
    });

  });

  // ============================================
  // TESTE DE SANIDADE: Detectar bug da linha 395
  // ============================================

  describe('🚨 DETECÇÃO DE BUG - Linha 395', () => {
    it('❌ Deve FALHAR se o bug estiver presente (increment com sinal invertido)', async () => {
      mockTransaction(null);

      const quantidadeAtualKits = 10;
      const novaQuantidadeKits = 5;
      const qtdPorKit = 1;
      
      // Setup mínimo
      mockPrisma.caixa.findUnique.mockResolvedValue({
        id: 1,
        caixaNumber: '01',
        gradeId: 1,
        caixaItem: [{ id: 1, itemTamanhoId: 400, itemQty: quantidadeAtualKits }]
      });

      mockPrisma.itemTamanho.findUnique.mockResolvedValue({
        id: 400,
        isKit: true,
        kitMain: [{
          componentId: 401,
          quantidade: qtdPorKit,
          component: {
            id: 401,
            estoque: { id: 4, quantidade: 90 }
          }
        }]
      });

      mockPrisma.caixaItem.findFirst.mockResolvedValue({
        id: 1,
        itemTamanhoId: 400,
        itemQty: quantidadeAtualKits
      });

      mockPrisma.outInput.findFirst.mockResolvedValue({
        id: 4,
        itemTamanhoId: 401,
        quantidade: quantidadeAtualKits,
        estoqueId: 4,
        kitOrigemId: 400
      });

      mockPrisma.gradeItem.findFirst.mockResolvedValue(null);
      mockPrisma.caixaItem.findMany.mockResolvedValue([{ id: 1 }]);

      // Executar
      await service.updateItensByBox({
        id: 1,
        gradeId: 1,
        caixaNumber: '01',
        status: 'PRONTA',
        qtyCaixa: novaQuantidadeKits,
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
        projeto: 'Teste',
        escola: 'Teste',
        escolaNumero: '001',
        itens: [{
          id: 1,
          caixaId: 1,
          itemTamanhoId: 400,
          itemName: 'Kit Detecção Bug',
          itemGenero: 'UNISSEX',
          itemTam: 'M',
          itemQty: novaQuantidadeKits
        }]
      });

      const incrementEstoque = estoqueIncrements[0].increment;
      
      // Se o bug estiver presente, será -5 em vez de +5
      if (incrementEstoque === -5) {
        console.error(`
        ❌❌❌ BUG DETECTADO! ❌❌❌
        
        Ao reduzir de ${quantidadeAtualKits} para ${novaQuantidadeKits} kits,
        o estoque foi DECREMENTADO em ${incrementEstoque} em vez de INCREMENTADO!
        
        CAUSA: Linha 395 em caixa.prisma.ts tem:
        increment: -diffComponentes
        
        SOLUÇÃO: Remover o sinal negativo:
        increment: diffComponentes
        `);
        
        fail('🔴 BUG CONFIRMADO: Linha 395 está com sinal invertido!');
      }
      
      expect(incrementEstoque).toBe(5);
    });
  });

});

