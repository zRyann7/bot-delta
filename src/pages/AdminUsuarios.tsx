import { useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Search, Shield, Trash2, UserRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { verificarIsAdmin } from "@/lib/auth";
import { atualizarAdminCargo, atualizarAdminUsuario, CargoOption, criarAdminCargo, excluirAdminCargo, excluirAdminUsuario, getAdminCargos, getAdminUsuarios, AdminUsuario } from "@/lib/admin";

const emptyCargo = { nome: "", ordem: 0 };

export default function AdminUsuarios() {
  const [aba, setAba] = useState<"usuarios" | "cargos">("usuarios");
  const [usuarios, setUsuarios] = useState<AdminUsuario[]>([]);
  const [cargos, setCargos] = useState<CargoOption[]>([]);
  const [busca, setBusca] = useState("");
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState({ username: "", cargo_id: null as number | null, id_funcional: "", lotacao: "" });
  const [cargoEditing, setCargoEditing] = useState<number | null>(null);
  const [cargoForm, setCargoForm] = useState(emptyCargo);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const meuUsername = (localStorage.getItem("user_name") || "").toLowerCase();

  const load = async () => {
    setLoading(true); setError("");
    try {
      const [u, c] = await Promise.all([getAdminUsuarios(), getAdminCargos()]);
      setUsuarios(u); setCargos(c);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Não foi possível carregar a administração.");
    } finally { setLoading(false); }
  };

  useEffect(() => { verificarIsAdmin().then((ok) => { if (ok) load(); else setError("Acesso restrito a administradores."); }); }, []);

  const filtered = useMemo(() => usuarios.filter((u) => [u.username, u.id_funcional, u.lotacao, u.cargo, u.discord_username].filter(Boolean).join(" ").toLowerCase().includes(busca.toLowerCase())), [usuarios, busca]);

  const startEdit = (u: AdminUsuario) => {
    setEditing(u.id); setError(""); setForm({ username: u.username, cargo_id: u.cargo_id, id_funcional: u.id_funcional || "", lotacao: u.lotacao || "" });
  };

  const saveUser = async () => {
    if (editing === null) return;
    setSaving(true); setError("");
    try {
      const updated = await atualizarAdminUsuario(editing, form);
      setUsuarios((items) => items.map((u) => u.id === editing ? { ...u, ...updated } : u));
      setEditing(null);
    } catch (err: any) {
      const data = err?.response?.data;
      setError(data?.username?.[0] || data?.id_funcional?.[0] || data?.detail || "Não foi possível salvar.");
    } finally { setSaving(false); }
  };

  const startCargo = (c?: CargoOption) => {
    setError("");
    setCargoEditing(c?.id ?? null);
    setCargoForm(c ? { nome: c.nome, ordem: c.ordem } : emptyCargo);
  };

  const saveCargo = async () => {
    setSaving(true); setError("");
    try {
      const result = cargoEditing === null ? await criarAdminCargo(cargoForm) : await atualizarAdminCargo(cargoEditing, cargoForm);
      setCargos((items) => cargoEditing === null ? [...items, result].sort((a,b) => b.ordem-a.ordem || a.nome.localeCompare(b.nome)) : items.map(c => c.id === cargoEditing ? result : c).sort((a,b) => b.ordem-a.ordem || a.nome.localeCompare(b.nome)));
      setCargoEditing(null); setCargoForm(emptyCargo);
    } catch (err: any) {
      const data = err?.response?.data;
      setError(data?.nome?.[0] || data?.ordem?.[0] || data?.detail || "Não foi possível salvar o cargo.");
    } finally { setSaving(false); }
  };

  const deleteCargo = async (c: CargoOption) => {
    if (!window.confirm(`Excluir o cargo “${c.nome}”?`)) return;
    setError("");
    try { await excluirAdminCargo(c.id); setCargos(items => items.filter(x => x.id !== c.id)); }
    catch (err: any) { setError(err?.response?.data?.detail || "Não foi possível excluir o cargo."); }
  };

  const deleteUser = async (u: AdminUsuario) => {
    if (!window.confirm(`Excluir o usuário “${u.username}”? Essa ação não pode ser desfeita — todos os registros de ponto e ausências dele também serão apagados.`)) return;
    setError("");
    setDeletingId(u.id);
    try {
      await excluirAdminUsuario(u.id);
      setUsuarios((items) => items.filter((x) => x.id !== u.id));
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Não foi possível excluir o usuário.");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;

  return <div className="space-y-6">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div><div className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /><h1 className="font-display text-2xl font-bold text-foreground">Administração</h1></div><p className="mt-1 text-sm text-muted-foreground">Gerencie usuários, cargos e a ordem hierárquica diretamente pelo site.</p></div>
      {aba === "usuarios" && <div className="relative w-full lg:w-80"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar usuário, ID ou lotação..." className="pl-9" /></div>}
    </div>

    <div className="flex gap-2 border-b border-border">
      <button onClick={() => {setAba("usuarios"); setError("");}} className={`border-b-2 px-4 py-3 text-sm font-semibold ${aba === "usuarios" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>Usuários</button>
      <button onClick={() => {setAba("cargos"); setError("");}} className={`border-b-2 px-4 py-3 text-sm font-semibold ${aba === "cargos" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>Cargos e hierarquia</button>
    </div>

    {error && <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

    {aba === "usuarios" ? <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card"><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="border-b border-border bg-muted/30"><tr className="text-left text-muted-foreground"><th className="px-4 py-3">Usuário</th><th className="px-4 py-3">Cargo</th><th className="px-4 py-3">Passaporte</th><th className="px-4 py-3">Badge</th><th className="px-4 py-3 text-right">Ação</th></tr></thead><tbody>{filtered.map((u) => <tr key={u.id} className="border-b border-border/70 last:border-0"><td className="px-4 py-3"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary"><UserRound className="h-4 w-4" /></div><div><div className="font-semibold text-foreground">{u.username}</div><div className="text-xs text-muted-foreground">{u.discord_username || "Sem Discord"}</div></div>{u.is_staff && <Badge variant="secondary">Admin</Badge>}</div></td><td className="px-4 py-3">{u.cargo || "—"}</td><td className="px-4 py-3">{u.id_funcional || "—"}</td><td className="px-4 py-3">{u.lotacao || "—"}</td><td className="px-4 py-3 text-right"><div className="flex justify-end gap-2"><Button variant="outline" size="sm" onClick={() => startEdit(u)}><Pencil className="mr-2 h-4 w-4" />Editar</Button><Button variant="ghost" size="sm" onClick={() => deleteUser(u)} disabled={deletingId === u.id || u.username.toLowerCase() === meuUsername} title={u.username.toLowerCase() === meuUsername ? "Você não pode excluir a própria conta" : undefined}>{deletingId === u.id ? <Loader2 className="h-4 w-4 animate-spin text-destructive" /> : <Trash2 className="h-4 w-4 text-destructive" />}</Button></div></td></tr>)}</tbody></table>{filtered.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">Nenhum usuário encontrado.</div>}</div></div> : <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card"><div className="border-b border-border p-4"><h2 className="font-display font-bold">Hierarquia de cargos</h2><p className="text-sm text-muted-foreground">Quanto maior a ordem, maior a posição hierárquica.</p></div><div className="divide-y divide-border">{cargos.map(c => <div key={c.id} className="flex items-center justify-between gap-4 p-4"><div><div className="font-semibold">{c.nome}</div><div className="text-xs text-muted-foreground">Ordem {c.ordem} · {c.usuarios_count ?? 0} usuário(s)</div></div><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => startCargo(c)}><Pencil className="mr-2 h-4 w-4" />Editar</Button><Button variant="ghost" size="sm" onClick={() => deleteCargo(c)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div></div>)}{cargos.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">Nenhum cargo cadastrado.</div>}</div></div>
      <div className="rounded-2xl border border-border bg-card p-5 shadow-card"><div className="flex items-center justify-between"><div><h2 className="font-display font-bold">{cargoEditing === null ? "Novo cargo" : "Editar cargo"}</h2><p className="text-sm text-muted-foreground">Defina nome e posição na hierarquia.</p></div>{cargoEditing !== null && <Button variant="ghost" size="icon" onClick={() => {setCargoEditing(null); setCargoForm(emptyCargo);}}><X className="h-4 w-4" /></Button>}</div><div className="mt-5 space-y-4"><div className="space-y-2"><label className="text-sm font-medium">Nome</label><Input value={cargoForm.nome} onChange={e => setCargoForm({...cargoForm, nome:e.target.value})} placeholder="Ex.: Sargento" /></div><div className="space-y-2"><label className="text-sm font-medium">Ordem hierárquica</label><Input type="number" min="0" value={cargoForm.ordem} onChange={e => setCargoForm({...cargoForm, ordem:Number(e.target.value)})} /></div><Button className="w-full" onClick={saveCargo} disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}{cargoEditing === null ? "Criar cargo" : "Salvar cargo"}</Button></div></div>
    </div>}

    {editing !== null && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm"><div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl"><div className="mb-5"><h2 className="font-display text-xl font-bold">Editar usuário</h2><p className="mt-1 text-sm text-muted-foreground">As alterações são aplicadas diretamente no perfil.</p></div><div className="space-y-4"><div className="space-y-2"><label className="text-sm font-medium">Usuário</label><Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></div><div className="space-y-2"><label className="text-sm font-medium">Cargo</label><Select value={form.cargo_id ? String(form.cargo_id) : "none"} onValueChange={(v) => setForm({ ...form, cargo_id: v === "none" ? null : Number(v) })}><SelectTrigger><SelectValue placeholder="Selecione o cargo" /></SelectTrigger><SelectContent><SelectItem value="none">Sem cargo</SelectItem>{cargos.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><label className="text-sm font-medium">Passaporte</label><Input value={form.id_funcional} onChange={(e) => setForm({ ...form, id_funcional: e.target.value })} /></div><div className="space-y-2"><label className="text-sm font-medium">Badge</label><Input value={form.lotacao} onChange={(e) => setForm({ ...form, lotacao: e.target.value })} /></div></div><div className="mt-6 flex justify-end gap-2"><Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button><Button onClick={saveUser} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar alterações</Button></div></div></div>}
  </div>;
}
