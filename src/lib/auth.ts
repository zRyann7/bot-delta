// src/lib/auth.ts
//
// A flag "is_admin" guardada no localStorage NUNCA deve ser tratada como
// fonte de verdade — qualquer pessoa pode abrir o DevTools (F12) e mudar
// esse valor manualmente. Ela só serve como um "chute inicial" para a UI
// não piscar antes da resposta do servidor.
//
// A verdade sobre quem é admin sempre vem daqui: uma checagem que pergunta
// pro backend, autenticada pelo token JWT — algo que o navegador não tem
// como falsificar sem um token válido de fato.

import api from "@/lib/api";

/**
 * Confirma com o backend se o usuário autenticado é admin (is_staff).
 * Atualiza o cache local (usado só para o primeiro render) e retorna o
 * valor real. Em caso de token inválido/expirado, assume não-admin.
 */
export async function verificarIsAdmin(): Promise<boolean> {
  const token = localStorage.getItem("user_token");
  if (!token) {
    localStorage.setItem("is_admin", "false");
    return false;
  }

  try {
    const { data } = await api.get<{ username: string; is_staff: boolean }>("me/", {
      headers: { Authorization: `Bearer ${token}` },
    });
    localStorage.setItem("is_admin", data.is_staff ? "true" : "false");
    return data.is_staff;
  } catch {
    // Token inválido/expirado ou backend fora do ar: nunca assuma admin.
    localStorage.setItem("is_admin", "false");
    return false;
  }
}

/** Leitura só para um primeiro render sem "flash" — nunca use isto para
 * decidir se uma ação é permitida; use sempre verificarIsAdmin(). */
export function isAdminCacheado(): boolean {
  return localStorage.getItem("is_admin") === "true";
}
