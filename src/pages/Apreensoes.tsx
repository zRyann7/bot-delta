"use client";

import { useState, useEffect } from "react";
import {
  Plus, X, Clock, User, Minus, RotateCcw,
  Send, Trash2, ShieldAlert, ImageIcon, ExternalLink,
  Check, ChevronsUpDown, Loader2, Car
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList
} from "@/components/ui/command";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  type SubGrupoApreensao,
  type VeiculoAcaoFechada,
} from "@/lib/data";
import { buscarOficiais, type Oficial } from "@/lib/googleSheets";
import { SITE_NAME } from "@/lib/config";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

// Formato retornado pelo backend (GET /api/apreensoes/). Nomes em
// snake_case e "id" numérico — diferente do tipo local usado só para o
// formulário antes de enviar (veja `VeiculoAcaoFechada`, com id de
// cliente via crypto.randomUUID, usado só para as `key` do React).
interface VeiculoAcaoAPI {
  id: number;
  nome: string;
  membros: string[];
}

interface RegistroApreensaoAPI {
  id: number;
  sub_grupo: SubGrupoApreensao;
  qra: string[];
  qru: string;
  bo: string;
  daec: string;
  veiculo: string;
  foto_link: string;
  autor: string;
  acao: string;
  radio_principal: string;
  veiculos_acao: VeiculoAcaoAPI[];
  criado_em: string;
}

function authHeaders() {
  const token = localStorage.getItem("user_token");
  return { Authorization: `Bearer ${token}` };
}

// Pequeno helper visual: rótulo em caixa alta acima do campo, igual ao
// padrão usado no painel de Ações Fechadas.
function Campo({
  label,
  children,
  erro,
}: {
  label: string;
  children: React.ReactNode;
  erro?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label
        className={cn(
          "text-[11px] font-semibold uppercase tracking-wider",
          erro ? "text-destructive" : "text-muted-foreground"
        )}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function criarVeiculoVazio(): VeiculoAcaoFechada {
  return { id: crypto.randomUUID(), nome: "", membros: ["", "", ""] };
}


function OficialCombobox({
  value,
  onChange,
  placeholder,
  oficiais,
  carregando,
  erro,
}: {
  value: string;
  onChange: (nome: string) => void;
  placeholder: string;
  oficiais: Oficial[];
  carregando: boolean;
  erro: boolean;
}) {
  const [aberto, setAberto] = useState(false);

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={aberto}
          className="w-full justify-between font-normal text-foreground"
        >
          <span className="truncate">{value || placeholder}</span>
          {carregando ? (
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
              {erro ? "Não foi possível carregar a planilha." : "Nenhum oficial encontrado."}
            </CommandEmpty>
            <CommandGroup>
              {oficiais.map((oficial) => {
                const selecionado = value === oficial.nome;
                return (
                  <CommandItem
                    key={`${oficial.badge}-${oficial.nome}`}
                    value={oficial.nome}
                    onSelect={() => {
                      onChange(oficial.nome);
                      setAberto(false);
                    }}
                  >
                    <Check
                      className={cn("mr-2 h-4 w-4", selecionado ? "opacity-100" : "opacity-0")}
                    />
                    <span className="flex flex-col">
                      <span>{oficial.nome}</span>
                      {(oficial.patente || oficial.unidade) && (
                        <span className="text-xs text-muted-foreground">
                          {[oficial.patente, oficial.unidade].filter(Boolean).join(" · ")}
                        </span>
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
  );
}

const SUB_GRUPOS: { value: SubGrupoApreensao; label: string }[] = [
  { value: "acoes_fechadas", label: "Ações Fechadas" },
  { value: "apreensoes_rua", label: "Apreensões de Rua" },
];

export default function ApreensoesPage() {
  const [lista, setLista] = useState<RegistroApreensaoAPI[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [excluindoId, setExcluindoId] = useState<number | null>(null);
  const [subGrupoAtivo, setSubGrupoAtivo] = useState<SubGrupoApreensao>("acoes_fechadas");
  const [showForm, setShowForm] = useState(false);

  const [qra, setQra] = useState<string[]>([]);
  const [qru, setQru] = useState("");
  const [bo, setBo] = useState("");
  const [daec, setDaec] = useState("");
  const [veiculo, setVeiculo] = useState("");
  const [fotoLink, setFotoLink] = useState("");

  // Campos específicos do painel de Ações Fechadas
  const [acao, setAcao] = useState("");
  const [radioPrincipal, setRadioPrincipal] = useState("");
  const [veiculosAcao, setVeiculosAcao] = useState<VeiculoAcaoFechada[]>([
    criarVeiculoVazio(),
    criarVeiculoVazio(),
  ]);

  // Busca de oficiais (QRA / Daec) vinda da planilha do efetivo
  const [oficiais, setOficiais] = useState<Oficial[]>([]);
  const [carregandoOficiais, setCarregandoOficiais] = useState(true);
  const [erroOficiais, setErroOficiais] = useState(false);
  const [qraAberto, setQraAberto] = useState(false);
  const [mostrarErros, setMostrarErros] = useState(false);

  useEffect(() => {
    carregarRegistros();
    buscarOficiais()
      .then(setOficiais)
      .catch(() => setErroOficiais(true))
      .finally(() => setCarregandoOficiais(false));
  }, []);

  const carregarRegistros = async () => {
    setCarregando(true);
    setErro("");
    try {
      const { data } = await api.get<RegistroApreensaoAPI[]>("apreensoes/", {
        headers: authHeaders(),
      });
      setLista(data);
    } catch (err) {
      console.error("Erro ao carregar registros de apreensões:", err);
      setErro("Não foi possível carregar os registros. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  const toggleOficial = (nome: string) => {
    setQra((atual) =>
      atual.includes(nome) ? atual.filter((n) => n !== nome) : [...atual, nome]
    );
  };

  // --- Manipulação dos veículos do painel de Ações Fechadas ---
  const adicionarVeiculo = () => {
    setVeiculosAcao((atual) => [...atual, criarVeiculoVazio()]);
  };

  const removerVeiculo = () => {
    setVeiculosAcao((atual) => (atual.length > 1 ? atual.slice(0, -1) : atual));
  };

  const atualizarNomeVeiculo = (veiculoId: string, nome: string) => {
    setVeiculosAcao((atual) =>
      atual.map((v) => (v.id === veiculoId ? { ...v, nome } : v))
    );
  };

  const atualizarMembroVeiculo = (veiculoId: string, indice: number, valor: string) => {
    setVeiculosAcao((atual) =>
      atual.map((v) =>
        v.id === veiculoId
          ? { ...v, membros: v.membros.map((m, i) => (i === indice ? valor : m)) }
          : v
      )
    );
  };

  const limparCamposAcao = () => {
    setAcao("");
    setRadioPrincipal("");
    setDaec("");
    setVeiculosAcao([criarVeiculoVazio(), criarVeiculoVazio()]);
  };

  const handleCriarRegistro = async () => {
    const ehAcaoFechada = subGrupoAtivo === "acoes_fechadas";

    // Ações Fechadas não usa a seleção geral de QRA (cada veículo já
    // especifica seus próprios membros), então a validação é mais simples.
    // (O backend valida de novo do lado dele — isto aqui só evita uma
    // requisição desnecessária e dá feedback imediato.)
    const faltando: string[] = [];
    if (!qru) faltando.push("QRU");
    if (!bo) faltando.push("B.O.");
    if (!ehAcaoFechada && qra.length === 0) faltando.push("QRA");

    if (faltando.length > 0) {
      setMostrarErros(true);
      toast.error("Preencha os campos obrigatórios", {
        description: `Faltando: ${faltando.join(", ")}`,
      });
      return;
    }

    setMostrarErros(false);
    setEnviando(true);

    const payload = {
      sub_grupo: subGrupoAtivo,
      qra: ehAcaoFechada ? [] : qra,
      qru,
      bo,
      daec,
      veiculo,
      foto_link: fotoLink,
      ...(ehAcaoFechada && {
        acao,
        radio_principal: radioPrincipal,
        // Só envia veículos que de fato foram preenchidos com um nome.
        veiculos_acao: veiculosAcao
          .filter((v) => v.nome.trim() !== "")
          .map((v) => ({ nome: v.nome, membros: v.membros })),
      }),
    };

    try {
      const { data } = await api.post<RegistroApreensaoAPI>("apreensoes/", payload, {
        headers: authHeaders(),
      });
      setLista((atual) => [data, ...atual]);
      toast.success("Registro criado com sucesso.");
      setQra([]);
      setQru("");
      setBo("");
      setVeiculo("");
      setFotoLink("");
      if (ehAcaoFechada) {
        limparCamposAcao();
      } else {
        setDaec("");
      }
      setShowForm(false);
    } catch (err) {
      console.error("Erro ao criar registro de apreensão:", err);
      toast.error("Não foi possível criar o registro. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  };

  const handleDeletarRegistro = async (id: number) => {
    if (!window.confirm("Deseja excluir este registro permanentemente?")) return;
    setExcluindoId(id);
    try {
      await api.delete(`apreensoes/${id}/`, { headers: authHeaders() });
      setLista((atual) => atual.filter((r) => r.id !== id));
      toast.success("Registro excluído.");
    } catch (err) {
      console.error("Erro ao excluir registro de apreensão:", err);
      toast.error("Não foi possível excluir este registro. Tente novamente.");
    } finally {
      setExcluindoId(null);
    }
  };

  const listaFiltrada = lista.filter((r) => r.sub_grupo === subGrupoAtivo);

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Apreensões</h1>
          <p className="text-muted-foreground mt-1 text-sm">Registro de apreensões do {SITE_NAME}.</p>
        </div>

        <Button onClick={() => setShowForm(!showForm)} variant={showForm ? "outline" : "default"} className="gap-2">
          {showForm ? <X size={18} /> : <Plus size={18} />} Novo Registro
        </Button>
      </header>

      {/* Sub-abas: Ações Fechadas / Apreensões de Rua */}
      <div className="flex items-center gap-6 border-b border-border">
        {SUB_GRUPOS.map((grupo) => {
          const ativo = subGrupoAtivo === grupo.value;
          return (
            <button
              key={grupo.value}
              type="button"
              onClick={() => setSubGrupoAtivo(grupo.value)}
              className={cn(
                "relative pb-3 text-sm font-medium transition-colors",
                ativo ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {grupo.label}
              {ativo && (
                <motion.div
                  layoutId="sub-grupo-indicator"
                  className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-card border border-primary/20 rounded-2xl p-6 shadow-lg space-y-4 mb-8">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Novo registro em: <span className="text-primary">{SUB_GRUPOS.find((g) => g.value === subGrupoAtivo)?.label}</span>
              </p>

              {subGrupoAtivo === "apreensoes_rua" ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Popover open={qraAberto} onOpenChange={setQraAberto}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={qraAberto}
                          className={cn(
                            "w-full justify-between font-normal text-foreground",
                            mostrarErros && qra.length === 0 && "border-destructive"
                          )}
                        >
                          {qra.length > 0 ? `${qra.length} selecionado(s)` : "Buscar oficial (QRA)..."}
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
                                      {(oficial.patente || oficial.unidade) && (
                                        <span className="text-xs text-muted-foreground">
                                          {[oficial.patente, oficial.unidade].filter(Boolean).join(" · ")}
                                        </span>
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

                  <Input
                    placeholder="QRU"
                    value={qru}
                    onChange={(e) => setQru(e.target.value)}
                    className={cn(mostrarErros && !qru && "border-destructive")}
                  />
                  <Input
                    placeholder="B.O"
                    value={bo}
                    onChange={(e) => setBo(e.target.value)}
                    className={cn(mostrarErros && !bo && "border-destructive")}
                  />

                  {/* Daec: seleção de um único oficial vindo da mesma planilha */}
                  <OficialCombobox
                    value={daec}
                    onChange={setDaec}
                    placeholder="DAEC"
                    oficiais={oficiais}
                    carregando={carregandoOficiais}
                    erro={erroOficiais}
                  />

                  <Input placeholder="Veículo" value={veiculo} onChange={(e) => setVeiculo(e.target.value)} />
                  <Input
                    placeholder="Link da foto da ação (URL)"
                    value={fotoLink}
                    onChange={(e) => setFotoLink(e.target.value)}
                  />
                </div>
              ) : (
                /* Painel de Ações Fechadas: dados da operação + veículos com membros buscados na planilha */
                <div className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Campo label="Ação" erro={mostrarErros && !qru}>
                      <Input
                        placeholder="Ex.: Joalheria"
                        value={qru}
                        onChange={(e) => setQru(e.target.value)}
                        className={cn(mostrarErros && !qru && "border-destructive")}
                      />
                    </Campo>
                    <Campo label="B.O" erro={mostrarErros && !bo}>
                      <Input
                        placeholder="B.O"
                        value={bo}
                        onChange={(e) => setBo(e.target.value)}
                        className={cn(mostrarErros && !bo && "border-destructive")}
                      />
                    </Campo>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Campo label="Daec">
                      <OficialCombobox
                        value={daec}
                        onChange={setDaec}
                        placeholder=""
                        oficiais={oficiais}
                        carregando={carregandoOficiais}
                        erro={erroOficiais}
                      />
                    </Campo>
                    <Campo label="Veículos">
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={removerVeiculo}
                          disabled={veiculosAcao.length <= 1}
                        >
                          <Minus size={16} />
                        </Button>
                        <span className="w-8 text-center text-sm font-semibold">
                          {veiculosAcao.length}
                        </span>
                        <Button type="button" variant="outline" size="icon" onClick={adicionarVeiculo}>
                          <Plus size={16} />
                        </Button>
                      </div>
                    </Campo>
                  </div>

                  {veiculosAcao.map((v, indice) => (
                    <div key={v.id} className="space-y-4 border-t border-border/50 pt-5">
                      <Campo label={`${indice + 1}º Veículo`}>
                        <Input
                          placeholder="Ex.: RH5"
                          value={v.nome}
                          onChange={(e) => atualizarNomeVeiculo(v.id, e.target.value)}
                        />
                      </Campo>
                      <div className="grid gap-4 sm:grid-cols-3">
                        <Campo label="1º Membro">
                          <OficialCombobox
                            value={v.membros[0]}
                            onChange={(nome) => atualizarMembroVeiculo(v.id, 0, nome)}
                            placeholder="Vaga"
                            oficiais={oficiais}
                            carregando={carregandoOficiais}
                            erro={erroOficiais}
                          />
                        </Campo>
                        <Campo label="2º Membro">
                          <OficialCombobox
                            value={v.membros[1]}
                            onChange={(nome) => atualizarMembroVeiculo(v.id, 1, nome)}
                            placeholder="Vaga"
                            oficiais={oficiais}
                            carregando={carregandoOficiais}
                            erro={erroOficiais}
                          />
                        </Campo>
                        <Campo label="3º Membro">
                          <OficialCombobox
                            value={v.membros[2]}
                            onChange={(nome) => atualizarMembroVeiculo(v.id, 2, nome)}
                            placeholder="Vaga"
                            oficiais={oficiais}
                            carregando={carregandoOficiais}
                            erro={erroOficiais}
                          />
                        </Campo>
                      </div>
                    </div>
                  ))}

                  <Input
                    placeholder="Link da foto da ação (URL)"
                    value={fotoLink}
                    onChange={(e) => setFotoLink(e.target.value)}
                  />
                </div>
              )}

              <div className="flex items-center gap-3">
                {subGrupoAtivo === "acoes_fechadas" && (
                  <Button type="button" variant="outline" onClick={limparCamposAcao} className="gap-2">
                    <RotateCcw size={16} /> Limpar campos
                  </Button>
                )}
                <Button onClick={handleCriarRegistro} disabled={enviando} className="flex-1 gap-2">
                  {enviando ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                  Registrar
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {erro && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {erro}
        </div>
      )}

      <div className="space-y-4">
        {carregando ? (
          <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
            <Loader2 className="animate-spin" />
            <p className="text-sm">Carregando registros...</p>
          </div>
        ) : listaFiltrada.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-muted-foreground">
            <ShieldAlert className="mb-2" /> Nenhum registro cadastrado em{" "}
            {SUB_GRUPOS.find((g) => g.value === subGrupoAtivo)?.label.toLowerCase()} ainda.
          </div>
        ) : (
          listaFiltrada.map((registro) => (
            <motion.div
              layout
              key={registro.id}
              className="group relative p-6 rounded-2xl border bg-card border-border transition-all"
            >
              <div className="absolute top-6 right-6 flex items-center gap-1">
                <button
                  onClick={() => handleDeletarRegistro(registro.id)}
                  disabled={excluindoId === registro.id}
                  className="p-2 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-100"
                >
                  {excluindoId === registro.id ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Trash2 size={18} />
                  )}
                </button>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="w-fit px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                    B.O. {registro.bo}
                  </span>
                  <span className="w-fit px-2.5 py-0.5 rounded-full bg-accent text-accent-foreground text-[10px] font-bold uppercase tracking-wider">
                    {SUB_GRUPOS.find((g) => g.value === registro.sub_grupo)?.label}
                  </span>
                </div>

                <div className="grid gap-2 pr-12 sm:grid-cols-2">
                  {registro.qra.length > 0 && (
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
                  )}
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground">QRU</span>
                    <p className="text-sm font-medium text-card-foreground">{registro.qru}</p>
                  </div>
                  {registro.daec && (
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Daec</span>
                      <p className="text-sm font-medium text-card-foreground">{registro.daec}</p>
                    </div>
                  )}
                  {registro.veiculo && (
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Veículo</span>
                      <p className="flex items-center gap-1.5 text-sm font-medium text-card-foreground">
                        <Car size={14} className="text-muted-foreground" /> {registro.veiculo}
                      </p>
                    </div>
                  )}
                  {registro.acao && (
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Ação</span>
                      <p className="text-sm font-medium text-card-foreground">{registro.acao}</p>
                    </div>
                  )}
                  {registro.radio_principal && (
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Rádio Principal</span>
                      <p className="text-sm font-medium text-card-foreground">{registro.radio_principal}</p>
                    </div>
                  )}
                </div>

                {registro.veiculos_acao && registro.veiculos_acao.length > 0 && (
                  <div className="grid gap-3 pr-12 sm:grid-cols-2">
                    {registro.veiculos_acao.map((v, indice) => {
                      const membrosPreenchidos = v.membros.filter((m) => m.trim() !== "");
                      return (
                        <div key={v.id} className="rounded-xl border border-border/60 bg-muted/30 p-3">
                          <p className="flex items-center gap-1.5 text-sm font-semibold text-card-foreground">
                            <Car size={14} className="text-muted-foreground" /> {indice + 1}º Veículo — {v.nome}
                          </p>
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {membrosPreenchidos.length > 0 ? (
                              membrosPreenchidos.map((m, i) => (
                                <span
                                  key={i}
                                  className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                                >
                                  {m}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">Sem membros informados</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {registro.foto_link && (
                  <a
                    href={registro.foto_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-fit items-center gap-1.5 text-sm text-primary hover:underline"
                  >
                    <ImageIcon size={14} /> Foto da ação <ExternalLink size={12} />
                  </a>
                )}

                <div className="mt-4 pt-4 border-t border-border/50 flex items-center gap-6 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} /> {new Date(registro.criado_em).toLocaleDateString("pt-BR")}
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
