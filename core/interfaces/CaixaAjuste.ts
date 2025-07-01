import ItensCaixaAjuste from "./ItensCaixaAjuste";

export default interface CaixaAjuste {
    id: number,
    caixaNumber: string,
    gradeId: number,
    qtyCaixa: number,
    createdAt: string,
    updatedAt: string,
    projeto: string,
    escola: string,
    escolaNumero: string,
    itens: ItensCaixaAjuste[],
}
