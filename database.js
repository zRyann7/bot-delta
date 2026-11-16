const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

// ──────────────────────────────────────────────
// Membros
// ──────────────────────────────────────────────

const getMembro = async (id) => {
  const membro = await prisma.membro.findUnique({ where: { id } });

  return membro ?? { id, horas: 0, acoes: 0, inicio_plantao: null };
};

const salvarMembro = async (id, username, horas, acoes, inicio) => {
  const inicio_plantao = inicio ?? null;

  await prisma.membro.upsert({
    where: { id },
    update: { username, horas, acoes, inicio_plantao },
    create: { id, username, horas, acoes, inicio_plantao },
  });
};

const adicionarAcao = async (id, username) => {
  await prisma.membro.upsert({
    where: { id },
    update: {
      username,
      acoes: { increment: 1 },
    },
    create: { id, username, horas: 0, acoes: 1, inicio_plantao: null },
  });
};

const getTodosMembros = async () => {
  return prisma.membro.findMany({
    orderBy: { horas: 'desc' },
  });
};

const getPontosAbertos = async () => {
  return prisma.membro.findMany({
    where: {
      inicio_plantao: {
        not: null,
      },
    },
  });
};

const getMembrosComPontoAberto = async () => {
  const membros = await prisma.membro.findMany({
    where: { inicio_plantao: { not: null } },
    orderBy: { inicio_plantao: 'asc' },
  });

  // Mapeia para o formato esperado pelo index.js ({ user_id, username, inicio_plantao })
  return membros.map((m) => ({
    user_id: m.id,
    username: m.username,
    inicio_plantao: m.inicio_plantao,
  }));
};

// ──────────────────────────────────────────────
// Histórico de Plantões
// ──────────────────────────────────────────────

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

// ──────────────────────────────────────────────
// Histórico de Apreensões
// ──────────────────────────────────────────────

const registrarApreensao = async (userId, username, registradoPor) => {
  await prisma.historicoAcao.create({
    data: {
      user_id: userId,
      username,
      registrado_por: registradoPor,
      data_registro: new Date().toISOString(),
    },
  });
};

const getUltimasApreensoes = async (limit = 10) => {
  return prisma.historicoAcao.findMany({
    orderBy: { id: 'desc' },
    take: limit,
    select: {
      user_id: true,
      username: true,
      registrado_por: true,
      data_registro: true,
    },
  });
};

// ──────────────────────────────────────────────
// Zerar dados
// ──────────────────────────────────────────────

/**
 * Zera horas e apreensões de um único membro pelo ID do Discord.
 * Mantém o registro na tabela (não deleta), apenas reseta os contadores.
 */
const zerarMembro = async (id) => {
  await prisma.membro.update({
    where: { id },
    data: { horas: 0, acoes: 0, inicio_plantao: null },
  });
};

/**
 * Remove definitivamente o registro de um membro da tabela `membros`.
 * Diferente de zerarMembro, este apaga a linha (usado quando o membro
 * saiu da unidade). O histórico de plantões/apreensões NÃO é apagado.
 */
const removerMembro = async (id) => {
  await prisma.membro.delete({ where: { id } });
};

/**
 * Zera horas e apreensões de TODOS os membros.
 * Também fecha qualquer ponto aberto.
 */
const zerarTodos = async () => {
  const resultado = await prisma.membro.updateMany({
    data: { horas: 0, acoes: 0, inicio_plantao: null },
  });
  return resultado.count; // retorna quantos registros foram zerados
};

// ──────────────────────────────────────────────
// Exports (mesma interface do database.js original)
// ──────────────────────────────────────────────

module.exports = {
  getMembro,
  salvarMembro,
  adicionarAcao,
  getTodosMembros,
  registrarHistorico,
  getUltimoPlantao,
  getPontosAbertos,
  getUltimosPontos,
  getMembrosComPontoAberto,
  getUltimasApreensoes,
  registrarApreensao,
  zerarMembro,
  removerMembro,
  zerarTodos,
  // Expõe o client caso algum módulo precise de acesso direto
  prisma,
};
