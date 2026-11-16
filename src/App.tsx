import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Sistemas from "@/pages/Sistemas";
import Avisos from "@/pages/Avisos";
import Apreensoes from "@/pages/Apreensoes";
import BaterPonto from "@/pages/BaterPonto";
import Perfil from "@/pages/Perfil";
import Efetivo from "@/pages/Efetivo";
import Documentos from "@/pages/Documentos";
import Planilha from "@/pages/Planilha";
import EmBreve from "@/pages/EmBreve";
import NotFound from "@/pages/NotFound";
import Login from "./pages/Login";
import DiscordCallback from "./pages/DiscordCallback";
import DiscordChooseUsername from "./pages/DiscordChooseUsername";
import Boletins from "@/pages/Boletins";
import Ausencias from "@/pages/Ausencias";
import AdminUsuarios from "@/pages/AdminUsuarios";
import { CalendarOff, GraduationCap, FileText, ShieldCheck, MessageCircle, Loader2 } from "lucide-react";
import { verificarIsAdmin } from "@/lib/auth";

const queryClient = new QueryClient();

// Componente de Proteção de Rota
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = !!localStorage.getItem("user_token");
  
  if (!isAuthenticated) {
    // Se não estiver logado, redireciona para o login
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// A aba "Ausências" (visão de todos os usuários) é restrita a admins.
// Usuários comuns registram as próprias ausências em Meu perfil > Ausências.
// A verdade sobre quem é admin sempre vem do backend (verificarIsAdmin);
// o valor cacheado no localStorage é só um chute inicial pra não piscar.
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const [status, setStatus] = useState<"checking" | "admin" | "not-admin">("checking");

  useEffect(() => {
    verificarIsAdmin().then((ok) => setStatus(ok ? "admin" : "not-admin"));
  }, []);

  if (status === "checking") {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-24 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (status === "not-admin") {
    return <Navigate to="/perfil" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter 
        future={{ 
          v7_startTransition: true, 
          v7_relativeSplatPath: true 
        }}
      >
        <Routes>
          {/* ROTAS PÚBLICAS: Sem Layout (tela cheia) */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Navigate to="/login" replace />} />
          <Route path="/discord/callback" element={<DiscordCallback />} />
          <Route path="/discord/escolher-usuario" element={<DiscordChooseUsername />} />

          {/* ROTAS PROTEGIDAS: Com Layout e Verificação de Token */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Layout><Home /></Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/sistemas" 
            element={
              <ProtectedRoute>
                <Layout><Sistemas /></Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/avisos" 
            element={
              <ProtectedRoute>
                <Layout><Avisos /></Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/apreensoes" 
            element={
              <ProtectedRoute>
                <Layout><Apreensoes /></Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/bater-ponto" 
            element={
              <ProtectedRoute>
                <Layout><BaterPonto /></Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/perfil" 
            element={
              <ProtectedRoute>
                <Layout><Perfil /></Layout>
              </ProtectedRoute>
            } 
          />
          <Route
            path="/perfil/:username"
            element={
              <ProtectedRoute>
                <Layout><Perfil /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/efetivo"
            element={
              <ProtectedRoute>
                <Layout><Efetivo /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/manual"
            element={
              <ProtectedRoute>
                <Layout><Documentos /></Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/ausencias"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <Layout><Ausencias /></Layout>
                </AdminRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/usuarios"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <Layout><AdminUsuarios /></Layout>
                </AdminRoute>
              </ProtectedRoute>
            }
          />

          {/* PLACEHOLDERS: itens da sidebar sem página própria ainda */}
          <Route
            path="/cursos"
            element={
              <ProtectedRoute>
                <Layout><EmBreve title="Cursos" icon={GraduationCap} /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/boletins"
            element={
              <ProtectedRoute>
                <Layout><Boletins /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/planilha"
            element={
              <ProtectedRoute>
                <Layout><Planilha /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/acessos"
            element={
              <ProtectedRoute>
                <Layout><EmBreve title="Acessos" icon={ShieldCheck} /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/discord-comunidade"
            element={
              <ProtectedRoute>
                <Layout><EmBreve title="Discord" icon={MessageCircle} /></Layout>
              </ProtectedRoute>
            }
          />

          {/* ROTA 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;