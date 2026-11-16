import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Table2, RefreshCw, Loader2, Check, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buscarHierarquiaUnidade, type GrupoHierarquia } from "@/lib/hierarquiaSheet";

const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1AzYZ6oYRMbx3AYU0GuFTd9M5T_kLVUBAKoQxvU7lToM/edit?usp=sharing";

type AbaPlanilha = "hierarquia";

function CursoCell({ ok }: { ok: boolean }) {
  return (
    <span
      className={`mx-auto flex h-5 w-5 items-center justify-center rounded ${
        ok ? "bg-success/15 text-success" : "bg-muted text-muted-foreground/50"
      }`}
    >
      {ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = status.trim().toUpperCase();
  if (!s) return <span className="text-muted-foreground">—</span>;
  const ativo = s === "ATIVO";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${
        ativo ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${ativo ? "bg-success" : "bg-destructive"}`} />
      {status}
    </span>
  );
}

function HierarquiaTab() {
  const [grupos, setGrupos] = useState<GrupoHierarquia[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const carregar = (forceRefresh = false) => {
    if (forceRefresh) setRefreshing(true);
    else setLoading(true);
    setErro(false);
    buscarHierarquiaUnidade(forceRefresh)
      .then(setGrupos)
      .catch(() => setErro(true))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    carregar();
  }, []);

  const totalMembros = grupos.reduce((acc, g) => acc + g.membros.length, 0);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  if (erro) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-center text-sm text-destructive">
        Não foi possível carregar os dados da planilha da unidade.
        <div className="mt-3">
          <Button variant="outline" size="sm" onClick={() => carregar(true)}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {totalMembros} membro(s) cadastrado(s) na planilha da unidade.
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => carregar(true)} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Button asChild variant="ghost" size="sm">
            <a href={SHEET_URL} target="_blank" rel="noopener noreferrer">
              Abrir planilha <ExternalLink className="ml-2 h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      </div>

      {grupos.map((grupo) => (
        <motion.div
          key={grupo.nome}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-2xl border border-border bg-card shadow-card"
        >
          <div className="border-b border-border bg-gradient-to-r from-primary/15 to-transparent px-4 py-2.5">
            <h3 className="font-display text-sm font-bold tracking-wide text-primary">{grupo.nome}</h3>
          </div>

          {grupo.membros.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Nenhum membro nessa posição.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr className="text-left">
                    <th className="px-3 py-2.5">ID</th>
                    <th className="px-3 py-2.5">Nome</th>
                    <th className="px-3 py-2.5">Badge</th>
                    <th className="px-3 py-2.5">Patente</th>
                    <th className="px-2 py-2.5 text-center">C1</th>
                    <th className="px-2 py-2.5 text-center">C2</th>
                    <th className="px-2 py-2.5 text-center">C3</th>
                    <th className="px-3 py-2.5">ADVS</th>
                    <th className="px-3 py-2.5">Status</th>
                    <th className="px-3 py-2.5">Apreensões</th>
                    <th className="px-3 py-2.5">Data promoção</th>
                    <th className="px-3 py-2.5">Tempo no cargo</th>
                  </tr>
                </thead>
                <tbody>
                  {grupo.membros.map((m, i) => (
                    <tr key={`${m.id}-${i}`} className="border-t border-border/70">
                      <td className="px-3 py-2.5 text-muted-foreground">{m.id}</td>
                      <td className="px-3 py-2.5 font-semibold text-foreground">{m.nome}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{m.badge || "—"}</td>
                      <td className="px-3 py-2.5">
                        <span className="rounded border border-border px-2 py-0.5 text-xs">{m.patente || "—"}</span>
                      </td>
                      <td className="px-2 py-2.5">
                        <CursoCell ok={m.curso1} />
                      </td>
                      <td className="px-2 py-2.5">
                        <CursoCell ok={m.curso2} />
                      </td>
                      <td className="px-2 py-2.5">
                        <CursoCell ok={m.curso3} />
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">{m.advs || "—"}</td>
                      <td className="px-3 py-2.5">
                        <StatusBadge status={m.status} />
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">{m.apreensoes || "—"}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{m.dataPromocao || "—"}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{m.tempoNoCargo || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      ))}

      {grupos.length === 0 && (
        <div className="p-10 text-center text-sm text-muted-foreground">
          Nenhum dado encontrado na planilha da unidade.
        </div>
      )}
    </div>
  );
}

export default function Planilha() {
  const [aba, setAba] = useState<AbaPlanilha>("hierarquia");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Table2 className="h-5 w-5 text-primary" />
        <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">Planilha</h1>
      </div>
      <p className="-mt-4 text-sm text-muted-foreground">Efetivo e hierarquia da unidade, sincronizados direto da planilha.</p>

      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setAba("hierarquia")}
          className={`border-b-2 px-4 py-3 text-sm font-semibold ${
            aba === "hierarquia" ? "border-primary text-primary" : "border-transparent text-muted-foreground"
          }`}
        >
          Hierarquia
        </button>
      </div>

      {aba === "hierarquia" && <HierarquiaTab />}
    </div>
  );
}
