import ItemTamanho from "./ItemTamanho";

export default interface Estoque {
    id?: number;
    itemTamanhoId: number;
    itemTamanho?: ItemTamanho;
    quantidade: number;
    createdAt?: Date;
    updatedAt?: Date;
}
