import GradeDistribuicao from "core/gradeDistribuicao/GradeDistribuicao";
import ItemProjetoTamanho from "core/itemProjetoTamanho/ItemProjetoTamanho";

export default interface GradeDistribuicaoItem {
    id: number;                       
    gradeDistribuicaoId: number;     
    itemProjetoTamanhoId: number;     
    quantidadeDistribuida: number;   
    gradeDistribuicao: GradeDistribuicao; 
    itemProjetoTamanho: ItemProjetoTamanho; 
}
