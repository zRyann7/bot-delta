import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronsUp, Loader2, Search, Shield, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getPerfis, type PerfilResumo } from "@/lib/perfil";

function formatarHoras(p: PerfilResumo) {
  return `${p.horas_total.horas}h ${String(p.horas_total.minutos).padStart(2, "0")}m`;
}

function formatarTempoNaPatente(dias: number | null) {
  if (dias === null) return "—";
  if (dias < 1) return "Hoje";
  return `${dias} dia${dias === 1 ? "" : "s"}`;
}

function formatarDataCompacta(iso: string | null) {
  if (!iso) return "—";
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

/** Card de um membro na aba Efetivo — clicável, abre o perfil completo. */
function CardEfetivo({ p }: { p: PerfilResumo }) {
  const nomeExibicao = p.callsign || p.username;

  return (
    <Link
      to={`/perfil/${encodeURIComponent(p.username)}`}
      className="group flex flex-col rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/50"
    >
      <div className="flex items-start gap-3">
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-muted">
          {p.avatar ? (
            <img src={p.avatar} alt={nomeExibicao} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <Shield className="h-5 w-5" />
            </div>
          )}
          <span
            className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card ${
              p.em_servico ? "bg-success" : "bg-muted-foreground/40"
            }`}
            title={p.em_servico ? "Em serviço" : "Fora de serviço"}
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-foreground group-hover:text-primary">
            {p.lotacao ? `#${p.lotacao} ` : ""}{nomeExibicao}
            {p.id_funcional ? ` | ${p.id_funcional}` : ""}
          </p>
          {p.cargo && (
            <span className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
              <ChevronsUp className="h-3 w-3" /> {p.cargo}
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border/60 pt-3 text-center">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Na patente
          </p>
          <p className="mt-0.5 text-xs font-semibold text-foreground">
            {formatarTempoNaPatente(p.tempo_na_patente_dias)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Horas
          </p>
          <p className="mt-0.5 text-xs font-semibold text-foreground">{formatarHoras(p)}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Na unidade
          </p>
          <p className="mt-0.5 text-xs font-semibold text-foreground">
            {formatarDataCompacta(p.data_ingresso)}
          </p>
        </div>
      </div>
    </Link>
  );
}

export default function Efetivo() {
  const [perfis, setPerfis] = useState<PerfilResumo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");

  useEffect(() => {
    getPerfis()
      .then(setPerfis)
      .catch(() => setErro("Não foi possível carregar o efetivo."))
      .finally(() => setCarregando(false));
  }, []);

  const filtrados = useMemo(() => {
    const alvo = busca.trim().toLowerCase();
    if (!alvo) return perfis;
    return perfis.filter((p) =>
      `${p.callsign} ${p.username} ${p.cargo ?? ""} ${p.lotacao} ${p.id_funcional ?? ""}`
        .toLowerCase()
        .includes(alvo)
    );
  }, [perfis, busca]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Efetivo</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {carregando ? "Carregando..." : `${perfis.length} perfil(is) cadastrado(s).`}
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, cargo ou badge..."
            className="pl-9"
          />
        </div>
      </div>

      {carregando ? (
        <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando efetivo...
        </div>
      ) : erro ? (
        <div className="rounded-2xl border border-dashed border-destructive/30 p-8 text-center text-sm text-destructive">
          {erro}
        </div>
      ) : filtrados.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          <Users className="mx-auto mb-2 h-6 w-6" />
          Nenhum perfil encontrado.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtrados.map((p) => (
            <CardEfetivo key={p.username} p={p} />
          ))}
        </div>
      )}
    </div>
  );
}
