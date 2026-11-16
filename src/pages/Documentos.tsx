import { useEffect } from "react";
import { BookOpen, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { DOCS_URL } from "@/lib/config";

// Os documentos e o manual de conduta da Unidade Delta vivem no GitBook.
// Esta página redireciona automaticamente e oferece um link de fallback
// caso o navegador bloqueie o redirecionamento/pop-up.
export default function Documentos() {
  useEffect(() => {
    window.location.href = DOCS_URL;
  }, []);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-card"
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
          <BookOpen className="h-7 w-7" />
        </div>
        <h1 className="font-display text-xl font-bold text-foreground">Documentos da Unidade Delta</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Você está sendo redirecionado para o GitBook com o manual de conduta e demais documentos da unidade.
        </p>
        <Button asChild className="mt-6 gap-2">
          <a href={DOCS_URL} target="_blank" rel="noopener noreferrer">
            Abrir documentos <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </motion.div>
    </div>
  );
}
