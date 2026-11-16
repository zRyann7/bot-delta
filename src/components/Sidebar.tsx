import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  LayoutGrid,
  Clock,
  User,
  CalendarOff,
  GraduationCap,
  Megaphone,
  FileText,
  Siren,
  Table2,
  BookOpen,
  ShieldCheck,
  MessageCircle,
  ChevronLeft,
  ChevronDown,
  ChevronsUp,
  Users,
  Settings,
} from "lucide-react";
import { SITE_NAME } from "@/lib/config";
import { getPerfil, type Perfil } from "@/lib/perfil";
import { verificarIsAdmin, isAdminCacheado } from "@/lib/auth";
import logoDelta from "@/assets/logo-delta.png";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  external?: boolean;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const geral: NavItem[] = [
  { label: "Home", path: "/", icon: Home },
  { label: "Bater Ponto", path: "/bater-ponto", icon: Clock },
];

const minhaArea: NavItem[] = [
  { label: "Meu perfil", path: "/perfil", icon: User },
  { label: "Efetivo", path: "/efetivo", icon: Users },
];


const gestaoBase: NavItem[] = [
  { label: "Cursos", path: "/cursos", icon: GraduationCap },
  { label: "Avisos", path: "/avisos", icon: Megaphone },
];

const sectionsBase: NavSection[] = [
  {
    label: "Gestão",
    items: gestaoBase,
  },
  {
    label: "Operacional",
    items: [
      { label: "Boletins", path: "/boletins", icon: FileText },
      { label: "Apreensões", path: "/apreensoes", icon: Siren },
      { label: "Planilha", path: "/planilha", icon: Table2 },
    ],
  },
  {
    label: "Sistema",
    items: [
      { label: "Manual", path: "/manual", icon: BookOpen },
      { label: "Acessos", path: "/acessos", icon: ShieldCheck },
      { label: "Discord", path: "/discord-comunidade", icon: MessageCircle },
    ],
  },
];

function NavRow({ item, collapsed, onClick }: { item: NavItem; collapsed: boolean; onClick?: () => void }) {
  const location = useLocation();
  const active = location.pathname === item.path;

  return (
    <Link
      to={item.path}
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "border border-primary/60 bg-primary/10 text-primary"
          : "border border-transparent text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
      )}
    >
      <item.icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );
}

function SectionLabel({ children, collapsed }: { children: React.ReactNode; collapsed: boolean }) {
  if (collapsed) return <div className="my-2 h-px bg-sidebar-border" />;
  return (
    <p className="mb-2 mt-5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
      {children}
    </p>
  );
}

export default function Sidebar({
  collapsed,
  onToggleCollapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onNavigate?: () => void;
}) {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  // "Ausências" no menu (aba de gestão de todos os usuários) é visível só
  // para admins. A verdade sobre quem é admin sempre vem do backend — o
  // valor cacheado é só um chute inicial pra não piscar o item no primeiro
  // render (ver lib/auth.ts).
  const [isAdmin, setIsAdmin] = useState(isAdminCacheado);

  useEffect(() => {
    getPerfil()
      .then(setPerfil)
      .catch(() => setPerfil(null));
    verificarIsAdmin().then(setIsAdmin);
  }, []);

  const sections: NavSection[] = sectionsBase.map((section) => {
    if (section.label === "Gestão" && isAdmin) {
      return { ...section, items: [{ label: "Ausências", path: "/ausencias", icon: CalendarOff }, ...section.items] };
    }
    if (section.label === "Sistema" && isAdmin) {
      return { ...section, items: [{ label: "Administração", path: "/admin/usuarios", icon: Settings }, ...section.items] };
    }
    return section;
  });

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Header */}
      <div
        className={cn(
          "flex items-center border-b border-sidebar-border px-4 py-4",
          collapsed ? "flex-col gap-3" : "justify-between"
        )}
      >
        <Link to="/" onClick={onNavigate} className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full">
            <img src={logoDelta} alt={SITE_NAME} className="h-full w-full object-contain" />
          </div>
          {!collapsed && <span className="truncate font-display text-base font-bold text-foreground">{SITE_NAME}</span>}
        </Link>
        <button
          onClick={onToggleCollapsed}
          className="hidden h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground lg:flex"
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 scrollbar-thin-dark">
        <SectionLabel collapsed={collapsed}>Geral</SectionLabel>
        <div className="space-y-1">
          {geral.map((item) => (
            <NavRow key={item.path} item={item} collapsed={collapsed} onClick={onNavigate} />
          ))}
        </div>

        <SectionLabel collapsed={collapsed}>Minha área</SectionLabel>
        <div className="space-y-1">
          {minhaArea.map((item) => (
            <NavRow key={item.path} item={item} collapsed={collapsed} onClick={onNavigate} />
          ))}
        </div>

        {sections.map((section) => (
          <div key={section.label}>
            <SectionLabel collapsed={collapsed}>{section.label}</SectionLabel>
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavRow key={item.path} item={item} collapsed={collapsed} onClick={onNavigate} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer / user card */}
      <Link
        to="/perfil"
        onClick={onNavigate}
        className="flex items-center gap-3 border-t border-sidebar-border px-4 py-3 transition-colors hover:bg-sidebar-accent"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sidebar-accent">
          {perfil?.discord.avatar ? (
            <img src={perfil.discord.avatar} alt={perfil.username} className="h-full w-full object-cover" />
          ) : (
            <User className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {perfil ? `${perfil.id_funcional ?? ""} ${perfil.callsign || perfil.username}`.trim() : "Carregando..."}
            </p>
            <p className="truncate text-xs text-muted-foreground">{perfil?.lotacao || SITE_NAME}</p>
            {perfil?.cargo && (
              <span className="mt-1 inline-flex items-center gap-1 truncate text-[11px] font-semibold text-primary">
                <ChevronsUp className="h-3 w-3 shrink-0" />
                <span className="truncate">{perfil.cargo}</span>
              </span>
            )}
          </div>
        )}
        {!collapsed && <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
      </Link>
    </div>
  );
}
