import Escola from "./Escola";
import Item from "./Item";
import Tamanho from "./Tamanho";

export default interface Grade {
    id: number;                 // Identificador único da grade
    escolaId: number;          // ID da escola associada
    escola: Escola;             // Relacionamento com a escola
    itemId: number;            // ID do item associado
    item: Item;                 // Relacionamento com o item
    tamanhoId: number;         // ID do tamanho associado
    tamanho: Tamanho;           // Relacionamento com o tamanho
    totalExpedir: number;       // Total a ser expedido
    expedido: number;           // Total já expedido
    expedicaoAtiva: boolean;    // Se a expedição está ativa
    createdAt: Date;            // Data de criação da grade
    updatedAt: Date;            // Data da última atualização
}
