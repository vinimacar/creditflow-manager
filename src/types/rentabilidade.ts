// Tipos para Análise de Rentabilidade

export interface RentabilidadeProduto {
  produtoId: string;
  produtoNome: string;
  fornecedorNome: string;
  totalVendas: number;
  receitaBruta: number;
  comissoesPagas: number;
  comissoesReceber: number;
  lucroLiquido: number;
  margemLucro: number; // percentual
  ticketMedio: number;
}

export interface RentabilidadeFornecedor {
  fornecedorId: string;
  fornecedorNome: string;
  totalProdutos: number;
  totalVendas: number;
  receitaBruta: number;
  comissoesPagas: number;
  lucroLiquido: number;
  margemLucro: number;
  ticketMedio: number;
}

export interface RentabilidadeFuncionario {
  funcionarioId: string;
  funcionarioNome: string;
  cargo: string;
  totalVendas: number;
  receitaGerada: number;
  comissoesRecebidas: number;
  custoSalarial: number; // folha de pagamento
  lucroLiquido: number; // receita - comissões
  roi: number; // retorno sobre investimento (lucro / custo)
  ticketMedio: number;
}

export interface ResumoRentabilidade {
  periodo: string;
  receitaTotal: number;
  custoTotal: number;
  lucroTotal: number;
  margemMedia: number;
  produtoMaisRentavel: string;
  fornecedorMelhor: string;
  funcionarioDestaque: string;
}
