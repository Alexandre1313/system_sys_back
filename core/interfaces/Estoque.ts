import ItemTamanho from "./ItemTamanho";

export default interface Estoque {
    id?: number;
    itemTamanhoId: number; // Relacionamento com ItemTamanho
    itemTamanho?: ItemTamanho; // Relacionamento opcional com ItemTamanho
    quantidade: number; // Quantidade em estoque
    createdAt?: Date;
    updatedAt?: Date;
}
