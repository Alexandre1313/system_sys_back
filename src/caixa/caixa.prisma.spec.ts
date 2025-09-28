import { Test, TestingModule } from '@nestjs/testing';
import { CaixaPrisma } from './caixa.prisma';
import { PrismaProvider } from '../db/prisma.provider';

describe('CaixaPrisma - updateItensByBox', () => {
  let service: CaixaPrisma;
  let mockPrisma: any;

  beforeEach(async () => {
    // Mock do Prisma
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

  describe('Item Normal - Ajuste de Quantidade', () => {
    it('deve ajustar quantidade de item normal corretamente', async () => {
      // Mock da transação
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });

      // Mock dos dados
      const caixaAtual = {
        id: 1,
        caixaNumber: '01',
        gradeId: 1,
        caixaItem: [{ id: 1, itemTamanhoId: 100, itemQty: 5 }]
      };

      const itemTamanho = {
        id: 100,
        isKit: false,
        kitMain: []
      };

      const caixaItemAtual = {
        id: 1,
        itemTamanhoId: 100,
        itemQty: 5
      };

      const outInputItem = {
        id: 1,
        itemTamanhoId: 100,
        quantidade: 5,
        estoqueId: 1
      };

      const gradeItem = {
        id: 1,
        itemTamanhoId: 100,
        quantidadeExpedida: 5
      };

      // Configurar mocks
      mockPrisma.caixa.findUnique.mockResolvedValue(caixaAtual);
      mockPrisma.itemTamanho.findUnique.mockResolvedValue(itemTamanho);
      mockPrisma.caixaItem.findFirst.mockResolvedValue(caixaItemAtual);
      mockPrisma.outInput.findFirst.mockResolvedValue(outInputItem);
      mockPrisma.gradeItem.findFirst.mockResolvedValue(gradeItem);
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
        itens: [
          { 
            caixaId: 1,
            itemName: 'Item Teste',
            itemGenero: 'MASCULINO',
            itemTam: 'M',
            itemQty: 3,
            itemTamanhoId: 100
          }
        ]
      };

      // Executar
      const result = await service.updateItensByBox(caixaData);

      // Verificar chamadas
      expect(mockPrisma.outInput.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { quantidade: 3 }
      });

      expect(mockPrisma.estoque.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { quantidade: { increment: 2 } } // 5 - 3 = 2
      });

      expect(mockPrisma.gradeItem.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { quantidadeExpedida: { decrement: 2 } }
      });

      expect(mockPrisma.caixaItem.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { itemQty: 3 }
      });
    });
  });

  describe('Item Normal - Zerar Quantidade', () => {
    it('deve excluir item quando quantidade for zerada', async () => {
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });

      const caixaAtual = {
        id: 1,
        caixaNumber: '01',
        gradeId: 1,
        caixaItem: [{ id: 1, itemTamanhoId: 100, itemQty: 5 }]
      };

      const itemTamanho = {
        id: 100,
        isKit: false,
        kitMain: []
      };

      const caixaItemAtual = {
        id: 1,
        itemTamanhoId: 100,
        itemQty: 5
      };

      const outInputItem = {
        id: 1,
        itemTamanhoId: 100,
        quantidade: 5,
        estoqueId: 1
      };

      const gradeItem = {
        id: 1,
        itemTamanhoId: 100,
        quantidadeExpedida: 5
      };

      mockPrisma.caixa.findUnique.mockResolvedValue(caixaAtual);
      mockPrisma.itemTamanho.findUnique.mockResolvedValue(itemTamanho);
      mockPrisma.caixaItem.findFirst.mockResolvedValue(caixaItemAtual);
      mockPrisma.outInput.findFirst.mockResolvedValue(outInputItem);
      mockPrisma.gradeItem.findFirst.mockResolvedValue(gradeItem);
      mockPrisma.caixaItem.findMany.mockResolvedValue([]); // Caixa vazia

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
        itens: [
          { 
            caixaId: 1,
            itemName: 'Item Teste',
            itemGenero: 'MASCULINO',
            itemTam: 'M',
            itemQty: 0,
            itemTamanhoId: 100
          }
        ]
      };

      const result = await service.updateItensByBox(caixaData);

      // Verificar exclusões
      expect(mockPrisma.outInput.delete).toHaveBeenCalledWith({
        where: { id: 1 }
      });

      expect(mockPrisma.caixaItem.delete).toHaveBeenCalledWith({
        where: { id: 1 }
      });

      expect(mockPrisma.estoque.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { quantidade: { increment: 5 } }
      });

      expect(mockPrisma.gradeItem.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { quantidadeExpedida: { decrement: 5 } }
      });

      // Caixa deve ser excluída
      expect(mockPrisma.caixa.delete).toHaveBeenCalledWith({
        where: { id: 1 }
      });

      expect(result).toBeNull();
    });
  });

  describe('Kit - Ajuste de Quantidade', () => {
    it('deve ajustar quantidade de kit corretamente (componentes)', async () => {
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });

      const caixaAtual = {
        id: 1,
        caixaNumber: '01',
        gradeId: 1,
        caixaItem: [{ id: 1, itemTamanhoId: 200, itemQty: 2 }]
      };

      const itemTamanho = {
        id: 200,
        isKit: true,
        kitMain: [
          {
            componentId: 201,
            quantidade: 3, // 3 unidades do componente por kit
            component: {
              id: 201,
              estoque: { id: 2 }
            }
          }
        ]
      };

      const caixaItemAtual = {
        id: 1,
        itemTamanhoId: 200,
        itemQty: 2 // 2 kits
      };

      const outInputComponente = {
        id: 2,
        itemTamanhoId: 201,
        quantidade: 6, // 2 kits * 3 componentes = 6
        estoqueId: 2
      };

      const gradeItemComponente = {
        id: 2,
        itemTamanhoId: 201,
        quantidadeExpedida: 6
      };

      mockPrisma.caixa.findUnique.mockResolvedValue(caixaAtual);
      mockPrisma.itemTamanho.findUnique.mockResolvedValue(itemTamanho);
      mockPrisma.caixaItem.findFirst.mockResolvedValue(caixaItemAtual);
      mockPrisma.outInput.findFirst.mockResolvedValue(outInputComponente);
      mockPrisma.gradeItem.findFirst.mockResolvedValue(gradeItemComponente);
      mockPrisma.caixaItem.findMany.mockResolvedValue([
        { id: 1, itemTamanhoId: 200, itemQty: 1 }
      ]);

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
        itens: [
          { 
            caixaId: 1,
            itemName: 'Kit Teste',
            itemGenero: 'MASCULINO',
            itemTam: 'M',
            itemQty: 1,
            itemTamanhoId: 200
          }
        ]
      };

      const result = await service.updateItensByBox(caixaData);

      // Verificar ajuste do componente
      expect(mockPrisma.outInput.update).toHaveBeenCalledWith({
        where: { id: 2 },
        data: { quantidade: 3 } // 1 kit * 3 componentes = 3
      });

      expect(mockPrisma.estoque.update).toHaveBeenCalledWith({
        where: { id: 2 },
        data: { quantidade: { increment: 3 } } // 6 - 3 = 3
      });

      expect(mockPrisma.gradeItem.update).toHaveBeenCalledWith({
        where: { id: 2 },
        data: { quantidadeExpedida: { decrement: 3 } }
      });
    });
  });

  describe('Kit - Zerar Kit', () => {
    it('deve excluir kit e seus componentes quando quantidade for zerada', async () => {
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });

      const caixaAtual = {
        id: 1,
        caixaNumber: '01',
        gradeId: 1,
        caixaItem: [{ id: 1, itemTamanhoId: 200, itemQty: 2 }]
      };

      const itemTamanho = {
        id: 200,
        isKit: true,
        kitMain: [
          {
            componentId: 201,
            quantidade: 3,
            component: {
              id: 201,
              estoque: { id: 2 }
            }
          }
        ]
      };

      const caixaItemAtual = {
        id: 1,
        itemTamanhoId: 200,
        itemQty: 2
      };

      const outInputComponente = {
        id: 2,
        itemTamanhoId: 201,
        quantidade: 6, // 2 kits * 3 componentes
        estoqueId: 2
      };

      const gradeItemComponente = {
        id: 2,
        itemTamanhoId: 201,
        quantidadeExpedida: 6
      };

      mockPrisma.caixa.findUnique.mockResolvedValue(caixaAtual);
      mockPrisma.itemTamanho.findUnique.mockResolvedValue(itemTamanho);
      mockPrisma.caixaItem.findFirst.mockResolvedValue(caixaItemAtual);
      mockPrisma.outInput.findFirst.mockResolvedValue(outInputComponente);
      mockPrisma.gradeItem.findFirst.mockResolvedValue(gradeItemComponente);
      mockPrisma.caixaItem.findMany.mockResolvedValue([]); // Caixa vazia

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
        itens: [
          { 
            caixaId: 1,
            itemName: 'Kit Teste',
            itemGenero: 'MASCULINO',
            itemTam: 'M',
            itemQty: 0,
            itemTamanhoId: 200
          }
        ]
      };

      const result = await service.updateItensByBox(caixaData);

      // Verificar exclusão do componente
      expect(mockPrisma.outInput.delete).toHaveBeenCalledWith({
        where: { id: 2 }
      });

      expect(mockPrisma.estoque.update).toHaveBeenCalledWith({
        where: { id: 2 },
        data: { quantidade: { increment: 6 } }
      });

      expect(mockPrisma.gradeItem.update).toHaveBeenCalledWith({
        where: { id: 2 },
        data: { quantidadeExpedida: { decrement: 6 } }
      });

      // Caixa deve ser excluída
      expect(mockPrisma.caixa.delete).toHaveBeenCalledWith({
        where: { id: 1 }
      });

      expect(result).toBeNull();
    });
  });

  describe('Exclusão de Caixa', () => {
    it('deve reordenar números das caixas posteriores ao excluir', async () => {
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });

      const caixaAtual = {
        id: 1,
        caixaNumber: '02', // Caixa 02 será excluída
        gradeId: 1,
        caixaItem: [{ id: 1, itemTamanhoId: 100, itemQty: 5 }]
      };

      const caixasPosteriores = [
        { id: 2, caixaNumber: '03' },
        { id: 3, caixaNumber: '04' }
      ];

      mockPrisma.caixa.findUnique.mockResolvedValue(caixaAtual);
      mockPrisma.caixaItem.findMany.mockResolvedValue([]); // Caixa vazia
      mockPrisma.caixa.findMany.mockResolvedValue(caixasPosteriores);

      const caixaData = {
        id: 1,
        gradeId: 1,
        caixaNumber: '02',
        status: 'PENDENTE',
        qtyCaixa: 5,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        projeto: 'Teste',
        escola: 'Escola Teste',
        escolaNumero: '001',
        itens: [
          { 
            caixaId: 1,
            itemName: 'Item Teste',
            itemGenero: 'MASCULINO',
            itemTam: 'M',
            itemQty: 0,
            itemTamanhoId: 100
          }
        ]
      };

      const result = await service.updateItensByBox(caixaData);

      // Verificar reordenação das caixas posteriores
      expect(mockPrisma.caixa.update).toHaveBeenCalledWith({
        where: { id: 2 },
        data: { caixaNumber: '02' } // 03 -> 02
      });

      expect(mockPrisma.caixa.update).toHaveBeenCalledWith({
        where: { id: 3 },
        data: { caixaNumber: '03' } // 04 -> 03
      });
    });
  });
});