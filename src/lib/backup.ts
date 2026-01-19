import { collection, query, getDocs, Timestamp } from "firebase/firestore";
import { db } from "./firebase";
import { toast } from "sonner";

export interface DadosExportacao {
  nome: string;
  dados: any[];
}

/**
 * Exporta dados para CSV
 */
export function exportarParaCSV(dados: any[], nomeArquivo: string) {
  if (!dados || dados.length === 0) {
    toast.error("Nenhum dado para exportar");
    return;
  }

  // Obter cabeçalhos (todas as chaves únicas)
  const headers = Array.from(
    new Set(dados.flatMap(obj => Object.keys(obj)))
  );

  // Criar linhas CSV
  const linhasCSV = dados.map(obj => {
    return headers.map(header => {
      const valor = obj[header];
      
      // Tratar diferentes tipos de dados
      if (valor === null || valor === undefined) return "";
      if (typeof valor === "object" && valor.toDate) {
        // Timestamp do Firestore
        return valor.toDate().toLocaleString("pt-BR");
      }
      if (typeof valor === "object") {
        return JSON.stringify(valor);
      }
      
      // Escapar vírgulas e aspas
      const valorString = String(valor);
      if (valorString.includes(",") || valorString.includes('"') || valorString.includes("\n")) {
        return `"${valorString.replace(/"/g, '""')}"`;
      }
      
      return valorString;
    }).join(",");
  });

  // Combinar cabeçalhos e linhas
  const csv = [
    headers.join(","),
    ...linhasCSV
  ].join("\n");

  // Criar e baixar arquivo
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${nomeArquivo}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  toast.success("Arquivo CSV exportado com sucesso!");
}

/**
 * Exporta múltiplas tabelas para CSV (arquivo único com separadores)
 */
export function exportarVariasTabelas(tabelas: DadosExportacao[], nomeArquivo: string) {
  if (!tabelas || tabelas.length === 0) {
    toast.error("Nenhum dado para exportar");
    return;
  }

  const csvCompleto = tabelas.map(({ nome, dados }) => {
    if (!dados || dados.length === 0) return `\n=== ${nome} ===\nNenhum dado\n`;

    const headers = Array.from(
      new Set(dados.flatMap(obj => Object.keys(obj)))
    );

    const linhasCSV = dados.map(obj => {
      return headers.map(header => {
        const valor = obj[header];
        if (valor === null || valor === undefined) return "";
        if (typeof valor === "object" && valor.toDate) {
          return valor.toDate().toLocaleString("pt-BR");
        }
        if (typeof valor === "object") {
          return JSON.stringify(valor);
        }
        const valorString = String(valor);
        if (valorString.includes(",") || valorString.includes('"') || valorString.includes("\n")) {
          return `"${valorString.replace(/"/g, '""')}"`;
        }
        return valorString;
      }).join(",");
    });

    return `\n=== ${nome} ===\n${headers.join(",")}\n${linhasCSV.join("\n")}\n`;
  }).join("\n");

  const blob = new Blob(["\ufeff" + csvCompleto], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${nomeArquivo}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  toast.success("Backup completo exportado!");
}

/**
 * Exporta todos os dados do Firebase (BACKUP COMPLETO)
 */
export async function exportarBackupCompleto() {
  toast.info("Iniciando backup completo...");

  try {
    const colecoes = [
      "clientes",
      "fornecedores",
      "produtos",
      "funcionarios",
      "vendas",
      "despesas",
      "folhas_pagamento",
      "usuarios",
      "notificacoes",
      "categorias",
    ];

    const tabelas: DadosExportacao[] = [];

    for (const nomeColecao of colecoes) {
      try {
        const q = query(collection(db, nomeColecao));
        const snapshot = await getDocs(q);
        
        const dados = snapshot.docs.map(doc => {
          const data = doc.data();
          
          // Converter Timestamps para strings legíveis
          const dadosProcessados: any = { id: doc.id };
          Object.keys(data).forEach(key => {
            const valor = data[key];
            if (valor && typeof valor === "object" && valor.toDate) {
              dadosProcessados[key] = valor.toDate().toISOString();
            } else {
              dadosProcessados[key] = valor;
            }
          });
          
          return dadosProcessados;
        });

        tabelas.push({
          nome: nomeColecao.replace("_", " ").toUpperCase(),
          dados,
        });
        
        console.log(`✓ ${nomeColecao}: ${dados.length} registros`);
      } catch (error) {
        console.error(`Erro ao exportar ${nomeColecao}:`, error);
        tabelas.push({
          nome: nomeColecao.replace("_", " ").toUpperCase(),
          dados: [],
        });
      }
    }

    exportarVariasTabelas(tabelas, "backup_completo_creditflow");
    
  } catch (error) {
    console.error("Erro no backup completo:", error);
    toast.error("Erro ao gerar backup completo");
  }
}

/**
 * Exporta dados de uma coleção específica
 */
export async function exportarColecao(nomeColecao: string, nomeArquivo?: string) {
  toast.info(`Exportando ${nomeColecao}...`);

  try {
    const q = query(collection(db, nomeColecao));
    const snapshot = await getDocs(q);
    
    const dados = snapshot.docs.map(doc => {
      const data = doc.data();
      const dadosProcessados: any = { id: doc.id };
      
      Object.keys(data).forEach(key => {
        const valor = data[key];
        if (valor && typeof valor === "object" && valor.toDate) {
          dadosProcessados[key] = valor.toDate().toISOString();
        } else {
          dadosProcessados[key] = valor;
        }
      });
      
      return dadosProcessados;
    });

    if (dados.length === 0) {
      toast.warning(`Nenhum dado encontrado em ${nomeColecao}`);
      return;
    }

    exportarParaCSV(dados, nomeArquivo || nomeColecao);
    
  } catch (error) {
    console.error(`Erro ao exportar ${nomeColecao}:`, error);
    toast.error(`Erro ao exportar ${nomeColecao}`);
  }
}

/**
 * Exporta dados filtrados por período
 */
export async function exportarPorPeriodo(
  nomeColecao: string,
  campoData: string,
  dataInicio: Date,
  dataFim: Date
) {
  toast.info(`Exportando ${nomeColecao} do período...`);

  try {
    const q = query(collection(db, nomeColecao));
    const snapshot = await getDocs(q);
    
    const dados = snapshot.docs
      .map(doc => {
        const data = doc.data();
        const dadosProcessados: any = { id: doc.id };
        
        Object.keys(data).forEach(key => {
          const valor = data[key];
          if (valor && typeof valor === "object" && valor.toDate) {
            dadosProcessados[key] = valor.toDate().toISOString();
          } else {
            dadosProcessados[key] = valor;
          }
        });
        
        return dadosProcessados;
      })
      .filter(item => {
        const dataItem = new Date(item[campoData]);
        return dataItem >= dataInicio && dataItem <= dataFim;
      });

    if (dados.length === 0) {
      toast.warning("Nenhum dado encontrado no período selecionado");
      return;
    }

    const nomeArquivo = `${nomeColecao}_${dataInicio.toISOString().split('T')[0]}_a_${dataFim.toISOString().split('T')[0]}`;
    exportarParaCSV(dados, nomeArquivo);
    
  } catch (error) {
    console.error("Erro ao exportar por período:", error);
    toast.error("Erro ao exportar dados do período");
  }
}
