import { Projeto } from '@core/index';
import { Injectable } from '@nestjs/common';
import { PrismaProvider } from 'src/db/prisma.provider';

@Injectable()
export class ProjetoPrisma {
  constructor(readonly prisma: PrismaProvider) {}

  async salvar(projeto: Projeto): Promise<void> {
    await this.prisma.projeto.upsert({
      where: { id: projeto.id ?? -1 },
      update: projeto,
      create: projeto,
    });
  }

  async obter(): Promise<Projeto[]> {
    const projetos = await this.prisma.projeto.findMany();
    return projetos as any;
  }

  async obterPorId(id: number): Promise<Projeto | null> {
    const projeto = await this.prisma.projeto.findUnique({ where: { id } });
    return (projeto as any) ?? null;
  }

  async excluir(id: number): Promise<void> {
    await this.prisma.projeto.delete({ where: { id } });
  }
}
