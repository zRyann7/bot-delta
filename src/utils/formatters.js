const formatarHoras = (horas) => {
  // + 1e-6 evita que 0.0833333... vire 299s em vez de 300s por erro de ponto flutuante
  const totalSegundos = Math.floor((horas || 0) * 3600 + 1e-6);
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

/**
 * Converte um texto de duração em horas (decimal), aceitando sinal + ou -.
 * Formatos aceitos:
 *   2  |  1.5  |  1,5     número puro = horas (formato antigo)
 *   1h30  |  1h30m        horas e minutos
 *   45m  |  45min         só minutos
 *   2h  |  1h30m15s       horas, minutos e segundos
 *   1:30                  h:mm
 * Retorna null se não entender o texto.
 */
const parseDuracao = (texto) => {
  if (texto === undefined || texto === null) return null;

  let t = String(texto).toLowerCase().replace(/\s+/g, '').replace(',', '.');
  let sinal = 1;
  if (t[0] === '-' || t[0] === '+') {
    if (t[0] === '-') sinal = -1;
    t = t.slice(1);
  }
  if (!t) return null;

  let segundos;
  let m;

  if (/^\d+(\.\d+)?$/.test(t)) {
    segundos = parseFloat(t) * 3600;
  } else if ((m = t.match(/^(\d+):(\d{1,2})$/))) {
    segundos = Number(m[1]) * 3600 + Number(m[2]) * 60;
  } else if ((m = t.match(/^(\d+)h(\d{1,2})$/))) {
    segundos = Number(m[1]) * 3600 + Number(m[2]) * 60;
  } else if ((m = t.match(/^(?:(\d+(?:\.\d+)?)h)?(?:(\d+(?:\.\d+)?)(?:min|m))?(?:(\d+)s)?$/)) && (m[1] || m[2] || m[3])) {
    segundos =
      Number(m[1] || 0) * 3600 +
      Number(m[2] || 0) * 60 +
      Number(m[3] || 0);
  } else {
    return null;
  }

  return (sinal * Math.round(segundos)) / 3600;
};

module.exports = { formatarHoras, parseDataPlantao, parseDuracao };
