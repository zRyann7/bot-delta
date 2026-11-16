export interface Sistema {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  status: "ativo" | "instavel" | "offline";
  icone: string;
  link: string;
}

export interface Aviso {
  id: number | string; // Aceita number do Django ou string do mock
  titulo: string;
  conteudo: string;
  categoria: string;
  autor: string;
  data_criacao: string; // Padrão vindo do Backend
}

export interface Documento {
  id: string;
  nome: string;
  tipo: "pdf" | "doc" | "xls" | "ppt" | "img";
  categoria: string;
  data: string;
  tamanho: string;
}

// Lista de sistemas da Unidade Delta.
// Os links antigos (de outra unidade) foram removidos — adicione aqui os
// sistemas e endereços corretos da Delta.
export const sistemas: Sistema[] = [];

export const avisos: Aviso[] = [];

export const documentos: Documento[] = [
  { 
    id: "1", 
    nome: "Manual do Colaborador 2026", 
    tipo: "pdf", 
    categoria: "RH", 
    data: "2026-03-15", 
    tamanho: "2.4 MB" 
  }
];

export const categoriasSistemas = ["Todos", "Gestão", "RH", "TI", "Comunicação", "Comercial", "Suprimentos"];

export type SubGrupoApreensao = "acoes_fechadas" | "apreensoes_rua";

// Um veículo usado em uma Ação Fechada, com até 3 membros que o acompanharam.
export interface VeiculoAcaoFechada {
  id: string;
  nome: string;
  membros: string[]; // sempre 3 posições; "" = vaga em aberto
}

export interface Ponto {
  id: string;
  oficial: string;
  entrada: string;
  saida: string | null;
  fechadoManualmente?: boolean;
}