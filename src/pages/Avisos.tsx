"use client";

import { useState, useEffect } from "react";
import { 
  Plus, X, Clock, User, 
  Send, Pin, Trash2, AlertCircle 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { type Aviso } from "@/lib/data";
import { SITE_NAME } from "@/lib/config";
import { verificarIsAdmin, isAdminCacheado } from "@/lib/auth";
import axios from "axios";

export default function Avisos() {
  const [listaAvisos, setListaAvisos] = useState<Aviso[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [categoria, setCategoria] = useState("Geral");
  const [fixadosUsuario, setFixadosUsuario] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Começa com o valor em cache (evita flash), mas é substituído pelo
  // valor real assim que verificarIsAdmin() responde — ver useEffect.
  const [isAdmin, setIsAdmin] = useState(isAdminCacheado);

  useEffect(() => {
    // 1. Confirmar admin com o backend (nunca confiar só no localStorage)
    verificarIsAdmin().then(setIsAdmin);

    // 2. Carregar Avisos
    carregarAvisos();

    // 3. Carregar Pins
    const userPins = localStorage.getItem("user_avisos_fixados");
    if (userPins) setFixadosUsuario(JSON.parse(userPins));
  }, []);

  const carregarAvisos = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/avisos/");
      setListaAvisos(res.data);
    } catch (err) {
      console.error("Erro ao carregar avisos:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCriarAviso = async () => {
    if (!titulo || !conteudo) return;

    try {
      const token = localStorage.getItem("user_token");
      const novoAviso = {
        titulo,
        conteudo,
        categoria,
        autor: localStorage.getItem("user_name") || "Usuário",
      };

      const res = await axios.post("/api/avisos/", novoAviso, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setListaAvisos([res.data, ...listaAvisos]);
      setTitulo(""); 
      setConteudo(""); 
      setShowForm(false);
    } catch (err) {
      // 401/403: o backend não reconheceu este usuário como admin — a flag
      // "is_admin" salva no navegador não é uma fonte confiável (pode ter
      // ficado desatualizada ou ter sido alterada manualmente), então
      // escondemos os controles de admin e confiamos na resposta do servidor.
      if (axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) {
        setIsAdmin(false);
        localStorage.setItem("is_admin", "false");
        alert("Você não tem permissão de administrador para publicar avisos.");
      } else {
        alert("Erro ao publicar aviso. Verifique sua conexão.");
      }
    }
  };

  const handleDeletarAviso = async (id: string | number) => {
    if (!window.confirm("Deseja excluir este aviso permanentemente?")) return;

    try {
      const token = localStorage.getItem("user_token");
      await axios.delete(`/api/avisos/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setListaAvisos(listaAvisos.filter(aviso => aviso.id !== id));
    } catch (err) {
      if (axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) {
        setIsAdmin(false);
        localStorage.setItem("is_admin", "false");
        alert("Você não tem permissão de administrador para excluir avisos.");
      } else {
        alert("Erro ao deletar o aviso.");
      }
    }
  };

  const togglePin = (id: string | number) => {
    const stringId = String(id);
    const novosPins = fixadosUsuario.includes(stringId)
      ? fixadosUsuario.filter(p => p !== stringId)
      : [stringId, ...fixadosUsuario];
    setFixadosUsuario(novosPins);
    localStorage.setItem("user_avisos_fixados", JSON.stringify(novosPins));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Mural de Avisos</h1>
          <p className="text-muted-foreground mt-1 text-sm">Comunicados oficiais do {SITE_NAME}.</p>
        </div>
        
        {isAdmin && (
          <Button onClick={() => setShowForm(!showForm)} variant={showForm ? "outline" : "default"} className="gap-2">
            {showForm ? <X size={18} /> : <Plus size={18} />} Novo Aviso
          </Button>
        )}
      </header>

      <AnimatePresence>
        {showForm && isAdmin && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: "auto" }} 
            exit={{ opacity: 0, height: 0 }} 
            className="overflow-hidden"
          >
            <div className="bg-card border border-primary/20 rounded-2xl p-6 shadow-lg space-y-4 mb-8">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="sm:col-span-3">
                  <Input placeholder="Título do comunicado" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
                </div>
              </div>
              <Textarea 
                placeholder="Escreva aqui o conteúdo do aviso..." 
                value={conteudo} 
                onChange={(e) => setConteudo(e.target.value)} 
                className="min-h-[120px]" 
              />
              <Button onClick={handleCriarAviso} className="w-full gap-2"><Send size={16} /> Publicar</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center py-10 text-muted-foreground">
            <Clock className="mb-2 animate-spin" /> Carregando mural...
          </div>
        ) : (
          listaAvisos.map((aviso) => {
            const isPinned = fixadosUsuario.includes(String(aviso.id));
            return (
              <motion.div 
                layout 
                key={aviso.id} 
                className={`group relative p-6 rounded-2xl border transition-all ${
                  isPinned ? "bg-primary/5 border-primary/30 shadow-sm" : "bg-card border-border"
                }`}
              >
                <div className="absolute top-6 right-6 flex items-center gap-1">
                  <button onClick={() => togglePin(aviso.id)} className={`p-2 rounded-full ${isPinned ? "text-primary bg-primary/10" : "text-muted-foreground opacity-0 group-hover:opacity-100"}`}>
                    <Pin size={18} className={isPinned ? "fill-primary" : ""} />
                  </button>

                  {isAdmin && (
                    <button 
                      onClick={() => handleDeletarAviso(aviso.id)}
                      className="p-2 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  <h2 className="text-xl font-bold pr-20 text-card-foreground">{aviso.titulo}</h2>
                  <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                    {aviso.conteudo}
                  </p>
                  <div className="mt-4 pt-4 border-t border-border/50 flex items-center gap-6 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Clock size={14}/> {new Date(aviso.data_criacao).toLocaleDateString('pt-BR')}</span>
                    <span className="flex items-center gap-1.5"><User size={14}/> {aviso.autor}</span>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}