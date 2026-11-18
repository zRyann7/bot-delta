const prisma = require('../config/database');

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

const getTodosMembros = async () => {
  return prisma.membro.findMany({
    orderBy: { horas: 'desc' },
  });
};

const zerarMembro = async (id) => {
  await prisma.membro.update({
    where: { id },
    data: { horas: 0, acoes: 0, inicio_plantao: null },
  });
};

const removerMembro = async (id) => {
  await prisma.membro.delete({ where: { id } });
};

const zerarTodos = async () => {
  const resultado = await prisma.membro.updateMany({
    data: { horas: 0, acoes: 0, inicio_plantao: null },
  });
  return resultado.count;
};

module.exports = {
  getMembro,
  salvarMembro,
  getTodosMembros,
  zerarMembro,
  removerMembro,
  zerarTodos,
};