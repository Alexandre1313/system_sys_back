import { GradeItem } from "@prisma/client";
import CaixaItem from "./CaixaItem";

export default interface Caixa {
    id?: number;
    gradeId: number; 
    escolaCaixa: string;
    caixaNumber: string;
    escolaNumber: string;
    projeto: string;
    qtyCaixa: number;
    caixaItem: CaixaItem[]; 
    itensGrade: GradeItem[];
    userId?: number;
    createdAt?: Date;
    updatedAt?: Date;
}
