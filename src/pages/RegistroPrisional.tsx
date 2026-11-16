"use client";

import { useState, useEffect } from "react";
import {
  Plus, X, Clock, User,
  Send, Trash2, ShieldAlert, ImageIcon, ExternalLink,
  Check, ChevronsUpDown, Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList
} from "@/components/ui/command";
import { type RegistroPrisional } from "@/lib/data";
import { buscarOficiais, type Oficial } from "@/lib/googleSheets";
import { SITE_NAME } from "@/lib/config";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "registros_prisionais";

export default function RegistroPrisionalPage() {
  const [lista, setLista] = useState<RegistroPrisional[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [qra, setQra] = useState<string[]>([]);
  const [qru, setQru] = useState("");
  const [bo, setBo] = useState("");
  const [fotoLink, setFotoLink] = useState("");

  // Busca de oficiais (QRA) vinda da planilha do efetivo
  const [oficiais, setOficiais] = useState<Oficial[]>([]);
  const [carregandoOficiais, setCarregandoOficiais] = useState(true);
  const [erroOficiais, setErroOficiais] = useState(false);
  const [qraAberto, setQraAberto] = useState(false);

  useEffect(() => {
    carregarRegistros();
    buscarOficiais()
      .then(setOficiais)
      .catch(() => setErroOficiais(true))
      .finally(() => setCarregandoOficiais(false));
  }, []);

  const carregarRegistros = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const dados = raw ? JSON.parse(raw) : [];
      // Compatibilidade: registros antigos salvavam QRA como texto único
      const normalizados: RegistroPrisional[] = dados.map((r: RegistroPrisional | (Omit<RegistroPrisional, "qra"> & { qra: string })) => ({
        ...r,
        qra: Array.isArray(r.qra) ? r.qra : r.qra ? [r.qra] : [],
      }));
      setLista(normalizados);
    } catch (err) {
      console.error("Erro ao carregar registros prisionais:", err);
      setLista([]);
    }
  };

  const salvarLista = (novaLista: RegistroPrisional[]) => {
    setLista(novaLista);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(novaLista));
  };

  const toggleOficial = (nome: string) => {
    setQra((atual) =>
      atual.includes(nome) ? atual.filter((n) => n !== nome) : [...atual, nome]
    );
  };

  const handleCriarRegistro = () => {
    if (qra.length === 0 || !qru || !bo) return;

    const novoRegistro: RegistroPrisional = {
      id: crypto.randomUUID(),
      qra,
      qru,
      bo,
      fotoLink,
      autor: localStorage.getItem("user_name") || "Usuário",
      data_criacao: new Date().toISOString(),
    };

    salvarLista([novoRegistro, ...lista]);
    setQra([]);
    setQru("");
    setBo("");
    setFotoLink("");
    setShowForm(false);
  };

  const handleDeletarRegistro = (id: string) => {
    if (!window.confirm("Deseja excluir este registro permanentemente?")) return;
    salvarLista(lista.filter((r) => r.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Registrar Prisional</h1>
          <p className="text-muted-foreground mt-1 text-sm">Registro de ocorrências prisionais do {SITE_NAME}.</p>
        </div>

        <Button onClick={() => setShowForm(!showForm)} variant={showForm ? "outline" : "default"} className="gap-2">
          {showForm ? <X size={18} /> : <Plus size={18} />} Novo Registro
        </Button>
      </header>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-card border border-primary/20 rounded-2xl p-6 shadow-lg space-y-4 mb-8">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Popover open={qraAberto} onOpenChange={setQraAberto}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={qraAberto}
                        className="w-full justify-between font-normal text-foreground"
                      >
                        {qra.length > 0 ? `${qra.length} oficial(is) selecionado(s)` : "Buscar oficial (QRA)..."}
                        {carregandoOficiais ? (
                          <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
                        ) : (
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command>
                        <CommandInput placeholder="Digite o nome do oficial..." />
                        <CommandList>
                          <CommandEmpty>
                            {erroOficiais
                              ? "Não foi possível carregar a planilha."
                              : "Nenhum oficial encontrado."}
                          </CommandEmpty>
                          <CommandGroup>
                            {oficiais.map((oficial) => {
                              const selecionado = qra.includes(oficial.nome);
                              return (
                                <CommandItem
                                  key={`${oficial.badge}-${oficial.nome}`}
                                  value={oficial.nome}
                                  onSelect={() => toggleOficial(oficial.nome)}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selecionado ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <span className="flex flex-col">
                                    <span>{oficial.nome}</span>
                                    {oficial.patente && (
                                      <span className="text-xs text-muted-foreground">{oficial.patente}</span>
                                    )}
                                  </span>
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  {qra.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {qra.map((nome) => (
                        <span
                          key={nome}
                          className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                        >
                          {nome}
                          <button
                            type="button"
                            onClick={() => toggleOficial(nome)}
                            className="rounded-full hover:bg-primary/20"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <Input placeholder="QRU" value={qru} onChange={(e) => setQru(e.target.value)} />
                <Input placeholder="B.O." value={bo} onChange={(e) => setBo(e.target.value)} />
                <Input
                  placeholder="Link da foto da ação (URL)"
                  value={fotoLink}
                  onChange={(e) => setFotoLink(e.target.value)}
                />
              </div>
              <Button onClick={handleCriarRegistro} className="w-full gap-2">
                <Send size={16} /> Registrar
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {lista.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-muted-foreground">
            <ShieldAlert className="mb-2" /> Nenhum registro prisional cadastrado ainda.
          </div>
        ) : (
          lista.map((registro) => (
            <motion.div
              layout
              key={registro.id}
              className="group relative p-6 rounded-2xl border bg-card border-border transition-all"
            >
              <div className="absolute top-6 right-6 flex items-center gap-1">
                <button
                  onClick={() => handleDeletarRegistro(registro.id)}
                  className="p-2 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="flex flex-col gap-3">
                <span className="w-fit px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                  B.O. {registro.bo}
                </span>

                <div className="grid gap-2 pr-12 sm:grid-cols-2">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground">QRA</span>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {registro.qra.map((nome) => (
                        <span
                          key={nome}
                          className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                        >
                          {nome}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground">QRU</span>
                    <p className="text-sm font-medium text-card-foreground">{registro.qru}</p>
                  </div>
                </div>

                {registro.fotoLink && (
                  <a
                    href={registro.fotoLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-fit items-center gap-1.5 text-sm text-primary hover:underline"
                  >
                    <ImageIcon size={14} /> Foto da ação <ExternalLink size={12} />
                  </a>
                )}

                <div className="mt-4 pt-4 border-t border-border/50 flex items-center gap-6 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} /> {new Date(registro.data_criacao).toLocaleDateString("pt-BR")}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <User size={14} /> {registro.autor}
                  </span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
