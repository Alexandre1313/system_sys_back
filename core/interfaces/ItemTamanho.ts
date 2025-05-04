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
    url: string;
    peso?: number;       
    altura?: number;      
    largura?: number;     
    profundidade?: number; 
    createdAt?: Date;
    updatedAt?: Date;
    GradeItem?: GradeItem[];
}
