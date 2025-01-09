import Grade from "./Grade";
import Projeto from "./Projeto";

export default interface Escola {
    id?: number;
    numeroEscola: string;
    numberJoin: string;
    nome: string;
    projetoId: number;
    projeto?: Projeto;
    grades?: Grade[];
    createdAt?: Date;
    updatedAt?: Date;
}
