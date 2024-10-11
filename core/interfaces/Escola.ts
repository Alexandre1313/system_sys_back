import Grade from "./Grade";
import Projeto from "./Projeto";

export default interface Escola {
    id: number;                 // Identificador único da escola
    nome: string;               // Nome da escola
    projetoId: number;         // ID do projeto associado
    projeto: Projeto;           // Relacionamento com o projeto
    grades: Grade[];            // As grades associadas à escola
}
