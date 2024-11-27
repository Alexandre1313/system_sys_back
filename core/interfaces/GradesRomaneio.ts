import { Caixa } from "@prisma/client";

export default interface GradesRomaneio {
    id: number;
    isPrint: boolean;
    company: string;
    cnpjCompany: string;
    projectname: string;
    escola: string;
    tipo: string | null;
    numeroEscola: string;
    telefoneCompany: string;
    emailCompany: string;
    telefoneEscola: string;
    create: Date;
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
      quantidade: number;
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
  