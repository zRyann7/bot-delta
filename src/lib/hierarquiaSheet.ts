// src/lib/hierarquiaSheet.ts
// Busca e organiza os dados da planilha "GERAL - DELTA - METROVILLE" (efetivo
// da unidade) para exibição na aba Hierarquia da página Planilha.
//
// A planilha é organizada em blocos: uma linha de cabeçalho com o nome do
// posto/função (ex.: "GESTOR", "PILOTO MASTER"...) seguida das linhas dos
// membros que ocupam aquela posição. Este parser reconstrói essa estrutura
// a partir do CSV exportado publicamente pelo Google Sheets.

export interface MembroUnidade {
  badge: string;
  id: string;
  patente: string;
  nome: string;
  curso1: boolean;
  curso2: boolean;
  curso3: boolean;
  advs: string;
  status: string;
  apreensoes: string;
  dataAdmissao: string;
  dataPromocao: string;
  tempoNoCargo: string;
}

export interface GrupoHierarquia {
  nome: string;
  membros: MembroUnidade[];
}

const SHEET_ID = "1AzYZ6oYRMbx3AYU0GuFTd9M5T_kLVUBAKoQxvU7lToM";
const SHEET_GID = "0";
const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}`;

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      result.push(cur);
      cur = "";
    } else {
      cur += char;
    }
  }
  result.push(cur);
  return result;
}

function isMarcado(valor: string): boolean {
  const v = valor.trim().toUpperCase();
  if (!v) return false;
  return !["FALSE", "0", "NÃO", "NAO", "-", "—"].includes(v);
}

// Textos que aparecem nos cabeçalhos fixos da planilha (título da tabela,
// nomes de coluna, etc.) e que não representam um posto/função real —
// precisam ser ignorados para não virarem grupos "fantasmas" na hierarquia.
const ROTULOS_IGNORADOS = new Set([
  "IDENTIFICAÇÃO",
  "IDENTIFICACAO",
  "CURSOS INTERNOS",
  "ADMINISTRATIVO",
  "DATA ADMISSÃO",
  "DATA ADMISSAO",
  "DATA PROMOÇÃO",
  "DATA PROMOCAO",
  "TEMPO NO CARGO",
  "REGISTRO - DELTA - 2026",
  "REGISTRO - HORAS SEMANAIS",
  "BADGE",
  "ID",
  "PATENTE",
  "NOME",
  "STATUS",
  "APREENSÕES",
  "APREENSOES",
  "ADVS",
]);

const TEM_LETRA = /[A-Za-zÀ-ÖØ-öø-ÿ]/;
const VALORES_BOOLEANOS = new Set(["TRUE", "FALSE"]);

// Um rótulo de grupo válido é um nome de posto/função curto (ex.: "GESTOR",
// "PILOTO MASTER"). Se vier com vírgulas ou valores TRUE/FALSE dentro, é
// lixo de fórmula/célula mesclada vazando de outras colunas — não é um
// posto de verdade.
function ehRotuloDeGrupoValido(valor: string): boolean {
  if (!valor) return false;
  if (Number.isNaN(Number(valor)) === false) return false; // é número puro
  if (valor.includes(",")) return false;
  if (/\b(TRUE|FALSE)\b/i.test(valor)) return false;
  if (valor.length > 40) return false;
  if (ROTULOS_IGNORADOS.has(valor.toUpperCase())) return false;
  return true;
}

// Detecta linhas "lixo" resultantes de células mescladas/colunas de checkbox
// que acabaram caindo nas posições de status/apreensões/datas.
function pareceLinhaValida(m: Omit<MembroUnidade, "curso1" | "curso2" | "curso3">): boolean {
  if (!TEM_LETRA.test(m.nome)) return false; // nome precisa ter letras (não só número)
  const camposSuspeitos = [m.status, m.apreensoes, m.dataPromocao, m.tempoNoCargo];
  const boolCount = camposSuspeitos.filter((v) => VALORES_BOOLEANOS.has(v.trim().toUpperCase())).length;
  if (boolCount >= 2) return false; // várias colunas com TRUE/FALSE = desalinhamento de coluna
  return true;
}

let cacheGrupos: GrupoHierarquia[] | null = null;
let cachePromise: Promise<GrupoHierarquia[]> | null = null;

export async function buscarHierarquiaUnidade(forceRefresh = false): Promise<GrupoHierarquia[]> {
  if (cacheGrupos && !forceRefresh) return cacheGrupos;
  if (cachePromise && !forceRefresh) return cachePromise;

  cachePromise = (async () => {
    const res = await fetch(SHEET_CSV_URL);
    if (!res.ok) {
      throw new Error("Não foi possível acessar a planilha da unidade.");
    }
    const text = await res.text();
    const linhas = text.split(/\r?\n/);

    // Colunas (0-based) na aba "GERAL - DELTA - METROVILLE":
    // A=grupo/posto  B=Badge  C=ID  D=Patente  E=Nome
    // G=Curso 1  H=Curso 2  I=Curso 3
    // K=ADVS  N=Status  O=Apreensões
    // P=Data admissão  Q=Data promoção  R=Tempo no cargo
    const grupos: GrupoHierarquia[] = [];
    let grupoAtual: GrupoHierarquia | null = null;

    for (const linha of linhas) {
      if (!linha.trim()) continue;
      const col = parseCSVLine(linha);

      const rotuloA = (col[0] || "").trim();
      const rotuloB = (col[1] || "").replace(/^@\s*/, "").trim();
      const id = (col[2] || "").trim();
      const patente = (col[3] || "").trim();
      const nome = (col[4] || "").trim();

      // Linha de cabeçalho de bloco: não tem ID/Nome, mas tem rótulo em A ou B.
      const rotuloAValido = ehRotuloDeGrupoValido(rotuloA);
      const rotuloBValido = ehRotuloDeGrupoValido(rotuloB) && !nome;
      if (!id && !nome && (rotuloAValido || rotuloBValido)) {
        // Quando as duas colunas trazem rótulo na mesma linha, a da coluna B
        // é a mais específica (ex.: "PILOTO AVANÇADO"); usamos só ela.
        const nomeGrupo = rotuloBValido ? rotuloB : rotuloA;
        if (nomeGrupo) {
          grupoAtual = { nome: nomeGrupo, membros: [] };
          grupos.push(grupoAtual);
        }
        continue;
      }

      // Linha de dados de membro (precisa de nome e id numéricos válidos)
      if (!nome || !id || Number.isNaN(Number(id))) continue;

      const membroBase = {
        badge: (col[1] || "").replace(/^@\s*/, "").trim(),
        id,
        patente,
        nome,
        advs: (col[10] || "").trim(),
        status: (col[13] || "").trim(),
        apreensoes: (col[14] || "").trim(),
        dataAdmissao: (col[15] || "").trim(),
        dataPromocao: (col[16] || "").trim(),
        tempoNoCargo: (col[17] || "").trim(),
      };

      if (!pareceLinhaValida(membroBase)) continue;

      const membro: MembroUnidade = {
        ...membroBase,
        curso1: isMarcado(col[6] || ""),
        curso2: isMarcado(col[7] || ""),
        curso3: isMarcado(col[8] || ""),
      };

      // Ignora dados encontrados antes do primeiro cabeçalho de grupo real
      // (evita criar um grupo "fantasma" a partir de lixo de cabeçalho).
      if (!grupoAtual) continue;
      grupoAtual.membros.push(membro);
    }

    // Remove grupos vazios que sobraram de cabeçalhos residuais não mapeados
    // na blacklist (defesa extra contra ruído da planilha).
    const gruposLimpos = grupos.filter((g) => g.membros.length > 0 || !ROTULOS_IGNORADOS.has(g.nome.toUpperCase()));

    cacheGrupos = gruposLimpos;
    return gruposLimpos;
  })();

  return cachePromise;
}
