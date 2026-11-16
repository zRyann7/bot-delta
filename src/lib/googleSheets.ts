// src/lib/googleSheets.ts
// Busca a lista de oficiais (coluna "Nome") da planilha pública geral da
// polícia "Registro P.M.C Metroville" (aba/gid=0) para preencher os campos
// QRA e Daec.

export interface Oficial {
  badge: string;
  patente: string;
  nome: string;
  unidade: string;
  status: string;
}

const SHEET_ID = "1vMENvZD4ZMbMivjuci6vPOi344LK0bQa5s12-ERg5mg";
const SHEET_GID = "0";
const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}`;

// Parser simples de CSV (suporta campos entre aspas com vírgulas internas),
// evita adicionar uma dependência nova só para isso.
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

let cacheOficiais: Oficial[] | null = null;
let cachePromise: Promise<Oficial[]> | null = null;

export async function buscarOficiais(forceRefresh = false): Promise<Oficial[]> {
  if (cacheOficiais && !forceRefresh) return cacheOficiais;
  if (cachePromise && !forceRefresh) return cachePromise;

  cachePromise = (async () => {
    const res = await fetch(SHEET_CSV_URL);
    if (!res.ok) {
      throw new Error("Não foi possível acessar a planilha geral da polícia.");
    }
    const text = await res.text();
    const linhas = text.split(/\r?\n/);
    const oficiais: Oficial[] = [];

    // Colunas na planilha "Registro P.M.C Metroville":
    // B=Nome  C=ID  D=Badge  E=Patente  G=UN (unidade)  H=Status
    // As demais linhas são cabeçalhos de patente (ex: "CORONEL"),
    // separadores em branco ou marcadores "i" e são ignoradas abaixo.
    for (const linha of linhas) {
      if (!linha.trim()) continue;
      const col = parseCSVLine(linha);
      const nome = (col[1] || "").trim();
      const id = (col[2] || "").trim();
      const badge = (col[3] || "").trim();
      const patente = (col[4] || "").trim();
      const unidade = (col[6] || "").trim();
      const status = (col[7] || "").trim();

      if (!nome || nome.toLowerCase() === "nome") continue;
      if (!badge || Number.isNaN(Number(badge))) continue;
      if (!id || Number.isNaN(Number(id))) continue;

      oficiais.push({ badge, patente, nome, unidade, status });
    }

    cacheOficiais = oficiais;
    return oficiais;
  })();

  return cachePromise;
}
