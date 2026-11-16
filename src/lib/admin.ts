import api from "@/lib/api";

export interface AdminUsuario {
  id: number;
  username: string;
  is_active: boolean;
  is_staff: boolean;
  cargo_id: number | null;
  cargo: string | null;
  id_funcional: string | null;
  lotacao: string;
  callsign: string;
  discord_username: string;
}

export interface CargoOption { id: number; nome: string; ordem: number; usuarios_count?: number; }

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem("user_token")}` };
}

export async function getAdminUsuarios(): Promise<AdminUsuario[]> {
  const { data } = await api.get<AdminUsuario[]>("admin/usuarios/", { headers: authHeaders() });
  return data;
}

export async function getAdminCargos(): Promise<CargoOption[]> {
  const { data } = await api.get<CargoOption[]>("admin/cargos/", { headers: authHeaders() });
  return data;
}

export async function criarAdminCargo(payload: Pick<CargoOption, "nome" | "ordem">) {
  const { data } = await api.post("admin/cargos/", payload, { headers: authHeaders() });
  return data as CargoOption;
}

export async function atualizarAdminCargo(id: number, payload: Pick<CargoOption, "nome" | "ordem">) {
  const { data } = await api.patch(`admin/cargos/${id}/`, payload, { headers: authHeaders() });
  return data as CargoOption;
}

export async function excluirAdminCargo(id: number) {
  await api.delete(`admin/cargos/${id}/`, { headers: authHeaders() });
}

export async function atualizarAdminUsuario(id: number, payload: Pick<AdminUsuario, "username" | "cargo_id" | "id_funcional" | "lotacao">) {
  const { data } = await api.patch(`admin/usuarios/${id}/`, payload, { headers: authHeaders() });
  return data;
}

export async function excluirAdminUsuario(id: number) {
  await api.delete(`admin/usuarios/${id}/`, { headers: authHeaders() });
}
