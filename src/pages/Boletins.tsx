import { useMemo, useState, useEffect } from "react";
import {
  Clipboard,
  FileText,
  Car,
  Plus,
  Minus,
  RotateCcw,
  Copy,
  Check,
  Radio,
  ChevronsUpDown,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { buscarOficiais, type Oficial } from "@/lib/googleSheets";
import { cn } from "@/lib/utils";

type Categoria = "ocorrencias" | "acoes";
type AbaBoletim = "relatorios" | "geradores";
type AbaGerador = "acoes" | "boosting";
type Desfecho = "" | "conduzido" | "liberado";

type FormState = {
  local: string;
  qthFinal: string;
  veiculo: string;
  desfecho: Desfecho;
  individuos: number;
  id: string;
  itens: string;
  observacoes: string;
};

type Viatura = {
  veiculo: string;
  membros: [string, string, string, string];
};

const emptyForm: FormState = {
  local: "",
  qthFinal: "",
  veiculo: "",
  desfecho: "",
  individuos: 1,
  id: "",
  itens: "",
  observacoes: "",
};

const modelos = {
  ocorrencias: [
    { value: "trafico", label: "Tráfico de Entorpecentes" },
    { value: "corrida", label: "Corrida ilegal" },
    { value: "atm", label: "Roubo a atm" },
    { value: "abordagem", label: "Abordagem / Averiguação" },
    { value: "placa", label: "Placa falsa" },
    { value: "armas", label: "Cód.5" },
    { value: "boosting", label: "Boosting" },
  ],
  acoes: [
    { value: "fleeca", label: "Fleeca" },
    { value: "joalheria", label: "Joalheria" },
    { value: "bebidas", label: "Bebidas" },
    { value: "japones", label: "Restaurante Japonês" },
  ],
} as const;

const geradorAcoes = [
  { value: "joalheria", label: "JOALHERIA" },
  { value: "bebidas", label: "BEBIDAS" },
  { value: "fleeca", label: "FLEECA" },
  { value: "japones", label: "RESTAURANTE JAPONÊS" },
] as const;

const desfechos: { value: Desfecho; label: string }[] = [
  { value: "conduzido", label: "Conduzido" },
  { value: "liberado", label: "Liberado" },
];

function value(text: string, fallback = "[NÃO INFORMADO]") {
  return text.trim() || fallback;
}

function gerarTextoRelatorio(categoria: Categoria, modelo: string, form: FormState) {
  const local = value(form.local);
  const qthFinal = value(form.qthFinal, form.local);
  const veiculo = value(form.veiculo, "[MODELO DO VEÍCULO]");
  const id = value(form.id, "[ID]");
  const itens = value(form.itens, "");
  const obs = form.observacoes.trim() || "";
  const desfechoValue = form.desfecho;
  const desfecho = desfechos.find((item) => item.value === desfechoValue)?.label || "[DESFECHO]";

  if (categoria === "acoes") {
    const titulo = modelos.acoes.find((item) => item.value === modelo)?.label || "Operação Policial";
    return [
      "🛡️ 1º Batalhão de Polícia Militar da Capital – Metroville (1ºBPM-AV) 🛡️",
      "",
      `📋 Relato: ${titulo} realizada na região de ${local}. A equipe realizou o procedimento operacional previsto e finalizou a ação com ${desfecho.toLowerCase()}.`,
      `📍 QTH: ${qthFinal}`,
      `👥 Efetivo empregado: ${form.individuos}`,
      "",
      "",
      "",
      `📦 Itens apreendidos: ${itens}`,
      `🚔 Veículo: ${veiculo}`,
      `⚖️ Desfecho: ${desfecho}`,
      `⚠️ Observações: ${obs}`,
    ].join("\n");
  }

  const modeloLabel = modelos.ocorrencias.find((item) => item.value === modelo)?.label || "Ocorrência";
  const qru = modeloLabel.toUpperCase();

  const relato = (() => {
    switch (modelo) {
      case "trafico": {
        const conclusao = desfechoValue === "conduzido"
          ? "Após a abordagem, o indivíduo foi contido e conduzido até o departamento policial para prisão."
          : desfechoValue === "liberado"
            ? "Após a abordagem e averiguação, o indivíduo foi liberado no local."
            : "Após a abordagem, a equipe realizou os procedimentos cabíveis conforme o desfecho informado.";
        return `Recebemos uma denúncia via central, QRU ${qru}, QTH ${local}. Encontramos o indivíduo no ato do crime. Após aviso sonoro, luminoso e verbal, o indivíduo ${desfechoValue === "conduzido" ? "não aceitou se render e empreendeu fuga. Minutos depois, o mesmo ficou inoperante em seu veículo, QTH " + qthFinal + ", iniciou tentativa de fuga a pé, porém foi capturado." : "foi abordado pela equipe."} ${conclusao}`;
      }
      case "roubo":
        return `Recebemos uma denúncia via central, QRU ${qru}, QTH ${local}. A equipe deslocou até o local, realizou patrulhamento e procedeu com a abordagem e averiguação dos envolvidos. O atendimento foi finalizado com ${desfecho.toLowerCase()}.`;
      case "furto":
        return `Recebemos uma denúncia via central, QRU ${qru}, QTH ${local}. A equipe deslocou até o local, realizou a averiguação da ocorrência e tomou as providências cabíveis. O atendimento foi finalizado com ${desfecho.toLowerCase()}.`;
      case "abordagem":
        return `Durante patrulhamento, a equipe realizou abordagem para averiguação, QRU ${qru}, QTH ${local}. Após consulta e verificação dos envolvidos, foram realizados os procedimentos cabíveis, com desfecho ${desfecho.toLowerCase()}.`;
      case "acidente":
        return `Recebemos uma denúncia via central, QRU ${qru}, QTH ${local}. No local, a equipe realizou a sinalização, controle da área e averiguação dos envolvidos. O atendimento foi finalizado com ${desfecho.toLowerCase()}.`;
      case "armas":
        return `Recebemos uma denúncia via central, QRU ${qru}, QTH ${local}. No local, a equipe realizou a abordagem e averiguação dos envolvidos, adotando as medidas cabíveis. O atendimento foi finalizado com ${desfecho.toLowerCase()}.`;
      default:
        return `Recebemos uma denúncia via central, QRU ${qru}, QTH ${local}. A equipe realizou a averiguação da ocorrência e adotou as providências cabíveis.`;
    }
  })();

  return [
    "🛡️ 1º Batalhão de Polícia Militar da Capital – Metroville (1ºBPMC) 🛡️",
    "",
    `📋 Relato: ${relato}`,
    "",
    "",
    "",
    "📦 Itens apreendidos: ",
    `🚔 Veículo: ${veiculo}`,
    `⚖️ Crimes / Multas: ${modeloLabel}`,
    `👤 Indivíduos envolvidos: ${form.individuos}`,
    `🪪 ID: ${id}`,
    `📦 Materiais: ${itens}`,
    `⚠️ Observações: ${obs}`,
  ].join("\n");
}

function gerarTextoGerador(acao: string, radio: string, daeclivre: string, viaturas: Viatura[]) {
  const acaoLabel = geradorAcoes.find((item) => item.value === acao)?.label || "[AÇÃO]";
  const radioValue = value(radio, "[RÁDIO PRINCIPAL]");
  const daecValue = value(daeclivre, "VAGA");

  const linhas = [
    `cp ${acaoLabel} | ${radioValue} | DAEC LIVRE: ${daecValue}`,
    "",
    ...viaturas.map((viatura, index) => {
      const nomeVeiculo = value(viatura.veiculo, `${index + 1}º VEÍCULO`);
      const membros = viatura.membros.map((membro) => value(membro, "VAGA"));
      return `${nomeVeiculo} | ${membros.join(" | ")}`;
    }),
  ];

  return linhas.join("\n");
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
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={aberto}
          className="h-10 w-full justify-between font-normal text-foreground"
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

export default function Boletins() {
  const [aba, setAba] = useState<AbaBoletim>("relatorios");
  const [categoria, setCategoria] = useState<Categoria>("ocorrencias");
  const [modelo, setModelo] = useState("trafico");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [copied, setCopied] = useState(false);
  const [abaGerador, setAbaGerador] = useState<AbaGerador>("acoes");
  const [acao, setAcao] = useState("patrulhamento");
  const [radio, setRadio] = useState("");
  const [daeclivre, setdaeclivre] = useState("");
  const [viaturas, setViaturas] = useState<Viatura[]>([
    { veiculo: "", membros: ["", "", "", ""] },
  ]);

  // Lista de oficiais vinda da planilha pública da polícia, usada pro
  // campo "DAEC livre" (o mesmo padrão já usado em Apreensões).
  const [oficiais, setOficiais] = useState<Oficial[]>([]);
  const [carregandoOficiais, setCarregandoOficiais] = useState(true);
  const [erroOficiais, setErroOficiais] = useState(false);

  useEffect(() => {
    buscarOficiais()
      .then(setOficiais)
      .catch(() => setErroOficiais(true))
      .finally(() => setCarregandoOficiais(false));
  }, []);

  const textoRelatorio = useMemo(
    () => gerarTextoRelatorio(categoria, modelo, form),
    [categoria, modelo, form],
  );

  const textoGerador = useMemo(
    () => gerarTextoGerador(acao, radio, daeclivre, viaturas),
    [acao, radio, daeclivre, viaturas],
  );

  const texto = aba === "geradores" ? textoGerador : textoRelatorio;

  const modelosAtuais = modelos[categoria];

  const update = <K extends keyof FormState>(key: K, next: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: next }));
  };

  const mudarCategoria = (next: Categoria) => {
    setCategoria(next);
    setModelo(modelos[next][0].value);
    setForm(emptyForm);
  };

  const limparRelatorio = () => {
    setForm(emptyForm);
    setCopied(false);
  };

  const limparGerador = () => {
    setAcao("patrulhamento");
    setRadio("");
    setdaeclivre("");
    setViaturas([{ veiculo: "", membros: ["", "", "", ""] }]);
    setCopied(false);
  };

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const adicionarViatura = () => {
    setViaturas((current) => [
      ...current,
      { veiculo: "", membros: ["", "", "", ""] },
    ]);
  };

  const removerViatura = () => {
    setViaturas((current) => current.length > 1 ? current.slice(0, -1) : current);
  };

  const updateViatura = (index: number, field: "veiculo" | "membro", value: string, memberIndex = 0) => {
    setViaturas((current) => current.map((item, itemIndex) => {
      if (itemIndex !== index) return item;
      if (field === "veiculo") return { ...item, veiculo: value };
      const membros = [...item.membros] as [string, string, string, string];
      membros[memberIndex] = value;
      return { ...item, membros };
    }));
  };

  return (
    <div className="mx-auto max-w-[1460px] space-y-5">
      <header>
        <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">Central de boletins</h1>
        <p className="mt-2 text-sm text-muted-foreground">Monte relatórios e escalas operacionais da unidade DELTA</p>
      </header>

      <div className="border-b border-border" />

      <div className="flex gap-6 border-b border-border">
        <button
          type="button"
          onClick={() => setAba("relatorios")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-3 pb-3 pt-2 text-sm transition",
            aba === "relatorios" ? "border-primary font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <FileText className="h-4 w-4" /> Relatórios
        </button>
        <button
          type="button"
          onClick={() => setAba("geradores")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-3 pb-3 pt-2 text-sm transition",
            aba === "geradores" ? "border-primary font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <Car className="h-4 w-4" /> Geradores
        </button>
      </div>

      {aba === "relatorios" ? (
        <Relatorios
          categoria={categoria}
          modelo={modelo}
          form={form}
          modelosAtuais={modelosAtuais}
          texto={textoRelatorio}
          copied={copied}
          onCategoria={mudarCategoria}
          onModelo={setModelo}
          onUpdate={update}
          onLimpar={limparRelatorio}
          onCopiar={copiar}
        />
      ) : (
        <Geradores
          abaGerador={abaGerador}
          acao={acao}
          radio={radio}
          daeclivre={daeclivre}
          viaturas={viaturas}
          texto={textoGerador}
          copied={copied}
          oficiais={oficiais}
          carregandoOficiais={carregandoOficiais}
          erroOficiais={erroOficiais}
          onAbaGerador={setAbaGerador}
          onAcao={setAcao}
          onRadio={setRadio}
          ondaeclivre={setdaeclivre}
          onUpdateViatura={updateViatura}
          onAdicionarViatura={adicionarViatura}
          onRemoverViatura={removerViatura}
          onLimpar={limparGerador}
          onCopiar={copiar}
        />
      )}
    </div>
  );
}

function Relatorios({
  categoria,
  modelo,
  form,
  modelosAtuais,
  texto,
  copied,
  onCategoria,
  onModelo,
  onUpdate,
  onLimpar,
  onCopiar,
}: {
  categoria: Categoria;
  modelo: string;
  form: FormState;
  modelosAtuais: readonly { value: string; label: string }[];
  texto: string;
  copied: boolean;
  onCategoria: (value: Categoria) => void;
  onModelo: (value: string) => void;
  onUpdate: <K extends keyof FormState>(key: K, next: FormState[K]) => void;
  onLimpar: () => void;
  onCopiar: () => void;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(440px,0.95fr)]">
      <section className="rounded-xl border border-border bg-card p-4 shadow-card sm:p-5">
        <div className="grid gap-4 border-b border-border pb-4 md:grid-cols-[200px_minmax(0,1fr)]">
          <div>
            <label className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Categoria</label>
            <div className="grid grid-cols-2 rounded-lg border border-border bg-background/40 p-1">
              <button type="button" onClick={() => onCategoria("ocorrencias")} className={cn("rounded-md px-2 py-2 text-xs transition", categoria === "ocorrencias" ? "bg-accent text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}>◉ Ocorrências</button>
              <button type="button" onClick={() => onCategoria("acoes")} className={cn("rounded-md px-2 py-2 text-xs transition", categoria === "acoes" ? "bg-accent text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}>▤ Ações</button>
            </div>
          </div>
          <div>
            <label htmlFor="modelo" className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Modelo</label>
            <select id="modelo" value={modelo} onChange={(e) => onModelo(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none ring-offset-background focus:ring-2 focus:ring-ring">
              {modelosAtuais.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Local (QTH)" placeholder="Ex: Vinewood Hills" value={form.local} onChange={(v) => onUpdate("local", v)} />
          <Field label="QTH final" placeholder="Ex: Elgin Avenue" value={form.qthFinal} onChange={(v) => onUpdate("qthFinal", v)} />
          <Field label="Modelo do veículo" placeholder="Ex: RH5" value={form.veiculo} onChange={(v) => onUpdate("veiculo", v)} />
          <div>
            <label htmlFor="desfecho" className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Desfecho</label>
            <select id="desfecho" value={form.desfecho} onChange={(e) => onUpdate("desfecho", e.target.value as Desfecho)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring">
              <option value="">Selecione...</option>
              {desfechos.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-4 border-t border-border pt-4">
          <div className="grid gap-4 sm:grid-cols-[150px_180px_minmax(0,1fr)]">
            <div>
              <label className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Indivíduos na ação</label>
              <div className="flex h-10 items-center gap-2">
                <Button type="button" variant="outline" size="icon" onClick={() => onUpdate("individuos", Math.max(1, form.individuos - 1))}><Minus className="h-4 w-4" /></Button>
                <div className="flex h-10 min-w-10 items-center justify-center rounded-md border border-input bg-background text-sm">{form.individuos}</div>
                <Button type="button" variant="outline" size="icon" onClick={() => onUpdate("individuos", form.individuos + 1)}><Plus className="h-4 w-4" /></Button>
              </div>
            </div>
            <Field label="ID" placeholder="1234" value={form.id} onChange={(v) => onUpdate("id", v)} />
            <Field label="Itens apreendidos" placeholder="2kg de entorpecentes + R$ 10.000" value={form.itens} onChange={(v) => onUpdate("itens", v)} />
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="observacoes" className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Observações</label>
          <Textarea id="observacoes" rows={3} placeholder="Detalhes adicionais da ocorrência..." value={form.observacoes} onChange={(e) => onUpdate("observacoes", e.target.value)} className="resize-y" />
        </div>

        <div className="mt-4 flex justify-end border-t border-border pt-3">
          <Button type="button" variant="outline" size="sm" onClick={onLimpar} className="gap-2 text-muted-foreground"><RotateCcw className="h-3.5 w-3.5" /> Limpar campos</Button>
        </div>
      </section>

      <Preview texto={texto} copied={copied} onCopiar={onCopiar} />
    </div>
  );
}

function Geradores({
  abaGerador,
  acao,
  radio,
  daeclivre,
  viaturas,
  texto,
  copied,
  oficiais,
  carregandoOficiais,
  erroOficiais,
  onAbaGerador,
  onAcao,
  onRadio,
  ondaeclivre,
  onUpdateViatura,
  onAdicionarViatura,
  onRemoverViatura,
  onLimpar,
  onCopiar,
}: {
  abaGerador: AbaGerador;
  acao: string;
  radio: string;
  daeclivre: string;
  viaturas: Viatura[];
  texto: string;
  copied: boolean;
  oficiais: Oficial[];
  carregandoOficiais: boolean;
  erroOficiais: boolean;
  onAbaGerador: (value: AbaGerador) => void;
  onAcao: (value: string) => void;
  onRadio: (value: string) => void;
  ondaeclivre: (value: string) => void;
  onUpdateViatura: (index: number, field: "veiculo" | "membro", value: string, memberIndex?: number) => void;
  onAdicionarViatura: () => void;
  onRemoverViatura: () => void;
  onLimpar: () => void;
  onCopiar: () => void;
}) {
  return (
    <>
      <div className="flex gap-5 border-b border-border">
        <button type="button" onClick={() => onAbaGerador("acoes")} className={cn("border-b-2 px-1 pb-2 pt-0 text-sm transition", abaGerador === "acoes" ? "border-primary font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>Ações</button>
        <button type="button" onClick={() => onAbaGerador("boosting")} className={cn("border-b-2 px-1 pb-2 pt-0 text-sm transition", abaGerador === "boosting" ? "border-primary font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>Boosting</button>
      </div>

      {abaGerador === "boosting" ? (
        <section className="rounded-xl border border-border bg-card p-8 text-center shadow-card">
          <h2 className="text-lg font-semibold text-foreground">Gerador de Boosting</h2>
          <p className="mt-2 text-sm text-muted-foreground">Em breve...</p>
        </section>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(440px,0.95fr)]">
          <section className="rounded-xl border border-border bg-card p-4 shadow-card sm:p-5">
            <div className="grid gap-4 border-b border-border pb-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <SelectField label="Ação" value={acao} onChange={onAcao} options={geradorAcoes.map((item) => ({ value: item.value, label: item.label }))} placeholder="Selecione a ação..." />
              <Field label="Rádio principal" placeholder="Ex: policiafleeca" value={radio} onChange={onRadio} />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_220px]">
              <div>
                <label className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">DAEC livre</label>
                <OficialCombobox
                  value={daeclivre}
                  onChange={ondaeclivre}
                  placeholder="Selecione o oficial..."
                  oficiais={oficiais}
                  carregando={carregandoOficiais}
                  erro={erroOficiais}
                />
              </div>
              <div>
                <label className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Veículos</label>
                <div className="flex h-10 items-center gap-2">
                  <Button type="button" variant="outline" size="icon" onClick={onRemoverViatura} disabled={viaturas.length === 1}><Minus className="h-4 w-4" /></Button>
                  <div className="flex h-10 min-w-10 items-center justify-center rounded-md border border-input bg-background px-3 text-sm">{viaturas.length}</div>
                  <Button type="button" variant="outline" size="icon" onClick={onAdicionarViatura}><Plus className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-4 border-t border-border pt-4">
              {viaturas.map((viatura, index) => (
                <div key={index} className="grid gap-4 border-b border-border pb-4 last:border-b-0 last:pb-0 sm:grid-cols-3">
                  <Field label={`${index + 1}º veículo`} placeholder="Ex: Sentinel XI" value={viatura.veiculo} onChange={(v) => onUpdateViatura(index, "veiculo", v)} />
                  <Field label="1º membro" placeholder="Ex: VAGA" value={viatura.membros[0]} onChange={(v) => onUpdateViatura(index, "membro", v, 0)} />
                  <Field label="2º membro" placeholder="Ex: VAGA" value={viatura.membros[1]} onChange={(v) => onUpdateViatura(index, "membro", v, 1)} />
                  <Field label="3º membro" placeholder="Ex: VAGA" value={viatura.membros[2]} onChange={(v) => onUpdateViatura(index, "membro", v, 2)} />
                  <Field label="4º membro" placeholder="Ex: VAGA" value={viatura.membros[3]} onChange={(v) => onUpdateViatura(index, "membro", v, 3)} />
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end border-t border-border pt-3">
              <Button type="button" variant="outline" size="sm" onClick={onLimpar} className="gap-2 text-muted-foreground"><RotateCcw className="h-3.5 w-3.5" /> Limpar campos</Button>
            </div>
          </section>

          <div className="space-y-4">
            <section className="rounded-xl border border-border bg-card p-4 shadow-card sm:p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Prévia da mensagem</h2>
                <Button type="button" size="sm" variant="outline" onClick={onCopiar} className="gap-1.5 border-primary/40 text-primary hover:bg-primary/10">
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copiado" : "Copiar texto"}
                </Button>
              </div>
              <div className="min-h-[140px] rounded-lg border border-border bg-background p-4 font-sans text-[13px] leading-[1.55] text-foreground whitespace-pre-wrap">{texto}</div>
            </section>
          </div>
        </div>
      )}
    </>
  );
}

function Preview({ texto, copied, onCopiar }: { texto: string; copied: boolean; onCopiar: () => void }) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-card sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Prévia do boletim</h2>
        <Button type="button" size="sm" variant="outline" onClick={onCopiar} className="gap-1.5 border-primary/40 text-primary hover:bg-primary/10">
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copiado" : "Copiar texto"}
        </Button>
      </div>
      <div className="min-h-[300px] rounded-lg border border-border bg-background p-4 font-sans text-[13px] leading-[1.55] text-foreground whitespace-pre-wrap">{texto}</div>
      <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground"><Clipboard className="h-3.5 w-3.5" /> O texto é atualizado automaticamente enquanto você preenche os campos.</div>
    </section>
  );
}

function Field({ label, placeholder, value, onChange }: { label: string; placeholder: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function SelectField({ label, value, onChange, options, placeholder }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[]; placeholder: string }) {
  return (
    <div>
      <label className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring">
        <option value="">{placeholder}</option>
        {options.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
      </select>
    </div>
  );
}
