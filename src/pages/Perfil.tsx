"use client";

import { useEffect, useState } from "react";
import {
  Shield, Loader2, X, Pencil, Check, GraduationCap, Award,
  ChevronsUp, Sparkles,
} from "lucide-react";
import {
  AreaChart, Area, ResponsiveContainer, XAxis, Tooltip,
} from "recharts";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { SITE_NAME } from "@/lib/config";
import {
  getPerfil, getPerfilPorUsername, getAusencias, criarAusencia, excluirAusencia,
  atualizarBadge, atualizarUsername, atualizarBio,
  type Perfil as PerfilData, type DuracaoResumo, type Ausencia,
} from "@/lib/perfil";

function formatarHoras(d: DuracaoResumo) {
  return `${d.horas}h ${String(d.minutos).padStart(2, "0")}m`;
}

function formatarData(iso: string | null) {
  if (!iso) return "—";
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

function formatarTempoNaPatente(dias: number | null) {
  if (dias === null) return "—";
  if (dias < 1) return "Hoje";
  return `${dias} dia${dias === 1 ? "" : "s"}`;
}

/** Padrão decorativo de linhas diagonais (rabiscos), usado como fundo sutil de seções do card. */
function RabiscosDecorativos() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full text-primary/10"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="rabiscos-perfil"
          width="34"
          height="34"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(35)"
        >
          <line x1="0" y1="0" x2="0" y2="34" stroke="currentColor" strokeWidth="1" />
          <circle cx="0" cy="34" r="1.6" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#rabiscos-perfil)" />
    </svg>
  );
}

/** Linha de informação: label pequeno em caixa alta + valor em destaque à direita. */
function InfoRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/60 py-3 last:border-b-0">
      <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <span className="text-right text-sm font-semibold text-foreground">
        {children}
      </span>
    </div>
  );
}

export default function Perfil() {
  const { username } = useParams<{ username?: string }>();
  const somenteLeitura = !!username;

  const [perfil, setPerfil] = useState<PerfilData | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [editandoBadge, setEditandoBadge] = useState(false);
  const [badgeInput, setBadgeInput] = useState("");
  const [salvandoBadge, setSalvandoBadge] = useState(false);
  const [erroBadge, setErroBadge] = useState("");

  const [editandoUsername, setEditandoUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [salvandoUsername, setSalvandoUsername] = useState(false);
  const [erroUsername, setErroUsername] = useState("");

  const [editandoBio, setEditandoBio] = useState(false);
  const [bioInput, setBioInput] = useState("");
  const [salvandoBio, setSalvandoBio] = useState(false);
  const [erroBio, setErroBio] = useState("");

  useEffect(() => {
    setCarregando(true);
    const promessa = somenteLeitura ? getPerfilPorUsername(username!) : getPerfil();
    promessa
      .then(setPerfil)
      .catch(() => setPerfil(null))
      .finally(() => setCarregando(false));
  }, [somenteLeitura, username]);

  const iniciarEdicaoUsername = () => {
    setUsernameInput(perfil?.username || "");
    setErroUsername("");
    setEditandoUsername(true);
  };

  const salvarUsername = async () => {
    setErroUsername("");
    const valor = usernameInput.trim();
    if (!/^[A-Za-z0-9_]{3,20}$/.test(valor)) {
      setErroUsername("Use de 3 a 20 caracteres: letras, números ou _.");
      return;
    }
    setSalvandoUsername(true);
    try {
      const { username } = await atualizarUsername(valor);
      setPerfil((atual) => (atual ? { ...atual, username } : atual));
      setEditandoUsername(false);
    } catch (err: any) {
      setErroUsername(
        err?.response?.data?.username?.[0] || err?.response?.data?.detail || "Não foi possível salvar o usuário."
      );
    } finally {
      setSalvandoUsername(false);
    }
  };

  const iniciarEdicaoBio = () => {
    setBioInput(perfil?.bio || "");
    setErroBio("");
    setEditandoBio(true);
  };

  const salvarBio = async () => {
    setErroBio("");
    const valor = bioInput.trim();
    if (valor.length > 140) {
      setErroBio("Use no máximo 140 caracteres.");
      return;
    }
    setSalvandoBio(true);
    try {
      const { bio } = await atualizarBio(valor);
      setPerfil((atual) => (atual ? { ...atual, bio } : atual));
      setEditandoBio(false);
    } catch (err: any) {
      setErroBio(
        err?.response?.data?.bio?.[0] || err?.response?.data?.detail || "Não foi possível salvar a bio."
      );
    } finally {
      setSalvandoBio(false);
    }
  };

  const iniciarEdicaoBadge = () => {
    setBadgeInput(perfil?.lotacao || "");
    setErroBadge("");
    setEditandoBadge(true);
  };

  const salvarBadge = async () => {
    setErroBadge("");
    const valor = badgeInput.trim();
    if (valor && !/^\d+$/.test(valor)) {
      setErroBadge("Use só números.");
      return;
    }
    setSalvandoBadge(true);
    try {
      const { lotacao } = await atualizarBadge(valor);
      setPerfil((atual) => (atual ? { ...atual, lotacao } : atual));
      setEditandoBadge(false);
    } catch (err: any) {
      setErroBadge(
        err?.response?.data?.lotacao?.[0] || err?.response?.data?.detail || "Não foi possível salvar o Badge."
      );
    } finally {
      setSalvandoBadge(false);
    }
  };

  if (carregando) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="mb-2 h-6 w-6 animate-spin" /> Carregando perfil...
      </div>
    );
  }

  if (!perfil) {
    return (
      <div className="py-24 text-center text-muted-foreground">
        {somenteLeitura ? "Não foi possível carregar esse perfil." : "Não foi possível carregar o seu perfil."}
      </div>
    );
  }

  const nomeExibicao = perfil.callsign || perfil.username;

  return (
    <div className="space-y-8">
      {/* Cabeçalho da página */}
      <div className="space-y-1 border-b border-border/60 pb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">
          {somenteLeitura ? `Perfil de ${nomeExibicao}` : "Meu perfil"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {somenteLeitura ? "Identidade e desempenho deste membro." : "Consulte sua identidade e seu desempenho."}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
        {/* Card de perfil */}
        <div className="h-fit overflow-hidden rounded-2xl border border-border bg-card">
          <div className="p-4 pb-0">
            <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-muted">
              {perfil.discord.avatar ? (
                <img src={perfil.discord.avatar} alt={nomeExibicao} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <Shield className="h-14 w-14" />
                </div>
              )}
              <span
                className={`absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-background/85 px-3 py-1 text-[11px] font-semibold backdrop-blur-sm ${
                  perfil.em_servico ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${perfil.em_servico ? "bg-primary" : "bg-muted-foreground"}`} />
                {perfil.em_servico ? "Em serviço" : "Fora de serviço"}
              </span>
            </div>
          </div>

          <div className="relative overflow-hidden p-5">
            <RabiscosDecorativos />

            <div className="relative z-10">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">
              {SITE_NAME}
            </p>

            <div className="mt-0.5 flex items-start justify-between gap-2">
              {somenteLeitura ? (
                <h2 className="font-display text-xl font-bold leading-tight text-foreground">
                  {perfil.lotacao ? `#${perfil.lotacao} ` : ""}{nomeExibicao}
                  {perfil.id_funcional ? ` | ${perfil.id_funcional}` : ""}
                </h2>
              ) : editandoUsername ? (
                <div className="flex flex-1 items-center gap-1">
                  <Input
                    autoFocus
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && salvarUsername()}
                    className="h-8 px-2 text-sm"
                    placeholder="Ex: joaosilva"
                    maxLength={20}
                  />
                  <button type="button" onClick={salvarUsername} disabled={salvandoUsername} className="text-primary hover:text-primary/80" aria-label="Salvar usuário">
                    {salvandoUsername ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  </button>
                  <button type="button" onClick={() => setEditandoUsername(false)} className="text-muted-foreground hover:text-foreground" aria-label="Cancelar">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={iniciarEdicaoUsername} className="group flex items-start gap-1.5 text-left">
                  <h2 className="font-display text-xl font-bold leading-tight text-foreground">
                    {perfil.lotacao ? `#${perfil.lotacao} ` : ""}{nomeExibicao}
                    {perfil.id_funcional ? ` | ${perfil.id_funcional}` : ""}
                  </h2>
                  <Pencil className="mt-1.5 h-3 w-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              )}
            </div>
            {!somenteLeitura && erroUsername && <p className="mt-1 text-[11px] font-normal text-destructive">{erroUsername}</p>}

            <p className="mt-0.5 text-xs text-muted-foreground">
              Discord · {perfil.discord.username || "Não vinculado"}
            </p>

            {perfil.cargo && (
              <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-primary">
                <ChevronsUp className="h-3.5 w-3.5" /> {perfil.cargo}
              </p>
            )}

            {perfil.nome_completo && (
              <p className="mt-2 text-sm text-foreground/90">{perfil.nome_completo}</p>
            )}

            <div className="mt-2">
              {somenteLeitura ? (
                perfil.bio && <p className="text-sm text-foreground/80">{perfil.bio}</p>
              ) : editandoBio ? (
                <div className="flex items-start gap-1">
                  <Input
                    autoFocus
                    value={bioInput}
                    onChange={(e) => setBioInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && salvarBio()}
                    className="h-8 flex-1 px-2 text-sm"
                    placeholder="Escreva uma bio curta"
                    maxLength={140}
                  />
                  <button type="button" onClick={salvarBio} disabled={salvandoBio} className="mt-1 text-primary hover:text-primary/80" aria-label="Salvar bio">
                    {salvandoBio ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  </button>
                  <button type="button" onClick={() => setEditandoBio(false)} className="mt-1 text-muted-foreground hover:text-foreground" aria-label="Cancelar">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={iniciarEdicaoBio} className="group flex items-start gap-1.5 text-left">
                  <p className={`text-sm ${perfil.bio ? "text-foreground/80" : "text-muted-foreground"}`}>
                    {perfil.bio || "Adicionar uma bio"}
                  </p>
                  <Pencil className="mt-1 h-3 w-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              )}
              {!somenteLeitura && erroBio && <p className="mt-1 text-[11px] font-normal text-destructive">{erroBio}</p>}
            </div>

            <div className="mt-4 border-t border-border/60 pt-4">
              <InfoRow label="ID Funcional">{perfil.id_funcional || "—"}</InfoRow>

              <InfoRow label="Lotação">
                {somenteLeitura ? (
                  perfil.lotacao || "—"
                ) : editandoBadge ? (
                  <div className="flex items-center gap-1">
                    <Input
                      autoFocus
                      value={badgeInput}
                      onChange={(e) => setBadgeInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && salvarBadge()}
                      className="h-7 w-20 px-2 text-right text-sm"
                      placeholder="Ex: 1234"
                      maxLength={20}
                    />
                    <button type="button" onClick={salvarBadge} disabled={salvandoBadge} className="text-primary hover:text-primary/80" aria-label="Salvar Lotação">
                      {salvandoBadge ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    </button>
                    <button type="button" onClick={() => setEditandoBadge(false)} className="text-muted-foreground hover:text-foreground" aria-label="Cancelar">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={iniciarEdicaoBadge} className="flex items-center gap-1.5">
                    {perfil.lotacao || "—"}
                    <Pencil className="h-3 w-3 text-muted-foreground" />
                  </button>
                )}
                {!somenteLeitura && erroBadge && <span className="mt-1 block text-[11px] font-normal text-destructive">{erroBadge}</span>}
              </InfoRow>

              <InfoRow label="Ingresso">{formatarData(perfil.data_ingresso)}</InfoRow>
              <InfoRow label="Tempo na patente">{formatarTempoNaPatente(perfil.tempo_na_patente_dias)}</InfoRow>
              {!somenteLeitura && (
                <InfoRow label="Discord ID">
                  <span className="font-mono text-xs">{perfil.discord.id || "—"}</span>
                </InfoRow>
              )}
            </div>
            </div>
          </div>
        </div>

        {/* Abas — Ausências e Pontos só fazem sentido no próprio perfil */}
        <Tabs defaultValue="visao-geral">
          <TabsList>
            <TabsTrigger value="visao-geral">Visão geral</TabsTrigger>
            {!somenteLeitura && <TabsTrigger value="ausencias">Ausências</TabsTrigger>}
            <TabsTrigger value="advertencias">Advertências</TabsTrigger>
            {!somenteLeitura && <TabsTrigger value="pontos">Pontos</TabsTrigger>}
          </TabsList>

          <TabsContent value="visao-geral" className="mt-6">
            <VisaoGeral perfil={perfil} somenteLeitura={somenteLeitura} />
          </TabsContent>

          {!somenteLeitura && (
            <TabsContent value="ausencias" className="mt-6">
              <AusenciasTab perfil={perfil} />
            </TabsContent>
          )}

          <TabsContent value="advertencias" className="mt-6">
            <EmBreve texto="O histórico de advertências ainda não está disponível por aqui." />
          </TabsContent>

          {!somenteLeitura && (
            <TabsContent value="pontos" className="mt-6">
              <EmBreve texto="Seus pontos batidos ainda ficam na página dedicada.">
                <Link to="/bater-ponto">
                  <Button variant="outline" size="sm" className="mt-3">Ir para Bater Ponto</Button>
                </Link>
              </EmBreve>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}

function EmBreve({ texto, children }: { texto: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border p-8 text-center">
      <p className="text-sm text-muted-foreground">{texto}</p>
      {children}
    </div>
  );
}

function VisaoGeral({ perfil, somenteLeitura }: { perfil: PerfilData; somenteLeitura: boolean }) {
  const diasComAtividade = perfil.atividade.filter((d) => d.jornadas > 0).length;
  const jornadas30Dias = perfil.jornadas.ultimos_30_dias;
  const nomeExibicao = perfil.callsign || perfil.username;

  return (
    <div className="space-y-8">
      <div>
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Jornadas concluídas
        </p>
        <div className="grid grid-cols-2 gap-y-6 sm:grid-cols-4">
          <Metrica label="Hoje" valor={perfil.jornadas.hoje} />
          <Metrica label="Últimos 7 dias" valor={perfil.jornadas.ultimos_7_dias} />
          <Metrica label="Últimos 30 dias" valor={perfil.jornadas.ultimos_30_dias} />
          <Metrica label="Total" valor={perfil.jornadas.total} />
        </div>
      </div>

      <div className="border-t border-border/60 pt-8">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Horas de serviço
        </p>
        <div className="grid grid-cols-2 gap-y-6 sm:grid-cols-4">
          <Metrica label="Hoje" valor={formatarHoras(perfil.horas.hoje)} />
          <Metrica label="Últimos 7 dias" valor={formatarHoras(perfil.horas.ultimos_7_dias)} />
          <Metrica label="Últimos 30 dias" valor={formatarHoras(perfil.horas.ultimos_30_dias)} cor="success" />
          <Metrica label="Total" valor={formatarHoras(perfil.horas.total)} />
        </div>
      </div>

      {/* Formação e Certificações — seções sem dados no backend ainda; ficam com estado vazio honesto */}
      <div className="border-t border-border/60 pt-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Formação e certificações
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Cursos da planilha histórica e certificados sincronizados do Discord.
            </p>
          </div>
          <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-success/40 bg-success/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-success">
            <Sparkles className="h-3 w-3" /> Atualização automática
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <GraduationCap className="h-4 w-4 text-primary" /> Cursos registrados
              </div>
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full border border-border px-1.5 text-[11px] font-semibold text-muted-foreground">
                0
              </span>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">Aprovações e registros anteriores.</p>
            <p className="rounded-lg border border-dashed border-border py-6 text-center text-xs text-muted-foreground">
              Nenhum curso aprovado registrado.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Award className="h-4 w-4 text-primary" /> Certificados
              </div>
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full border border-border px-1.5 text-[11px] font-semibold text-muted-foreground">
                0
              </span>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">Tags oficiais vinculadas no Discord.</p>
            <p className="rounded-lg border border-dashed border-border py-6 text-center text-xs text-muted-foreground">
              Nenhum certificado vinculado.
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-border/60 pt-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
          <div>
            <div className="mb-1 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Atividade
              </p>
              <span className="rounded-full border border-border px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                30 dias
              </span>
            </div>
            <p className="mb-4 text-xs text-muted-foreground">
              {jornadas30Dias} jornadas · {diasComAtividade} dias com atividade
            </p>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={perfil.atividade} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="atividadeGradiente" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="data" hide />
                  <Tooltip
                    formatter={(value: number) => [`${value} jornada(s)`, ""]}
                    labelFormatter={(label: string) => formatarData(label)}
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Area type="monotone" dataKey="jornadas" stroke="hsl(var(--primary))" fill="url(#atividadeGradiente)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Integrações — Discord usa dados reais do perfil; Twitch/Kick ainda não existem no backend */}
          <div>
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Integrações
            </p>
            <div className="divide-y divide-border/60">
              <div className="flex items-center justify-between gap-3 py-3 first:pt-0">
                <div className="flex items-center gap-2.5">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${perfil.discord.conectado ? "bg-success" : "bg-muted-foreground/40"}`} />
                  <div>
                    <p className="text-sm font-medium text-foreground">Discord</p>
                    <p className="text-xs text-muted-foreground">
                      {perfil.discord.conectado
                        ? (perfil.lotacao ? `#${perfil.lotacao} ` : "") + nomeExibicao
                        : "Não vinculada"}
                    </p>
                  </div>
                </div>
                <span className={`text-xs font-semibold ${perfil.discord.conectado ? "text-primary" : "text-muted-foreground"}`}>
                  {perfil.discord.conectado ? "Conectado" : "Desconectado"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-muted-foreground/40" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Twitch</p>
                    <p className="text-xs text-muted-foreground">Não vinculada</p>
                  </div>
                </div>
                {!somenteLeitura && (
                  <Button variant="outline" size="sm" disabled title="Em breve" className="h-7 px-2 text-xs">
                    Vincular
                  </Button>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 py-3 last:pb-0">
                <div className="flex items-center gap-2.5">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-muted-foreground/40" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Kick</p>
                    <p className="text-xs text-muted-foreground">Não vinculada</p>
                  </div>
                </div>
                {!somenteLeitura && (
                  <Button variant="outline" size="sm" disabled title="Em breve" className="h-7 px-2 text-xs">
                    Vincular
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Metrica({
  label,
  valor,
  cor,
}: {
  label: string;
  valor: string | number;
  cor?: "primary" | "success";
}) {
  const corClasse = cor === "success" ? "text-success" : cor === "primary" ? "text-primary" : "text-foreground";
  return (
    <div>
      <p className={`font-display text-3xl font-bold ${corClasse}`}>
        {valor}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

/** Hoje em "YYYY-MM-DD", para comparar com os períodos (mesmo padrão usado em Ausencias.tsx). */
function hojeISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function statusAusencia(a: Ausencia): "atual" | "futura" | "encerrada" {
  const hojeStr = hojeISO();
  if (hojeStr < a.data_inicio) return "futura";
  if (hojeStr > a.data_fim) return "encerrada";
  return "atual";
}

const BADGE_STATUS_AUSENCIA: Record<ReturnType<typeof statusAusencia>, { label: string; className: string } | null> = {
  atual: { label: "Ausente agora", className: "border-destructive/40 bg-destructive/10 text-destructive" },
  futura: { label: "Agendada", className: "border-primary/40 bg-primary/10 text-primary" },
  encerrada: null,
};

/** Diferença em dias (inclusive) entre duas datas "YYYY-MM-DD". */
function diasDoPeriodo(inicio: string, fim: string) {
  const [ai, mi, di] = inicio.split("-").map(Number);
  const [af, mf, df] = fim.split("-").map(Number);
  const ms = Date.UTC(af, mf - 1, df) - Date.UTC(ai, mi - 1, di);
  return Math.round(ms / 86400000) + 1;
}

function AusenciasTab({ perfil }: { perfil: PerfilData }) {
  const nomeExibicao = perfil.callsign || perfil.username;

  const [ausencias, setAusencias] = useState<Ausencia[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [motivo, setMotivo] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [cancelandoId, setCancelandoId] = useState<number | null>(null);

  const carregar = () => {
    setCarregando(true);
    getAusencias()
      .then(setAusencias)
      .catch(() => setErro("Não foi possível carregar suas ausências."))
      .finally(() => setCarregando(false));
  };

  useEffect(carregar, []);

  const periodoValido = !!dataInicio && !!dataFim && dataFim >= dataInicio;

  const handleCriar = async () => {
    setErro("");
    if (!dataInicio || !dataFim || !motivo.trim()) {
      setErro("Preencha data de início, data de fim e a justificativa.");
      return;
    }
    if (dataFim < dataInicio) {
      setErro("A data final não pode ser anterior à data inicial.");
      return;
    }
    setEnviando(true);
    try {
      await criarAusencia({ data_inicio: dataInicio, data_fim: dataFim, motivo: motivo.trim() });
      setDataInicio(""); setDataFim(""); setMotivo("");
      carregar();
    } catch {
      setErro("Não foi possível registrar a ausência. Confira as datas.");
    } finally {
      setEnviando(false);
    }
  };

  const handleCancelar = async (id: number) => {
    if (!window.confirm("Cancelar este registro de ausência?")) return;
    setCancelandoId(id);
    try {
      await excluirAusencia(id);
      setAusencias((atual) => atual.filter((a) => a.id !== id));
    } catch {
      alert("Não foi possível cancelar o registro.");
    } finally {
      setCancelandoId(null);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Registro operacional — formulário de nova ausência, sempre visível */}
      <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">
            Registro operacional
          </p>
          <h3 className="mt-1 font-display text-lg font-bold text-foreground">Registrar ausência</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Informe o período completo e o motivo da ausência.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Início
            </label>
            <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Fim
            </label>
            <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          {periodoValido
            ? `Período de ${diasDoPeriodo(dataInicio, dataFim)} dia(s).`
            : "Selecione o início e o fim para conferir o período."}
        </p>

        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Justificativa
          </label>
          <Textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value.slice(0, 500))}
            placeholder="Descreva o motivo da ausência"
            maxLength={500}
            rows={5}
          />
          <p className="text-right text-[11px] text-muted-foreground">{motivo.length}/500</p>
        </div>

        {erro && <p className="text-xs font-medium text-destructive">{erro}</p>}

        <Button onClick={handleCriar} disabled={enviando} className="w-full">
          {enviando ? "Enviando..." : "Registrar ausência"}
        </Button>
      </div>

      {/* Histórico pessoal — ausências do próprio usuário, com opção de cancelar */}
      <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">
            Histórico pessoal
          </p>
          <h3 className="mt-1 font-display text-lg font-bold text-foreground">Minhas ausências</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Acompanhe ou cancele seus registros antes do fim do período.
          </p>
        </div>

        {carregando ? (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
          </div>
        ) : ausencias.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Nenhuma ausência registrada.
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {ausencias.map((a) => {
                const badge = BADGE_STATUS_AUSENCIA[statusAusencia(a)];
                return (
                  <motion.div
                    layout
                    key={a.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-2 rounded-xl border border-border bg-background/40 p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground">
                        {perfil.lotacao ? `#${perfil.lotacao} ` : ""}{nomeExibicao}
                        {perfil.id_funcional ? ` | ${perfil.id_funcional}` : ""} · #{a.id}
                      </p>
                      {badge && (
                        <span
                          className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-medium text-primary">
                      {formatarData(a.data_inicio)} até {formatarData(a.data_fim)}
                    </p>
                    <p className="text-xs text-muted-foreground">{a.motivo}</p>

                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 rounded-full text-destructive hover:text-destructive"
                      disabled={cancelandoId === a.id}
                      onClick={() => handleCancelar(a.id)}
                    >
                      {cancelandoId === a.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Cancelar registro"}
                    </Button>
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

// O diretório de todo mundo (antiga aba "Diretório" aqui) virou a página
// dedicada /efetivo (ver src/pages/Efetivo.tsx).
