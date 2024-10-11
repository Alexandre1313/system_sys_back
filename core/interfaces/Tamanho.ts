import Estoque from "./Estoque";
import Grade from "./Grade";
import Item from "./Item";

export default interface Tamanho {
    id: number;                 // Identificador único do tamanho
    valor: string;              // Tamanho (ex: P, M, G)
    itemId: number;            // ID do item associado
    item: Item;                 // Relacionamento com o item
    grades: Grade[];            // Relação oposta com Grade
    estoques: Estoque[];        // Relação oposta com Estoque
}
