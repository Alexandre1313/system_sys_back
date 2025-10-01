/**
 * TESTE: Múltiplos ajustes de quantidade seguidos
 * 
 * Cenário reportado pelo usuário:
 * 1. Cria caixa com 10 itens → Estoque = -10
 * 2. Reduz para 8 → Estoque = -8
 * 3. Reduz para 5 → Estoque = -5  
 * 4. Reduz para 3 → Estoque = -3
 * 5. Zera (deleta) → Estoque = 0
 * 
 * Problema: Estoque fica POSITIVO no final
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CaixaPrisma } from './caixa.prisma';
import { PrismaProvider } from '../db/prisma.provider';

describe('🔄 TESTE: Múltiplos ajustes de caixa', () => {
  let service: CaixaPrisma;
  let mockPrisma: any;

  // Simular estoque real
  let estoqueSimulado = {
    id: 1,
    itemTamanhoId: 100,
    quantidade: 0 // Inicia em 0
  };

  // Simular OutInput
  let outInputSimulado = {
    id: 1,
    itemTamanhoId: 100,
    quantidade: 0,
    estoqueId: 1
  };

  // Simular CaixaItem
  let caixaItemSimulado = {
    id: 1,
    itemTamanhoId: 100,
    itemQty: 0
  };

  let historicoEstoque: Array<{ acao: string; quantidade: number }> = [];

  beforeEach(async () => {
    // Reset
    estoqueSimulado.quantidade = 0;
    outInputSimulado.quantidade = 0;
    caixaItemSimulado.itemQty = 0;
    historicoEstoque = [];

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
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn(),
        delete: jest.fn(),
      },
      caixaItem: {
        findFirst: jest.fn().mockImplementation(() => {
          return Promise.resolve({ ...caixaItemSimulado });
        }),
        findMany: jest.fn().mockImplementation(() => {
          if (caixaItemSimulado.itemQty === 0) return Promise.resolve([]);
          return Promise.resolve([{ ...caixaItemSimulado }]);
        }),
        update: jest.fn().mockImplementation((args) => {
          caixaItemSimulado.itemQty = args.data.itemQty;
          return Promise.resolve({ ...caixaItemSimulado });
        }),
        delete: jest.fn().mockImplementation(() => {
          caixaItemSimulado.itemQty = 0;
          return Promise.resolve({});
        }),
      },
      itemTamanho: {
        findUnique: jest.fn().mockResolvedValue({
          id: 100,
          isKit: false,
          estoque: estoqueSimulado,
          kitMain: []
        }),
      },
      outInput: {
        findFirst: jest.fn().mockImplementation(() => {
          return Promise.resolve({ ...outInputSimulado });
        }),
        update: jest.fn().mockImplementation((args) => {
          const quantidadeAntiga = outInputSimulado.quantidade;
          outInputSimulado.quantidade = args.data.quantidade;
          historicoEstoque.push({
            acao: `OutInput.update (${quantidadeAntiga} → ${args.data.quantidade})`,
            quantidade: estoqueSimulado.quantidade
          });
          return Promise.resolve({ ...outInputSimulado });
        }),
        delete: jest.fn().mockImplementation(() => {
          historicoEstoque.push({
            acao: `OutInput.delete (tinha ${outInputSimulado.quantidade})`,
            quantidade: estoqueSimulado.quantidade
          });
          outInputSimulado.quantidade = 0;
          return Promise.resolve({});
        }),
        deleteMany: jest.fn(),
      },
      estoque: {
        update: jest.fn().mockImplementation((args) => {
          if (args.data?.quantidade?.increment !== undefined) {
            const incremento = args.data.quantidade.increment;
            estoqueSimulado.quantidade += incremento;
            historicoEstoque.push({
              acao: `Estoque.increment(${incremento > 0 ? '+' : ''}${incremento})`,
              quantidade: estoqueSimulado.quantidade
            });
          } else if (args.data?.quantidade !== undefined) {
            const quantidadeAntiga = estoqueSimulado.quantidade;
            estoqueSimulado.quantidade = args.data.quantidade;
            historicoEstoque.push({
              acao: `Estoque.set(${quantidadeAntiga} → ${args.data.quantidade})`,
              quantidade: estoqueSimulado.quantidade
            });
          }
          return Promise.resolve({ ...estoqueSimulado });
        }),
      },
      gradeItem: {
        findFirst: jest.fn().mockResolvedValue({
          id: 1,
          itemTamanhoId: 100,
          quantidadeExpedida: 10
        }),
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

  async function ajustarCaixa(novaQuantidade: number) {
    historicoEstoque.push({
      acao: `>>> AJUSTE PARA ${novaQuantidade}`,
      quantidade: estoqueSimulado.quantidade
    });

    caixaItemSimulado.itemQty = novaQuantidade > 0 ? novaQuantidade : 10; // Simular quantidade atual

    await service.updateItensByBox({
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
    });
  }

  it('🎯 Cenário REAL do usuário: múltiplos ajustes + exclusão', async () => {
    console.log('\n📋 SIMULAÇÃO DO CENÁRIO REAL:');
    console.log('=====================================');
    
    // Simular que a caixa foi criada com 10 itens
    estoqueSimulado.quantidade = -10; // Após criação
    outInputSimulado.quantidade = 10;
    caixaItemSimulado.itemQty = 10;
    
    console.log('Estado inicial (após criar caixa):');
    console.log(`  Estoque: ${estoqueSimulado.quantidade}`);
    console.log(`  OutInput: ${outInputSimulado.quantidade}`);
    console.log(`  CaixaItem: ${caixaItemSimulado.itemQty}`);
    console.log('');

    // Ajuste 1: 10 → 8
    console.log('1️⃣ Ajuste 10 → 8');
    await ajustarCaixa(8);
    console.log(`  Estoque: ${estoqueSimulado.quantidade} (esperado: -8)`);
    expect(estoqueSimulado.quantidade).toBe(-8);

    // Ajuste 2: 8 → 5
    console.log('\n2️⃣ Ajuste 8 → 5');
    caixaItemSimulado.itemQty = 8; // Atualizar estado
    outInputSimulado.quantidade = 8;
    await ajustarCaixa(5);
    console.log(`  Estoque: ${estoqueSimulado.quantidade} (esperado: -5)`);
    expect(estoqueSimulado.quantidade).toBe(-5);

    // Ajuste 3: 5 → 3
    console.log('\n3️⃣ Ajuste 5 → 3');
    caixaItemSimulado.itemQty = 5;
    outInputSimulado.quantidade = 5;
    await ajustarCaixa(3);
    console.log(`  Estoque: ${estoqueSimulado.quantidade} (esperado: -3)`);
    expect(estoqueSimulado.quantidade).toBe(-3);

    // Ajuste 4: Zerar (deletar)
    console.log('\n4️⃣ Zerar (deletar caixa)');
    caixaItemSimulado.itemQty = 3;
    outInputSimulado.quantidade = 3;
    await ajustarCaixa(0);
    console.log(`  Estoque: ${estoqueSimulado.quantidade} (esperado: 0)`);

    // VALIDAÇÃO FINAL
    console.log('\n=====================================');
    console.log('📊 HISTÓRICO COMPLETO DE OPERAÇÕES:');
    historicoEstoque.forEach((h, i) => {
      console.log(`${i + 1}. ${h.acao.padEnd(40)} → Estoque: ${h.quantidade}`);
    });
    console.log('=====================================\n');

    if (estoqueSimulado.quantidade > 0) {
      console.error(`❌ BUG DETECTADO: Estoque ficou POSITIVO (${estoqueSimulado.quantidade})!`);
      console.error(`   Deveria estar em 0!`);
      fail(`Estoque positivo: ${estoqueSimulado.quantidade}`);
    } else if (estoqueSimulado.quantidade < 0) {
      console.error(`❌ BUG DETECTADO: Estoque ficou NEGATIVO (${estoqueSimulado.quantidade})!`);
      console.error(`   Deveria estar em 0!`);
      fail(`Estoque negativo: ${estoqueSimulado.quantidade}`);
    } else {
      console.log(`✅ SUCESSO: Estoque voltou para 0 corretamente!`);
    }

    expect(estoqueSimulado.quantidade).toBe(0);
  });

  it('🧪 Teste simplificado: Uma redução + exclusão', async () => {
    // Setup inicial
    estoqueSimulado.quantidade = -10;
    outInputSimulado.quantidade = 10;
    caixaItemSimulado.itemQty = 10;

    console.log('\nInicial: Estoque = -10, OutInput = 10, CaixaItem = 10');

    // Reduzir para 5
    console.log('Ajuste: 10 → 5');
    await ajustarCaixa(5);
    console.log(`Estoque após ajuste: ${estoqueSimulado.quantidade} (esperado: -5)`);
    expect(estoqueSimulado.quantidade).toBe(-5);

    // Zerar
    console.log('Ajuste: 5 → 0 (deletar)');
    caixaItemSimulado.itemQty = 5;
    outInputSimulado.quantidade = 5;
    await ajustarCaixa(0);
    console.log(`Estoque após deletar: ${estoqueSimulado.quantidade} (esperado: 0)`);
    
    expect(estoqueSimulado.quantidade).toBe(0);
  });

});


