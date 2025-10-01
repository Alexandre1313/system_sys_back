import { CaixaPrisma } from './caixa.prisma';
import { PrismaProvider } from '../db/prisma.provider';
import { CaixaAjuste } from '@core/index';

// Mock do PrismaClient
const mockPrisma = {
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
    deleteMany: jest.fn(),
  },
  estoque: {
    update: jest.fn(),
  },
  gradeItem: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn(),
};

describe('Test - Caixa Deletion with OutInput Cleanup', () => {
  let service: CaixaPrisma;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CaixaPrisma(mockPrisma as unknown as PrismaProvider);
    // Mock da transação para executar o callback diretamente
    mockPrisma.$transaction.mockImplementation(async (callback) => {
      return await callback(mockPrisma);
    });
  });

  it('deve excluir caixa e limpar todos os OutInput quando todos os itens forem zerados', async () => {
    const gradeId = 1;
    const caixaId = 1;
    const kitItemTamanhoId = 1578; // ID do kit

    // Mock da caixa atual
    const caixaAtual = {
      id: caixaId,
      gradeId: gradeId,
      caixaNumber: '01',
      status: 'PENDENTE',
      qtyCaixa: 2, // 2 kits
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      projeto: 'Teste Debug',
      escola: 'Escola Teste',
      escolaNumero: '001',
      grade: {
        status: 'ATIVO',
        escola: {
          nome: 'Escola Teste',
          numeroEscola: '123',
          projeto: {
            nome: 'Projeto Teste'
          }
        }
      }
    };

    // Mock do CaixaItem atual para o kit
    const caixaItemAtual = {
      id: 1,
      caixaId: caixaId,
      itemName: 'Kit Teste',
      itemGenero: 'UNISSEX',
      itemTam: 'U',
      itemQty: 2, // 2 kits
      itemTamanhoId: kitItemTamanhoId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Mock do ItemTamanho para o kit
    const itemTamanhoKit = {
      id: kitItemTamanhoId,
      isKit: true,
      kitMain: [
        {
          componentId: 1336,
          quantidade: 2, // 2 peças do componente por kit
          component: {
            estoque: { id: 1001, quantidade: 100 }
          }
        }
      ]
    };

    // Mock dos OutInputs dos componentes
    const outInputComponente = {
      id: 139445,
      itemTamanhoId: 1336,
      quantidade: 4, // 2 kits * 2 peças/kit
      estoqueId: 1001,
      caixaId: caixaId,
      gradeId: gradeId,
      kitOrigemId: kitItemTamanhoId,
    };

    // Mock do GradeItem para o kit
    const gradeItemKit = {
      id: 1000,
      gradeId: gradeId,
      itemTamanhoId: kitItemTamanhoId,
      quantidade: 10,
      quantidadeExpedida: 2, // 2 kits expedidos
    };

    // Configurar mocks
    mockPrisma.caixa.findUnique.mockResolvedValue(caixaAtual);
    mockPrisma.caixaItem.findFirst.mockResolvedValue(caixaItemAtual);
    mockPrisma.itemTamanho.findUnique.mockResolvedValue(itemTamanhoKit);
    mockPrisma.outInput.findFirst.mockResolvedValue(outInputComponente);
    mockPrisma.gradeItem.findFirst.mockResolvedValue(gradeItemKit);
    
    // IMPORTANTE: caixaItemsRestantes retorna array vazio (todos zerados)
    mockPrisma.caixaItem.findMany.mockResolvedValue([]);
    
    // Mock para caixas posteriores (vazio para simplificar)
    mockPrisma.caixa.findMany.mockResolvedValue([]);

    // Dados da requisição - zerar todos os kits
    const caixaData: CaixaAjuste = {
      id: caixaId,
      gradeId: gradeId,
      caixaNumber: '01',
      status: 'PENDENTE',
      qtyCaixa: 0, // Zerar todos os kits
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      projeto: 'Teste Debug',
      escola: 'Escola Teste',
      escolaNumero: '001',
      itens: [
        {
          caixaId: caixaId,
          itemName: 'Kit Debug',
          itemGenero: 'UNISSEX',
          itemTam: 'U',
          itemQty: 0, // Zerar o kit
          itemTamanhoId: kitItemTamanhoId,
        },
      ],
    };

    // Executar
    const result = await service.updateItensByBox(caixaData);

    // Verificar se os OutInputs foram excluídos (não atualizados)
    expect(mockPrisma.outInput.delete).toHaveBeenCalledWith({
      where: { id: outInputComponente.id }
    });

    // Verificar se o GradeItem foi ajustado
    expect(mockPrisma.gradeItem.update).toHaveBeenCalledWith({
      where: { id: gradeItemKit.id },
      data: { quantidadeExpedida: { decrement: 2 } }, // Reduz 2 kits
    });

    // Verificar se o CaixaItem foi excluído
    expect(mockPrisma.caixaItem.delete).toHaveBeenCalledWith({
      where: { id: caixaItemAtual.id }
    });

    // Verificar se todos os OutInput da caixa foram excluídos
    expect(mockPrisma.outInput.deleteMany).toHaveBeenCalledWith({
      where: { caixaId: caixaId }
    });

    // Verificar se a caixa foi excluída
    expect(mockPrisma.caixa.delete).toHaveBeenCalledWith({
      where: { id: caixaId }
    });

    // Verificar resposta
    expect(result).toBeDefined();
    expect(result).toHaveProperty('status', 'EXCLUIDA');
    expect(result).toHaveProperty('mensagem', 'Caixa foi excluída pois todos os itens foram zerados');
    expect(result).toHaveProperty('qtyCaixa', 0);
    expect(result).toHaveProperty('itens', []);
  });
});





