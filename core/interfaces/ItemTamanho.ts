import Barcode from "./Barcode";
import Estoque from "./Estoque";
import GradeItem from "./GradeItem";
import Item from "./Item";
import Tamanho from "./Tamanho";

export default interface ItemTamanho {
    id?: number;
    itemId: number; // Relacionamento com Item
    item?: Item; // Relacionamento opcional com Item
    tamanhoId: number; // Relacionamento com Tamanho
    tamanho?: Tamanho; // Relacionamento opcional com Tamanho
    barcode?: Barcode; // Relacionamento com o código de barras único
    estoque?: Estoque; // Estoque desse item/tamanho (opcional)
    createdAt?: Date;
    updatedAt?: Date;
    GradeItem?: GradeItem[]; // Relacionamento opcional com GradeItem
}
