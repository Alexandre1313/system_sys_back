import Escola from "./Escola";
import Item from "./Item";

export default interface Projeto {
  id?: number;
  nome: string;
  descricao: string;
  escolas?: Escola[];
  itens?: Item[];
  url: string
  createdAt?: Date;
  updatedAt?: Date;
}
