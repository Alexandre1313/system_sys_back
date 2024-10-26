import CaixaItem from "./CaixaItem";

export default interface Caixa {
    id?: number;
    gradeId: number; // Código de barras único+
    escolaCaixa: string;
    caixaNumber: number;
    caixaItem: CaixaItem[]; // Relacionamento com ItemTamanho
    createdAt?: Date;
    updatedAt?: Date;
}
