import Caixa from "./Caixa";

export default interface TipoEmbalagem {
    id?: number;          
    nome: string;        
    peso: number;        
    altura: number;       
    largura: number;     
    profundidade: number; 
    createdAt?: Date;    
    updatedAt?: Date;    
    caixas?: Caixa[];       
}
