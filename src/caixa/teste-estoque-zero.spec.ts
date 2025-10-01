/**
 * TESTE: Estoque fica positivo ao apagar caixa
 * 
 * Cenário reportado:
 * 1. Estoque inicial = 0
 * 2. Cria caixa com 10 itens → Estoque = -10
 * 3. Apaga caixa → Estoque deveria voltar para 0
 * 4. MAS está ficando POSITIVO
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CaixaPrisma } from './caixa.prisma';
import { PrismaProvider } from '../db/prisma.provider';

describe('🐛 BUG: Estoque fica positivo ao apagar caixa', () => {
  let service: CaixaPrisma;
  let mockPrisma: any;

  // Rastrear todas as operações de estoque
  let estoqueOperacoes: Array<{
    tipo: 'SET' | 'INCREMENT';
    itemTamanhoId: number;
    valor: number;
    momento: string;
  }> = [];

  beforeEach(async () => {
    estoqueOperacoes = [];

    mockPrisma = {
      $transaction: jest.fn().mockImplementation(async (cb) => await cb(mockPrisma)),
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
              projeto: { nome: 'Projeto Teste' }
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
          // Rastrear operações
          if (args.data?.quantidade?.increment !== undefined) {
            estoqueOperacoes.push({
              tipo: 'INCREMENT',
              itemTamanhoId: args.where.id || args.where.itemTamanhoId,
              valor: args.data.quantidade.increment,
              momento: new Date().toISOString()
            });
          } else if (args.data?.quantidade !== undefined) {
            estoqueOperacoes.push({
              tipo: 'SET',
              itemTamanhoId: args.where.id || args.where.itemTamanhoId,
              valor: args.data.quantidade,
              momento: new Date().toISOString()
            });
          }
          return Promise.resolve({ id: args.where.id, quantidade: 0 });
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
        { provide: PrismaProvider, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CaixaPrisma>(CaixaPrisma);
    jest.spyOn(service, 'getCaixaById').mockResolvedValue({
      id: 1,
      gradeId: 1,
      status: 'PRONTA',
      caixaNumber: '01',
      qtyCaixa: 0,
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
      projeto: 'Projeto Teste',
      escola: 'Escola Teste',
      escolaNumero: '001',
      itens: []
    });
  });

  it('🔍 Deve rastrear TODAS as operações de estoque ao zerar item', async () => {
    // Setup: Item normal com 10 unidades na caixa
    const quantidadeNaCaixa = 10;

    mockPrisma.caixa.findUnique.mockResolvedValue({
      id: 1,
      caixaNumber: '01',
      gradeId: 1,
      caixaItem: [{ id: 1, itemTamanhoId: 100, itemQty: quantidadeNaCaixa }]
    });

    mockPrisma.itemTamanho.findUnique.mockResolvedValue({
      id: 100,
      isKit: false,
      estoque: { id: 1, quantidade: 0 }, // Estoque está em 0 (ou negativo)
      kitMain: []
    });

    mockPrisma.caixaItem.findFirst.mockResolvedValue({
      id: 1,
      itemTamanhoId: 100,
      itemQty: quantidadeNaCaixa
    });

    mockPrisma.outInput.findFirst.mockResolvedValue({
      id: 1,
      itemTamanhoId: 100,
      quantidade: quantidadeNaCaixa, // OutInput tem 10
      estoqueId: 1
    });

    mockPrisma.gradeItem.findFirst.mockResolvedValue({
      id: 1,
      itemTamanhoId: 100,
      quantidadeExpedida: quantidadeNaCaixa
    });

    // Quando zera, não há mais CaixaItems
    mockPrisma.caixaItem.findMany.mockResolvedValue([]);

    // Executar: ZERAR o item
    await service.updateItensByBox({
      id: 1,
      gradeId: 1,
      caixaNumber: '01',
      status: 'PRONTA',
      qtyCaixa: 0,
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
        itemQty: 0 // ← ZERAR
      }]
    });

    // Analisar operações
    console.log('\n📊 OPERAÇÕES DE ESTOQUE REALIZADAS:');
    console.log('=====================================');
    estoqueOperacoes.forEach((op, index) => {
      console.log(`${index + 1}. ${op.tipo}: ${op.valor > 0 ? '+' : ''}${op.valor} (itemTamanhoId: ${op.itemTamanhoId})`);
    });
    console.log('=====================================');

    // Calcular resultado final
    const totalIncrement = estoqueOperacoes
      .filter(op => op.tipo === 'INCREMENT')
      .reduce((sum, op) => sum + op.valor, 0);

    console.log(`\n🎯 RESULTADO:`);
    console.log(`Estoque INICIAL (antes de criar caixa): 0`);
    console.log(`Estoque APÓS criar caixa: -${quantidadeNaCaixa}`);
    console.log(`Total de INCREMENT ao zerar: +${totalIncrement}`);
    console.log(`Estoque FINAL esperado: 0`);
    console.log(`Estoque FINAL real: ${-quantidadeNaCaixa + totalIncrement}`);

    // Validar: Deve ter APENAS 1 increment de +10
    expect(estoqueOperacoes.filter(op => op.tipo === 'INCREMENT').length).toBe(1);
    expect(totalIncrement).toBe(quantidadeNaCaixa);

    if (totalIncrement > quantidadeNaCaixa) {
      console.error(`\n❌ BUG DETECTADO: Estoque está sendo incrementado MAIS que o necessário!`);
      console.error(`Deveria incrementar: ${quantidadeNaCaixa}`);
      console.error(`Incrementou: ${totalIncrement}`);
      fail('Duplicação de devolução ao estoque!');
    }

    if (totalIncrement === quantidadeNaCaixa) {
      console.log(`\n✅ CORRETO: Devolveu exatamente o que foi retirado!`);
    }
  });

  it('🔍 Cenário: Deletar caixa com múltiplos itens de uma vez', async () => {
    // Setup: Caixa com 3 itens diferentes
    const item1Qty = 10;
    const item2Qty = 5;
    const item3Qty = 8;

    mockPrisma.caixa.findUnique.mockResolvedValue({
      id: 1,
      caixaNumber: '01',
      gradeId: 1,
      caixaItem: [
        { id: 1, itemTamanhoId: 100, itemQty: item1Qty },
        { id: 2, itemTamanhoId: 101, itemQty: item2Qty },
        { id: 3, itemTamanhoId: 102, itemQty: item3Qty }
      ]
    });

    // Mock para cada item
    mockPrisma.itemTamanho.findUnique
      .mockResolvedValueOnce({ id: 100, isKit: false, estoque: { id: 1, quantidade: 0 }, kitMain: [] })
      .mockResolvedValueOnce({ id: 101, isKit: false, estoque: { id: 2, quantidade: 0 }, kitMain: [] })
      .mockResolvedValueOnce({ id: 102, isKit: false, estoque: { id: 3, quantidade: 0 }, kitMain: [] });

    mockPrisma.caixaItem.findFirst
      .mockResolvedValueOnce({ id: 1, itemTamanhoId: 100, itemQty: item1Qty })
      .mockResolvedValueOnce({ id: 2, itemTamanhoId: 101, itemQty: item2Qty })
      .mockResolvedValueOnce({ id: 3, itemTamanhoId: 102, itemQty: item3Qty });

    mockPrisma.outInput.findFirst
      .mockResolvedValueOnce({ id: 1, itemTamanhoId: 100, quantidade: item1Qty, estoqueId: 1 })
      .mockResolvedValueOnce({ id: 2, itemTamanhoId: 101, quantidade: item2Qty, estoqueId: 2 })
      .mockResolvedValueOnce({ id: 3, itemTamanhoId: 102, quantidade: item3Qty, estoqueId: 3 });

    mockPrisma.gradeItem.findFirst.mockResolvedValue(null);
    mockPrisma.caixaItem.findMany.mockResolvedValue([]);

    // Executar: ZERAR TODOS os itens de uma vez
    await service.updateItensByBox({
      id: 1,
      gradeId: 1,
      caixaNumber: '01',
      status: 'PRONTA',
      qtyCaixa: 0,
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
      projeto: 'Teste',
      escola: 'Teste',
      escolaNumero: '001',
      itens: [
        { id: 1, caixaId: 1, itemTamanhoId: 100, itemName: 'Item 1', itemGenero: 'UNISSEX', itemTam: 'M', itemQty: 0 },
        { id: 2, caixaId: 1, itemTamanhoId: 101, itemName: 'Item 2', itemGenero: 'UNISSEX', itemTam: 'M', itemQty: 0 },
        { id: 3, caixaId: 1, itemTamanhoId: 102, itemName: 'Item 3', itemGenero: 'UNISSEX', itemTam: 'M', itemQty: 0 }
      ]
    });

    // Analisar
    console.log('\n📊 OPERAÇÕES PARA MÚLTIPLOS ITENS:');
    estoqueOperacoes.forEach((op, index) => {
      console.log(`${index + 1}. ItemTamanhoId ${op.itemTamanhoId}: ${op.tipo} ${op.valor > 0 ? '+' : ''}${op.valor}`);
    });

    // Validar: Deve ter exatamente 3 increments
    expect(estoqueOperacoes.filter(op => op.tipo === 'INCREMENT').length).toBe(3);
    
    const incrementsPorItem = {
      100: estoqueOperacoes.filter(op => op.itemTamanhoId === 1 && op.tipo === 'INCREMENT').reduce((s, o) => s + o.valor, 0),
      101: estoqueOperacoes.filter(op => op.itemTamanhoId === 2 && op.tipo === 'INCREMENT').reduce((s, o) => s + o.valor, 0),
      102: estoqueOperacoes.filter(op => op.itemTamanhoId === 3 && op.tipo === 'INCREMENT').reduce((s, o) => s + o.valor, 0)
    };

    console.log('\n✅ Increments por item:');
    console.log(`Item 100: +${incrementsPorItem[100]} (esperado: ${item1Qty})`);
    console.log(`Item 101: +${incrementsPorItem[101]} (esperado: ${item2Qty})`);
    console.log(`Item 102: +${incrementsPorItem[102]} (esperado: ${item3Qty})`);
  });

});


