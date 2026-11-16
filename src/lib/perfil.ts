// src/lib/perfil.ts
import api from "@/lib/api";

export interface DuracaoResumo {
  jornadas: number;
  horas: number;
  minutos: number;
  segundos: number;
  total_minutos: number;
  total_segundos: number;
}

export interface AtividadeDia {
  data: string; // "YYYY-MM-DD"
  jornadas: number;
}

export interface Perfil {
  username: string;
  callsign: string;
  cargo: string | null;
  id_funcional: string | null;
  lotacao: string;
  data_ingresso: string | null;
  /** Dias desde que o cargo atual passou a valer. null = sem cargo ou sem histórico ainda. */
  tempo_na_patente_dias: number | null;
  em_servico: boolean;
  /** Nome civil/OOC do membro. Opcional: só aparece no card se o backend enviar esse campo. */
  nome_completo?: string | null;
  /** Bio curta do membro, editável pelo próprio usuário no card de perfil. */
  bio?: string | null;
  discord: {
    id: string | null;
    username: string;
    avatar: string;
    conectado: boolean;
  };
  jornadas: {
    hoje: number;
    ultimos_7_dias: number;
    ultimos_30_dias: number;
    total: number;
  };
  horas: {
    hoje: DuracaoResumo;
    ultimos_7_dias: DuracaoResumo;
    ultimos_30_dias: DuracaoResumo;
    total: DuracaoResumo;
  };
  atividade: AtividadeDia[];
}

function authHeaders() {
  const token = localStorage.getItem("user_token");
  return { Authorization: `Bearer ${token}` };
}

export async function getPerfil(): Promise<Perfil> {
  const { data } = await api.get<Perfil>("perfil/", { headers: authHeaders() });
  return data;
}

/** Perfil completo de outro membro (somente leitura) — usado ao abrir um card da aba Efetivo. */
export async function getPerfilPorUsername(username: string): Promise<Perfil> {
  const { data } = await api.get<Perfil>(`perfis/${encodeURIComponent(username)}/`, {
    headers: authHeaders(),
  });
  return data;
}

export async function atualizarBadge(lotacao: string): Promise<{ lotacao: string }> {
  const { data } = await api.patch<{ lotacao: string }>(
    "perfil/",
    { lotacao },
    { headers: authHeaders() },
  );
  return data;
}

export async function atualizarUsername(username: string): Promise<{ username: string }> {
  const { data } = await api.patch<{ username: string }>(
    "perfil/",
    { username },
    { headers: authHeaders() },
  );
  return data;
}

export async function atualizarBio(bio: string): Promise<{ bio: string }> {
  const { data } = await api.patch<{ bio: string }>(
    "perfil/",
    { bio },
    { headers: authHeaders() },
  );
  return data;
}

/** Versão resumida do perfil, usada no diretório com todo mundo (aba Efetivo). */
export interface PerfilResumo {
  username: string;
  callsign: string;
  cargo: string | null;
  id_funcional: string | null;
  lotacao: string;
  bio: string | null;
  avatar: string;
  em_servico: boolean;
  data_ingresso: string | null;
  tempo_na_patente_dias: number | null;
  horas_total: DuracaoResumo;
}

export async function getPerfis(): Promise<PerfilResumo[]> {
  const { data } = await api.get<PerfilResumo[]>("perfis/", { headers: authHeaders() });
  return data;
}

export interface Ausencia {
  id: number;
  usuario: number;
  usuario_nome: string;
  data_inicio: string;
  data_fim: string;
  motivo: string;
  criado_em: string;
}

export async function getAusencias(): Promise<Ausencia[]> {
  const { data } = await api.get<Ausencia[]>("ausencias/", { headers: authHeaders() });
  return data;
}

export async function criarAusencia(payload: {
  data_inicio: string;
  data_fim: string;
  motivo: string;
}): Promise<Ausencia> {
  const { data } = await api.post<Ausencia>("ausencias/", payload, { headers: authHeaders() });
  return data;
}

export async function excluirAusencia(id: number): Promise<void> {
  await api.delete(`ausencias/${id}/`, { headers: authHeaders() });
}
