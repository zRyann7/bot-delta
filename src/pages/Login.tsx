"use client";

import {
  Shield,
  BadgeCheck,
  Radio,
  FileClock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
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

const highlights = [
  {
    icon: Radio,
    title: "Comunicação centralizada",
    description: "Avisos, escalas e ocorrências em um só lugar.",
  },
  {
    icon: FileClock,
    title: "Registro em tempo real",
    description: "Bater ponto e registrar procedimentos com agilidade.",
  },
  {
    icon: BadgeCheck,
    title: "Acesso por credencial",
    description: "Cada efetivo acessa apenas o que lhe é permitido.",
  },
];

export default function Login() {
  const handleDiscordLogin = () => {
    window.location.href = `${API_BASE_URL}/api/auth/discord/login/`;
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Painel esquerdo - Branding (oculto em telas pequenas) */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-surface p-10 lg:flex xl:p-14">
        {/* Elementos decorativos */}
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
            Portal interno da{" "}
            <span className="text-gradient">Unidade Delta</span>
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            Centralize avisos, escalas, ponto e documentos em um único ambiente
            seguro, feito para o efetivo do dia a dia.
          </p>

          <div className="mt-10 space-y-5">
            {highlights.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                className="flex items-start gap-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{item.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
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

      {/* Painel direito - Acesso */}
      <div className="flex w-full flex-1 items-center justify-center p-6 lg:w-1/2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          {/* Logo visível apenas em telas pequenas (sem painel esquerdo) */}
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

          <div className="mb-8">
            <div className="mb-4 hidden h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner lg:flex">
              <Shield className="h-6 w-6" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              Acesso Restrito
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              O acesso ao{" "}
              <span className="font-semibold text-primary">{SITE_NAME}</span>{" "}
              é feito exclusivamente pelo Discord da unidade. Seu cargo lá
              define o que você pode acessar aqui.
            </p>
          </div>

          <Button
            type="button"
            onClick={handleDiscordLogin}
            className="h-12 w-full gap-2 bg-[#5865F2] text-base font-semibold text-white hover:bg-[#4752C4]"
          >
            <DiscordIcon className="h-5 w-5" />
            Entrar com Discord
          </Button>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Você será redirecionado ao Discord para autorizar o acesso. Se
            for seu primeiro acesso, sua conta é criada automaticamente.
          </p>

          <div className="mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground">
            Problemas com o acesso? Entre em contato com o{" "}
            <span className="font-semibold text-primary underline">
              Malbec
            </span>
            .
          </div>
        </motion.div>
      </div>
    </div>
  );
}
