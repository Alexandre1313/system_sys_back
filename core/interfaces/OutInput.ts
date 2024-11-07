import ItemTamanho from "./ItemTamanho";

export default interface OutInput {
  id?: number;          
  itemTamanho?: ItemTamanho;    
  itemTamanhoId: number; 
  quantidade: number; 
  createdAt?: Date;   
  updatedAt?: Date;
}
