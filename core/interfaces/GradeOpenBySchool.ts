export default interface GradeOpenBySchool {
    projetoName: string;
    escolaNome: string;
    data: string;
    itens: {
        gradeId: number;        
        itemNome: string;
        tamanho: string;
        quantidadePrevista: number;
        quantidadeExpedida: number;
        quantidadeRestante: number;
        statusExpedicao: 'Concluído' | 'Pendente';
    }[];
}
