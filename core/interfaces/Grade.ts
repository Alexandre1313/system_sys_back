import Escola from "./Escola";
import GradeItem from "./GradeItem";

export default interface Grade {
    id?: number;
    escolaId: number; // Relacionamento com Escola
    escola?: Escola; // Relacionamento opcional com Escola
    itensGrade?: GradeItem[]; // Relacionamento com os itens dessa grade
    finalizada?: boolean; // Se a grade foi finalizada ou não
    createdAt?: Date;
    updatedAt?: Date;
  }
