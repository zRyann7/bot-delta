import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, Shield, UserRound, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SITE_NAME } from "@/lib/config";
import api from "@/lib/api";
import logoDelta from "@/assets/logo-delta.png";

export default function DiscordChooseUsername() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [token] = useState(() => {
    // O backend redireciona pra cá com ?signup_token=... após o Discord
    // autorizar. Guarda no localStorage pra sobreviver a um refresh da página.
    const fromUrl = searchParams.get("signup_token");
    if (fromUrl) {
      localStorage.setItem("discord_signup_token", fromUrl);
      return fromUrl;
    }
    return localStorage.getItem("discord_signup_token") || "";
  });
  const [discordUsername, setDiscordUsername] = useState("");
  const [avatar, setAvatar] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    // Tira o token da barra de endereço depois de guardado, pra não ficar
    // exposto/compartilhável na URL.
    if (searchParams.get("signup_token")) {
      navigate("/discord/escolher-usuario", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }
    api.post("auth/discord/signup-info/", { signup_token: token })
      .then(({ data }) => {
        setDiscordUsername(data.discord_username);
        setAvatar(data.discord_avatar);
      })
      .catch((err) => setError(err?.response?.data?.detail || "O cadastro expirou. Faça o login novamente."))
      .finally(() => setLoading(false));
  }, [navigate, token]);

  useEffect(() => {
    setError("");
    if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) {
      setAvailable(null);
      return;
    }
    const timer = window.setTimeout(async () => {
      try {
        await api.post("auth/discord/signup-complete/", { signup_token: token, username, __check_only: true });
        setAvailable(true);
      } catch (err: any) {
        if (err?.response?.status === 409 || err?.response?.data?.username) setAvailable(false);
        else setAvailable(null);
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [username, token]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) return setError("Use de 3 a 20 caracteres: letras, números ou _.");
    setSaving(true);
    setError("");
    try {
      const { data } = await api.post("auth/discord/signup-complete/", { signup_token: token, username });
      localStorage.removeItem("discord_signup_token");
      localStorage.setItem("user_token", data.access);
      localStorage.setItem("user_refresh", data.refresh);
      localStorage.setItem("is_admin", data.is_staff ? "true" : "false");
      localStorage.setItem("user_name", data.user_name);
      navigate("/", { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.username?.[0] || err?.response?.data?.detail || "Não foi possível criar seu usuário.");
      setAvailable(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-surface p-10 lg:flex xl:p-14">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-10 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)", backgroundSize: "42px 42px" }} />
        <div className="relative z-10 flex items-center gap-3"><img src={logoDelta} alt={SITE_NAME} className="h-11 w-11 rounded-full shadow-glow" /><span className="font-display text-lg font-bold text-foreground">{SITE_NAME}</span></div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 max-w-md">
          <h2 className="font-display text-4xl font-bold leading-tight text-foreground">Crie seu acesso ao <span className="text-gradient">Portal Delta</span></h2>
          <p className="mt-4 text-base text-muted-foreground">Seu Discord foi reconhecido. Agora escolha o usuário que será usado dentro do portal.</p>
          <ul className="mt-10 space-y-3 text-sm text-muted-foreground">
            {["Seu Discord fica vinculado à conta", "O usuário é escolhido por você", "Depois disso, os próximos logins serão automáticos"].map((item) => <li key={item} className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 text-primary" />{item}</li>)}
          </ul>
        </motion.div>
        <p className="relative z-10 text-xs text-muted-foreground">© {new Date().getFullYear()} {SITE_NAME}. Acesso restrito ao efetivo autorizado.</p>
      </div>
      <div className="flex w-full flex-1 items-center justify-center p-6 lg:w-1/2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <div className="mb-8 text-center lg:hidden"><img src={logoDelta} alt={SITE_NAME} className="mx-auto mb-3 h-14 w-14 rounded-full shadow-glow" /><span className="font-display text-lg font-bold text-foreground">{SITE_NAME}</span></div>
          <div className="mb-6"><div className="mb-4 hidden h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner lg:flex"><Shield className="h-6 w-6" /></div><h1 className="font-display text-2xl font-bold text-foreground">Escolha seu usuário</h1><p className="mt-2 text-sm text-muted-foreground">Esse será o nome usado para acessar o {SITE_NAME}.</p></div>
          {loading ? <div className="flex justify-center py-10"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div> : error && !discordUsername ? <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div> : <form onSubmit={submit} className="space-y-5">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 p-3">
              {avatar ? <img src={avatar} className="h-10 w-10 rounded-full" /> : <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary"><UserRound className="h-5 w-5" /></div>}
              <div><p className="text-xs text-muted-foreground">Discord conectado</p><p className="font-semibold text-foreground">{discordUsername}</p></div>
            </div>
            <div className="space-y-2"><label className="text-sm font-medium text-foreground/80">Nome de usuário</label><div className="relative"><UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input autoFocus value={username} onChange={(e) => setUsername(e.target.value)} className="h-11 pl-10 pr-10" placeholder="seu_usuario" maxLength={20} /><div className="absolute right-3 top-1/2 -translate-y-1/2">{available === true && <CheckCircle2 className="h-4 w-4 text-primary" />}{available === false && <XCircle className="h-4 w-4 text-destructive" />}</div></div><p className="text-xs text-muted-foreground">3–20 caracteres, somente letras, números e _.</p></div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button disabled={saving || available === false} className="h-11 w-full">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continuar"}</Button>
          </form>}
        </motion.div>
      </div>
    </div>
  );
}
