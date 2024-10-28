import { GradeItem } from "@prisma/client";
import CaixaItem from "./CaixaItem";

export default interface Caixa {
    id?: number;
    gradeId: number; 
    escolaCaixa: string;
    caixaNumber: string;
    escolaNumber: string;
    projeto: string;
    caixaItem: CaixaItem[]; 
    itensGrade: GradeItem[];
    createdAt?: Date;
    updatedAt?: Date;
}
