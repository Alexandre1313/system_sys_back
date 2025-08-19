import { Login, Usuarios } from '@core/index';
import { Injectable } from '@nestjs/common';
import { PrismaProvider } from 'src/db/prisma.provider';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsuarioPrisma {
  constructor(readonly prisma: PrismaProvider) { }

  async searchCredentials(credentials: Login): Promise<Usuarios | null> {
    const { email } = credentials;
    const credenciais = await this.prisma.usuarios.findUnique({
      where: { email }
    });
    return credenciais || null;
  }

  async salvar(usuario: Usuarios): Promise<Usuarios> {
    const { id, entryInput, caixa, outInput, ...dadosDoUsuario } = usuario;

    const usuarioSalvo = await this.prisma.usuarios.upsert({
      where: {
        id: id !== undefined ? +id : -1,
      },
      update: {
        ...dadosDoUsuario,
        // Aqui você pode adicionar lógica específica para atualizar usuários se necessário
      },
      create: {
        ...dadosDoUsuario,
        // Aqui você pode adicionar lógica específica para criar usuários se necessário
      },
    });
    return usuarioSalvo; // Retorne o usuário salvo
  }

  async obter(): Promise<Usuarios[]> {
    const usuarios = await this.prisma.usuarios.findMany();
    return usuarios;
  }

  async obterPorId(id: number): Promise<Usuarios | null> {
    const usuario = await this.prisma.usuarios.findUnique({ where: { id } });
    return (usuario as Usuarios) ?? null;
  }

  async excluir(id: number): Promise<void> {
    try {
      // Tente excluir o usuário com o ID fornecido
      await this.prisma.usuarios.delete({ where: { id } });
    } catch (error) {
      // Aqui você pode capturar e tratar o erro
      console.error('Erro ao excluir o usuário:', error);

      // Lançar um erro apropriado ou lançar uma exceção
      if (error.code === 'P2025') {
        // Erro específico quando o registro não é encontrado
        throw new Error('O usuário não foi encontrado.');
      } else {
        // Lidar com outros erros genéricos
        throw new Error('Erro ao tentar excluir o usuário. Por favor, tente novamente.');
      }
    }
  }

  /*async obterRanking(mes?: string): Promise<{rankingPorMes: Record<string, any[]>; rankingGeral: any[];}> {
    try {
      let whereClause = '';
      if (mes && mes !== 'T') {
        // Sanitiza e aplica o filtro por mês
        whereClause = `WHERE DATE_TRUNC('month', o."createdAt") = TO_DATE('${mes}', 'YYYY-MM')`;
      }

      const query = `
      WITH ranking_por_mes AS (
        SELECT
          u.id,
          u.nome,
          DATE_TRUNC('month', o."createdAt") AS mes,
          SUM(o.quantidade) AS total_pecas_expedidas,
          RANK() OVER (
            PARTITION BY DATE_TRUNC('month', o."createdAt") 
            ORDER BY SUM(o.quantidade) DESC
          ) AS rank_mes
        FROM
          "OutInput" o
        JOIN
          "Usuarios" u ON u.id = o."userId"
        ${whereClause}
        GROUP BY
          u.id,
          u.nome,
          mes
      ),
      ranking_geral AS (
        SELECT
          u.id,
          SUM(o.quantidade) AS total_pecas_expedidas_geral,
          RANK() OVER (ORDER BY SUM(o.quantidade) DESC) AS rank_geral
        FROM
          "OutInput" o
        JOIN
          "Usuarios" u ON u.id = o."userId"
        GROUP BY
          u.id
      )

      SELECT
        rpm.nome,
        rpm.mes,
        rpm.total_pecas_expedidas,
        rpm.rank_mes,
        rg.total_pecas_expedidas_geral,
        rg.rank_geral
      FROM
        ranking_por_mes rpm
      JOIN
        ranking_geral rg ON rpm.id = rg.id
      ORDER BY
        rpm.mes DESC,
        rpm.rank_mes;
    `;

      const rawResult: any[] = await this.prisma.$queryRawUnsafe(query);

      const rankingPorMes: Record<string, any[]> = {};
      const rankingGeralMap = new Map<string, any>();

      rawResult.forEach((item: any) => {
        const mesKey = new Date(item.mes).toISOString().slice(0, 7);

        if (!rankingPorMes[mesKey]) rankingPorMes[mesKey] = [];

        rankingPorMes[mesKey].push({
          nome: item.nome,
          total_pecas_expedidas: Number(item.total_pecas_expedidas),
          rank_mes: Number(item.rank_mes),
          total_pecas_expedidas_geral: Number(item.total_pecas_expedidas_geral),
          rank_geral: Number(item.rank_geral),
        });

        if (!rankingGeralMap.has(item.nome)) {
          rankingGeralMap.set(item.nome, {
            nome: item.nome,
            total_pecas_expedidas_geral: Number(item.total_pecas_expedidas_geral),
            rank_geral: Number(item.rank_geral),
          });
        }
      });

      const rankingGeral = Array.from(rankingGeralMap.values()).sort(
        (a, b) => a.rank_geral - b.rank_geral,
      );

      return { rankingPorMes, rankingGeral };
    } catch (error) {
      console.error('Erro ao obter o ranking:', error);
      throw new Error('Erro ao buscar o ranking de expedições. Tente novamente mais tarde.');
    }
  }*/

  async obterRanking(mes?: string): Promise<{ rankingPorMes: Record<string, any[]>; rankingGeral: any[]; }> {
    try {
      // Define hoje e ontem em formato YYYY-MM-DD
      const hoje = new Date();
      const hojeStr = hoje.toISOString().split('T')[0];

      const ontem = new Date(hoje);
      ontem.setDate(hoje.getDate() - 1);
      const ontemStr = ontem.toISOString().split('T')[0];

      // SQL seguro com Prisma.sql
      const whereClause = mes && mes !== 'T'
        ? Prisma.sql`WHERE DATE_TRUNC('month', o."createdAt") = TO_DATE(${mes}, 'YYYY-MM')`
        : Prisma.empty;

      const query = Prisma.sql`
      WITH ranking_por_mes AS (
        SELECT
          u.id,
          u.nome,
          DATE_TRUNC('month', o."createdAt") AS mes,
          SUM(o.quantidade) AS total_pecas_expedidas,
          RANK() OVER (
            PARTITION BY DATE_TRUNC('month', o."createdAt") 
            ORDER BY SUM(o.quantidade) DESC
          ) AS rank_mes
        FROM
          "OutInput" o
        JOIN
          "Usuarios" u ON u.id = o."userId"
        ${whereClause}
        GROUP BY
          u.id, u.nome, mes
      ),
      ranking_geral AS (
        SELECT
          u.id,
          SUM(o.quantidade) AS total_pecas_expedidas_geral,
          RANK() OVER (ORDER BY SUM(o.quantidade) DESC) AS rank_geral
        FROM
          "OutInput" o
        JOIN
          "Usuarios" u ON u.id = o."userId"
        GROUP BY
          u.id
      ),
      pecas_por_dia AS (
        SELECT
          o."userId" AS id,
          SUM(CASE WHEN DATE(o."createdAt") = DATE(${hojeStr}) THEN o.quantidade ELSE 0 END) AS pecas_hoje,
          SUM(CASE WHEN DATE(o."createdAt") = DATE(${ontemStr}) THEN o.quantidade ELSE 0 END) AS pecas_ontem
        FROM
          "OutInput" o
        WHERE
          DATE(o."createdAt") IN (DATE(${hojeStr}), DATE(${ontemStr}))
        GROUP BY
          o."userId"
      )

      SELECT
        rpm.id,
        rpm.nome,
        rpm.mes,
        rpm.total_pecas_expedidas,
        rpm.rank_mes,
        rg.total_pecas_expedidas_geral,
        rg.rank_geral,
        pd.pecas_hoje,
        pd.pecas_ontem
      FROM
        ranking_por_mes rpm
      JOIN
        ranking_geral rg ON rpm.id = rg.id
      LEFT JOIN
        pecas_por_dia pd ON rpm.id = pd.id
      ORDER BY
        rpm.mes DESC,
        rpm.rank_mes;
    `;

      const rawResult: any[] = await this.prisma.$queryRaw(query);

      const rankingPorMes: Record<string, any[]> = {};
      const rankingGeralMap = new Map<string, any>();

      const mesesUnicos = rawResult.map(r => new Date(r.mes).toISOString().slice(0, 7));
      const mesMaisRecente = mesesUnicos.sort().reverse()[0];

      rawResult.forEach((item: any) => {
        const mesKey = new Date(item.mes).toISOString().slice(0, 7);

        if (!rankingPorMes[mesKey]) rankingPorMes[mesKey] = [];

        const registro: any = {
          nome: item.nome,
          total_pecas_expedidas: Number(item.total_pecas_expedidas),
          rank_mes: Number(item.rank_mes),
          total_pecas_expedidas_geral: Number(item.total_pecas_expedidas_geral),
          rank_geral: Number(item.rank_geral),
        };

        if (mesKey === mesMaisRecente) {
          const pecasHoje = Number(item.pecas_hoje || 0);
          const pecasOntem = Number(item.pecas_ontem || 0);
          const diferencaDia = pecasHoje - pecasOntem;

          let variacaoPercentualDia: number;
          if (pecasOntem === 0) {
            variacaoPercentualDia = pecasHoje > 0 ? 100 : 0;
          } else {
            variacaoPercentualDia = (diferencaDia / pecasOntem) * 100;
          }

          registro.pecas_hoje = pecasHoje;
          registro.pecas_ontem = pecasOntem;
          registro.diferenca_dia = diferencaDia;
          registro.variacao_percentual_dia = Number(variacaoPercentualDia.toFixed(2));
        }

        rankingPorMes[mesKey].push(registro);

        if (!rankingGeralMap.has(item.nome)) {
          rankingGeralMap.set(item.nome, {
            nome: item.nome,
            total_pecas_expedidas_geral: Number(item.total_pecas_expedidas_geral),
            rank_geral: Number(item.rank_geral),
          });
        }
      });

      const rankingGeral = Array.from(rankingGeralMap.values()).sort(
        (a, b) => a.rank_geral - b.rank_geral,
      );

      return { rankingPorMes, rankingGeral };
    } catch (error) {
      console.error('Erro ao obter o ranking:', error);
      throw new Error('Erro ao buscar o ranking de expedições. Tente novamente mais tarde.');
    }
  }

}
