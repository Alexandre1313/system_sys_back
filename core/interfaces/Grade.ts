import { Caixa } from "@prisma/client";
import Company from "./Company";
import Escola from "./Escola";
import GradeItem from "./GradeItem";
import { Status } from "./Status";

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
