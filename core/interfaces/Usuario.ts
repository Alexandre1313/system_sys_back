export default interface Usuario {
    id: number;                 // Identificador único
    nome: string;               // Nome do usuário
    email: string;              // Email único do usuário
    password: string;           // Senha do usuário
    criadoEm: Date;            // Data de criação do usuário
}
