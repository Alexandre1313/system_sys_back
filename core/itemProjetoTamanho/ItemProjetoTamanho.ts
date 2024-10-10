import Estoque from "core/estoque/Estoque";
import GradeDistribuicaoItem from "core/gradeDistribuicaoItem/GradeDistribuicaoItem";
import Item from "core/item/Item";

export default interface ItemProjetoTamanho {
    id: number;                   
    itemId: number;                
    tamanho: string;               
    quantidade: number;            
    item: Item;                   
    estoque?: Estoque;             
    distribuicaoItens: GradeDistribuicaoItem[]; 
}
