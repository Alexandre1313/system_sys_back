import Escola from "./Escola";
import Item from "./Item";

export default interface Projeto {
  id?: number;
  nome: string;
  descricao: string; // opcional
  escolas?: Escola[]; // Relacionamento com as Escolas
  itens?: Item[]; // Relacionamento com os Itens do projeto
  createdAt?: Date;
  updatedAt?: Date;
}
