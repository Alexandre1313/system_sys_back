export default interface CaixaItem {
    id?: number;
    caixaId: number; 
    itemName: string; 
    itemGenero: string;
    itemTam: string;
    itemQty: number;
    itemTamanhoId: number;
    createdAt?: Date;
    updatedAt?: Date;
}
