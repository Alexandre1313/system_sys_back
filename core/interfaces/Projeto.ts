import Escola from "./Escola";
import Item from "./Item";

export default interface Projeto {
  id: number;                 // Identificador único do projeto
  nome: string;               // Nome do projeto (ex: Joinville)
  escolas?: Escola[];          // Um projeto pode ter várias escolas
  itens?: Item[];              // Um projeto pode ter vários itens
}
