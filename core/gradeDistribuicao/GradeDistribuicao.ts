import Escola from "core/escola/Escola";
import GradeDistribuicaoItem from "core/gradeDistribuicaoItem/GradeDistribuicaoItem";

export default interface GradeDistribuicao {
    id: number;                      
    escolaId: number;               
    dataDistribuicao: Date;       
    escola: Escola;                 
    itensDistribuidos: GradeDistribuicaoItem[]; 
}
