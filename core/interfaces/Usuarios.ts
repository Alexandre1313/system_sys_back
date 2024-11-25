import Caixa from "./Caixa";
import EntryInput from "./EntryInput";
import OutInput from "./OutInput";

export default interface Usuarios {
    id?: number;
    nome: string;
    email: string;
    password: string;
    createdAt?: Date;
    updatedAt?: Date;
    caixa?:      Caixa[];
    entryInput?: EntryInput[];
    outInput?:   OutInput[];
}
