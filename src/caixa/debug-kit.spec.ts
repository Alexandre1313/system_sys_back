import { Test, TestingModule } from '@nestjs/testing';
import { CaixaPrisma } from './caixa.prisma';
import { PrismaProvider } from '../db/prisma.provider';

describe('Debug - Kit OutInput Update', () => {
  let service: CaixaPrisma;
  let mockPrisma: any;

  beforeEach(async () => {
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

  it('deve ajustar corretamente OutInput dos componentes do kit', async () => {
    mockPrisma.$transaction.mockImplementation(async (callback) => {
      return await callback(mockPrisma);
    });

    // Setup: Kit com 3 componentes
    const caixaAtual = {
      id: 1,
      caixaNumber: '01',
      gradeId: 1,
      qtyCaixa: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      grade: {
        status: 'ATIVO',
        escola: { 
          nome: 'Escola Teste',
          numeroEscola: '123',
          projeto: { nome: 'Projeto Teste' }
        }
      },
      caixaItem: [{ 
        id: 1, 
        caixaId: 1,
        itemTamanhoId: 1579, 
        itemQty: 3,
        itemName: 'Kit Teste',
        itemGenero: 'UNISSEX',
        itemTam: 'U',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }] // 3 kits
    };

    // Kit com 3 componentes (cada kit tem 2 de cada componente)
    mockPrisma.itemTamanho.findUnique.mockResolvedValue({
      id: 1579,
      isKit: true,
      estoque: null,
      kitComponents: [
        {
          componentId: 1337, // Componente 1
          quantidade: 2, // 2 por kit
          component: { id: 1337, estoque: { id: 1001 } }
        },
        {
          componentId: 1369, // Componente 2  
          quantidade: 2, // 2 por kit
          component: { id: 1369, estoque: { id: 1002 } }
        },
        {
          componentId: 1401, // Componente 3
          quantidade: 2, // 2 por kit
          component: { id: 1401, estoque: { id: 1003 } }
        }
      ]
    });

    // CaixaItem atual
    mockPrisma.caixaItem.findFirst.mockResolvedValue({
      id: 1,
      itemTamanhoId: 1579,
      itemQty: 3 // Atualmente 3 kits
    });

    // OutInputs dos componentes (atualmente 6 cada = 3 kits × 2)
    mockPrisma.outInput.findFirst
      .mockResolvedValueOnce({
        id: 139433, // Componente 1337
        itemTamanhoId: 1337,
        quantidade: 6, // 3 kits × 2 = 6
        estoqueId: 1001,
        kitOrigemId: 1579
      })
      .mockResolvedValueOnce({
        id: 139434, // Componente 1369
        itemTamanhoId: 1369,
        quantidade: 6, // 3 kits × 2 = 6
        estoqueId: 1002,
        kitOrigemId: 1579
      })
      .mockResolvedValueOnce({
        id: 139435, // Componente 1401
        itemTamanhoId: 1401,
        quantidade: 6, // 3 kits × 2 = 6
        estoqueId: 1003,
        kitOrigemId: 1579
      });

    // GradeItem do kit
    mockPrisma.gradeItem.findFirst.mockResolvedValue({
      id: 1,
      itemTamanhoId: 1579,
      quantidadeExpedida: 3
    });

    // Caixa final
    mockPrisma.caixa.findUnique.mockResolvedValue(caixaAtual);
    mockPrisma.caixaItem.findMany.mockResolvedValue([
      { id: 1, itemTamanhoId: 1579, itemQty: 1 }
    ]);

    // Dados da requisição - reduzir de 3 para 1 kit
    const caixaData = {
      id: 1,
      gradeId: 1,
      caixaNumber: '01',
      status: 'PENDENTE',
      qtyCaixa: 3,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      projeto: 'Teste Debug',
      escola: 'Escola Teste',
      escolaNumero: '001',
      itens: [{
        caixaId: 1,
        itemName: 'Kit Debug',
        itemGenero: 'MASCULINO',
        itemTam: 'M',
        itemQty: 1, // Reduzir de 3 para 1
        itemTamanhoId: 1579
      }]
    };

    const result = await service.updateItensByBox(caixaData);

    // Verificar se OutInput dos componentes foi atualizado corretamente
    // Esperado: 1 kit × 2 = 2 para cada componente
    expect(mockPrisma.outInput.update).toHaveBeenCalledWith({
      where: { id: 139433 }, // Componente 1337
      data: { quantidade: 2 } // 1 kit × 2 = 2
    });

    expect(mockPrisma.outInput.update).toHaveBeenCalledWith({
      where: { id: 139434 }, // Componente 1369
      data: { quantidade: 2 } // 1 kit × 2 = 2
    });

    expect(mockPrisma.outInput.update).toHaveBeenCalledWith({
      where: { id: 139435 }, // Componente 1401
      data: { quantidade: 2 } // 1 kit × 2 = 2
    });

    // Verificar se estoque foi incrementado corretamente
    // Diferença: 6 - 2 = 4 para cada componente
    expect(mockPrisma.estoque.update).toHaveBeenCalledWith({
      where: { id: 1001 },
      data: { quantidade: { increment: 4 } } // 4 devolvidos para estoque
    });

    expect(mockPrisma.estoque.update).toHaveBeenCalledWith({
      where: { id: 1002 },
      data: { quantidade: { increment: 4 } } // 4 devolvidos para estoque
    });

    expect(mockPrisma.estoque.update).toHaveBeenCalledWith({
      where: { id: 1003 },
      data: { quantidade: { increment: 4 } } // 4 devolvidos para estoque
    });

    // Verificar se GradeItem do kit foi ajustado
    expect(mockPrisma.gradeItem.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { 
        quantidadeExpedida: { 
          decrement: 2 // Diferença de 3 - 1 = 2
        } 
      }
    });

    // Verificar se CaixaItem foi atualizado
    expect(mockPrisma.caixaItem.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { itemQty: 1 }
    });
  });
});
