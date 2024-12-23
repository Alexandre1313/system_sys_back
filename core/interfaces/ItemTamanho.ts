import Barcode from "./Barcode";
import Estoque from "./Estoque";
import GradeItem from "./GradeItem";
import Item from "./Item";
import Tamanho from "./Tamanho";

export default interface ItemTamanho {
    id?: number;
    itemId: number;
    item?: Item;
    tamanhoId: number;
    tamanho?: Tamanho;
    barcode?: Barcode;
    estoque?: Estoque;
    url: string
    createdAt?: Date;
    updatedAt?: Date;
    GradeItem?: GradeItem[];
}
