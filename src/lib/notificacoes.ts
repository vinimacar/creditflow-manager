import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Notificacao } from "@/types/financeiro";
import { getDespesas, getFolhasPagamento } from "./firestore";
import { addDays, differenceInDays } from "date-fns";

/**
 * Cria uma nova notificação no sistema
 */
export async function criarNotificacao(dados: Omit<Notificacao, 'id' | 'criadoEm' | 'lida'>) {
  try {
    const notificacao: Omit<Notificacao, 'id'> = {
      ...dados,
      lida: false,
      criadoEm: new Date(),
    };

    await addDoc(collection(db, "notificacoes"), {
      ...notificacao,
      criadoEm: Timestamp.fromDate(notificacao.criadoEm),
      dataLeitura: notificacao.dataLeitura ? Timestamp.fromDate(notificacao.dataLeitura) : null,
    });

    console.log("Notificação criada:", dados.titulo);
  } catch (error) {
    console.error("Erro ao criar notificação:", error);
  }
}

/**
 * Verifica despesas que estão vencendo nos próximos 3 dias
 */
export async function verificarDespesasVencendo() {
  try {
    const despesas = await getDespesas();
    const hoje = new Date();
    const limite = addDays(hoje, 3); // 3 dias de antecedência

    for (const despesa of despesas) {
      if (despesa.status === 'Pendente' && despesa.dataVencimento) {
        const diasRestantes = differenceInDays(despesa.dataVencimento, hoje);
        
        if (diasRestantes >= 0 && diasRestantes <= 3) {
          await criarNotificacao({
            tipo: 'despesa_vencendo',
            titulo: `Despesa Vencendo: ${despesa.descricao}`,
            mensagem: `A despesa "${despesa.descricao}" vence em ${diasRestantes} dia(s) (${despesa.dataVencimento.toLocaleDateString('pt-BR')}). Valor: R$ ${despesa.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            destinatarioCargo: 'admin',
            prioridade: diasRestantes === 0 ? 'urgente' : diasRestantes === 1 ? 'alta' : 'media',
            link: '/despesas',
            entidadeRelacionada: 'despesas',
            entidadeRelacionadaId: despesa.id,
          });
        }
      }
    }
  } catch (error) {
    console.error("Erro ao verificar despesas:", error);
  }
}

/**
 * Verifica folhas de pagamento pendentes
 */
export async function verificarFolhasPendentes() {
  try {
    const folhas = await getFolhasPagamento();
    const hoje = new Date();

    for (const folha of folhas) {
      if (folha.status === 'processando') {
        const diasDesdeProcessamento = differenceInDays(hoje, folha.criadaEm);
        
        // Se está processando há mais de 2 dias, alertar
        if (diasDesdeProcessamento >= 2) {
          await criarNotificacao({
            tipo: 'folha_pendente',
            titulo: 'Folha de Pagamento Pendente',
            mensagem: `A folha de ${folha.mes}/${folha.ano} está em processamento há ${diasDesdeProcessamento} dias e ainda não foi finalizada.`,
            destinatarioCargo: 'admin',
            prioridade: diasDesdeProcessamento >= 5 ? 'urgente' : 'alta',
            link: '/folha-pagamento',
            entidadeRelacionada: 'folhaPagamento',
            entidadeRelacionadaId: folha.id,
          });
        }
      }
    }
  } catch (error) {
    console.error("Erro ao verificar folhas:", error);
  }
}

/**
 * Verifica comissões de fornecedores atrasadas
 */
export async function verificarComissoesAtrasadas() {
  try {
    const hoje = new Date();
    
    // Buscar comissões a receber atrasadas
    const { getDocs, collection, query, where } = await import('firebase/firestore');
    const q = query(
      collection(db, "comissoesReceber"),
      where("status", "==", "pendente")
    );

    const snapshot = await getDocs(q);
    
    for (const doc of snapshot.docs) {
      const comissao = doc.data();
      const dataVencimento = comissao.dataVencimento?.toDate();
      
      if (dataVencimento && dataVencimento < hoje) {
        const diasAtraso = differenceInDays(hoje, dataVencimento);
        
        if (diasAtraso > 0 && diasAtraso % 7 === 0) { // Notificar a cada 7 dias
          await criarNotificacao({
            tipo: 'comissao_atrasada',
            titulo: 'Comissão de Fornecedor Atrasada',
            mensagem: `Comissão de R$ ${comissao.valorComissao?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} está atrasada há ${diasAtraso} dias.`,
            destinatarioCargo: 'admin',
            prioridade: diasAtraso >= 30 ? 'urgente' : 'alta',
            link: '/comissoes-receber',
            entidadeRelacionada: 'comissoesReceber',
            entidadeRelacionadaId: doc.id,
          });
        }
      }
    }
  } catch (error) {
    console.error("Erro ao verificar comissões:", error);
  }
}

/**
 * Verifica metas próximas do fim do mês
 */
export async function verificarMetasProximasFim() {
  try {
    const hoje = new Date();
    const diaDoMes = hoje.getDate();
    
    // Nos últimos 5 dias do mês
    if (diaDoMes >= 25) {
      const { getDocs, collection, query, where } = await import('firebase/firestore');
      const periodo = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
      
      const q = query(
        collection(db, "metas"),
        where("periodo", "==", periodo),
        where("status", "==", "em_andamento")
      );

      const snapshot = await getDocs(q);
      
      for (const doc of snapshot.docs) {
        const meta = doc.data();
        
        if (meta.percentualAtingido < 70) {
          await criarNotificacao({
            tipo: 'meta_proxima',
            titulo: 'Meta Longe de Ser Atingida',
            mensagem: `A meta de ${meta.tipo} está com apenas ${meta.percentualAtingido?.toFixed(0)}% atingida e o mês está acabando.`,
            destinatarioId: meta.funcionarioId,
            destinatarioCargo: meta.funcionarioId ? undefined : 'admin',
            prioridade: 'alta',
            link: '/metas',
            entidadeRelacionada: 'metas',
            entidadeRelacionadaId: doc.id,
          });
        }
      }
    }
  } catch (error) {
    console.error("Erro ao verificar metas:", error);
  }
}

/**
 * Executa todas as verificações de notificações
 * Esta função deve ser chamada diariamente (via Firebase Functions ou cron job)
 */
export async function executarVerificacoesDiarias() {
  console.log("Iniciando verificações diárias de notificações...");
  
  await Promise.all([
    verificarDespesasVencendo(),
    verificarFolhasPendentes(),
    verificarComissoesAtrasadas(),
    verificarMetasProximasFim(),
  ]);
  
  console.log("Verificações diárias concluídas!");
}
