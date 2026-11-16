"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Clock, LogIn, LogOut, ShieldAlert, Lock, EyeOff, User, Loader2, Filter,
  ChevronLeft, ChevronRight, CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { SITE_NAME } from "@/lib/config";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { verificarIsAdmin, isAdminCacheado } from "@/lib/auth";

type Periodo = "semana_atual" | "semana_passada" | "mes_atual" | "personalizado";
type StatusPonto = "todos" | "aberto" | "fechado";

const OPCOES_STATUS: { value: StatusPonto; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "aberto", label: "Em aberto" },
  { value: "fechado", label: "Fechados" },
];

const OPCOES_PERIODO: { value: Periodo; label: string }[] = [
  { value: "semana_atual", label: "Esta semana" },
  { value: "semana_passada", label: "Semana passada" },
  { value: "mes_atual", label: "Este mês" },
  { value: "personalizado", label: "Personalizado" },
];

interface Duracao {
  horas: number;
  minutos: number;
  segundos: number;
  total_minutos: number;
  total_segundos: number;
}

interface ResumoPorUsuario extends Duracao {
  usuario: string;
}

interface ResumoPeriodo {
  periodo: Periodo;
  inicio: string;
  fim: string;
  meu_total?: Duracao;
  por_usuario?: ResumoPorUsuario[];
  total_geral?: Duracao;
}

function formatarHoras(d?: Duracao) {
  if (!d) return "—";
  return `${d.horas}h ${String(d.minutos).padStart(2, "0")}min ${String(d.segundos).padStart(2, "0")}s`;
}

// Formato retornado pelo backend (GET /api/pontos/).
// "oficial" vem do usuário dono do registro (definido pelo servidor, nunca
// enviado pelo cliente), então não há como um usuário ler ou fabricar o
// ponto de outra pessoa.
interface Ponto {
  id: number;
  oficial: string;
  entrada: string;
  saida: string | null;
  fechado_manualmente: boolean;
}

// Quando o admin filtra por "Fechados", o backend não devolve cada ponto
// individual — devolve uma linha por usuário já com o total de horas
// somado (ver PontoViewSet._listar_fechados_agrupados no backend). Assim,
// alguém que abriu 30 pontos e fez 8h aparece uma única vez, com "8h".
interface PontoFechadoAgrupado extends Duracao {
  usuario: string;
  quantidade_pontos: number;
}

function ehPontoAgrupado(item: Ponto | PontoFechadoAgrupado): item is PontoFechadoAgrupado {
  return "quantidade_pontos" in item;
}

// Resposta paginada do backend (GET /api/pontos/?page=N) — 10 itens por
// página. Como o queryset já vem restrito ao próprio usuário para quem não
// é admin, cada página mostra, no caso de um usuário comum, apenas os seus
// próprios últimos 10 pontos daquela página. Quando o admin filtra por
// "Fechados", cada item da página é um total agrupado por usuário (ver
// PontoFechadoAgrupado) em vez de um ponto individual.
interface PontosPaginados {
  count: number;
  next: string | null;
  previous: string | null;
  results: Array<Ponto | PontoFechadoAgrupado>;
}

const PONTOS_POR_PAGINA = 10;

function formatarDuracao(inicioISO: string, fimISO: string) {
  const ms = new Date(fimISO).getTime() - new Date(inicioISO).getTime();
  const totalMin = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h ${m}min`;
}

function authHeaders() {
  const token = localStorage.getItem("user_token");
  return { Authorization: `Bearer ${token}` };
}

export default function BaterPonto() {
  const [isAdmin, setIsAdmin] = useState(isAdminCacheado);
  const [usuarioLogado, setUsuarioLogado] = useState("");
  const [pontos, setPontos] = useState<Array<Ponto | PontoFechadoAgrupado>>([]);
  const [carregando, setCarregando] = useState(true);
  const [batendo, setBatendo] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [ultimaAcao, setUltimaAcao] = useState<"entrada" | "saida" | null>(null);
  const [erro, setErro] = useState("");

  // Paginação da listagem de pontos — 10 por página, do mais recente para
  // o mais antigo (o backend já ordena por "-entrada").
  const [pagina, setPagina] = useState(1);
  const [totalPontos, setTotalPontos] = useState(0);

  // Filtro de status da listagem ("mais enxuto") — restrito a admin, já
  // que só o admin vê pontos de todo mundo misturados. Resolvido no
  // backend para não bagunçar a paginação de 10 por página.
  const [statusFiltro, setStatusFiltro] = useState<StatusPonto>("todos");

  // Sessão em aberto do usuário logado. Guardada à parte da página exibida
  // na listagem, porque para um admin navegando em páginas seguintes o
  // próprio ponto em aberto pode não estar na página atualmente visível.
  const [sessaoAberta, setSessaoAberta] = useState(false);

  // Filtro de período ("funil") — em vez de zerar os pontos toda semana,
  // apenas filtramos o histórico já existente pelo período escolhido.
  const [periodo, setPeriodo] = useState<Periodo>("semana_atual");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [resumo, setResumo] = useState<ResumoPeriodo | null>(null);
  const [carregandoResumo, setCarregandoResumo] = useState(false);
  const [erroResumo, setErroResumo] = useState("");

  const carregarResumo = useCallback(async () => {
    // O filtro/resumo de horas por período é exclusivo de administradores.
    if (!isAdmin) return;
    if (periodo === "personalizado" && (!dataInicio || !dataFim)) return;
    setCarregandoResumo(true);
    setErroResumo("");
    try {
      const params: Record<string, string> = { periodo };
      if (periodo === "personalizado") {
        params.inicio = dataInicio;
        params.fim = dataFim;
      }
      const { data } = await api.get<ResumoPeriodo>("pontos/resumo/", {
        headers: authHeaders(),
        params,
      });
      setResumo(data);
    } catch (err) {
      console.error("Erro ao carregar resumo de horas:", err);
      setErroResumo("Não foi possível calcular o resumo desse período.");
      setResumo(null);
    } finally {
      setCarregandoResumo(false);
    }
  }, [isAdmin, periodo, dataInicio, dataFim]);

  const carregarPontos = useCallback(async (paginaAlvo: number, status: StatusPonto) => {
    setCarregando(true);
    setErro("");
    try {
      // O backend já devolve apenas os pontos do usuário autenticado,
      // exceto se ele for administrador (is_staff), caso em que devolve
      // os pontos de todo mundo — filtrados por status quando pedido.
      // Filtrar no servidor (e não no cliente) mantém a contagem/paginação
      // corretas mesmo com o filtro aplicado.
      const params: Record<string, string | number> = { page: paginaAlvo };
      if (status !== "todos") {
        params.status = status;
      }
      const { data } = await api.get<PontosPaginados>("pontos/", {
        headers: authHeaders(),
        params,
      });
      setPontos(data.results);
      setTotalPontos(data.count);
    } catch (err) {
      console.error("Erro ao carregar pontos:", err);
      setErro("Não foi possível carregar os pontos. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }, []);

  // Status da sessão (em serviço ou não) do usuário logado, independente
  // da página da listagem que está sendo exibida.
  const carregarStatusSessao = useCallback(async () => {
    try {
      const { data } = await api.get<PontosPaginados>("pontos/", {
        headers: authHeaders(),
        params: { page: 1, mine: "true" },
      });
      const aberto = data.results.some((p) => p.saida === null);
      setSessaoAberta(aberto);
    } catch (err) {
      console.error("Erro ao carregar status da sessão:", err);
    }
  }, []);

  useEffect(() => {
    verificarIsAdmin().then(setIsAdmin);
    setUsuarioLogado(localStorage.getItem("user_name") || "");
    carregarStatusSessao();
  }, [carregarStatusSessao]);

  useEffect(() => {
    carregarPontos(pagina, statusFiltro);
  }, [carregarPontos, pagina]);

  // Trocar o filtro de status recarrega a página 1 (senão o admin pode
  // cair numa página que não existe mais dentro do subconjunto filtrado).
  // Só o próprio efeito acima reage a "pagina" pra não disparar duas
  // buscas seguidas quando o filtro muda com a página já em 1.
  useEffect(() => {
    if (pagina === 1) {
      carregarPontos(1, statusFiltro);
    } else {
      setPagina(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFiltro]);

  useEffect(() => {
    carregarResumo();
  }, [carregarResumo]);

  const handleBaterPonto = async () => {
    if (!usuarioLogado || batendo) return;
    const acaoRealizada: "entrada" | "saida" = sessaoAberta ? "saida" : "entrada";
    setBatendo(true);
    setErro("");
    try {
      // O servidor decide, com base no usuário autenticado pelo token, se
      // é uma batida de entrada ou de saída — o cliente não escolhe isso.
      await api.post("pontos/bater/", {}, { headers: authHeaders() });
      // Uma nova batida sempre aparece na página 1 (mais recente primeiro).
      if (pagina !== 1) {
        setPagina(1);
      } else {
        await carregarPontos(1, statusFiltro);
      }
      await Promise.all([carregarResumo(), carregarStatusSessao()]);
      setUltimaAcao(acaoRealizada);
      setSucesso(true);
      window.setTimeout(() => setSucesso(false), 1400);
    } catch (err) {
      console.error("Erro ao bater ponto:", err);
      setErro("Não foi possível registrar o ponto. Tente novamente.");
    } finally {
      setBatendo(false);
    }
  };

  const handleFecharManualmente = async (id: number) => {
    if (!window.confirm("Fechar este ponto manualmente com o horário atual?")) return;
    try {
      await api.post(`pontos/${id}/fechar/`, {}, { headers: authHeaders() });
      await Promise.all([carregarPontos(pagina, statusFiltro), carregarResumo(), carregarStatusSessao()]);
    } catch (err) {
      console.error("Erro ao fechar ponto:", err);
      setErro("Não foi possível fechar este ponto. Tente novamente.");
    }
  };

  // O backend já retorna só o que este usuário pode ver e já entrega a
  // página certa, ordenada da mais recente para a mais antiga — não é
  // preciso (nem deve-se) filtrar/ordenar de novo no cliente.
  const pontosOrdenados = pontos;
  const totalPaginas = Math.max(1, Math.ceil(totalPontos / PONTOS_POR_PAGINA));

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4">
      <header>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Bater Ponto</h1>
        <p className="text-muted-foreground mt-1 text-sm">Registro de entrada e saída de serviço do {SITE_NAME}.</p>
      </header>

      {erro && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {erro}
        </div>
      )}

      {/* Card de bater ponto — disponível para todos, baseado no usuário logado */}
      <motion.div
        animate={sucesso ? { borderColor: "hsl(var(--success))" } : { borderColor: "hsl(var(--border))" }}
        transition={{ duration: 0.4 }}
        className="bg-card border rounded-2xl p-6 shadow-lg space-y-4"
      >
        <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-4 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User size={18} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Registrando ponto como</p>
            <p className="font-semibold text-foreground">{usuarioLogado || "Usuário"}</p>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
          <span className="text-sm text-muted-foreground">Status atual</span>
          <span
            className={cn(
              "flex items-center gap-1.5 text-sm font-semibold",
              sessaoAberta ? "text-success" : "text-muted-foreground"
            )}
          >
            <span className="relative flex h-2 w-2">
              {sessaoAberta && (
                <motion.span
                  className="absolute inline-flex h-full w-full rounded-full bg-success"
                  animate={{ scale: [1, 2.2], opacity: [0.6, 0] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
                />
              )}
              <span className={cn("relative inline-flex h-2 w-2 rounded-full", sessaoAberta ? "bg-success" : "bg-muted-foreground")} />
            </span>
            {sessaoAberta ? "Em serviço" : "Fora de serviço"}
          </span>
        </div>

        <motion.div whileTap={{ scale: 0.97 }} className="w-full">
          <Button
            onClick={handleBaterPonto}
            disabled={!usuarioLogado || batendo}
            className={cn(
              "w-full gap-2 overflow-hidden",
              sucesso ? "bg-success hover:bg-success text-success-foreground" : sessaoAberta ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" : ""
            )}
          >
            <AnimatePresence mode="wait" initial={false}>
              {sucesso ? (
                <motion.span
                  key="sucesso"
                  initial={{ opacity: 0, scale: 0.4, rotate: -45 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.4 }}
                  transition={{ type: "spring", stiffness: 500, damping: 20 }}
                  className="flex items-center gap-2"
                >
                  <CheckCircle2 size={18} />
                  {ultimaAcao === "saida" ? "Saída registrada!" : "Entrada registrada!"}
                </motion.span>
              ) : batendo ? (
                <motion.span
                  key="carregando"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-2"
                >
                  <Loader2 size={18} className="animate-spin" />
                  Registrando...
                </motion.span>
              ) : (
                <motion.span
                  key="parado"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-2"
                >
                  {sessaoAberta ? <LogOut size={18} /> : <LogIn size={18} />}
                  {sessaoAberta ? "Bater Saída" : "Bater Entrada"}
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </motion.div>
      </motion.div>

      {/* Filtro de período — soma as horas do intervalo escolhido sem apagar
          nada. Restrito a administradores. */}
      {isAdmin && (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-lg space-y-4">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-muted-foreground" />
            <h2 className="text-lg font-bold text-foreground">Horas por período</h2>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Select value={periodo} onValueChange={(v) => setPeriodo(v as Periodo)}>
              <SelectTrigger className="sm:w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OPCOES_PERIODO.map((op) => (
                  <SelectItem key={op.value} value={op.value}>
                    {op.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {periodo === "personalizado" && (
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="w-40"
                />
                <span className="text-sm text-muted-foreground">até</span>
                <Input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="w-40"
                />
              </div>
            )}
          </div>

          {periodo === "personalizado" && (!dataInicio || !dataFim) ? (
            <p className="text-sm text-muted-foreground">Escolha a data de início e fim para calcular.</p>
          ) : carregandoResumo ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 size={16} className="animate-spin" /> Calculando...
            </div>
          ) : erroResumo ? (
            <p className="text-sm text-destructive">{erroResumo}</p>
          ) : resumo ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-primary/10 px-4 py-3">
                <span className="text-sm font-semibold text-foreground">Total geral do período</span>
                <span className="text-lg font-bold text-primary">{formatarHoras(resumo.total_geral)}</span>
              </div>
              {resumo.por_usuario && resumo.por_usuario.length > 0 ? (
                <div className="space-y-2">
                  {resumo.por_usuario.map((u) => (
                    <div
                      key={u.usuario}
                      className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-2.5"
                    >
                      <span className="text-sm text-foreground">{u.usuario}</span>
                      <span className="text-sm font-semibold text-foreground">{formatarHoras(u)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Ninguém bateu ponto nesse período.</p>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* Listagem de pontos — cada usuário vê os seus; admin vê os de todos */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-muted-foreground" />
            <h2 className="text-lg font-bold text-foreground">
              {isAdmin ? "Pontos registrados (todos os usuários)" : "Meus pontos registrados"}
            </h2>
          </div>

          {isAdmin && (
            <Select value={statusFiltro} onValueChange={(v) => setStatusFiltro(v as StatusPonto)}>
              <SelectTrigger className="sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OPCOES_STATUS.map((op) => (
                  <SelectItem key={op.value} value={op.value}>
                    {op.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {carregando ? (
          <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
            <Loader2 className="animate-spin" />
            <p className="text-sm">Carregando pontos...</p>
          </div>
        ) : !usuarioLogado ? (
          <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
            <EyeOff size={24} />
            <p className="text-sm">Faça login para ver seu histórico de pontos.</p>
          </div>
        ) : pontosOrdenados.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-muted-foreground">
            <ShieldAlert className="mb-2" />
            {isAdmin ? "Nenhum ponto batido ainda." : "Você ainda não bateu nenhum ponto."}
          </div>
        ) : (
          <div className="space-y-3">
            {pontosOrdenados.map((ponto) =>
              ehPontoAgrupado(ponto) ? (
                // Filtro "Fechados": uma linha por usuário, com o total de
                // horas já somado (em vez de cada ponto individual).
                <motion.div
                  layout
                  key={ponto.usuario}
                  className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-card-foreground">{ponto.usuario}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {ponto.quantidade_pontos} {ponto.quantidade_pontos === 1 ? "ponto fechado" : "pontos fechados"}
                    </p>
                  </div>
                  <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    Total: {formatarHoras(ponto)}
                  </span>
                </motion.div>
              ) : (
                <motion.div
                  layout
                  key={ponto.id}
                  className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    {isAdmin && (
                      <p className="font-semibold text-card-foreground">{ponto.oficial}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Entrada: {new Date(ponto.entrada).toLocaleString("pt-BR")}
                      {ponto.saida && (
                        <>
                          {" · "}Saída: {new Date(ponto.saida).toLocaleString("pt-BR")}
                          {" · "}Duração: {formatarDuracao(ponto.entrada, ponto.saida)}
                        </>
                      )}
                    </p>
                  </div>

                  {ponto.saida ? (
                    <span className="w-fit rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                      {ponto.fechado_manualmente ? "Fechado manualmente" : "Concluído"}
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-success">
                        <span className="h-2 w-2 rounded-full bg-success animate-pulse" /> Em serviço
                      </span>
                      {isAdmin && (
                        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => handleFecharManualmente(ponto.id)}>
                          <Lock size={14} /> Fechar
                        </Button>
                      )}
                    </div>
                  )}
                </motion.div>
              )
            )}

            {totalPaginas > 1 && (
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  disabled={pagina <= 1}
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={14} /> Anterior
                </Button>
                <span className="text-sm text-muted-foreground">
                  Página {pagina} de {totalPaginas}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  disabled={pagina >= totalPaginas}
                  onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                >
                  Próxima <ChevronRight size={14} />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
