import Grade from "./Grade";
import ItemTamanho from "./ItemTamanho";

export default interface GradeItem {
    id?: number;
    gradeId: number;
    grade?: Grade;
    itemTamanhoId: number;
    itemTamanho?: ItemTamanho;
    quantidade: number;
    quantidadeExpedida: number;
    createdAt?: Date;
    updatedAt?: Date;
}
