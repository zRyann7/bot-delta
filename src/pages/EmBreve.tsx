import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Construction } from "lucide-react";

interface EmBreveProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
}

export default function EmBreve({ title, description, icon: Icon = Construction }: EmBreveProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-card"
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
          <Icon className="h-7 w-7" />
        </div>
        <h1 className="font-display text-xl font-bold text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {description ?? "Essa área ainda está sendo construída. Em breve novidades por aqui."}
        </p>
      </motion.div>
    </div>
  );
}
