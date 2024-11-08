import { Embalagem } from '@core/index';
import { Injectable } from '@nestjs/common';
import { PrismaProvider } from 'src/db/prisma.provider';

@Injectable()
export class EmbalagemPrisma {
    constructor(readonly prisma: PrismaProvider) { }

    async salvar(embalagem: Embalagem): Promise<Embalagem> {
        const { id, entryInput, ...dadosDaEmbalagem } = embalagem;
        // Realiza o upsert no banco de dados
        const embalagemSalva = await this.prisma.embalagem.upsert({
            where: {
                id: id !== undefined ? +id : -1, // Usar -1 para id inexistente
            },
            update: {
                ...dadosDaEmbalagem,
            },
            create: {
                ...dadosDaEmbalagem,
            },
        });
        return embalagemSalva;
    }

    async obter(): Promise<Embalagem[]> {
        const embalagems = await this.prisma.embalagem.findMany();
        return embalagems;
    }   
}
