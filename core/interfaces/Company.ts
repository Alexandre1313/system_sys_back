import AddressCompany from "./AddressCompany";
import Grade from "./Grade";
import TelephonesCompany from "./TelephonesCompany";

export default interface Company {
    id?: number;
    nome: string;
    email: string;
    cnpj?: string;
    createdAt?: Date;
    updatedAt?: Date;  
    address?:   AddressCompany[];
    telefone?:  TelephonesCompany[];
    Grade?:     Grade[];  
}
