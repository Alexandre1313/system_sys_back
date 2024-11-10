import { Embalagem } from '@core/index';
import { Injectable } from '@nestjs/common';
import { PrismaProvider } from 'src/db/prisma.provider';

@Injectable()
export class EmbalagemPrisma {
    constructor(readonly prisma: PrismaProvider) { }

    async salvar(embalagem: Embalagem): Promise<Embalagem> {
        // Função para verificar se a string é válida (não vazia ou apenas espaços)
        const isValidString = (value: string): boolean => value.trim().length > 0;

        // Verifica se os campos obrigatórios estão preenchidos corretamente
        if (!isValidString(embalagem.nome)) {
            throw new Error('O campo "nome" é obrigatório e não pode ser vazio ou apenas espaços.');
        }
        if (!isValidString(embalagem.email)) {
            throw new Error('O campo "email" é obrigatório e não pode ser vazio ou apenas espaços.');
        }
        if (!isValidString(embalagem.whats)) {
            throw new Error('O campo "whats" é obrigatório e não pode ser vazio ou apenas espaços.');
        }

        try {
            // Envolvendo a operação de upsert em uma transação
            const embalagemSalva = await this.prisma.$transaction(async (tx) => {
                // Realiza o upsert na tabela `Embalagem` utilizando o nome e email para verificação
                const embalagemSalva = await tx.embalagem.upsert({
                    where: { nome: embalagem.nome },
                    update: {
                        email: embalagem.email,
                        nomefantasia: embalagem.nomefantasia || null,
                        telefone: embalagem.telefone || null,
                        whats: embalagem.whats,
                    },
                    create: {
                        nome: embalagem.nome,
                        email: embalagem.email,
                        nomefantasia: embalagem.nomefantasia || null,
                        telefone: embalagem.telefone || null,
                        whats: embalagem.whats,
                    },
                });

                return embalagemSalva;
            });

            return embalagemSalva; // Retorna a embalagem salva ou atualizada
        } catch (error) {
            throw new Error('Erro ao salvar embalagem: ' + error.message);
        }
    }  

    async obter(): Promise<Embalagem[]> {
        const embs: Embalagem[] = await this.prisma.embalagem.findMany({
          select: {
            id: true,
            nome: true,
            email: true,
            whats: true
          },
          orderBy: {
            nome: 'asc', 
          },
        });
        return embs;
    }  
}
