import GradeDistribuicao from "core/gradeDistribuicao/GradeDistribuicao";
import Projeto from "core/projeto/Projeto";

export default interface Escola {
    id?: number;                          
    nome: string;                      
    projetoId: number;                  
    projeto: Projeto;                   
    distribuicoes: GradeDistribuicao[]; 
}
