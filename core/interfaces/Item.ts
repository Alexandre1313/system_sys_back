import { Genero } from "./Genero";
import ItemTamanho from "./ItemTamanho";
import Projeto from "./Projeto";

export default interface Item {
    id?: number;
    nome: string;
    genero: Genero; // Masculino, Feminino ou Unissex
    projetoId: number; // Relacionamento com o Projeto
    projeto?: Projeto; // Relacionamento opcional com o Projeto
    tamanhos?: ItemTamanho[]; // Relacionamento com tamanhos específicos
    createdAt?: Date;
    updatedAt?: Date;
}
