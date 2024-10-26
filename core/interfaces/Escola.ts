import Grade from "./Grade";
import Projeto from "./Projeto";

export default interface Escola {
    id?: number;
    numeroEscola: string;
    nome: string;
    projetoId: number; // Relacionamento com o Projeto
    projeto?: Projeto; // Relacionamento opcional com o Projeto
    grades?: Grade[]; // Relacionamento com as Grades de Distribuição
    createdAt?: Date;
    updatedAt?: Date;    
}
