"use client";

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Shield,
  Lock,
  User,
  IdCard,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { SITE_NAME, API_BASE_URL } from "@/lib/config";
import logoDelta from "@/assets/logo-delta.png";

// Ícone da marca Discord (não faz parte do lucide-react)
function DiscordIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 127.14 96.36" fill="currentColor" {...props}>
      <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
    </svg>
  );
}

type Mode = "discord" | "manual";

export default function Register() {
  const [mode, setMode] = useState<Mode>("discord");

  const [nome, setNome] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleDiscordSignup = () => {
    window.location.href = `${API_BASE_URL}/api/auth/discord/login/`;
  };

  const handleManualSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== password2) {
      setError("As senhas não coincidem.");
      return;
    }
    if (password.length < 8) {
      setError("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/register/`, {
        username,
        nome,
        password,
        password2,
      });

      localStorage.setItem("user_token", res.data.access);
      localStorage.setItem("is_admin", res.data.is_staff ? "true" : "false");
      localStorage.setItem("user_name", res.data.user_name ?? username);

      setSuccess(true);
      setTimeout(() => navigate("/"), 900);
    } catch (err: any) {
      const data = err?.response?.data;
      if (data && typeof data === "object") {
        const firstError = Object.values(data)[0];
        setError(
          Array.isArray(firstError)
            ? String(firstError[0])
            : "Não foi possível criar a conta. Verifique os dados."
        );
      } else {
        setError("Não foi possível criar a conta. Tente novamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Painel esquerdo - Branding (oculto em telas pequenas) */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-surface p-10 lg:flex xl:p-14">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-10 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
            backgroundSize: "42px 42px",
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 flex items-center gap-3"
        >
          <img
            src={logoDelta}
            alt={SITE_NAME}
            className="h-11 w-11 rounded-full shadow-glow"
          />
          <span className="font-display text-lg font-bold text-foreground">
            {SITE_NAME}
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative z-10 max-w-md"
        >
          <h2 className="font-display text-4xl font-bold leading-tight text-foreground">
            Solicite seu acesso ao{" "}
            <span className="text-gradient">Portal Delta</span>
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            Crie sua conta vinculando seu Discord em um clique, ou cadastre
            manualmente um usuário e senha próprios.
          </p>

          <ul className="mt-10 space-y-3 text-sm text-muted-foreground">
            {[
              "Login rápido usando sua conta do Discord",
              "Ou cadastro manual com usuário e senha",
              "Acesso liberado conforme sua função na unidade",
            ].map((item, i) => (
              <motion.li
                key={item}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                {item}
              </motion.li>
            ))}
          </ul>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="relative z-10 text-xs text-muted-foreground"
        >
          © {new Date().getFullYear()} {SITE_NAME}. Acesso restrito ao efetivo autorizado.
        </motion.p>
      </div>

      {/* Painel direito - Formulário */}
      <div className="flex w-full flex-1 items-center justify-center p-6 lg:w-1/2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <div className="mb-8 text-center lg:hidden">
            <img
              src={logoDelta}
              alt={SITE_NAME}
              className="mx-auto mb-3 h-14 w-14 rounded-full shadow-glow"
            />
            <span className="font-display text-lg font-bold text-foreground">
              {SITE_NAME}
            </span>
          </div>

          <div className="mb-6">
            <div className="mb-4 hidden h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner lg:flex">
              <Shield className="h-6 w-6" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              Criar Conta
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Escolha como deseja se cadastrar no{" "}
              <span className="font-semibold text-primary">{SITE_NAME}</span>
            </p>
          </div>

          {/* Alternador de modo */}
          <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl border border-border bg-muted/30 p-1">
            <button
              type="button"
              onClick={() => {
                setMode("discord");
                setError("");
              }}
              className={`rounded-lg py-2 text-sm font-medium transition-colors ${
                mode === "discord"
                  ? "bg-primary text-primary-foreground shadow-card"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Discord
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("manual");
                setError("");
              }}
              className={`rounded-lg py-2 text-sm font-medium transition-colors ${
                mode === "manual"
                  ? "bg-primary text-primary-foreground shadow-card"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Manual
            </button>
          </div>

          <AnimatePresence mode="wait">
            {mode === "discord" ? (
              <motion.div
                key="discord"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <p className="text-sm text-muted-foreground">
                  Vincule sua conta do Discord para criar seu acesso
                  automaticamente, sem precisar escolher uma senha.
                </p>
                <Button
                  type="button"
                  onClick={handleDiscordSignup}
                  className="h-11 w-full gap-2 bg-[#5865F2] text-white hover:bg-[#4752C4]"
                >
                  <DiscordIcon className="h-4 w-4" />
                  Continuar com Discord
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Você será redirecionado ao Discord para autorizar o acesso.
                </p>
              </motion.div>
            ) : (
              <motion.form
                key="manual"
                onSubmit={handleManualSignup}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground/80">
                    Nome completo
                  </label>
                  <div className="relative">
                    <IdCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      required
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="h-11 border-border bg-muted/30 pl-10 focus:ring-primary"
                      placeholder="Ex: Malbec Santorini"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground/80">
                    Usuário
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="h-11 border-border bg-muted/30 pl-10 focus:ring-primary"
                      placeholder="Ex: malbec"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground/80">
                    Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      required
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 border-border bg-muted/30 pl-10 pr-10 focus:ring-primary"
                      placeholder="Mínimo 8 caracteres"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                      tabIndex={-1}
                      aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground/80">
                    Confirmar senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      required
                      type={showPassword ? "text" : "password"}
                      value={password2}
                      onChange={(e) => setPassword2(e.target.value)}
                      className="h-11 border-border bg-muted/30 pl-10 focus:ring-primary"
                      placeholder="Repita a senha"
                    />
                  </div>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs font-medium text-destructive"
                    >
                      <AlertCircle className="h-4 w-4" />
                      {error}
                    </motion.div>
                  )}
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-2 rounded-lg border border-success/20 bg-success/10 p-3 text-xs font-medium text-success"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Conta criada! Entrando...
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="h-11 w-full gap-2 text-base font-semibold transition-all hover:shadow-lg"
                >
                  {isLoading ? "Criando conta..." : "Criar conta"}
                  {!isLoading && <ArrowRight className="h-4 w-4" />}
                </Button>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground">
            Já tem uma conta?{" "}
            <Link
              to="/login"
              className="font-semibold text-primary underline underline-offset-2"
            >
              Entrar
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
