import Grade from "./Grade";
import ItemTamanho from "./ItemTamanho";

export default interface GradeItem {
    id?: number;
    gradeId: number; // Relacionamento com Grade
    grade?: Grade; // Relacionamento opcional com Grade
    itemTamanhoId: number; // Relacionamento com ItemTamanho
    itemTamanho?: ItemTamanho; // Relacionamento opcional com ItemTamanho
    quantidade: number; // Quantidade total a ser expedida
    quantidadeExpedida: number; // Quantidade já expedida
    createdAt?: Date;
    updatedAt?: Date;
}
