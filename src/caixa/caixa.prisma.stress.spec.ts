import { Test, TestingModule } from '@nestjs/testing';
import { CaixaPrisma } from './caixa.prisma';
import { PrismaProvider } from '../db/prisma.provider';

describe('CaixaPrisma - updateItensByBox (Testes Pesados)', () => {
  let service: CaixaPrisma;
  let mockPrisma: any;

  beforeEach(async () => {
    // Mock completo do Prisma
    mockPrisma = {
      $transaction: jest.fn(),
      caixa: {
        findUnique: jest.fn(),
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
      },
      estoque: {
        update: jest.fn(),
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
  });

  describe('Cenários Complexos - Múltiplos Itens', () => {
    it('deve processar caixa com 10 itens diferentes (5 normais + 5 kits)', async () => {
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });

      // Setup: Caixa com 10 itens
      const caixaAtual = {
        id: 1,
        caixaNumber: '01',
        gradeId: 1,
        caixaItem: Array.from({ length: 10 }, (_, i) => ({
          id: i + 1,
          itemTamanhoId: i + 1,
          itemQty: 5
        }))
      };

      // Mock ItemTamanho (alternando entre normal e kit)
      mockPrisma.itemTamanho.findUnique.mockImplementation(({ where }) => {
        const isKit = where.id % 2 === 0; // Itens pares são kits
        return Promise.resolve({
          id: where.id,
          isKit,
          kitMain: isKit ? [
            {
              componentId: where.id + 100,
              quantidade: 2,
              component: { id: where.id + 100, estoque: { id: where.id + 100 } }
            },
            {
              componentId: where.id + 200,
              quantidade: 3,
              component: { id: where.id + 200, estoque: { id: where.id + 200 } }
            }
          ] : []
        });
      });

      // Mock CaixaItem
      mockPrisma.caixaItem.findFirst.mockImplementation(({ where }) => {
        return Promise.resolve({
          id: where.itemTamanhoId,
          itemTamanhoId: where.itemTamanhoId,
          itemQty: 5
        });
      });

      // Mock OutInput
      mockPrisma.outInput.findFirst.mockImplementation(({ where }) => {
        const isKit = where.itemTamanhoId % 2 === 0;
        const quantidade = isKit ? 10 : 5; // Kits têm mais quantidade total
        return Promise.resolve({
          id: where.itemTamanhoId,
          itemTamanhoId: where.itemTamanhoId,
          quantidade,
          estoqueId: where.itemTamanhoId
        });
      });

      // Mock GradeItem
      mockPrisma.gradeItem.findFirst.mockImplementation(({ where }) => {
        return Promise.resolve({
          id: where.itemTamanhoId,
          itemTamanhoId: where.itemTamanhoId,
          quantidadeExpedida: 5
        });
      });

      // Mock dados finais
      mockPrisma.caixa.findUnique.mockResolvedValue(caixaAtual);
      mockPrisma.caixaItem.findMany.mockResolvedValue(
        Array.from({ length: 10 }, (_, i) => ({
          id: i + 1,
          itemTamanhoId: i + 1,
          itemQty: 3 // Reduzidos para 3
        }))
      );

      // Dados da requisição - reduzir todos os itens
      const caixaData = {
        id: 1,
        gradeId: 1,
        caixaNumber: '01',
        status: 'PENDENTE',
        qtyCaixa: 50,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        projeto: 'Teste Complexo',
        escola: 'Escola Teste',
        escolaNumero: '001',
        itens: Array.from({ length: 10 }, (_, i) => ({
          caixaId: 1,
          itemName: `Item ${i + 1}`,
          itemGenero: 'MASCULINO',
          itemTam: 'M',
          itemQty: 3, // Reduzir de 5 para 3
          itemTamanhoId: i + 1
        }))
      };

      const result = await service.updateItensByBox(caixaData);

      // Verificar se todos os itens foram processados
      expect(mockPrisma.caixaItem.update).toHaveBeenCalledTimes(10);
      expect(mockPrisma.caixa.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { qtyCaixa: 30 } // 10 itens × 3 = 30
      });

      // Verificar processamento de kits (itens pares)
      const kitCalls = mockPrisma.outInput.update.mock.calls.filter((_, index) => (index + 1) % 2 === 0);
      expect(kitCalls.length).toBeGreaterThan(0);
    });

    it('deve zerar TODOS os itens e excluir a caixa', async () => {
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });

      // Setup: Caixa com 5 itens
      const caixaAtual = {
        id: 1,
        caixaNumber: '03',
        gradeId: 1,
        caixaItem: Array.from({ length: 5 }, (_, i) => ({
          id: i + 1,
          itemTamanhoId: i + 1,
          itemQty: 2
        }))
      };

      // Mock para todos os itens
      mockPrisma.itemTamanho.findUnique.mockResolvedValue({
        id: 1,
        isKit: false,
        kitMain: []
      });

      mockPrisma.caixaItem.findFirst.mockResolvedValue({
        id: 1,
        itemTamanhoId: 1,
        itemQty: 2
      });

      mockPrisma.outInput.findFirst.mockResolvedValue({
        id: 1,
        itemTamanhoId: 1,
        quantidade: 2,
        estoqueId: 1
      });

      mockPrisma.gradeItem.findFirst.mockResolvedValue({
        id: 1,
        itemTamanhoId: 1,
        quantidadeExpedida: 2
      });

      // Caixas posteriores para reordenação
      mockPrisma.caixa.findMany.mockResolvedValue([
        { id: 2, caixaNumber: '04' },
        { id: 3, caixaNumber: '05' },
        { id: 4, caixaNumber: '06' }
      ]);

      mockPrisma.caixa.findUnique.mockResolvedValue(caixaAtual);
      mockPrisma.caixaItem.findMany.mockResolvedValue([]); // Caixa vazia

      // Dados da requisição - zerar todos os itens
      const caixaData = {
        id: 1,
        gradeId: 1,
        caixaNumber: '03',
        status: 'PENDENTE',
        qtyCaixa: 10,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        projeto: 'Teste Exclusão',
        escola: 'Escola Teste',
        escolaNumero: '001',
        itens: Array.from({ length: 5 }, (_, i) => ({
          caixaId: 1,
          itemName: `Item ${i + 1}`,
          itemGenero: 'MASCULINO',
          itemTam: 'M',
          itemQty: 0, // Zerar todos
          itemTamanhoId: i + 1
        }))
      };

      const result = await service.updateItensByBox(caixaData);

      // Verificar exclusões
      expect(mockPrisma.outInput.delete).toHaveBeenCalledTimes(5);
      expect(mockPrisma.caixaItem.delete).toHaveBeenCalledTimes(5);
      expect(mockPrisma.caixa.delete).toHaveBeenCalledWith({ where: { id: 1 } });

      // Verificar reordenação das caixas posteriores
      expect(mockPrisma.caixa.update).toHaveBeenCalledWith({
        where: { id: 2 },
        data: { caixaNumber: '03' }
      });
      expect(mockPrisma.caixa.update).toHaveBeenCalledWith({
        where: { id: 3 },
        data: { caixaNumber: '04' }
      });
      expect(mockPrisma.caixa.update).toHaveBeenCalledWith({
        where: { id: 4 },
        data: { caixaNumber: '05' }
      });

      expect(result).toBeNull();
    });
  });

  describe('Cenários de Stress - Kits Complexos', () => {
    it('deve processar kit com 10 componentes diferentes', async () => {
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });

      const caixaAtual = {
        id: 1,
        caixaNumber: '01',
        gradeId: 1,
        caixaItem: [{ id: 1, itemTamanhoId: 100, itemQty: 3 }]
      };

      // Kit com 10 componentes
      const kitComponents = Array.from({ length: 10 }, (_, i) => ({
        componentId: 200 + i,
        quantidade: i + 1, // Quantidades diferentes: 1, 2, 3, ..., 10
        component: {
          id: 200 + i,
          estoque: { id: 200 + i }
        }
      }));

      mockPrisma.itemTamanho.findUnique.mockResolvedValue({
        id: 100,
        isKit: true,
        kitMain: kitComponents
      });

      mockPrisma.caixaItem.findFirst.mockResolvedValue({
        id: 1,
        itemTamanhoId: 100,
        itemQty: 3
      });

      // Mock OutInput para cada componente
      mockPrisma.outInput.findFirst.mockImplementation(({ where }) => {
        const componentIndex = where.itemTamanhoId - 200;
        const qtdPorKit = componentIndex + 1;
        const qtdTotal = 3 * qtdPorKit; // 3 kits × quantidade por kit
        return Promise.resolve({
          id: where.itemTamanhoId,
          itemTamanhoId: where.itemTamanhoId,
          quantidade: qtdTotal,
          estoqueId: where.itemTamanhoId
        });
      });

      mockPrisma.gradeItem.findFirst.mockImplementation(({ where }) => {
        const componentIndex = where.itemTamanhoId - 200;
        const qtdPorKit = componentIndex + 1;
        const qtdTotal = 3 * qtdPorKit;
        return Promise.resolve({
          id: where.itemTamanhoId,
          itemTamanhoId: where.itemTamanhoId,
          quantidadeExpedida: qtdTotal
        });
      });

      mockPrisma.caixa.findUnique.mockResolvedValue(caixaAtual);
      mockPrisma.caixaItem.findMany.mockResolvedValue([
        { id: 1, itemTamanhoId: 100, itemQty: 2 }
      ]);

      const caixaData = {
        id: 1,
        gradeId: 1,
        caixaNumber: '01',
        status: 'PENDENTE',
        qtyCaixa: 3,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        projeto: 'Teste Kit Complexo',
        escola: 'Escola Teste',
        escolaNumero: '001',
        itens: [{
          caixaId: 1,
          itemName: 'Kit Complexo',
          itemGenero: 'MASCULINO',
          itemTam: 'M',
          itemQty: 2, // Reduzir de 3 para 2
          itemTamanhoId: 100
        }]
      };

      const result = await service.updateItensByBox(caixaData);

      // Verificar se todos os 10 componentes foram processados
      expect(mockPrisma.outInput.update).toHaveBeenCalledTimes(10);
      expect(mockPrisma.estoque.update).toHaveBeenCalledTimes(10);
      expect(mockPrisma.gradeItem.update).toHaveBeenCalledTimes(10);

      // Verificar cálculos corretos para cada componente
      // Componente 1: 3 kits × 1 = 3 → 2 kits × 1 = 2 (diferença: 1)
      expect(mockPrisma.estoque.update).toHaveBeenCalledWith({
        where: { id: 201 },
        data: { quantidade: { increment: 1 } }
      });

      // Componente 10: 3 kits × 10 = 30 → 2 kits × 10 = 20 (diferença: 10)
      expect(mockPrisma.estoque.update).toHaveBeenCalledWith({
        where: { id: 209 },
        data: { quantidade: { increment: 10 } }
      });
    });

    it('deve zerar kit complexo com múltiplos componentes', async () => {
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });

      const caixaAtual = {
        id: 1,
        caixaNumber: '01',
        gradeId: 1,
        caixaItem: [{ id: 1, itemTamanhoId: 100, itemQty: 5 }]
      };

      // Kit com 5 componentes
      const kitComponents = Array.from({ length: 5 }, (_, i) => ({
        componentId: 200 + i,
        quantidade: (i + 1) * 2, // 2, 4, 6, 8, 10
        component: {
          id: 200 + i,
          estoque: { id: 200 + i }
        }
      }));

      mockPrisma.itemTamanho.findUnique.mockResolvedValue({
        id: 100,
        isKit: true,
        kitMain: kitComponents
      });

      mockPrisma.caixaItem.findFirst.mockResolvedValue({
        id: 1,
        itemTamanhoId: 100,
        itemQty: 5
      });

      // Mock OutInput para cada componente
      mockPrisma.outInput.findFirst.mockImplementation(({ where }) => {
        const componentIndex = where.itemTamanhoId - 200;
        const qtdPorKit = (componentIndex + 1) * 2;
        const qtdTotal = 5 * qtdPorKit; // 5 kits × quantidade por kit
        return Promise.resolve({
          id: where.itemTamanhoId,
          itemTamanhoId: where.itemTamanhoId,
          quantidade: qtdTotal,
          estoqueId: where.itemTamanhoId
        });
      });

      mockPrisma.gradeItem.findFirst.mockImplementation(({ where }) => {
        const componentIndex = where.itemTamanhoId - 200;
        const qtdPorKit = (componentIndex + 1) * 2;
        const qtdTotal = 5 * qtdPorKit;
        return Promise.resolve({
          id: where.itemTamanhoId,
          itemTamanhoId: where.itemTamanhoId,
          quantidadeExpedida: qtdTotal
        });
      });

      mockPrisma.caixa.findUnique.mockResolvedValue(caixaAtual);
      mockPrisma.caixaItem.findMany.mockResolvedValue([]); // Caixa vazia

      const caixaData = {
        id: 1,
        gradeId: 1,
        caixaNumber: '01',
        status: 'PENDENTE',
        qtyCaixa: 5,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        projeto: 'Teste Zerar Kit',
        escola: 'Escola Teste',
        escolaNumero: '001',
        itens: [{
          caixaId: 1,
          itemName: 'Kit para Zerar',
          itemGenero: 'MASCULINO',
          itemTam: 'M',
          itemQty: 0, // Zerar kit
          itemTamanhoId: 100
        }]
      };

      const result = await service.updateItensByBox(caixaData);

      // Verificar exclusões de todos os componentes
      expect(mockPrisma.outInput.delete).toHaveBeenCalledTimes(5);
      expect(mockPrisma.caixaItem.delete).toHaveBeenCalledTimes(1);

      // Verificar devolução total para estoque
      // Componente 1: 5 kits × 2 = 10
      expect(mockPrisma.estoque.update).toHaveBeenCalledWith({
        where: { id: 200 },
        data: { quantidade: { increment: 10 } }
      });

      // Componente 5: 5 kits × 10 = 50
      expect(mockPrisma.estoque.update).toHaveBeenCalledWith({
        where: { id: 204 },
        data: { quantidade: { increment: 50 } }
      });

      // Verificar devolução para GradeItem
      expect(mockPrisma.gradeItem.update).toHaveBeenCalledTimes(5);

      expect(result).toBeNull();
    });
  });

  describe('Edge Cases e Validações', () => {
    it('deve lidar com item não encontrado', async () => {
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });

      const caixaAtual = {
        id: 1,
        caixaNumber: '01',
        gradeId: 1,
        caixaItem: []
      };

      mockPrisma.caixa.findUnique.mockResolvedValue(caixaAtual);
      mockPrisma.itemTamanho.findUnique.mockResolvedValue(null); // Item não encontrado

      const caixaData = {
        id: 1,
        gradeId: 1,
        caixaNumber: '01',
        status: 'PENDENTE',
        qtyCaixa: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        projeto: 'Teste',
        escola: 'Escola Teste',
        escolaNumero: '001',
        itens: [{
          caixaId: 1,
          itemName: 'Item Inexistente',
          itemGenero: 'MASCULINO',
          itemTam: 'M',
          itemQty: 1,
          itemTamanhoId: 999
        }]
      };

      await expect(service.updateItensByBox(caixaData)).rejects.toThrow(
        'ItemTamanho não encontrado: 999'
      );
    });

    it('deve lidar com CaixaItem não encontrado', async () => {
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });

      const caixaAtual = {
        id: 1,
        caixaNumber: '01',
        gradeId: 1,
        caixaItem: []
      };

      mockPrisma.caixa.findUnique.mockResolvedValue(caixaAtual);
      mockPrisma.itemTamanho.findUnique.mockResolvedValue({
        id: 100,
        isKit: false,
        kitMain: []
      });
      mockPrisma.caixaItem.findFirst.mockResolvedValue(null); // CaixaItem não encontrado

      const caixaData = {
        id: 1,
        gradeId: 1,
        caixaNumber: '01',
        status: 'PENDENTE',
        qtyCaixa: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        projeto: 'Teste',
        escola: 'Escola Teste',
        escolaNumero: '001',
        itens: [{
          caixaId: 1,
          itemName: 'Item Sem CaixaItem',
          itemGenero: 'MASCULINO',
          itemTam: 'M',
          itemQty: 1,
          itemTamanhoId: 100
        }]
      };

      await expect(service.updateItensByBox(caixaData)).rejects.toThrow(
        'CaixaItem não encontrado para itemTamanhoId=100'
      );
    });

    it('deve lidar com OutInput não encontrado', async () => {
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });

      const caixaAtual = {
        id: 1,
        caixaNumber: '01',
        gradeId: 1,
        caixaItem: [{ id: 1, itemTamanhoId: 100, itemQty: 1 }]
      };

      mockPrisma.caixa.findUnique.mockResolvedValue(caixaAtual);
      mockPrisma.itemTamanho.findUnique.mockResolvedValue({
        id: 100,
        isKit: false,
        kitMain: []
      });
      mockPrisma.caixaItem.findFirst.mockResolvedValue({
        id: 1,
        itemTamanhoId: 100,
        itemQty: 1
      });
      mockPrisma.outInput.findFirst.mockResolvedValue(null); // OutInput não encontrado

      const caixaData = {
        id: 1,
        gradeId: 1,
        caixaNumber: '01',
        status: 'PENDENTE',
        qtyCaixa: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        projeto: 'Teste',
        escola: 'Escola Teste',
        escolaNumero: '001',
        itens: [{
          caixaId: 1,
          itemName: 'Item Sem OutInput',
          itemGenero: 'MASCULINO',
          itemTam: 'M',
          itemQty: 1,
          itemTamanhoId: 100
        }]
      };

      await expect(service.updateItensByBox(caixaData)).rejects.toThrow(
        'OutInput não encontrado para item normal 100'
      );
    });

    it('deve lidar com transação falhando (P2034)', async () => {
      let attemptCount = 0;
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        attemptCount++;
        if (attemptCount < 3) {
          const error = new Error('Transaction failed') as any;
          error.code = 'P2034';
          throw error;
        }
        return await callback(mockPrisma);
      });

      const caixaAtual = {
        id: 1,
        caixaNumber: '01',
        gradeId: 1,
        caixaItem: [{ id: 1, itemTamanhoId: 100, itemQty: 1 }]
      };

      mockPrisma.caixa.findUnique.mockResolvedValue(caixaAtual);
      mockPrisma.itemTamanho.findUnique.mockResolvedValue({
        id: 100,
        isKit: false,
        kitMain: []
      });
      mockPrisma.caixaItem.findFirst.mockResolvedValue({
        id: 1,
        itemTamanhoId: 100,
        itemQty: 1
      });
      mockPrisma.outInput.findFirst.mockResolvedValue({
        id: 1,
        itemTamanhoId: 100,
        quantidade: 1,
        estoqueId: 1
      });
      mockPrisma.gradeItem.findFirst.mockResolvedValue({
        id: 1,
        itemTamanhoId: 100,
        quantidadeExpedida: 1
      });
      mockPrisma.caixaItem.findMany.mockResolvedValue([
        { id: 1, itemTamanhoId: 100, itemQty: 1 }
      ]);

      const caixaData = {
        id: 1,
        gradeId: 1,
        caixaNumber: '01',
        status: 'PENDENTE',
        qtyCaixa: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        projeto: 'Teste Retry',
        escola: 'Escola Teste',
        escolaNumero: '001',
        itens: [{
          caixaId: 1,
          itemName: 'Item Teste',
          itemGenero: 'MASCULINO',
          itemTam: 'M',
          itemQty: 1,
          itemTamanhoId: 100
        }]
      };

      const result = await service.updateItensByBox(caixaData);

      // Deve ter tentado 3 vezes antes de suceder
      expect(attemptCount).toBe(3);
      expect(mockPrisma.caixaItem.update).toHaveBeenCalled();
    });

    it('deve falhar após 3 tentativas de retry', async () => {
      mockPrisma.$transaction.mockImplementation(async () => {
        const error = new Error('Transaction failed') as any;
        error.code = 'P2034';
        throw error;
      });

      const caixaAtual = {
        id: 1,
        caixaNumber: '01',
        gradeId: 1,
        caixaItem: [{ id: 1, itemTamanhoId: 100, itemQty: 1 }]
      };

      mockPrisma.caixa.findUnique.mockResolvedValue(caixaAtual);

      const caixaData = {
        id: 1,
        gradeId: 1,
        caixaNumber: '01',
        status: 'PENDENTE',
        qtyCaixa: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        projeto: 'Teste Falha',
        escola: 'Escola Teste',
        escolaNumero: '001',
        itens: [{
          caixaId: 1,
          itemName: 'Item Teste',
          itemGenero: 'MASCULINO',
          itemTam: 'M',
          itemQty: 1,
          itemTamanhoId: 100
        }]
      };

      await expect(service.updateItensByBox(caixaData)).rejects.toThrow(
        'Transação falhou após múltiplas tentativas (P2034)'
      );
    });
  });

  describe('Testes de Performance', () => {
    it('deve processar 100 itens em tempo aceitável', async () => {
      const startTime = Date.now();

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });

      // Setup para 100 itens
      const caixaAtual = {
        id: 1,
        caixaNumber: '01',
        gradeId: 1,
        caixaItem: Array.from({ length: 100 }, (_, i) => ({
          id: i + 1,
          itemTamanhoId: i + 1,
          itemQty: 1
        }))
      };

      // Mock otimizado
      mockPrisma.itemTamanho.findUnique.mockResolvedValue({
        id: 1,
        isKit: false,
        kitMain: []
      });

      mockPrisma.caixaItem.findFirst.mockResolvedValue({
        id: 1,
        itemTamanhoId: 1,
        itemQty: 1
      });

      mockPrisma.outInput.findFirst.mockResolvedValue({
        id: 1,
        itemTamanhoId: 1,
        quantidade: 1,
        estoqueId: 1
      });

      mockPrisma.gradeItem.findFirst.mockResolvedValue({
        id: 1,
        itemTamanhoId: 1,
        quantidadeExpedida: 1
      });

      mockPrisma.caixa.findUnique.mockResolvedValue(caixaAtual);
      mockPrisma.caixaItem.findMany.mockResolvedValue(
        Array.from({ length: 100 }, (_, i) => ({
          id: i + 1,
          itemTamanhoId: i + 1,
          itemQty: 1
        }))
      );

      const caixaData = {
        id: 1,
        gradeId: 1,
        caixaNumber: '01',
        status: 'PENDENTE',
        qtyCaixa: 100,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        projeto: 'Teste Performance',
        escola: 'Escola Teste',
        escolaNumero: '001',
        itens: Array.from({ length: 100 }, (_, i) => ({
          caixaId: 1,
          itemName: `Item ${i + 1}`,
          itemGenero: 'MASCULINO',
          itemTam: 'M',
          itemQty: 1,
          itemTamanhoId: i + 1
        }))
      };

      const result = await service.updateItensByBox(caixaData);

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Deve processar 100 itens em menos de 5 segundos
      expect(executionTime).toBeLessThan(5000);
      expect(mockPrisma.caixaItem.update).toHaveBeenCalledTimes(100);
    });
  });

  describe('Cenários de Dados Reais', () => {
    it('deve simular cenário real: caixa de uniforme escolar', async () => {
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });

      // Cenário: Caixa com uniforme escolar (kit) + itens individuais
      const caixaAtual = {
        id: 1,
        caixaNumber: '01',
        gradeId: 1,
        caixaItem: [
          { id: 1, itemTamanhoId: 100, itemQty: 10 }, // Kit Uniforme
          { id: 2, itemTamanhoId: 200, itemQty: 5 },  // Tênis
          { id: 3, itemTamanhoId: 300, itemQty: 8 }   // Meia
        ]
      };

      // Kit Uniforme: Camisa + Calça + Jaqueta
      mockPrisma.itemTamanho.findUnique.mockImplementation(({ where }) => {
        if (where.id === 100) {
          return Promise.resolve({
            id: 100,
            isKit: true,
            kitMain: [
              {
                componentId: 101, // Camisa
                quantidade: 1,
                component: { id: 101, estoque: { id: 101 } }
              },
              {
                componentId: 102, // Calça
                quantidade: 1,
                component: { id: 102, estoque: { id: 102 } }
              },
              {
                componentId: 103, // Jaqueta
                quantidade: 1,
                component: { id: 103, estoque: { id: 103 } }
              }
            ]
          });
        } else {
          // Itens normais
          return Promise.resolve({
            id: where.id,
            isKit: false,
            kitMain: []
          });
        }
      });

      mockPrisma.caixaItem.findFirst.mockImplementation(({ where }) => {
        const item = caixaAtual.caixaItem.find(ci => ci.itemTamanhoId === where.itemTamanhoId);
        return Promise.resolve(item);
      });

      mockPrisma.outInput.findFirst.mockImplementation(({ where }) => {
        if (where.kitOrigemId === 100) {
          // Componente do kit uniforme
          return Promise.resolve({
            id: where.itemTamanhoId,
            itemTamanhoId: where.itemTamanhoId,
            quantidade: 10, // 10 kits × 1 componente = 10
            estoqueId: where.itemTamanhoId
          });
        } else {
          // Itens normais
          const item = caixaAtual.caixaItem.find(ci => ci.itemTamanhoId === where.itemTamanhoId);
          return Promise.resolve({
            id: where.itemTamanhoId,
            itemTamanhoId: where.itemTamanhoId,
            quantidade: item.itemQty,
            estoqueId: where.itemTamanhoId
          });
        }
      });

      mockPrisma.gradeItem.findFirst.mockImplementation(({ where }) => {
        if ([101, 102, 103].includes(where.itemTamanhoId)) {
          // Componentes do kit
          return Promise.resolve({
            id: where.itemTamanhoId,
            itemTamanhoId: where.itemTamanhoId,
            quantidadeExpedida: 10
          });
        } else {
          // Itens normais
          const item = caixaAtual.caixaItem.find(ci => ci.itemTamanhoId === where.itemTamanhoId);
          return Promise.resolve({
            id: where.itemTamanhoId,
            itemTamanhoId: where.itemTamanhoId,
            quantidadeExpedida: item.itemQty
          });
        }
      });

      mockPrisma.caixa.findUnique.mockResolvedValue(caixaAtual);
      mockPrisma.caixaItem.findMany.mockResolvedValue([
        { id: 1, itemTamanhoId: 100, itemQty: 8 },  // Kit reduzido
        { id: 2, itemTamanhoId: 200, itemQty: 3 },  // Tênis reduzido
        { id: 3, itemTamanhoId: 300, itemQty: 8 }   // Meia inalterada
      ]);

      const caixaData = {
        id: 1,
        gradeId: 1,
        caixaNumber: '01',
        status: 'PENDENTE',
        qtyCaixa: 23,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        projeto: 'Uniforme Escolar',
        escola: 'Escola Municipal',
        escolaNumero: '001',
        itens: [
          {
            caixaId: 1,
            itemName: 'Kit Uniforme Completo',
            itemGenero: 'UNISSEX',
            itemTam: 'M',
            itemQty: 8, // Reduzir de 10 para 8
            itemTamanhoId: 100
          },
          {
            caixaId: 1,
            itemName: 'Tênis Escolar',
            itemGenero: 'UNISSEX',
            itemTam: '35',
            itemQty: 3, // Reduzir de 5 para 3
            itemTamanhoId: 200
          },
          {
            caixaId: 1,
            itemName: 'Meia Escolar',
            itemGenero: 'UNISSEX',
            itemTam: 'M',
            itemQty: 8, // Manter 8
            itemTamanhoId: 300
          }
        ]
      };

      const result = await service.updateItensByBox(caixaData);

      // Verificar processamento do kit (3 componentes)
      expect(mockPrisma.outInput.update).toHaveBeenCalledWith({
        where: { id: 101 },
        data: { quantidade: 8 } // 8 kits × 1 camisa = 8
      });
      expect(mockPrisma.outInput.update).toHaveBeenCalledWith({
        where: { id: 102 },
        data: { quantidade: 8 } // 8 kits × 1 calça = 8
      });
      expect(mockPrisma.outInput.update).toHaveBeenCalledWith({
        where: { id: 103 },
        data: { quantidade: 8 } // 8 kits × 1 jaqueta = 8
      });

      // Verificar devolução para estoque (diferença de 2 para cada componente)
      expect(mockPrisma.estoque.update).toHaveBeenCalledWith({
        where: { id: 101 },
        data: { quantidade: { increment: 2 } } // 10 - 8 = 2
      });

      // Verificar processamento dos itens normais
      expect(mockPrisma.outInput.update).toHaveBeenCalledWith({
        where: { id: 200 },
        data: { quantidade: 3 } // Tênis reduzido
      });

      // Verificar atualização da caixa
      expect(mockPrisma.caixa.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { qtyCaixa: 19 } // 8 + 3 + 8 = 19
      });
    });
  });
});
