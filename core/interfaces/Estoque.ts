import Item from "./Item";
import Tamanho from "./Tamanho";

export default interface Estoque {
    id: number;                 // Identificador único do estoque
    itemId: number;            // ID do item associado
    item: Item;                 // Relacionamento com o item
    tamanhoId: number;         // ID do tamanho associado
    tamanho: Tamanho;           // Relacionamento com o tamanho
    quantidade: number;         // Quantidade disponível no estoque
    updatedAt: Date;            // Data da última atualização
}
