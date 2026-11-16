"use client";

import { useState, useEffect } from "react";
import { 
  Search, Star, ExternalLink, Database, Clock, Users, Headphones, 
  Mail, BarChart3, TrendingUp, ShoppingCart, GraduationCap, 
  FolderKanban, BookOpen, Shield, Box 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { sistemas, categoriasSistemas, type Sistema } from "@/lib/data";

const iconMap: Record<string, React.ElementType> = {
  Database, Clock, Users, Headphones, Mail, BarChart3, TrendingUp, 
  ShoppingCart, GraduationCap, FolderKanban, BookOpen, Shield, Box
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function Sistemas() {
  const [search, setSearch] = useState("");
  const [categoria, setCategoria] = useState("Todos");
  const [favoritos, setFavoritos] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sistemas-favoritos");
    if (saved) {
      try {
        setFavoritos(JSON.parse(saved));
      } catch (e) {
        console.error("Erro ao carregar favoritos", e);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("sistemas-favoritos", JSON.stringify(favoritos));
    }
  }, [favoritos, isLoaded]);

  const toggleFav = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    const idStr = String(id);
    setFavoritos((prev) => 
      prev.includes(idStr) ? prev.filter((x) => x !== idStr) : [...prev, idStr]
    );
  };

  const filtered = sistemas.filter((s) => {
    const matchSearch = s.nome.toLowerCase().includes(search.toLowerCase()) || 
                       s.descricao.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoria === "Todos" || s.categoria === categoria;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">Central de Sistemas</h1>
        <p className="mt-2 text-muted-foreground">Acesse as ferramentas da unidade em um só lugar.</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar sistema..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-card"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {categoriasSistemas.map((cat) => (
            <Button
              key={cat}
              variant={categoria === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setCategoria(cat)}
              className="text-xs"
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {filtered.map((sys) => {
          const Icon = iconMap[sys.icone] || Database;
          const isFav = favoritos.includes(String(sys.id));

          return (
            <motion.div
              key={sys.id}
              variants={item}
              className="group relative flex flex-col rounded-xl border border-border bg-card p-6 shadow-card transition-all hover:shadow-card-hover hover:border-primary/30"
            >
              {/* Favorito */}
              <button
                type="button"
                onClick={(e) => toggleFav(e, String(sys.id))}
                className="absolute right-4 top-4 z-20 p-1 text-muted-foreground transition-all hover:scale-110 active:scale-95"
              >
                <Star className={`h-5 w-5 transition-colors ${isFav ? "fill-warning text-warning" : "hover:text-warning"}`} />
              </button>

              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-gradient-primary group-hover:text-primary-foreground">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-base font-semibold text-card-foreground">{sys.nome}</h3>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {sys.descricao || "Acesse o sistema " + sys.nome}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                {/* Status mockado ou vindo do sys.status */}
                <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-medium bg-success/10 text-success">
                  <span className="h-1 w-1 rounded-full bg-success" />
                  Online
                </span>
                
                {/* Botão de Acesso Externo */}
                <Button 
                  asChild
                  size="sm" 
                  variant="ghost" 
                  className="gap-1.5 text-primary hover:text-primary hover:bg-primary/10"
                >
                  <a href={sys.link} target="_blank" rel="noopener noreferrer">
                    Acessar <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {filtered.length === 0 && (
        <div className="py-16 text-center text-muted-foreground">
          <p className="text-lg">Nenhum sistema encontrado.</p>
        </div>
      )}
    </div>
  );
}