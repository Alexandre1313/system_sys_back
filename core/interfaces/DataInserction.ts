import TamanhoQuantidade from "./TamanhoQuantidade";

export default interface DataInserction {
    escola: string;
    projeto: string;
    item: string;
    genero: string;
    tamanhos: TamanhoQuantidade[]; 
}
