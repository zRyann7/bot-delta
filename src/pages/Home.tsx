"use client";

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, Bell, BookOpen, Clock, Loader2,
  Megaphone, Play, Shield, Square, Users
} from "lucide-react";
import { motion } from "framer-motion";
import axios from "axios";
import api from "@/lib/api";
import { Aviso } from "@/lib/data";
import { SITE_NAME } from "@/lib/config";
import { verificarIsAdmin, isAdminCacheado } from "@/lib/auth";

interface Ponto { id: number; oficial: string; entrada: string; saida: string | null; fechado_manualmente: boolean }
interface Duracao { horas: number; minutos: number; segundos: number; total_minutos: number; total_segundos: number }
interface ResumoPeriodo { meu_total?: Duracao; por_usuario?: Array<Duracao & { usuario: string }>; total_geral?: Duracao }
interface PontosPaginados { count: number; results: Ponto[] }

function authHeaders() {
  const token = localStorage.getItem("user_token");
  return { Authorization: `Bearer ${token}` };
}

function formatarHoras(d?: Duracao) {
  if (!d) return "0h 00min";
  return `${d.horas}h ${String(d.minutos).padStart(2, "0")}min`;
}

function inicioDaSemanaDomingo() {
  const agora = new Date();
  const inicio = new Date(agora);
  inicio.setHours(0, 0, 0, 0);
  inicio.setDate(agora.getDate() - agora.getDay());
  return inicio;
}

const quickLinks = [
  { label: "Avisos", to: "/avisos", icon: Megaphone },
  { label: "Membros", to: "/planilha", icon: Users },
  { label: "Documentos", to: "/https://delta-21.gitbook.io/delta-docs", icon: BookOpen },
  { label: "Pontos", to: "/bater-ponto", icon: Clock },
];

export default function Home() {
  const [usuario, setUsuario] = useState("");
  const [isAdmin, setIsAdmin] = useState(isAdminCacheado);
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [loadingAvisos, setLoadingAvisos] = useState(true);
  const [sessaoAberta, setSessaoAberta] = useState(false);
  const [carregandoPonto, setCarregandoPonto] = useState(true);
  const [resumo, setResumo] = useState<ResumoPeriodo | null>(null);
  const [emServico, setEmServico] = useState(0);

  const saudacao = useMemo(() => {
    const hora = new Date().getHours();
    if (hora < 12) return "Bom dia";
    if (hora < 18) return "Boa tarde";
    return "Boa noite";
  }, []);

  const dataHoje = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long" }).format(new Date());

  const carregarPonto = async () => {
    setCarregandoPonto(true);
    try {
      const { data } = await api.get<PontosPaginados>("pontos/", { headers: authHeaders(), params: { page: 1, mine: "true" } });
      setSessaoAberta(data.results.some((p) => p.saida === null));
    } catch (err) {
      console.error("Erro ao carregar status do ponto:", err);
    } finally {
      setCarregandoPonto(false);
    }
  };

  const carregarResumo = async (admin: boolean) => {
    try {
      const { data } = await api.get<ResumoPeriodo>("pontos/resumo/", { headers: authHeaders(), params: { periodo: "semana_atual" } });
      setResumo(data);
      if (admin) {
        const { data: pontos } = await api.get<PontosPaginados>("pontos/", { headers: authHeaders(), params: { page: 1, status: "aberto" } });
        setEmServico(pontos.count);
      }
    } catch (err) {
      console.error("Erro ao carregar resumo semanal:", err);
    }
  };

  useEffect(() => {
    setUsuario(localStorage.getItem("user_name") || "Operador");
    carregarPonto();

    verificarIsAdmin().then((admin) => {
      setIsAdmin(admin);
      carregarResumo(admin);
    });

    axios.get("/api/avisos/")
      .then((res) => setAvisos(res.data.slice(0, 3)))
      .catch((err) => console.error("Erro ao carregar avisos:", err))
      .finally(() => setLoadingAvisos(false));
  }, []);

  const semanaInicio = inicioDaSemanaDomingo();
  const semanaFim = new Date(semanaInicio);
  semanaFim.setDate(semanaFim.getDate() + 6);

  return (
    <div className="space-y-8">
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
        <p className="text-sm text-muted-foreground capitalize">{dataHoje}</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-foreground sm:text-4xl">
          {saudacao}, <span className="text-primary">{usuario}</span> 👋
        </h1>
        <p className="mt-2 text-muted-foreground">Central de operações do {SITE_NAME}.</p>
      </motion.section>

      <section className="grid gap-5 lg:grid-cols-[1.45fr_1fr]">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Controle de serviço</p>
              {carregandoPonto ? <Loader2 className="mt-5 h-6 w-6 animate-spin text-primary" /> : <>
                <h2 className="mt-3 flex items-center gap-2 text-2xl font-bold">
                  <span className={`h-3 w-3 rounded-full ${sessaoAberta ? "bg-primary animate-pulse" : "bg-muted-foreground"}`} />
                  {sessaoAberta ? "Você está em serviço" : "Você está fora de serviço"}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">{sessaoAberta ? "Sua jornada está em andamento." : "Nenhuma jornada está em andamento no momento."}</p>
              </>}
            </div>
            <Clock className="h-9 w-9 text-primary/70" />
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link to="/bater-ponto" className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
              {sessaoAberta ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {sessaoAberta ? "Ver meu ponto" : "Iniciar serviço"}
            </Link>
            <span className="text-sm text-muted-foreground">Semana atual: <strong className="text-foreground">{formatarHoras(resumo?.meu_total)}</strong></span>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Resumo da semana</p>
          <p className="mt-2 text-sm text-muted-foreground capitalize">{semanaInicio.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} — {semanaFim.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</p>
          <div className="mt-6">
            <p className="text-3xl font-bold text-foreground">{formatarHoras(resumo?.meu_total)}</p>
            <p className="mt-1 text-sm text-muted-foreground">horas acumuladas por você</p>
          </div>
          <Link to="/bater-ponto" className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">Ver histórico <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between"><h2 className="font-display text-xl font-semibold">Acessos rápidos</h2><Link to="/sistemas" className="text-sm font-medium text-primary hover:underline">Ver sistemas</Link></div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {quickLinks.map(({ label, to, icon: Icon }) => <Link key={label} to={to} className="group rounded-xl border border-border bg-card p-4 shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/30">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"><Icon className="h-5 w-5" /></div>
            <p className="mt-3 text-sm font-semibold">{label}</p>
          </Link>)}
        </div>
      </section>

      <section className={isAdmin ? "grid gap-6 xl:grid-cols-[1.6fr_1fr]" : ""}>
        <div>
          <div className="mb-4 flex items-center justify-between"><h2 className="flex items-center gap-2 font-display text-xl font-semibold"><Megaphone className="h-5 w-5 text-primary" /> Avisos recentes</h2><Link to="/avisos" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">Ver todos <ArrowRight className="h-4 w-4" /></Link></div>
          <div className="space-y-3">
            {loadingAvisos ? <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Carregando avisos...</div> : avisos.length ? avisos.map((aviso) => <Link key={aviso.id} to="/avisos" className="block rounded-xl border border-border bg-card p-5 shadow-card transition-colors hover:border-primary/30">
              <div className="flex items-start gap-4"><div className="rounded-lg bg-primary/10 p-2 text-primary"><Bell className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="rounded bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">{aviso.categoria}</span></div><h3 className="mt-2 text-sm font-bold">{aviso.titulo}</h3><p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{aviso.conteudo}</p></div><ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" /></div>
            </Link>) : <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Nenhum aviso cadastrado no momento.</div>}
          </div>
        </div>

      </section>
    </div>
  );
}
