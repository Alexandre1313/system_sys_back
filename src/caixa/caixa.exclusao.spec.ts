import { Test, TestingModule } from '@nestjs/testing';
import { CaixaPrisma } from './caixa.prisma';
import { PrismaProvider } from '../db/prisma.provider';

describe('CaixaPrisma - Exclusão de Caixa', () => {
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

  describe('Exclusão de Caixa - Retorno para Frontend', () => {
    it('deve retornar objeto indicando caixa excluída quando todos os itens são zerados', async () => {
      // Mock da transação
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });

      // Setup completo dos dados
      const caixaAtual = {
        id: 1,
        caixaNumber: '03',
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
        estoque: { id: 100 },
        kitComponents: []
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

      // Mock dados finais - caixa vazia (todos itens zerados)
      mockPrisma.caixa.findUnique.mockResolvedValue(caixaAtual);
      mockPrisma.caixaItem.findMany.mockResolvedValue([]); // Caixa vazia

      // Caixas posteriores para reordenação
      mockPrisma.caixa.findMany.mockResolvedValue([
        { id: 2, caixaNumber: '04' },
        { id: 3, caixaNumber: '05' }
      ]);

      // Dados da requisição - zerar todos os itens
      const caixaData = {
        id: 1,
        gradeId: 1,
        caixaNumber: '03',
        status: 'PENDENTE',
        qtyCaixa: 2,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        projeto: 'Teste Exclusão',
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

      // Verificar se retorna objeto indicando exclusão
      expect(result).toBeDefined();
      expect(result).toHaveProperty('status', 'EXCLUIDA');
      expect(result).toHaveProperty('mensagem', 'Caixa foi excluída pois todos os itens foram zerados');
      expect(result).toHaveProperty('qtyCaixa', 0);
      expect(result).toHaveProperty('itens', []);
      expect(result).toHaveProperty('id', 1);
      expect(result).toHaveProperty('caixaNumber', '03');

      // Verificar exclusões
      expect(mockPrisma.outInput.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mockPrisma.caixaItem.delete).toHaveBeenCalledWith({ where: { id: 1 } });
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
    });

    it('deve retornar objeto indicando caixa excluída para kit zerado', async () => {
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

      // Mock ItemTamanho (kit)
      mockPrisma.itemTamanho.findUnique.mockResolvedValue({
        id: 100,
        isKit: true,
        estoque: null,
        kitComponents: [
          {
            componentId: 101,
            quantidade: 2,
            component: {
              id: 101,
              estoque: { id: 101 }
            }
          }
        ]
      });

      // Mock CaixaItem
      mockPrisma.caixaItem.findFirst.mockResolvedValue({
        id: 1,
        itemTamanhoId: 100,
        itemQty: 3
      });

      // Mock OutInput para componente do kit
      mockPrisma.outInput.findFirst.mockResolvedValue({
        id: 1,
        itemTamanhoId: 101,
        quantidade: 6, // 3 kits × 2 = 6
        estoqueId: 101
      });

      // Mock GradeItem para componente
      mockPrisma.gradeItem.findFirst.mockResolvedValue({
        id: 1,
        itemTamanhoId: 101,
        quantidadeExpedida: 6
      });

      // Mock dados finais - caixa vazia
      mockPrisma.caixa.findUnique.mockResolvedValue(caixaAtual);
      mockPrisma.caixaItem.findMany.mockResolvedValue([]); // Caixa vazia

      // Caixas posteriores para reordenação
      mockPrisma.caixa.findMany.mockResolvedValue([]); // Nenhuma caixa posterior

      // Dados da requisição - zerar kit
      const caixaData = {
        id: 1,
        gradeId: 1,
        caixaNumber: '01',
        status: 'PENDENTE',
        qtyCaixa: 3,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        projeto: 'Teste Kit Exclusão',
        escola: 'Escola Teste',
        escolaNumero: '001',
        itens: [{
          caixaId: 1,
          itemName: 'Kit Teste',
          itemGenero: 'MASCULINO',
          itemTam: 'M',
          itemQty: 0, // Zerar kit
          itemTamanhoId: 100
        }]
      };

      const result = await service.updateItensByBox(caixaData);

      // Verificar se retorna objeto indicando exclusão
      expect(result).toBeDefined();
      expect(result).toHaveProperty('status', 'EXCLUIDA');
      expect(result).toHaveProperty('mensagem', 'Caixa foi excluída pois todos os itens foram zerados');
      expect(result).toHaveProperty('qtyCaixa', 0);
      expect(result).toHaveProperty('itens', []);

      // Verificar exclusões do componente do kit
      expect(mockPrisma.outInput.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mockPrisma.caixaItem.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mockPrisma.caixa.delete).toHaveBeenCalledWith({ where: { id: 1 } });

      // Verificar devolução para estoque do componente
      expect(mockPrisma.estoque.update).toHaveBeenCalledWith({
        where: { id: 101 },
        data: { quantidade: { increment: 6 } }
      });
    });

    it('deve retornar caixa atualizada quando nem todos os itens são zerados', async () => {
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
        caixaItem: [
          { id: 1, itemTamanhoId: 100, itemQty: 2 },
          { id: 2, itemTamanhoId: 200, itemQty: 3 }
        ]
      };

      // Mock ItemTamanho (item normal)
      mockPrisma.itemTamanho.findUnique.mockResolvedValue({
        id: 100,
        isKit: false,
        estoque: { id: 100 },
        kitComponents: []
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

      // Mock dados finais - caixa com itens restantes
      mockPrisma.caixa.findUnique.mockResolvedValue(caixaAtual);
      mockPrisma.caixaItem.findMany.mockResolvedValue([
        { id: 2, itemTamanhoId: 200, itemQty: 3 }
      ]);

      // Mock getCaixaById para retornar caixa atualizada
      jest.spyOn(service, 'getCaixaById').mockResolvedValue({
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
          itemName: 'Item Restante',
          itemGenero: 'MASCULINO',
          itemTam: 'M',
          itemQty: 3,
          itemTamanhoId: 200
        }]
      });

      // Dados da requisição - zerar apenas um item
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
            itemQty: 0, // Zerar este item
            itemTamanhoId: 100
          }
        ]
      };

      const result = await service.updateItensByBox(caixaData);

      // Verificar se retorna caixa atualizada (não excluída)
      expect(result).toBeDefined();
      expect(result).not.toHaveProperty('status', 'EXCLUIDA');
      expect(result).not.toHaveProperty('mensagem');
      expect(result).toHaveProperty('id', 1);
      expect(result).toHaveProperty('qtyCaixa', 3);

      // Verificar exclusões apenas do item zerado
      expect(mockPrisma.outInput.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mockPrisma.caixaItem.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      
      // Verificar que a caixa NÃO foi excluída
      expect(mockPrisma.caixa.delete).not.toHaveBeenCalled();
      
      // Verificar atualização da quantidade total
      expect(mockPrisma.caixa.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { qtyCaixa: 3 }
      });
    });
  });
});
