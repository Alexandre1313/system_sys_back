import ItemTamanho from "./ItemTamanho";

export default interface Tamanho {
    id?: number;
    nome: string; // Tamanho P, M, G, GG, etc.
    itens?: ItemTamanho[]; // Itens que possuem esse tamanho
    createdAt?: Date;
    updatedAt?: Date;
}
