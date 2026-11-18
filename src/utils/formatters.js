const formatarHoras = (horas) => {
  const totalSegundos = Math.floor((horas || 0) * 3600);
  const h = Math.floor(totalSegundos / 3600);
  const min = Math.floor((totalSegundos % 3600) / 60);
  const seg = totalSegundos % 60;
  return `${h}h ${min}min ${seg}s`;
};

const parseDataPlantao = (valor) => {
  if (!valor) return null;
  return new Date(
    valor instanceof Date ? valor : String(valor).replace(' ', 'T')
  );
};

module.exports = { formatarHoras, parseDataPlantao };