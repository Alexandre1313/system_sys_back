export default interface EscolaGradesItems {
    id: number;
    numeroEscola: string;
    numberJoin: string;
    nome: string;
    projetoId: number;
    projeto: {
        id: number;
        nome: string;
    };
    grades: {
        id: number;
        tipo: string | null;
        finalizada: boolean;
        companyId: number;
        escolaId: number;
        status: string;
        company: {
            id: number;
            nome: string;
            email: string;
            cnpj: string;
        };
        gradeCaixas: {
            id: number;
            gradeId: number;
            escolaCaixa: string;
            escolaNumber: string;
            numberJoin: string;
            projeto: string;
            qtyCaixa: number;
            caixaNumber: string;
            userId: number;
            caixaItem: {
                id: number;
                itemName: string;
                itemGenero: string;
                itemTam: string;
                itemQty: number;
                caixaId: number;
                itemTamanhoId: number;
            }[];
        }[];
        itensGrade: {
            id: number;
            quantidade: number;
            quantidadeExpedida: number;
            qtyPCaixa: number;
            isCount: boolean;
            itemTamanhoId: number;
            itemTamanho: {
                id: number;
                itemNome: string;
                itemGenero: string;
                itemComposicao: string;
                itemId: number;
                tamanhoNome: string;
                tamanhoId: number;
                barcode: string;
                barcodeId: number;
                estoque: number;
                estoqueId: number;
            };
        }[];
    }[];
}
