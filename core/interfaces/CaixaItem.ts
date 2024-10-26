export default interface CaixaItem {
    id?: number;
    caixaId: number; // Código de barras único
    itemName: string; // Relacionamento com ItemTamanho
    itemGenero: string;
    itemTam: string;
    itemQty: number;
    createdAt?: Date;
    updatedAt?: Date;
}
