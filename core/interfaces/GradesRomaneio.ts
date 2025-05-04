import { Caixa, Status } from "@prisma/client";

export default interface GradesRomaneio {
  id: number;
  isPrint: boolean;
  company: string;
  cnpjCompany: string;
  projectname: string;
  escola: string;
  tipo: string | null;
  numeroEscola: string;
  status: Status;
  numberJoin: string;
  telefoneCompany: string;
  emailCompany: string;
  telefoneEscola: string;
  peso?: number,
  cubagem?: number;
  create: string;
  update: string;
  enderecoschool: {
    rua: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    estado: string;
    postalCode: string;
    country: string;
  };
  tamanhosQuantidades: {
    item: string;
    genero: string;
    tamanho: string;
    composicao: string;
    quantidade: number;
    previsto: number;
    peso?: number;       
    altura?: number;      
    largura?: number;     
    profundidade?: number; 
  }[];
  caixas: Caixa[];
  enderecocompany: {
    rua: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    estado: string;
    postalCode: string;
    country: string;
  };
}
