import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, User } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

export default function CompleteProfile() {
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const token = localStorage.getItem("user_token");
      const response = await fetch(`${API_BASE_URL}/api/profile/complete/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nome }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.nome || data.detail || "Não foi possível salvar seu perfil.");
      localStorage.setItem("user_name", data.user_name);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocorreu um erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-card">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground">Complete seu cadastro</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sua conta do Discord foi vinculada. Agora escolha o nome que será exibido na intranet e no sistema de pontos.</p>
        <label className="mt-6 block text-sm font-medium text-foreground">Nome de exibição</label>
        <div className="mt-2 flex items-center rounded-xl border border-input bg-background px-3">
          <User className="mr-2 h-4 w-4 text-muted-foreground" />
          <input autoFocus value={nome} onChange={(e) => setNome(e.target.value)} maxLength={150} placeholder="Ex.: Ryan Rodrigues" className="h-12 w-full bg-transparent outline-none" />
        </div>
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        <button disabled={loading} className="mt-6 h-12 w-full rounded-xl bg-primary font-semibold text-primary-foreground disabled:opacity-60">{loading ? "Salvando..." : "Continuar para a intranet"}</button>
      </form>
    </div>
  );
}
