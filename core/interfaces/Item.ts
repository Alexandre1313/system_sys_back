import { Genero } from "@prisma/client";
import ItemTamanho from "./ItemTamanho";
import Projeto from "./Projeto";

export default interface Item {
    id?: number;
    nome: string;
    genero: Genero;
    projetoId: number;
    projeto?: Projeto;
    composicao?: string;
    tamanhos?: ItemTamanho[];
    url: string
    createdAt?: Date;
    updatedAt?: Date;
}
