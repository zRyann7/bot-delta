// src/lib/config.ts
// Configurações centrais de marca e links da Unidade Delta.
// Ajuste aqui quando precisar trocar nome, logo-texto ou links externos.

export const SITE_NAME = "Site DELTA";

// URL base da API Django (sem barra no final).
export const API_BASE_URL = import.meta.env.VITE_API_URL || "";

// Link do GitBook com os documentos/manual de conduta da Unidade Delta.
// Usado no menu "Documentos" e dentro da página Documentos.
export const DOCS_URL = "https://delta-24.gitbook.io/delta-docs";
