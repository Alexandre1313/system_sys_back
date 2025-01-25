import Caixa from "./Caixa";
import Company from "./Company";
import Escola from "./Escola";
import GradeItem from "./GradeItem";
import { Status } from "@prisma/client";

export default interface Grade {
  id?: number;
  companyId: number;
  company?: Company;
  escolaId: number;
  escola?: Escola;
  tipo?: string;
  itensGrade?: GradeItem[];
  gradeCaixas?: Caixa[];
  finalizada?: boolean;
  status?: Status;
  createdAt?: Date;
  updatedAt?: Date;
}
