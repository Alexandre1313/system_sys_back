export default interface GradeOpenBySchool {
    escolaNome: string;
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
