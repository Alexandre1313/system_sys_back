import TamanhoQuantidade from "./TamanhoQuantidade";

export default interface DataInserction {
    numeroEscola: string,
    escola: string;
    projeto: string;
    item: string;
    genero: string;
    tamanhos: TamanhoQuantidade[];
}
