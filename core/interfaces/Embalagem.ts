import EntryInput from "./EntryInput";

export default interface Embalagem {
    id?: number;
    entryInput?: EntryInput[];
    nome: string;
    email: string;
    nomefantasia?: string;
    telefone?: string;
    whats: string;
    createdAt?: Date;
    updatedAt?: Date;
}
