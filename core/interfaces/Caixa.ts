import { GradeItem, TipoEmbalagem } from "@prisma/client";
import CaixaItem from "./CaixaItem";

export default interface Caixa {
    id?: number;
    gradeId: number;
    escolaCaixa: string;
    caixaNumber: string;
    escolaNumber: string;
    numberJoin: string;
    projeto: string;
    qtyCaixa: number;
    caixaItem?: CaixaItem[];
    itensGrade?: GradeItem[];
    userId?: number;    
    tipoEmbalagemId?: number;
    tipoEmbalagem?: TipoEmbalagem;
    createdAt?: Date;
    updatedAt?: Date;
}
