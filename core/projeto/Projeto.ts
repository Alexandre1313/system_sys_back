import Escola from "core/escola/Escola";
import Item from "core/item/Item";

export default interface Projeto {
    id?: number;         
    nome: string;        
    itens?: Item[];      
    escolas?: Escola[];  
  }
