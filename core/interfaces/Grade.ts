import { Caixa } from "@prisma/client";
import Escola from "./Escola";
import GradeItem from "./GradeItem";
import Company from "./Company";

export default interface Grade {
    id?: number;
    companyId: number; 
    company?: Company; 
    escolaId: number; 
    escola?: Escola; 
    tipo?: string;
    itensGrade?: GradeItem[]; // Relacionamento com os itens dessa grade
    gradeCaixas?: Caixa[];
    finalizada?: boolean; // Se a grade foi finalizada ou não
    createdAt?: Date;
    updatedAt?: Date;
  }
