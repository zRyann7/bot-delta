"use client";

import { useState, useEffect, useCallback } from "react";
import { CalendarOff, Trash2, Loader2, ShieldAlert, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SITE_NAME } from "@/lib/config";
import api from "@/lib/api";
import { verificarIsAdmin, isAdminCacheado } from "@/lib/auth";

// Formato retornado pelo backend (GET /api/ausencias/). "usuario_nome" vem
// do dono do registro (definido pelo servidor a partir do token, nunca
// enviado pelo cliente) — mesmo padrão usado em Ponto/oficial.
interface Ausencia {
  id: number;
  usuario: number;
  usuario_nome: string;
  data_inicio: string;
  data_fim: string;
  motivo: string;
  criado_em: string;
}

function authHeaders() {
  const token = localStorage.getItem("user_token");
  return { Authorization: `Bearer ${token}` };
}

function formatarData(iso: string) {
  // "YYYY-MM-DD" -> Date local (evita o dia "voltar" por causa de fuso).
  const [ano, mes, dia] = iso.split("-").map(Number);
  return new Date(ano, mes - 1, dia).toLocaleDateString("pt-BR");
}

function hoje() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function statusAusencia(a: Ausencia): "atual" | "futura" | "encerrada" {
  const hojeStr = hoje();
  if (hojeStr < a.data_inicio) return "futura";
  if (hojeStr > a.data_fim) return "encerrada";
  return "atual";
}

const BADGE_STATUS: Record<ReturnType<typeof statusAusencia>, { label: string; className: string }> = {
  atual: { label: "Em andamento", className: "bg-success/10 text-success" },
  futura: { label: "Agendada", className: "bg-primary/10 text-primary" },
  encerrada: { label: "Encerrada", className: "bg-muted text-muted-foreground" },
};

export default function Ausencias() {
  const [isAdmin, setIsAdmin] = useState(isAdminCacheado);
  const [usuarioLogado, setUsuarioLogado] = useState("");
  const [ausencias, setAusencias] = useState<Ausencia[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [excluindoId, setExcluindoId] = useState<number | null>(null);

  const carregarAusencias = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      // O backend já devolve apenas as ausências do usuário autenticado,
      // exceto se ele for administrador (is_staff), caso em que devolve as
      // de todo mundo — mesma regra de acesso usada em Pontos.
      const { data } = await api.get<Ausencia[]>("ausencias/", { headers: authHeaders() });
      setAusencias(data);
    } catch (err) {
      console.error("Erro ao carregar ausências:", err);
      setErro("Não foi possível carregar as ausências. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    verificarIsAdmin().then(setIsAdmin);
    setUsuarioLogado(localStorage.getItem("user_name") || "");
    carregarAusencias();
  }, [carregarAusencias]);

  const handleExcluir = async (id: number) => {
    if (!window.confirm("Excluir esta ausência?")) return;
    setExcluindoId(id);
    try {
      await api.delete(`ausencias/${id}/`, { headers: authHeaders() });
      setAusencias((atuais) => atuais.filter((a) => a.id !== id));
      toast.success("Ausência excluída.");
    } catch (err) {
      console.error("Erro ao excluir ausência:", err);
      toast.error("Não foi possível excluir esta ausência. Tente novamente.");
    } finally {
      setExcluindoId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4">
      <header>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Ausências</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Períodos de ausência do serviço registrados no perfil de cada usuário do {SITE_NAME}.
        </p>
      </header>

      {erro && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {erro}
        </div>
      )}

      {/* Listagem — cada usuário vê as próprias; admin vê as de todos.
          Ausências são criadas no perfil do usuário; esta página é somente leitura (+ exclusão). */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <CalendarOff size={18} className="text-muted-foreground" />
          <h2 className="text-lg font-bold text-foreground">
            {isAdmin ? "Ausências registradas (todos os usuários)" : "Minhas ausências"}
          </h2>
        </div>

        {carregando ? (
          <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
            <Loader2 className="animate-spin" />
            <p className="text-sm">Carregando ausências...</p>
          </div>
        ) : !usuarioLogado ? (
          <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
            <EyeOff size={24} />
            <p className="text-sm">Faça login para ver suas ausências.</p>
          </div>
        ) : ausencias.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-muted-foreground">
            <ShieldAlert className="mb-2" />
            {isAdmin ? "Nenhuma ausência registrada ainda." : "Você não tem nenhuma ausência registrada."}
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {ausencias.map((a) => {
                const badge = BADGE_STATUS[statusAusencia(a)];
                return (
                  <motion.div
                    layout
                    key={a.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-1">
                      {isAdmin && <p className="font-semibold text-card-foreground">{a.usuario_nome}</p>}
                      <p className="text-sm text-foreground">
                        {formatarData(a.data_inicio)} até {formatarData(a.data_fim)}
                      </p>
                      <p className="text-xs text-muted-foreground">{a.motivo}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}>
                        {badge.label}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-destructive hover:text-destructive"
                        disabled={excluindoId === a.id}
                        onClick={() => handleExcluir(a.id)}
                      >
                        {excluindoId === a.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
