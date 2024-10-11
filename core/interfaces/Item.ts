import Estoque from "./Estoque";
import { Genero } from "./Genero";
import Grade from "./Grade";
import Projeto from "./Projeto";
import Tamanho from "./Tamanho";

export default interface Item {
    id: number;                 // Identificador único do item
    nome: string;               // Nome do item (ex: Short-Saia)
    genero: Genero;             // Enum: MASCULINO, FEMININO, UNISSEX
    projetoId: number;          // ID do projeto associado
    projeto: Projeto;           // Relacionamento com o projeto
    tamanhos: Tamanho[];        // Vários tamanhos associados ao item
    grades: Grade[];            // Grades associadas ao item
    estoque: Estoque[];         // Estoque associado ao item
}
