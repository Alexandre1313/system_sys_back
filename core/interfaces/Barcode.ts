export default interface Barcode {
    id?: number;
    codigo: string; // Código de barras único
    itemTamanhoId: number; // Relacionamento com ItemTamanho
    createdAt?: Date;
    updatedAt?: Date;
}
