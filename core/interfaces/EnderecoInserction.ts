import AddressSchool from "./AddressSchool ";
import TelephonesSchool from "./TelephonesSchool";

export default interface EnderecoInserction {
    projeto: string;
    escolas: {
        id: number;
        nome: string;
        numeroEscola: string;
        endereco: AddressSchool;
        telefone?: TelephonesSchool;
    }[]
}
