const { EmbedBuilder } = require('discord.js');
const prisma = require('../config/database');
const { getMembro, salvarMembro } = require('./membroService');
const { formatarHoras, parseDataPlantao } = require('../utils/formatters');
const { enviarLog } = require('../utils/discordHelpers');

const getPontosAbertos = async () => {
  const todos = await prisma.membro.findMany();
  return todos.filter((m) => m.inicio_plantao && m.inicio_plantao.trim() !== '');
};

const registrarHistorico = async (userId, username, inicio, fim, duracaoHoras) => {
  await prisma.historicoPlantao.create({
    data: {
      user_id: userId,
      username,
      inicio: String(inicio),
      fim: String(fim),
      duracao_horas: duracaoHoras,
    },
  });
};

const getUltimoPlantao = async (userId) => {
  const registro = await prisma.historicoPlantao.findFirst({
    where: { user_id: userId },
    orderBy: { id: 'desc' },
    select: { duracao_horas: true },
  });

  return registro?.duracao_horas ?? 0;
};

const getUltimosPontos = async (userId, limit = 5) => {
  return prisma.historicoPlantao.findMany({
    where: { user_id: userId },
    orderBy: { id: 'desc' },
    take: limit,
    select: { inicio: true, fim: true, duracao_horas: true },
  });
};

const fecharTodosPontos = async (guild = null, executorId = null) => {
  const membros = await getPontosAbertos();

  if (!membros.length) {
    return { total: 0, fechados: [], erros: [] };
  }

  const fim = new Date();
  const fechados = [];
  const erros = [];

  for (const m of membros) {
    try {
      const dados = await getMembro(m.id);
      if (!dados.inicio_plantao) continue;

      const inicio = parseDataPlantao(dados.inicio_plantao);
      const horasTrabalhadas = Math.max(0, (fim - inicio) / (1000 * 60 * 60));
      const novasHoras = dados.horas + horasTrabalhadas;

      await salvarMembro(m.id, dados.username, novasHoras, dados.acoes, null);
      await registrarHistorico(
        m.id,
        dados.username,
        dados.inicio_plantao,
        fim.toISOString(),
        horasTrabalhadas
      );

      fechados.push({
        id: m.id,
        username: dados.username,
        inicio,
        fim,
        horasTrabalhadas,
        novasHoras,
      });
    } catch (err) {
      console.error(`Erro ao fechar ponto de ${m.id}:`, err);
      erros.push({ id: m.id, erro: err });
    }
  }

  if (guild && fechados.length) {
    const linhas = fechados
      .map((f) => `👤 <@${f.id}> — \`${formatarHoras(f.horasTrabalhadas)}\` neste plantão`)
      .join('\n');

    const embed = new EmbedBuilder()
      .setColor('#FEE75C')
      .setTitle(`🔒 Fechamento em Massa de Pontos (${fechados.length})`)
      .setDescription((executorId ? `Executado por <@${executorId}>.\n\n` : '') + linhas)
      .setTimestamp();

    await enviarLog(guild, embed);
  }

  return { total: membros.length, fechados, erros };
};

module.exports = {
  getPontosAbertos,
  registrarHistorico,
  getUltimoPlantao,
  getUltimosPontos,
  fecharTodosPontos,
};