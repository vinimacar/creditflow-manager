// Estruturas de dados para exportação eSocial
// Baseado no leiaute do eSocial versão S-1.2

/**
 * Interface para exportação de dados de folha de pagamento para o eSocial
 * Evento S-1200 - Remuneração de trabalhador vinculado ao Regime Geral de Previd ência Social
 */
export interface ESocialS1200 {
  evtRemun: {
    ideEvento: {
      indRetif: number; // 1-Original, 2-Retificação
      nrRecibo?: string; // Número do recibo do arquivo a ser retificado
      indApuracao: number; // 1-Mensal
      perApur: string; // Período de apuração (YYYY-MM)
      tpAmb: number; // 1-Produção, 2-Produção restrita
      procEmi: number; // 1-Aplicativo do empregador
      verProc: string; // Versão do aplicativo
    };
    ideEmpregador: {
      tpInsc: number; // 1-CNPJ, 2-CPF
      nrInsc: string; // CNPJ/CPF do empregador
    };
    ideTrabalhador: {
      cpfTrab: string; // CPF do trabalhador
      nmTrab: string; // Nome do trabalhador
      dtNascto: string; // Data de nascimento (YYYY-MM-DD)
    };
    dmDev: {
      ideDmDev: string; // Identificador do demonstrativo de pagamento
      codCateg: number; // Código da categoria do trabalhador
      infoPerApur: {
        ideEstabLot: {
          tpInsc: number;
          nrInsc: string;
          codLotacao: string;
          remunPerApur: {
            matricula: string;
            itensRemun: ItemRemuneracao[];
          };
        }[];
      };
    }[];
  };
}

export interface ItemRemuneracao {
  codRubr: string; // Código da rubrica conforme tabela 3 do eSocial
  ideTabRubr: string; // Identificador da tabela de rubricas
  qtdRubr?: number; // Quantidade de referência para apuração
  fatorRubr?: number; // Fator para apuração
  vrRubr: number; // Valor da rubrica
  indApurIR: number; // Indicativo de apuração de IR (0-Normal, 1-Férias)
}

/**
 * Códigos de rubricas mais comuns no eSocial
 */
export const RUBRICAS_ESOCIAL = {
  // Proventos
  SALARIO_BASE: '1000',
  HORAS_EXTRAS_50: '1010',
  HORAS_EXTRAS_100: '1011',
  ADICIONAL_NOTURNO: '1020',
  DSR: '1030',
  COMISSOES: '1040',
  BONUS: '1050',
  INSALUBRIDADE: '1060',
  PERICULOSIDADE: '1070',
  
  // Descontos
  INSS: '9001',
  IRRF: '9002',
  VALE_TRANSPORTE: '9010',
  VALE_REFEICAO: '9011',
  PLANO_SAUDE: '9012',
  FALTAS: '9020',
  
  // Informativas (não integram base de cálculo)
  FGTS: '9200',
  PROVISAO_FERIAS: '9201',
  PROVISAO_13_SALARIO: '9202',
} as const;

/**
 * Interface para resumo de folha de pagamento (exibição em tabela)
 */
export interface FolhaPagamentoResumo {
  id: string;
  funcionarioId: string;
  funcionarioNome: string;
  funcionarioCPF: string;
  mesReferencia: string;
  salarioBase: number;
  totalProventos: number;
  totalDescontos: number;
  salarioLiquido: number;
  fgts: number;
  inss: number;
  irrf: number;
  status: 'rascunho' | 'processada' | 'paga';
  dataPagamento?: Date;
}

/**
 * Interface para detalhamento completo da folha (modal/impressão)
 */
export interface FolhaPagamentoDetalhada extends FolhaPagamentoResumo {
  proventos: {
    salarioBase: number;
    horasExtras50: number;
    horasExtras100: number;
    adicionalNoturno: number;
    dsr: number;
    comissoes: number;
    bonus: number;
    insalubridade: number;
    periculosidade: number;
    outros: number;
  };
  descontos: {
    inss: number;
    irrf: number;
    valeTransporte: number;
    valeRefeicao: number;
    planoDeSaude: number;
    faltas: number;
    outros: number;
  };
  encargos: {
    fgts: number;
    provisaoFerias: number;
    provisao13Salario: number;
    total: number;
  };
  informacoesAdicionais: {
    numeroDependentes?: number;
    diasTrabalhados?: number;
    diasFaltas?: number;
    horasExtras50?: number;
    horasExtras100?: number;
    horasAdicionalNoturno?: number;
  };
}

/**
 * Converte uma folha de pagamento para o formato eSocial S-1200
 */
export function converterParaESocial(
  folha: FolhaPagamentoDetalhada,
  cnpjEmpresa: string,
  versaoApp: string = '1.0.0'
): ESocialS1200 {
  const itensRemun: ItemRemuneracao[] = [];

  // Adicionar proventos
  if (folha.proventos.salarioBase > 0) {
    itensRemun.push({
      codRubr: RUBRICAS_ESOCIAL.SALARIO_BASE,
      ideTabRubr: 'TABELA01',
      vrRubr: folha.proventos.salarioBase,
      indApurIR: 0,
    });
  }

  if (folha.proventos.horasExtras50 > 0) {
    itensRemun.push({
      codRubr: RUBRICAS_ESOCIAL.HORAS_EXTRAS_50,
      ideTabRubr: 'TABELA01',
      qtdRubr: folha.informacoesAdicionais.horasExtras50,
      vrRubr: folha.proventos.horasExtras50,
      indApurIR: 0,
    });
  }

  if (folha.proventos.horasExtras100 > 0) {
    itensRemun.push({
      codRubr: RUBRICAS_ESOCIAL.HORAS_EXTRAS_100,
      ideTabRubr: 'TABELA01',
      qtdRubr: folha.informacoesAdicionais.horasExtras100,
      vrRubr: folha.proventos.horasExtras100,
      indApurIR: 0,
    });
  }

  if (folha.proventos.adicionalNoturno > 0) {
    itensRemun.push({
      codRubr: RUBRICAS_ESOCIAL.ADICIONAL_NOTURNO,
      ideTabRubr: 'TABELA01',
      qtdRubr: folha.informacoesAdicionais.horasAdicionalNoturno,
      vrRubr: folha.proventos.adicionalNoturno,
      indApurIR: 0,
    });
  }

  if (folha.proventos.dsr > 0) {
    itensRemun.push({
      codRubr: RUBRICAS_ESOCIAL.DSR,
      ideTabRubr: 'TABELA01',
      vrRubr: folha.proventos.dsr,
      indApurIR: 0,
    });
  }

  if (folha.proventos.comissoes > 0) {
    itensRemun.push({
      codRubr: RUBRICAS_ESOCIAL.COMISSOES,
      ideTabRubr: 'TABELA01',
      vrRubr: folha.proventos.comissoes,
      indApurIR: 0,
    });
  }

  // Adicionar descontos
  if (folha.descontos.inss > 0) {
    itensRemun.push({
      codRubr: RUBRICAS_ESOCIAL.INSS,
      ideTabRubr: 'TABELA01',
      vrRubr: folha.descontos.inss,
      indApurIR: 0,
    });
  }

  if (folha.descontos.irrf > 0) {
    itensRemun.push({
      codRubr: RUBRICAS_ESOCIAL.IRRF,
      ideTabRubr: 'TABELA01',
      vrRubr: folha.descontos.irrf,
      indApurIR: 0,
    });
  }

  if (folha.descontos.valeTransporte > 0) {
    itensRemun.push({
      codRubr: RUBRICAS_ESOCIAL.VALE_TRANSPORTE,
      ideTabRubr: 'TABELA01',
      vrRubr: folha.descontos.valeTransporte,
      indApurIR: 0,
    });
  }

  if (folha.descontos.faltas > 0) {
    itensRemun.push({
      codRubr: RUBRICAS_ESOCIAL.FALTAS,
      ideTabRubr: 'TABELA01',
      qtdRubr: folha.informacoesAdicionais.diasFaltas,
      vrRubr: folha.descontos.faltas,
      indApurIR: 0,
    });
  }

  // Adicionar informativas (FGTS)
  if (folha.encargos.fgts > 0) {
    itensRemun.push({
      codRubr: RUBRICAS_ESOCIAL.FGTS,
      ideTabRubr: 'TABELA01',
      vrRubr: folha.encargos.fgts,
      indApurIR: 0,
    });
  }

  return {
    evtRemun: {
      ideEvento: {
        indRetif: 1,
        indApuracao: 1,
        perApur: folha.mesReferencia,
        tpAmb: 2, // Ambiente de produção restrita por padrão
        procEmi: 1,
        verProc: versaoApp,
      },
      ideEmpregador: {
        tpInsc: 1, // CNPJ
        nrInsc: cnpjEmpresa,
      },
      ideTrabalhador: {
        cpfTrab: folha.funcionarioCPF,
        nmTrab: folha.funcionarioNome,
        dtNascto: '', // Deve ser preenchido com a data de nascimento do funcionário
      },
      dmDev: [
        {
          ideDmDev: `${folha.funcionarioId}-${folha.mesReferencia}`,
          codCateg: 101, // Empregado CLT - ajustar conforme categoria real
          infoPerApur: {
            ideEstabLot: [
              {
                tpInsc: 1,
                nrInsc: cnpjEmpresa,
                codLotacao: '001', // Código da lotação - ajustar conforme necessidade
                remunPerApur: {
                  matricula: folha.funcionarioId,
                  itensRemun,
                },
              },
            ],
          },
        },
      ],
    },
  };
}

/**
 * Exporta múltiplas folhas de pagamento para JSON eSocial
 */
export function exportarParaESocialJSON(
  folhas: FolhaPagamentoDetalhada[],
  cnpjEmpresa: string
): string {
  const eventos = folhas.map(folha => converterParaESocial(folha, cnpjEmpresa));
  return JSON.stringify(eventos, null, 2);
}
