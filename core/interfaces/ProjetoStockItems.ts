import ItemStock from "./ItemStock";

export default interface ProjetoStockItems {
    projetoId: number;
    nome: string;
    itens: ItemStock[];
}
