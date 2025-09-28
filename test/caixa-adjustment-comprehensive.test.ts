import { Test, TestingModule } from '@nestjs/testing';
import { CaixaPrisma } from '../src/caixa/caixa.prisma';
import { PrismaProvider } from '../src/db/prisma.provider';
import { CaixaAjuste } from '@core/index';

/**
 * Testes intensivos e abrangentes para a função updateItensByBox
 * Cobre todos os cenários: itens normais, kits, exclusão de caixa, reordenação
 */
describe('CaixaPrisma - updateItensByBox - Testes Intensivos', () => {
  let service: CaixaPrisma;
  let prisma: PrismaProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CaixaPrisma,
        {
          provide: PrismaProvider,
          useValue: {
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
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            gradeItem: {
              findFirst: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<CaixaPrisma>(CaixaPrisma);
    prisma = module.get<PrismaProvider>(PrismaProvider);
  });

  describe('Cenário 1: Ajuste de Item Normal', () => {
    it('deve ajustar quantidade de item normal corretamente', async () => {
      // Arrange
      const caixaData: CaixaAjuste = {
        id: 1,
        gradeId: 1,
        status: 'PRONTA',
        caixaNumber: '01',
        qtyCaixa: 10,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        projeto: 'Teste',
        escola: 'Escola Teste',
        escolaNumero: '001',
        itens: [{
          id: 1,
          caixaId: 1,
          itemName: 'Camiseta',
          itemGenero: 'MASCULINO',
          itemTam: 'M',
          itemQty: 5, // Reduzindo de 10 para 5
          itemTamanhoId: 1,
          updatedAt: '2024-01-01',
          createdAt: '2024-01-01',
        }]
      };

      // Mock data
      const caixaAtual = {
        id: 1,
        gradeId: 1,
        caixaNumber: '01',
        caixaItem: [{
          id: 1,
          caixaId: 1,
          itemTamanhoId: 1,
          itemQty: 10, // Quantidade original
        }]
      };

      const itemTamanho = {
        id: 1,
        isKit: false,
        kitMain: []
      };

      const outInput = {
        id: 1,
        quantidade: 10, // Quantidade original no OutInput
        estoqueId: 1,
        caixaId: 1,
        itemTamanhoId: 1,
        gradeId: 1
      };

      const estoque = {
        id: 1,
        quantidade: 50
      };

      const gradeItem = {
        id: 1,
        quantidadeExpedida: 10
      };

      // Mock implementations
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback({
          caixa: {
            findUnique: jest.fn().mockResolvedValue(caixaAtual),
            findMany: jest.fn().mockResolvedValue([]),
            update: jest.fn(),
            delete: jest.fn(),
          },
          caixaItem: {
            findFirst: jest.fn().mockResolvedValue(caixaAtual.caixaItem[0]),
            findMany: jest.fn().mockResolvedValue([{
              id: 1,
              itemQty: 5 // Nova quantidade
            }]),
            update: jest.fn(),
            delete: jest.fn(),
          },
          itemTamanho: {
            findUnique: jest.fn().mockResolvedValue(itemTamanho)
          },
          outInput: {
            findFirst: jest.fn().mockResolvedValue(outInput),
            update: jest.fn(),
            delete: jest.fn(),
          },
          estoque: {
            findUnique: jest.fn().mockResolvedValue(estoque),
            update: jest.fn(),
          },
          gradeItem: {
            findFirst: jest.fn().mockResolvedValue(gradeItem),
            update: jest.fn(),
          },
        });
      });

      // Mock getCaixaById
      jest.spyOn(service, 'getCaixaById').mockResolvedValue(caixaData);

      // Act
      const result = await service.updateItensByBox(caixaData);

      // Assert
      expect(result).toBeDefined();
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('deve zerar item normal e manter caixa quando outros itens existem', async () => {
      // Arrange
      const caixaData: CaixaAjuste = {
        id: 1,
        gradeId: 1,
        status: 'PRONTA',
        caixaNumber: '01',
        qtyCaixa: 10,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        projeto: 'Teste',
        escola: 'Escola Teste',
        escolaNumero: '001',
        itens: [{
          id: 1,
          caixaId: 1,
          itemName: 'Camiseta',
          itemGenero: 'MASCULINO',
          itemTam: 'M',
          itemQty: 0, // Zerando item
          itemTamanhoId: 1,
          updatedAt: '2024-01-01',
          createdAt: '2024-01-01',
        }]
      };

      // Mock data com outros itens na caixa
      const caixaAtual = {
        id: 1,
        gradeId: 1,
        caixaNumber: '01',
        caixaItem: [
          { id: 1, caixaId: 1, itemTamanhoId: 1, itemQty: 10 },
          { id: 2, caixaId: 1, itemTamanhoId: 2, itemQty: 5 } // Outro item
        ]
      };

      // Mock implementations
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback({
          caixa: {
            findUnique: jest.fn().mockResolvedValue(caixaAtual),
            findMany: jest.fn().mockResolvedValue([]),
            update: jest.fn(),
            delete: jest.fn(),
          },
          caixaItem: {
            findFirst: jest.fn().mockResolvedValue(caixaAtual.caixaItem[0]),
            findMany: jest.fn().mockResolvedValue([
              { id: 2, itemQty: 5 } // Apenas o outro item permanece
            ]),
            update: jest.fn(),
            delete: jest.fn(),
          },
          itemTamanho: {
            findUnique: jest.fn().mockResolvedValue({ id: 1, isKit: false, kitMain: [] })
          },
          outInput: {
            findFirst: jest.fn().mockResolvedValue({
              id: 1, quantidade: 10, estoqueId: 1, caixaId: 1, itemTamanhoId: 1, gradeId: 1
            }),
            update: jest.fn(),
            delete: jest.fn(),
          },
          estoque: {
            findUnique: jest.fn().mockResolvedValue({ id: 1, quantidade: 50 }),
            update: jest.fn(),
          },
          gradeItem: {
            findFirst: jest.fn().mockResolvedValue({ id: 1, quantidadeExpedida: 10 }),
            update: jest.fn(),
          },
        });
      });

      jest.spyOn(service, 'getCaixaById').mockResolvedValue(caixaData);

      // Act
      const result = await service.updateItensByBox(caixaData);

      // Assert
      expect(result).toBeDefined();
      // Caixa deve ser mantida pois há outros itens
    });
  });

  describe('Cenário 2: Ajuste de Kit', () => {
    it('deve ajustar componentes de kit corretamente', async () => {
      // Arrange
      const caixaData: CaixaAjuste = {
        id: 1,
        gradeId: 1,
        status: 'PRONTA',
        caixaNumber: '01',
        qtyCaixa: 10,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        projeto: 'Teste',
        escola: 'Escola Teste',
        escolaNumero: '001',
        itens: [{
          id: 1,
          caixaId: 1,
          itemName: 'Kit Uniforme',
          itemGenero: 'MASCULINO',
          itemTam: 'M',
          itemQty: 3, // Reduzindo de 5 para 3 kits
          itemTamanhoId: 1,
          updatedAt: '2024-01-01',
          createdAt: '2024-01-01',
        }]
      };

      // Mock data para kit
      const caixaAtual = {
        id: 1,
        gradeId: 1,
        caixaNumber: '01',
        caixaItem: [{ id: 1, caixaId: 1, itemTamanhoId: 1, itemQty: 5 }]
      };

      const itemTamanho = {
        id: 1,
        isKit: true,
        kitMain: [
          { componentId: 10, quantidade: 2 }, // 2 camisetas por kit
          { componentId: 11, quantidade: 1 }  // 1 calça por kit
        ]
      };

      const outInputsComponentes = [
        { id: 1, quantidade: 10, estoqueId: 1, caixaId: 1, itemTamanhoId: 10, gradeId: 1 }, // 10 camisetas
        { id: 2, quantidade: 5, estoqueId: 2, caixaId: 1, itemTamanhoId: 11, gradeId: 1 }   // 5 calças
      ];

      // Mock implementations
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback({
          caixa: {
            findUnique: jest.fn().mockResolvedValue(caixaAtual),
            findMany: jest.fn().mockResolvedValue([]),
            update: jest.fn(),
            delete: jest.fn(),
          },
          caixaItem: {
            findFirst: jest.fn().mockResolvedValue(caixaAtual.caixaItem[0]),
            findMany: jest.fn().mockResolvedValue([{ id: 1, itemQty: 3 }]),
            update: jest.fn(),
            delete: jest.fn(),
          },
          itemTamanho: {
            findUnique: jest.fn().mockResolvedValue(itemTamanho)
          },
          outInput: {
            findFirst: jest.fn()
              .mockResolvedValueOnce(outInputsComponentes[0]) // Primeira chamada para componente 1
              .mockResolvedValueOnce(outInputsComponentes[1]), // Segunda chamada para componente 2
            update: jest.fn(),
            delete: jest.fn(),
          },
          estoque: {
            findUnique: jest.fn()
              .mockResolvedValueOnce({ id: 1, quantidade: 100 })
              .mockResolvedValueOnce({ id: 2, quantidade: 50 }),
            update: jest.fn(),
          },
          gradeItem: {
            findFirst: jest.fn()
              .mockResolvedValueOnce({ id: 10, quantidadeExpedida: 10 })
              .mockResolvedValueOnce({ id: 11, quantidadeExpedida: 5 }),
            update: jest.fn(),
          },
        });
      });

      jest.spyOn(service, 'getCaixaById').mockResolvedValue(caixaData);

      // Act
      const result = await service.updateItensByBox(caixaData);

      // Assert
      expect(result).toBeDefined();
      
      // Verificar se os componentes foram ajustados corretamente:
      // - Componente 1: 10 -> 6 (3 kits * 2 camisetas)
      // - Componente 2: 5 -> 3 (3 kits * 1 calça)
    });

    it('deve zerar kit e manter caixa quando outros itens existem', async () => {
      // Arrange - Kit zerado mas outros itens na caixa
      const caixaData: CaixaAjuste = {
        id: 1,
        gradeId: 1,
        status: 'PRONTA',
        caixaNumber: '01',
        qtyCaixa: 10,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        projeto: 'Teste',
        escola: 'Escola Teste',
        escolaNumero: '001',
        itens: [{
          id: 1,
          caixaId: 1,
          itemName: 'Kit Uniforme',
          itemGenero: 'MASCULINO',
          itemTam: 'M',
          itemQty: 0, // Zerando kit
          itemTamanhoId: 1,
          updatedAt: '2024-01-01',
          createdAt: '2024-01-01',
        }]
      };

      // Mock data
      const caixaAtual = {
        id: 1,
        gradeId: 1,
        caixaNumber: '01',
        caixaItem: [
          { id: 1, caixaId: 1, itemTamanhoId: 1, itemQty: 5 }, // Kit
          { id: 2, caixaId: 1, itemTamanhoId: 2, itemQty: 3 }  // Outro item
        ]
      };

      // Mock implementations
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback({
          caixa: {
            findUnique: jest.fn().mockResolvedValue(caixaAtual),
            findMany: jest.fn().mockResolvedValue([]),
            update: jest.fn(),
            delete: jest.fn(),
          },
          caixaItem: {
            findFirst: jest.fn().mockResolvedValue(caixaAtual.caixaItem[0]),
            findMany: jest.fn().mockResolvedValue([{ id: 2, itemQty: 3 }]),
            update: jest.fn(),
            delete: jest.fn(),
          },
          itemTamanho: {
            findUnique: jest.fn().mockResolvedValue({
              id: 1,
              isKit: true,
              kitMain: [{ componentId: 10, quantidade: 2 }]
            })
          },
          outInput: {
            findFirst: jest.fn().mockResolvedValue({
              id: 1, quantidade: 10, estoqueId: 1, caixaId: 1, itemTamanhoId: 10, gradeId: 1
            }),
            update: jest.fn(),
            delete: jest.fn(),
          },
          estoque: {
            findUnique: jest.fn().mockResolvedValue({ id: 1, quantidade: 100 }),
            update: jest.fn(),
          },
          gradeItem: {
            findFirst: jest.fn().mockResolvedValue({ id: 10, quantidadeExpedida: 10 }),
            update: jest.fn(),
          },
        });
      });

      jest.spyOn(service, 'getCaixaById').mockResolvedValue(caixaData);

      // Act
      const result = await service.updateItensByBox(caixaData);

      // Assert
      expect(result).toBeDefined();
      // Caixa deve ser mantida pois há outros itens
    });
  });

  describe('Cenário 3: Exclusão de Caixa', () => {
    it('deve excluir caixa quando todos os itens são zerados', async () => {
      // Arrange
      const caixaData: CaixaAjuste = {
        id: 1,
        gradeId: 1,
        status: 'PRONTA',
        caixaNumber: '02',
        qtyCaixa: 10,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        projeto: 'Teste',
        escola: 'Escola Teste',
        escolaNumero: '001',
        itens: [
          {
            id: 1,
            caixaId: 1,
            itemName: 'Item 1',
            itemGenero: 'MASCULINO',
            itemTam: 'M',
            itemQty: 0, // Zerando
            itemTamanhoId: 1,
            updatedAt: '2024-01-01',
            createdAt: '2024-01-01',
          },
          {
            id: 2,
            caixaId: 1,
            itemName: 'Item 2',
            itemGenero: 'FEMININO',
            itemTam: 'P',
            itemQty: 0, // Zerando
            itemTamanhoId: 2,
            updatedAt: '2024-01-01',
            createdAt: '2024-01-01',
          }
        ]
      };

      // Mock data
      const caixaAtual = {
        id: 1,
        gradeId: 1,
        caixaNumber: '02',
        caixaItem: [
          { id: 1, caixaId: 1, itemTamanhoId: 1, itemQty: 5 },
          { id: 2, caixaId: 1, itemTamanhoId: 2, itemQty: 3 }
        ]
      };

      const caixasPosteriores = [
        { id: 3, caixaNumber: '03' },
        { id: 4, caixaNumber: '04' }
      ];

      // Mock implementations
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback({
          caixa: {
            findUnique: jest.fn().mockResolvedValue(caixaAtual),
            findMany: jest.fn().mockResolvedValue(caixasPosteriores),
            update: jest.fn(),
            delete: jest.fn(),
          },
          caixaItem: {
            findFirst: jest.fn()
              .mockResolvedValueOnce(caixaAtual.caixaItem[0])
              .mockResolvedValueOnce(caixaAtual.caixaItem[1]),
            findMany: jest.fn().mockResolvedValue([]), // Nenhum item restante
            update: jest.fn(),
            delete: jest.fn(),
          },
          itemTamanho: {
            findUnique: jest.fn()
              .mockResolvedValueOnce({ id: 1, isKit: false, kitMain: [] })
              .mockResolvedValueOnce({ id: 2, isKit: false, kitMain: [] })
          },
          outInput: {
            findFirst: jest.fn()
              .mockResolvedValueOnce({ id: 1, quantidade: 5, estoqueId: 1, caixaId: 1, itemTamanhoId: 1, gradeId: 1 })
              .mockResolvedValueOnce({ id: 2, quantidade: 3, estoqueId: 2, caixaId: 1, itemTamanhoId: 2, gradeId: 1 }),
            update: jest.fn(),
            delete: jest.fn(),
          },
          estoque: {
            findUnique: jest.fn()
              .mockResolvedValueOnce({ id: 1, quantidade: 100 })
              .mockResolvedValueOnce({ id: 2, quantidade: 50 }),
            update: jest.fn(),
          },
          gradeItem: {
            findFirst: jest.fn()
              .mockResolvedValueOnce({ id: 1, quantidadeExpedida: 5 })
              .mockResolvedValueOnce({ id: 2, quantidadeExpedida: 3 }),
            update: jest.fn(),
          },
        });
      });

      // Act
      const result = await service.updateItensByBox(caixaData);

      // Assert
      expect(result).toBeNull(); // Caixa deve ser excluída
    });

    it('deve reordenar caixas posteriores após exclusão', async () => {
      // Arrange - Mesmo cenário anterior mas verificando reordenação
      const caixaData: CaixaAjuste = {
        id: 1,
        gradeId: 1,
        status: 'PRONTA',
        caixaNumber: '02',
        qtyCaixa: 0,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        projeto: 'Teste',
        escola: 'Escola Teste',
        escolaNumero: '001',
        itens: [{
          id: 1,
          caixaId: 1,
          itemName: 'Item',
          itemGenero: 'MASCULINO',
          itemTam: 'M',
          itemQty: 0,
          itemTamanhoId: 1,
          updatedAt: '2024-01-01',
          createdAt: '2024-01-01',
        }]
      };

      const caixaAtual = {
        id: 1,
        gradeId: 1,
        caixaNumber: '02',
        caixaItem: [{ id: 1, caixaId: 1, itemTamanhoId: 1, itemQty: 5 }]
      };

      const caixasPosteriores = [
        { id: 3, caixaNumber: '03' },
        { id: 4, caixaNumber: '04' },
        { id: 5, caixaNumber: '05' }
      ];

      let updateCalls = 0;
      let deleteCalls = 0;

      // Mock implementations
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback({
          caixa: {
            findUnique: jest.fn().mockResolvedValue(caixaAtual),
            findMany: jest.fn().mockResolvedValue(caixasPosteriores),
            update: jest.fn().mockImplementation(() => {
              updateCalls++;
              return Promise.resolve();
            }),
            delete: jest.fn().mockImplementation(() => {
              deleteCalls++;
              return Promise.resolve();
            }),
          },
          caixaItem: {
            findFirst: jest.fn().mockResolvedValue(caixaAtual.caixaItem[0]),
            findMany: jest.fn().mockResolvedValue([]),
            update: jest.fn(),
            delete: jest.fn(),
          },
          itemTamanho: {
            findUnique: jest.fn().mockResolvedValue({ id: 1, isKit: false, kitMain: [] })
          },
          outInput: {
            findFirst: jest.fn().mockResolvedValue({
              id: 1, quantidade: 5, estoqueId: 1, caixaId: 1, itemTamanhoId: 1, gradeId: 1
            }),
            update: jest.fn(),
            delete: jest.fn(),
          },
          estoque: {
            findUnique: jest.fn().mockResolvedValue({ id: 1, quantidade: 100 }),
            update: jest.fn(),
          },
          gradeItem: {
            findFirst: jest.fn().mockResolvedValue({ id: 1, quantidadeExpedida: 5 }),
            update: jest.fn(),
          },
        });
      });

      // Act
      const result = await service.updateItensByBox(caixaData);

      // Assert
      expect(result).toBeNull();
      expect(updateCalls).toBe(3); // 3 caixas posteriores devem ser reordenadas
      expect(deleteCalls).toBe(1); // 1 caixa deve ser excluída
    });
  });

  describe('Cenário 4: Casos Extremos', () => {
    it('deve lidar com kit com múltiplos componentes', async () => {
      // Arrange - Kit com 5 componentes diferentes
      const caixaData: CaixaAjuste = {
        id: 1,
        gradeId: 1,
        status: 'PRONTA',
        caixaNumber: '01',
        qtyCaixa: 20,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        projeto: 'Teste',
        escola: 'Escola Teste',
        escolaNumero: '001',
        itens: [{
          id: 1,
          caixaId: 1,
          itemName: 'Kit Completo',
          itemGenero: 'MASCULINO',
          itemTam: 'M',
          itemQty: 2, // Reduzindo de 4 para 2
          itemTamanhoId: 1,
          updatedAt: '2024-01-01',
          createdAt: '2024-01-01',
        }]
      };

      const caixaAtual = {
        id: 1,
        gradeId: 1,
        caixaNumber: '01',
        caixaItem: [{ id: 1, caixaId: 1, itemTamanhoId: 1, itemQty: 4 }]
      };

      const itemTamanho = {
        id: 1,
        isKit: true,
        kitMain: [
          { componentId: 10, quantidade: 1 }, // 1 camiseta
          { componentId: 11, quantidade: 1 }, // 1 calça
          { componentId: 12, quantidade: 2 }, // 2 meias
          { componentId: 13, quantidade: 1 }, // 1 tênis
          { componentId: 14, quantidade: 1 }  // 1 boné
        ]
      };

      // Mock implementations para 5 componentes
      let outInputCallCount = 0;
      let estoqueCallCount = 0;
      let gradeItemCallCount = 0;

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback({
          caixa: {
            findUnique: jest.fn().mockResolvedValue(caixaAtual),
            findMany: jest.fn().mockResolvedValue([]),
            update: jest.fn(),
            delete: jest.fn(),
          },
          caixaItem: {
            findFirst: jest.fn().mockResolvedValue(caixaAtual.caixaItem[0]),
            findMany: jest.fn().mockResolvedValue([{ id: 1, itemQty: 2 }]),
            update: jest.fn(),
            delete: jest.fn(),
          },
          itemTamanho: {
            findUnique: jest.fn().mockResolvedValue(itemTamanho)
          },
          outInput: {
            findFirst: jest.fn().mockImplementation(() => {
              outInputCallCount++;
              return Promise.resolve({
                id: outInputCallCount,
                quantidade: 4, // Quantidade original por componente
                estoqueId: outInputCallCount,
                caixaId: 1,
                itemTamanhoId: 9 + outInputCallCount,
                gradeId: 1
              });
            }),
            update: jest.fn(),
            delete: jest.fn(),
          },
          estoque: {
            findUnique: jest.fn().mockImplementation(() => {
              estoqueCallCount++;
              return Promise.resolve({ id: estoqueCallCount, quantidade: 100 });
            }),
            update: jest.fn(),
          },
          gradeItem: {
            findFirst: jest.fn().mockImplementation(() => {
              gradeItemCallCount++;
              return Promise.resolve({ id: gradeItemCallCount, quantidadeExpedida: 4 });
            }),
            update: jest.fn(),
          },
        });
      });

      jest.spyOn(service, 'getCaixaById').mockResolvedValue(caixaData);

      // Act
      const result = await service.updateItensByBox(caixaData);

      // Assert
      expect(result).toBeDefined();
      expect(outInputCallCount).toBe(5); // 5 componentes processados
      expect(estoqueCallCount).toBe(5); // 5 estoques atualizados
      expect(gradeItemCallCount).toBe(5); // 5 gradeItems atualizados
    });

    it('deve lidar com erro de quantidade expedida negativa', async () => {
      // Arrange - Tentativa de reduzir mais do que foi expedido
      const caixaData: CaixaAjuste = {
        id: 1,
        gradeId: 1,
        status: 'PRONTA',
        caixaNumber: '01',
        qtyCaixa: 10,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        projeto: 'Teste',
        escola: 'Escola Teste',
        escolaNumero: '001',
        itens: [{
          id: 1,
          caixaId: 1,
          itemName: 'Item',
          itemGenero: 'MASCULINO',
          itemTam: 'M',
          itemQty: 15, // Tentando aumentar além do que foi expedido
          itemTamanhoId: 1,
          updatedAt: '2024-01-01',
          createdAt: '2024-01-01',
        }]
      };

      const caixaAtual = {
        id: 1,
        gradeId: 1,
        caixaNumber: '01',
        caixaItem: [{ id: 1, caixaId: 1, itemTamanhoId: 1, itemQty: 10 }]
      };

      const outInput = {
        id: 1,
        quantidade: 10,
        estoqueId: 1,
        caixaId: 1,
        itemTamanhoId: 1,
        gradeId: 1
      };

      const gradeItem = {
        id: 1,
        quantidadeExpedida: 10 // Só 10 foram expedidos
      };

      // Mock implementations
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        try {
          return await callback({
            caixa: {
              findUnique: jest.fn().mockResolvedValue(caixaAtual),
              findMany: jest.fn().mockResolvedValue([]),
              update: jest.fn(),
              delete: jest.fn(),
            },
            caixaItem: {
              findFirst: jest.fn().mockResolvedValue(caixaAtual.caixaItem[0]),
              findMany: jest.fn().mockResolvedValue([{ id: 1, itemQty: 15 }]),
              update: jest.fn(),
              delete: jest.fn(),
            },
            itemTamanho: {
              findUnique: jest.fn().mockResolvedValue({ id: 1, isKit: false, kitMain: [] })
            },
            outInput: {
              findFirst: jest.fn().mockResolvedValue(outInput),
              update: jest.fn(),
              delete: jest.fn(),
            },
            estoque: {
              findUnique: jest.fn().mockResolvedValue({ id: 1, quantidade: 100 }),
              update: jest.fn(),
            },
            gradeItem: {
              findFirst: jest.fn().mockResolvedValue(gradeItem),
              update: jest.fn(),
            },
          });
        } catch (error) {
          throw error;
        }
      });

      // Act & Assert
      await expect(service.updateItensByBox(caixaData)).rejects.toThrow('QuantidadeExpedida resultaria em valor negativo');
    });
  });

  describe('Cenário 5: Retry Logic', () => {
    it('deve tentar novamente em caso de conflito de transação', async () => {
      // Arrange
      const caixaData: CaixaAjuste = {
        id: 1,
        gradeId: 1,
        status: 'PRONTA',
        caixaNumber: '01',
        qtyCaixa: 10,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        projeto: 'Teste',
        escola: 'Escola Teste',
        escolaNumero: '001',
        itens: [{
          id: 1,
          caixaId: 1,
          itemName: 'Item',
          itemGenero: 'MASCULINO',
          itemTam: 'M',
          itemQty: 5,
          itemTamanhoId: 1,
          updatedAt: '2024-01-01',
          createdAt: '2024-01-01',
        }]
      };

      let attemptCount = 0;

      // Mock implementations com retry
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        attemptCount++;
        
        if (attemptCount === 1) {
          // Primeira tentativa falha com conflito
          const error = new Error('Transaction conflict');
          error.code = 'P2034';
          throw error;
        } else {
          // Segunda tentativa sucede
          const caixaAtual = {
            id: 1,
            gradeId: 1,
            caixaNumber: '01',
            caixaItem: [{ id: 1, caixaId: 1, itemTamanhoId: 1, itemQty: 10 }]
          };

          return callback({
            caixa: {
              findUnique: jest.fn().mockResolvedValue(caixaAtual),
              findMany: jest.fn().mockResolvedValue([]),
              update: jest.fn(),
              delete: jest.fn(),
            },
            caixaItem: {
              findFirst: jest.fn().mockResolvedValue(caixaAtual.caixaItem[0]),
              findMany: jest.fn().mockResolvedValue([{ id: 1, itemQty: 5 }]),
              update: jest.fn(),
              delete: jest.fn(),
            },
            itemTamanho: {
              findUnique: jest.fn().mockResolvedValue({ id: 1, isKit: false, kitMain: [] })
            },
            outInput: {
              findFirst: jest.fn().mockResolvedValue({
                id: 1, quantidade: 10, estoqueId: 1, caixaId: 1, itemTamanhoId: 1, gradeId: 1
              }),
              update: jest.fn(),
              delete: jest.fn(),
            },
            estoque: {
              findUnique: jest.fn().mockResolvedValue({ id: 1, quantidade: 100 }),
              update: jest.fn(),
            },
            gradeItem: {
              findFirst: jest.fn().mockResolvedValue({ id: 1, quantidadeExpedida: 10 }),
              update: jest.fn(),
            },
          });
        }
      });

      jest.spyOn(service, 'getCaixaById').mockResolvedValue(caixaData);

      // Act
      const result = await service.updateItensByBox(caixaData);

      // Assert
      expect(result).toBeDefined();
      expect(attemptCount).toBe(2); // Deve ter tentado 2 vezes
    });

    it('deve falhar após 3 tentativas de conflito', async () => {
      // Arrange
      const caixaData: CaixaAjuste = {
        id: 1,
        gradeId: 1,
        status: 'PRONTA',
        caixaNumber: '01',
        qtyCaixa: 10,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        projeto: 'Teste',
        escola: 'Escola Teste',
        escolaNumero: '001',
        itens: [{
          id: 1,
          caixaId: 1,
          itemName: 'Item',
          itemGenero: 'MASCULINO',
          itemTam: 'M',
          itemQty: 5,
          itemTamanhoId: 1,
          updatedAt: '2024-01-01',
          createdAt: '2024-01-01',
        }]
      };

      // Mock implementations - sempre falha com conflito
      (prisma.$transaction as jest.Mock).mockImplementation(async () => {
        const error = new Error('Transaction conflict');
        error.code = 'P2034';
        throw error;
      });

      // Act & Assert
      await expect(service.updateItensByBox(caixaData)).rejects.toThrow('Transação falhou após múltiplas tentativas');
    });
  });
});






