import ItemTamanho from "./ItemTamanho";

export default interface Tamanho {
    id?: number;
    nome: string;
    itens?: ItemTamanho[];
    createdAt?: Date;
    updatedAt?: Date;
}
