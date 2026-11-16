"use client";

import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, ShieldAlert, ShieldCheck } from "lucide-react";
import { SITE_NAME } from "@/lib/config";

/**
 * Página de retorno do fluxo OAuth do Discord.
 * O backend redireciona para cá com ?access=&refresh=&is_staff=&user_name=
 * (ou ?error=1 caso algo dê errado no lado do Discord/backend).
 */
export default function DiscordCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "error" | "not_member">("loading");

  useEffect(() => {
    const access = searchParams.get("access");
    const refresh = searchParams.get("refresh");
    const isStaff = searchParams.get("is_staff");
    const userName = searchParams.get("user_name");
    const error = searchParams.get("error");

    if (error === "not_member") {
      setStatus("not_member");
      return;
    }

    if (error || !access) {
      setStatus("error");
      return;
    }

    localStorage.setItem("user_token", access);
    localStorage.setItem("is_admin", isStaff === "true" ? "true" : "false");
    if (userName) localStorage.setItem("user_name", userName);
    if (refresh) localStorage.setItem("user_refresh", refresh);

    const timeout = setTimeout(() => navigate("/"), 700);
    return () => clearTimeout(timeout);
  }, [searchParams, navigate]);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center shadow-card">
        {status === "loading" ? (
          <>
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
            <h1 className="font-display text-lg font-bold text-foreground">
              Conectando com o Discord...
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Finalizando seu acesso ao {SITE_NAME}.
            </p>
          </>
        ) : status === "not_member" ? (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h1 className="font-display text-lg font-bold text-foreground">
              Você não está no Discord da unidade
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              O acesso ao {SITE_NAME} é liberado apenas para quem está no
              servidor do Discord da unidade. Entre no servidor e tente
              novamente.
            </p>
            <Link
              to="/login"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary underline underline-offset-2"
            >
              <ShieldCheck className="h-4 w-4" />
              Voltar para o login
            </Link>
          </>
        ) : (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h1 className="font-display text-lg font-bold text-foreground">
              Não foi possível entrar com o Discord
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Tente novamente em alguns instantes.
            </p>
            <Link
              to="/login"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary underline underline-offset-2"
            >
              <ShieldCheck className="h-4 w-4" />
              Voltar para o login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
