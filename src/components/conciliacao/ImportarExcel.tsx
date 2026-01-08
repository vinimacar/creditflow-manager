import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

export interface DadosExcel {
  contrato: string;
  cliente: string;
  fornecedor: string;
  funcionario: string;
  valorComissao: number;
  valorProduto: number;
  dataVenda: Date;
  dataPagamento?: Date;
  [key: string]: unknown;
}

interface ExcelRow {
  [key: string]: string | number | Date | undefined;
}

interface ImportarExcelProps {
  onImport: (dados: DadosExcel[]) => void;
  tipo: "interno" | "fornecedor";
}

export function ImportarExcel({ onImport, tipo }: ImportarExcelProps) {
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

      // Mapear colunas para o formato esperado
      const dadosFormatados: DadosExcel[] = jsonData.map((row: any) => {
        // Normalizar nomes de colunas (aceitar variações)
        const normalizar = (obj: any) => {
          const resultado: any = {};
          Object.keys(obj).forEach(key => {
            const keyLower = key.toLowerCase().trim();
            resultado[keyLower] = obj[key];
          });
          return resultado;
        };

        const rowNormalizada = normalizar(row);

        return {
          contrato: rowNormalizada.contrato || rowNormalizada.numero_contrato || rowNormalizada.numerocontrato || "",
          cliente: rowNormalizada.cliente || rowNormalizada.nome_cliente || rowNormalizada.nomecliente || "",
          fornecedor: rowNormalizada.fornecedor || rowNormalizada.banco || rowNormalizada.financeira || "",
          funcionario: rowNormalizada.funcionario || rowNormalizada.vendedor || rowNormalizada.agente || "",
          valorComissao: parseFloat(String(rowNormalizada.comissao || rowNormalizada.valor_comissao || rowNormalizada.valorcomissao || 0).replace(/[^\d.,]/g, "").replace(",", ".")) || 0,
          valorProduto: parseFloat(String(rowNormalizada.valor || rowNormalizada.valor_produto || rowNormalizada.valorproduto || 0).replace(/[^\d.,]/g, "").replace(",", ".")) || 0,
          dataVenda: rowNormalizada.data_venda || rowNormalizada.datavenda || rowNormalizada.data ? new Date(rowNormalizada.data_venda || rowNormalizada.datavenda || rowNormalizada.data) : new Date(),
          dataPagamento: rowNormalizada.data_pagamento || rowNormalizada.datapagamento ? new Date(rowNormalizada.data_pagamento || rowNormalizada.datapagamento) : undefined,
          ...row // Manter dados originais
        };
      });

      if (dadosFormatados.length === 0) {
        toast.error("Nenhum dado encontrado na planilha");
        return;
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

  return (
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
          variant={tipo === "interno" ? "default" : "outline"}
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
            {uploading ? "Importando..." : `Importar ${tipo === "interno" ? "Dados Internos" : "Relatório Fornecedor"}`}
          </span>
        </Button>
      </label>
    </div>
  );
}
