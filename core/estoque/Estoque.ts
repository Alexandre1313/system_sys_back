import ItemProjetoTamanho from "core/itemProjetoTamanho/ItemProjetoTamanho";

export default interface Estoque {
    id: number;                       
    itemProjetoTamanhoId: number;    
    quantidade: number;               
    itemProjetoTamanho: ItemProjetoTamanho; 
}
