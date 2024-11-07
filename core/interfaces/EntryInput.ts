import Embalagem from "./Embalagem";
import ItemTamanho from "./ItemTamanho";

export default interface EntryInput {
    id?: number;
    embalagem?: Embalagem;
    embalagemId: number;
    itemTamanho?: ItemTamanho;
    itemTamanhoId: number;
    quantidade: number;
    createdAt?: Date;
    updatedAt?: Date;
}
