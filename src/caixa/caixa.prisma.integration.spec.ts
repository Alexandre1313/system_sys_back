import { Test, TestingModule } from '@nestjs/testing';
import { CaixaPrisma } from './caixa.prisma';
import { PrismaProvider } from '../db/prisma.provider';

describe('CaixaPrisma - updateItensByBox (Testes de Integração)', () => {
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

  describe('Validação da Lógica Principal', () => {
    it('deve processar item normal com redução de quantidade', async () => {
      // Mock da transação
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });

      // Setup completo dos dados
      const caixaAtual = {
        id: 1,
        caixaNumber: '01',
        gradeId: 1,
        grade: {
          status: 'ATIVO',
          escola: { nome: 'Escola Teste' },
          projeto: { nome: 'Projeto Teste' }
        },
        caixaItem: [{ id: 1, itemTamanhoId: 100, itemQty: 5 }]
      };

      // Mock ItemTamanho (item normal)
      mockPrisma.itemTamanho.findUnique.mockResolvedValue({
        id: 100,
        isKit: false,
        kitMain: []
      });

      // Mock CaixaItem
      mockPrisma.caixaItem.findFirst.mockResolvedValue({
        id: 1,
        itemTamanhoId: 100,
        itemQty: 5
      });

      // Mock OutInput
      mockPrisma.outInput.findFirst.mockResolvedValue({
        id: 1,
        itemTamanhoId: 100,
        quantidade: 5,
        estoqueId: 100
      });

      // Mock GradeItem
      mockPrisma.gradeItem.findFirst.mockResolvedValue({
        id: 1,
        itemTamanhoId: 100,
        quantidadeExpedida: 5
      });

      // Mock dados finais
      mockPrisma.caixa.findUnique.mockResolvedValue(caixaAtual);
      mockPrisma.caixaItem.findMany.mockResolvedValue([
        { id: 1, itemTamanhoId: 100, itemQty: 3 }
      ]);

      // Dados da requisição
      const caixaData = {
        id: 1,
        gradeId: 1,
        caixaNumber: '01',
        status: 'PENDENTE',
        qtyCaixa: 5,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        projeto: 'Teste',
        escola: 'Escola Teste',
        escolaNumero: '001',
        itens: [{
          caixaId: 1,
          itemName: 'Item Teste',
          itemGenero: 'MASCULINO',
          itemTam: 'M',
          itemQty: 3, // Reduzir de 5 para 3
          itemTamanhoId: 100
        }]
      };

      const result = await service.updateItensByBox(caixaData);

      // Verificações
      expect(mockPrisma.outInput.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { quantidade: 3 }
      });

      expect(mockPrisma.estoque.update).toHaveBeenCalledWith({
        where: { id: 100 },
        data: { quantidade: { increment: 2 } } // 5 - 3 = 2
      });

      expect(mockPrisma.gradeItem.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { quantidadeExpedida: { decrement: 2 } } // 5 - 3 = 2
      });

      expect(mockPrisma.caixaItem.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { itemQty: 3 }
      });

      expect(mockPrisma.caixa.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { qtyCaixa: 3 }
      });

      expect(result).toEqual(caixaData);
    });

    it('deve processar kit com redução de quantidade', async () => {
      // Mock da transação
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });

      // Setup completo dos dados
      const caixaAtual = {
        id: 1,
        caixaNumber: '01',
        gradeId: 1,
        grade: {
          status: 'ATIVO',
          escola: { nome: 'Escola Teste' },
          projeto: { nome: 'Projeto Teste' }
        },
        caixaItem: [{ id: 1, itemTamanhoId: 100, itemQty: 4 }]
      };

      // Mock ItemTamanho (kit)
      mockPrisma.itemTamanho.findUnique.mockResolvedValue({
        id: 100,
        isKit: true,
        kitMain: [
          {
            componentId: 101,
            quantidade: 2,
            component: { id: 101, estoque: { id: 101 } }
          },
          {
            componentId: 102,
            quantidade: 3,
            component: { id: 102, estoque: { id: 102 } }
          }
        ]
      });

      // Mock CaixaItem
      mockPrisma.caixaItem.findFirst.mockResolvedValue({
        id: 1,
        itemTamanhoId: 100,
        itemQty: 4
      });

      // Mock OutInput para componentes do kit
      mockPrisma.outInput.findFirst.mockImplementation(({ where }) => {
        if (where.kitOrigemId === 100) {
          const componentIndex = where.itemTamanhoId - 101;
          const qtdPorKit = componentIndex === 0 ? 2 : 3;
          const qtdTotal = 4 * qtdPorKit; // 4 kits × quantidade por kit
          return Promise.resolve({
            id: where.itemTamanhoId,
            itemTamanhoId: where.itemTamanhoId,
            quantidade: qtdTotal,
            estoqueId: where.itemTamanhoId
          });
        }
        return Promise.resolve(null);
      });

      // Mock GradeItem para componentes do kit
      mockPrisma.gradeItem.findFirst.mockImplementation(({ where }) => {
        const componentIndex = where.itemTamanhoId - 101;
        const qtdPorKit = componentIndex === 0 ? 2 : 3;
        const qtdTotal = 4 * qtdPorKit;
        return Promise.resolve({
          id: where.itemTamanhoId,
          itemTamanhoId: where.itemTamanhoId,
          quantidadeExpedida: qtdTotal
        });
      });

      // Mock dados finais
      mockPrisma.caixa.findUnique.mockResolvedValue(caixaAtual);
      mockPrisma.caixaItem.findMany.mockResolvedValue([
        { id: 1, itemTamanhoId: 100, itemQty: 2 }
      ]);

      // Dados da requisição
      const caixaData = {
        id: 1,
        gradeId: 1,
        caixaNumber: '01',
        status: 'PENDENTE',
        qtyCaixa: 4,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        projeto: 'Teste',
        escola: 'Escola Teste',
        escolaNumero: '001',
        itens: [{
          caixaId: 1,
          itemName: 'Kit Teste',
          itemGenero: 'MASCULINO',
          itemTam: 'M',
          itemQty: 2, // Reduzir de 4 para 2
          itemTamanhoId: 100
        }]
      };

      const result = await service.updateItensByBox(caixaData);

      // Verificações para componente 1 (2 por kit)
      expect(mockPrisma.outInput.update).toHaveBeenCalledWith({
        where: { id: 101 },
        data: { quantidade: 4 } // 2 kits × 2 = 4
      });

      expect(mockPrisma.estoque.update).toHaveBeenCalledWith({
        where: { id: 101 },
        data: { quantidade: { increment: 4 } } // 8 - 4 = 4
      });

      expect(mockPrisma.gradeItem.update).toHaveBeenCalledWith({
        where: { id: 101 },
        data: { quantidadeExpedida: { decrement: 4 } } // 8 - 4 = 4
      });

      // Verificações para componente 2 (3 por kit)
      expect(mockPrisma.outInput.update).toHaveBeenCalledWith({
        where: { id: 102 },
        data: { quantidade: 6 } // 2 kits × 3 = 6
      });

      expect(mockPrisma.estoque.update).toHaveBeenCalledWith({
        where: { id: 102 },
        data: { quantidade: { increment: 6 } } // 12 - 6 = 6
      });

      expect(mockPrisma.gradeItem.update).toHaveBeenCalledWith({
        where: { id: 102 },
        data: { quantidadeExpedida: { decrement: 6 } } // 12 - 6 = 6
      });

      // Verificação do CaixaItem do kit
      expect(mockPrisma.caixaItem.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { itemQty: 2 }
      });

      expect(result).toEqual(caixaData);
    });

    it('deve zerar item e excluir CaixaItem e OutInput', async () => {
      // Mock da transação
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });

      // Setup completo dos dados
      const caixaAtual = {
        id: 1,
        caixaNumber: '01',
        gradeId: 1,
        grade: {
          status: 'ATIVO',
          escola: { nome: 'Escola Teste' },
          projeto: { nome: 'Projeto Teste' }
        },
        caixaItem: [{ id: 1, itemTamanhoId: 100, itemQty: 3 }]
      };

      // Mock ItemTamanho (item normal)
      mockPrisma.itemTamanho.findUnique.mockResolvedValue({
        id: 100,
        isKit: false,
        kitMain: []
      });

      // Mock CaixaItem
      mockPrisma.caixaItem.findFirst.mockResolvedValue({
        id: 1,
        itemTamanhoId: 100,
        itemQty: 3
      });

      // Mock OutInput
      mockPrisma.outInput.findFirst.mockResolvedValue({
        id: 1,
        itemTamanhoId: 100,
        quantidade: 3,
        estoqueId: 100
      });

      // Mock GradeItem
      mockPrisma.gradeItem.findFirst.mockResolvedValue({
        id: 1,
        itemTamanhoId: 100,
        quantidadeExpedida: 3
      });

      // Mock dados finais - caixa vazia
      mockPrisma.caixa.findUnique.mockResolvedValue(caixaAtual);
      mockPrisma.caixaItem.findMany.mockResolvedValue([]);

      // Dados da requisição
      const caixaData = {
        id: 1,
        gradeId: 1,
        caixaNumber: '01',
        status: 'PENDENTE',
        qtyCaixa: 3,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        projeto: 'Teste',
        escola: 'Escola Teste',
        escolaNumero: '001',
        itens: [{
          caixaId: 1,
          itemName: 'Item Teste',
          itemGenero: 'MASCULINO',
          itemTam: 'M',
          itemQty: 0, // Zerar item
          itemTamanhoId: 100
        }]
      };

      const result = await service.updateItensByBox(caixaData);

      // Verificações de exclusão
      expect(mockPrisma.outInput.delete).toHaveBeenCalledWith({
        where: { id: 1 }
      });

      expect(mockPrisma.caixaItem.delete).toHaveBeenCalledWith({
        where: { id: 1 }
      });

      expect(mockPrisma.caixa.delete).toHaveBeenCalledWith({
        where: { id: 1 }
      });

      expect(result).toBeNull();
    });

    it('deve aumentar quantidade de item e remover do estoque', async () => {
      // Mock da transação
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });

      // Setup completo dos dados
      const caixaAtual = {
        id: 1,
        caixaNumber: '01',
        gradeId: 1,
        grade: {
          status: 'ATIVO',
          escola: { nome: 'Escola Teste' },
          projeto: { nome: 'Projeto Teste' }
        },
        caixaItem: [{ id: 1, itemTamanhoId: 100, itemQty: 2 }]
      };

      // Mock ItemTamanho (item normal)
      mockPrisma.itemTamanho.findUnique.mockResolvedValue({
        id: 100,
        isKit: false,
        kitMain: []
      });

      // Mock CaixaItem
      mockPrisma.caixaItem.findFirst.mockResolvedValue({
        id: 1,
        itemTamanhoId: 100,
        itemQty: 2
      });

      // Mock OutInput
      mockPrisma.outInput.findFirst.mockResolvedValue({
        id: 1,
        itemTamanhoId: 100,
        quantidade: 2,
        estoqueId: 100
      });

      // Mock GradeItem
      mockPrisma.gradeItem.findFirst.mockResolvedValue({
        id: 1,
        itemTamanhoId: 100,
        quantidadeExpedida: 2
      });

      // Mock dados finais
      mockPrisma.caixa.findUnique.mockResolvedValue(caixaAtual);
      mockPrisma.caixaItem.findMany.mockResolvedValue([
        { id: 1, itemTamanhoId: 100, itemQty: 5 }
      ]);

      // Dados da requisição
      const caixaData = {
        id: 1,
        gradeId: 1,
        caixaNumber: '01',
        status: 'PENDENTE',
        qtyCaixa: 2,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        projeto: 'Teste',
        escola: 'Escola Teste',
        escolaNumero: '001',
        itens: [{
          caixaId: 1,
          itemName: 'Item Teste',
          itemGenero: 'MASCULINO',
          itemTam: 'M',
          itemQty: 5, // Aumentar de 2 para 5
          itemTamanhoId: 100
        }]
      };

      const result = await service.updateItensByBox(caixaData);

      // Verificações
      expect(mockPrisma.outInput.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { quantidade: 5 }
      });

      expect(mockPrisma.estoque.update).toHaveBeenCalledWith({
        where: { id: 100 },
        data: { quantidade: { decrement: 3 } } // 5 - 2 = 3
      });

      expect(mockPrisma.gradeItem.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { quantidadeExpedida: { increment: 3 } } // 5 - 2 = 3
      });

      expect(mockPrisma.caixaItem.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { itemQty: 5 }
      });

      expect(mockPrisma.caixa.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { qtyCaixa: 5 }
      });

      expect(result).toEqual(caixaData);
    });
  });

  describe('Validação de Edge Cases', () => {
    it('deve lidar com transação P2034 e fazer retry', async () => {
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

      // Setup completo dos dados
      const caixaAtual = {
        id: 1,
        caixaNumber: '01',
        gradeId: 1,
        grade: {
          status: 'ATIVO',
          escola: { nome: 'Escola Teste' },
          projeto: { nome: 'Projeto Teste' }
        },
        caixaItem: [{ id: 1, itemTamanhoId: 100, itemQty: 1 }]
      };

      // Mocks básicos
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
        estoqueId: 100
      });

      mockPrisma.gradeItem.findFirst.mockResolvedValue({
        id: 1,
        itemTamanhoId: 100,
        quantidadeExpedida: 1
      });

      mockPrisma.caixa.findUnique.mockResolvedValue(caixaAtual);
      mockPrisma.caixaItem.findMany.mockResolvedValue([
        { id: 1, itemTamanhoId: 100, itemQty: 1 }
      ]);

      // Dados da requisição
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
      expect(result).toEqual(caixaData);
    });

    it('deve falhar após 3 tentativas de retry', async () => {
      mockPrisma.$transaction.mockImplementation(async () => {
        const error = new Error('Transaction failed') as any;
        error.code = 'P2034';
        throw error;
      });

      // Dados da requisição
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
});





