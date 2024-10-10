import { Genero } from "core/genero/Genero";
import ItemProjetoTamanho from "core/itemProjetoTamanho/ItemProjetoTamanho";
import Projeto from "core/projeto/Projeto";

export default interface Item {
    id: number;              
    nome: string;             
    projetoId: number;    
    projeto: Projeto;        
    codigoBarra: number;     
    genero: Genero;         
    tamanhos: ItemProjetoTamanho[];
}
