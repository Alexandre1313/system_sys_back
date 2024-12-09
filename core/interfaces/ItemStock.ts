import TamanhoStock from "./TamanhoStock";

export default interface ItemStock {
    nome: string;
    genero: string;
    tamanhos: TamanhoStock[];
}
