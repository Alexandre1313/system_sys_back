export default interface DataInserctionUni {
    projeto: string;
    escolas: {
        nome: string;
        numeroEscola: string;
        numberJoin: string,
        itens: {
            nome: string;
            genero: 'MASCULINO' | 'FEMININO' | 'UNISSEX';
            tamanhos: {
                tamanho: string;
                quantidade: number;
            }[];
        }[];
    }[];
}
