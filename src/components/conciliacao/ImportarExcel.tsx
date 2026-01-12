import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

export interface DadosExcel {
  contrato: string;
  cliente: string;
  cpfCliente?: string;
  fornecedor: string;
  funcionario: string;
  cpfFuncionario?: string;
  produto: string;
  prazo?: number;
  valorComissao: number;
  valorProduto: number;
  dataVenda: Date;
  dataPagamento?: Date;
  status?: string;
  observacoes?: string;
  [key: string]: unknown;
}

interface ExcelRow {
  [key: string]: string | number | Date | undefined;
}

interface ImportarExcelProps {
  onImport: (dados: DadosExcel[]) => void;
  tipo: "interno" | "fornecedor";
  apenasButton?: boolean;
}

export function ImportarExcel({ onImport, tipo, apenasButton = false }: ImportarExcelProps) {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      toast.error("Por favor, selecione um arquivo Excel (.xlsx ou .xls)");
      return;
    }

    setUploading(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      
      // Pega a primeira planilha
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      
      // Converte para JSON
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { 
        raw: false,
        dateNF: "dd/mm/yyyy"
      });

      // Debug: Mostrar colunas detectadas
      if (jsonData.length > 0) {
        const primeiraLinha = jsonData[0] as ExcelRow;
        const colunas = Object.keys(primeiraLinha);
        console.log("Colunas detectadas no Excel:", colunas);
        console.log("Primeira linha de dados:", primeiraLinha);
      }

      // Mapear colunas para o formato esperado
      const dadosFormatados: DadosExcel[] = jsonData.map((row: ExcelRow) => {
        // Normalizar nomes de colunas (aceitar variações)
        const normalizar = (obj: ExcelRow) => {
          const resultado: Record<string, unknown> = {};
          Object.keys(obj).forEach(key => {
            const keyLower = key.toLowerCase().trim()
              .replace(/[áàâã]/g, 'a')
              .replace(/[éèê]/g, 'e')
              .replace(/[íì]/g, 'i')
              .replace(/[óòôõ]/g, 'o')
              .replace(/[úù]/g, 'u')
              .replace(/[ç]/g, 'c')
              .replace(/\s+/g, '_'); // Substituir espaços por underscore
            resultado[keyLower] = obj[key];
          });
          return resultado;
        };

        const rowNormalizada = normalizar(row);
        
        // Tentar encontrar a coluna de comissão com múltiplas variações
        const valorComissaoStr = String(
          rowNormalizada.comissao || 
          rowNormalizada.comissão || 
          rowNormalizada.valor_comissao || 
          rowNormalizada.valorcomissao || 
          rowNormalizada.valor_da_comissao ||
          rowNormalizada.vlr_comissao ||
          rowNormalizada.vlrcomissao ||
          rowNormalizada.valor_pago ||
          rowNormalizada.valorpago ||
          rowNormalizada.vr_comissao ||
          rowNormalizada.vrcomissao ||
          rowNormalizada.comissao_paga ||
          rowNormalizada.comissaopaga ||
          rowNormalizada.pagamento ||
          rowNormalizada.valor_pagamento ||
          0
        );
        
        // Tentar encontrar a coluna de valor do produto com múltiplas variações
        const valorProdutoStr = String(
          rowNormalizada.valor || 
          rowNormalizada.valor_produto || 
          rowNormalizada.valorproduto ||
          rowNormalizada.valor_contrato ||
          rowNormalizada.valorcontrato ||
          rowNormalizada.vlr_produto ||
          rowNormalizada.vlrproduto ||
          rowNormalizada.valor_liberado ||
          rowNormalizada.valorliberado ||
          rowNormalizada.vr_contrato ||
          rowNormalizada.vrcontrato ||
          0
        );

        // Converter valores removendo formatação brasileira e símbolos
        const parseValor = (str: string): number => {
          if (!str) return 0;
          // Remove tudo exceto dígitos, vírgula e ponto
          const limpo = String(str).replace(/[^\d.,\-]/g, "");
          // Se tiver vírgula e ponto, assume formato brasileiro (1.234,56)
          if (limpo.includes('.') && limpo.includes(',')) {
            return parseFloat(limpo.replace(/\./g, "").replace(",", ".")) || 0;
          }
          // Se tiver apenas vírgula, assume formato brasileiro (1234,56)
          if (limpo.includes(',')) {
            return parseFloat(limpo.replace(",", ".")) || 0;
          }
          // Caso contrário, tenta converter direto
          return parseFloat(limpo) || 0;
        };

        return {
          contrato: String(rowNormalizada.contrato || rowNormalizada.numero_contrato || rowNormalizada.numerocontrato || rowNormalizada.num_contrato || rowNormalizada.nr_contrato || ""),
          cliente: String(rowNormalizada.cliente || rowNormalizada.nome_cliente || rowNormalizada.nomecliente || rowNormalizada.nome || ""),
          cpfCliente: String(rowNormalizada.cpf_cliente || rowNormalizada.cpfcliente || rowNormalizada.cpf || rowNormalizada.documento || ""),
          fornecedor: String(rowNormalizada.fornecedor || rowNormalizada.banco || rowNormalizada.financeira || rowNormalizada.instituicao || ""),
          funcionario: String(rowNormalizada.funcionario || rowNormalizada.vendedor || rowNormalizada.agente || rowNormalizada.corretor || ""),
          cpfFuncionario: String(rowNormalizada.cpf_funcionario || rowNormalizada.cpffuncionario || rowNormalizada.cpf_vendedor || ""),
          produto: String(rowNormalizada.produto || rowNormalizada.nome_produto || rowNormalizada.nomeproduto || rowNormalizada.tipo_produto || ""),
          prazo: parseInt(String(rowNormalizada.prazo || rowNormalizada.meses || rowNormalizada.parcelas || 0)) || undefined,
          valorComissao: parseValor(valorComissaoStr),
          valorProduto: parseValor(valorProdutoStr),
          dataVenda: rowNormalizada.data_venda || rowNormalizada.datavenda || rowNormalizada.data ? new Date(String(rowNormalizada.data_venda || rowNormalizada.datavenda || rowNormalizada.data)) : new Date(),
          dataPagamento: rowNormalizada.data_pagamento || rowNormalizada.datapagamento || rowNormalizada.dt_pagamento ? new Date(String(rowNormalizada.data_pagamento || rowNormalizada.datapagamento || rowNormalizada.dt_pagamento)) : undefined,
          status: String(rowNormalizada.status || rowNormalizada.situacao || ""),
          observacoes: String(rowNormalizada.observacoes || rowNormalizada.obs || rowNormalizada.observacao || ""),
          ...row // Manter dados originais
        };
      });

      if (dadosFormatados.length === 0) {
        toast.error("Nenhum dado encontrado na planilha");
        return;
      }

      // Verificar se muitos valores de comissão estão zerados
      const comissoesZeradas = dadosFormatados.filter(d => d.valorComissao === 0).length;
      const percentualZerado = (comissoesZeradas / dadosFormatados.length) * 100;
      
      // Log detalhado para debug
      console.log("=== IMPORT DEBUG ===");
      console.log("Total de registros:", dadosFormatados.length);
      console.log("Comissões zeradas:", comissoesZeradas, `(${percentualZerado.toFixed(1)}%)`);
      console.log("Primeiros 3 registros importados:", dadosFormatados.slice(0, 3));
      console.log("Valores de comissão detectados:", dadosFormatados.slice(0, 5).map(d => ({
        valorComissao: d.valorComissao,
        valorProduto: d.valorProduto,
        contrato: d.contrato
      })));
      
      if (percentualZerado > 80) {
        toast.warning(
          `Atenção: ${percentualZerado.toFixed(0)}% dos registros têm comissão zerada. Verifique se a coluna de comissão está correta no Excel.`,
          { duration: 8000 }
        );
        console.warn("Muitas comissões zeradas. Colunas disponíveis:", Object.keys(jsonData[0] || {}));
        console.warn("Primeira linha original do Excel:", jsonData[0]);
      }

      toast.success(`${dadosFormatados.length} registros importados com sucesso!`);
      onImport(dadosFormatados);
      
      // Limpar input
      event.target.value = "";
    } catch (error) {
      console.error("Erro ao processar arquivo:", error);
      toast.error("Erro ao processar o arquivo Excel");
    } finally {
      setUploading(false);
    }
  };

  const botaoUpload = (
    <div>
      <input
        type="file"
        id={`file-upload-${tipo}`}
        accept=".xlsx,.xls"
        onChange={handleFileUpload}
        className="hidden"
      />
      <label htmlFor={`file-upload-${tipo}`}>
        <Button
          type="button"
          variant={tipo === "interno" ? "outline" : "outline"}
          className="gap-2 w-full"
          disabled={uploading}
          asChild
        >
          <span>
            {uploading ? (
              <Upload className="w-4 h-4 animate-bounce" />
            ) : (
              <FileSpreadsheet className="w-4 h-4" />
            )}
            {uploading ? "Importando..." : `Importar Excel`}
          </span>
        </Button>
      </label>
    </div>
  );

  if (apenasButton) {
    return botaoUpload;
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">
              {tipo === "interno" ? "Dados Internos" : "Relatório Fornecedor"}
            </h3>
            <p className="text-sm text-muted-foreground">
              Importe uma planilha Excel
            </p>
          </div>
        </div>
        {botaoUpload}
      </div>
    </Card>
  );
}
