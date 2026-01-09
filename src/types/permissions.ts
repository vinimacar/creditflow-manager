import type { UserRole } from "@/contexts/AuthTypes";

// Módulos do sistema
export type Modulo = 
  | "dashboard"
  | "clientes"
  | "produtos"
  | "funcionarios"
  | "fornecedores"
  | "pdv"
  | "conciliacao"
  | "relatorios"
  | "configuracoes"
  | "usuarios";

// Ações que podem ser realizadas
export type Acao = "visualizar" | "criar" | "editar" | "excluir" | "exportar";

// Permissão para um módulo específico
export interface PermissaoModulo {
  modulo: Modulo;
  acoes: Acao[];
}

// Conjunto completo de permissões
export interface Permissoes {
  [modulo: string]: Acao[];
}

// Permissões por função/cargo
export interface PermissoesPorCargo {
  cargo: UserRole;
  permissoes: Permissoes;
}

// Permissões customizadas para um funcionário
export interface PermissoesFuncionario {
  funcionarioId: string;
  permissoes: Permissoes;
  usarPermissoesCargo: boolean; // Se true, ignora permissões customizadas
}

// Permissões padrão do sistema
export const PERMISSOES_PADRAO: Record<UserRole, Permissoes> = {
  admin: {
    dashboard: ["visualizar", "exportar"],
    clientes: ["visualizar", "criar", "editar", "excluir", "exportar"],
    produtos: ["visualizar", "criar", "editar", "excluir", "exportar"],
    funcionarios: ["visualizar", "criar", "editar", "excluir", "exportar"],
    fornecedores: ["visualizar", "criar", "editar", "excluir", "exportar"],
    pdv: ["visualizar", "criar", "editar", "excluir"],
    conciliacao: ["visualizar", "criar", "editar", "exportar"],
    relatorios: ["visualizar", "exportar"],
    configuracoes: ["visualizar", "editar"],
    usuarios: ["visualizar", "criar", "editar", "excluir"],
  },
  gerente: {
    dashboard: ["visualizar", "exportar"],
    clientes: ["visualizar", "criar", "editar", "exportar"],
    produtos: ["visualizar", "criar", "editar", "exportar"],
    funcionarios: ["visualizar", "criar", "editar"],
    fornecedores: ["visualizar", "criar", "editar", "exportar"],
    pdv: ["visualizar", "criar", "editar"],
    conciliacao: ["visualizar", "criar", "editar", "exportar"],
    relatorios: ["visualizar", "exportar"],
    configuracoes: ["visualizar"],
    usuarios: ["visualizar"],
  },
  agente: {
    dashboard: ["visualizar"],
    clientes: ["visualizar", "criar", "editar"],
    produtos: ["visualizar"],
    funcionarios: ["visualizar"],
    fornecedores: ["visualizar"],
    pdv: ["visualizar", "criar"],
    conciliacao: ["visualizar"],
    relatorios: ["visualizar"],
    configuracoes: [],
    usuarios: [],
  },
  atendente: {
    dashboard: ["visualizar"],
    clientes: ["visualizar", "criar"],
    produtos: ["visualizar"],
    funcionarios: [],
    fornecedores: [],
    pdv: ["visualizar", "criar"],
    conciliacao: [],
    relatorios: [],
    configuracoes: [],
    usuarios: [],
  },
};

// Labels dos módulos
export const MODULOS_LABELS: Record<Modulo, string> = {
  dashboard: "Dashboard",
  clientes: "Clientes",
  produtos: "Produtos",
  funcionarios: "Funcionários",
  fornecedores: "Fornecedores",
  pdv: "PDV (Vendas)",
  conciliacao: "Conciliação",
  relatorios: "Relatórios",
  configuracoes: "Configurações",
  usuarios: "Usuários",
};

// Labels das ações
export const ACOES_LABELS: Record<Acao, string> = {
  visualizar: "Visualizar",
  criar: "Criar",
  editar: "Editar",
  excluir: "Excluir",
  exportar: "Exportar",
};

// Função para verificar se um usuário tem permissão
export function temPermissao(
  permissoes: Permissoes,
  modulo: Modulo,
  acao: Acao
): boolean {
  return permissoes[modulo]?.includes(acao) || false;
}

// Função para obter permissões efetivas (cargo ou customizadas)
export function obterPermissoesEfetivas(
  cargo: UserRole,
  permissoesCustomizadas?: Permissoes,
  usarPermissoesCargo?: boolean
): Permissoes {
  if (usarPermissoesCargo === false && permissoesCustomizadas) {
    return permissoesCustomizadas;
  }
  return PERMISSOES_PADRAO[cargo] || PERMISSOES_PADRAO.atendente;
}
