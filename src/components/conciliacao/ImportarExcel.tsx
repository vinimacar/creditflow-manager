import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, FileSpreadsheet, AlertCircle } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

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
  const [colunasSugeridas, setColunasSugeridas] = useState<string[]>([]);
  const [dadosTemporarios, setDadosTemporarios] = useState<any[]>([]);
  const [mostrarSeletor, setMostrarSeletor] = useState(false);
  const [colunaComissao, setColunaComissao] = useState<string>("");
  const [colunaValor, setColunaValor] = useState<string>("");

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
        
        // Analisar quais colunas têm valores numéricos
        const colunasNumericas: string[] = [];
        colunas.forEach(col => {
          const valor = primeiraLinha[col];
          const valorStr = String(valor).replace(/[^\d.,\-]/g, "");
          if (valorStr && !isNaN(parseFloat(valorStr))) {
            colunasNumericas.push(col);
          }
        });
        
        console.log("Colunas com valores numéricos:", colunasNumericas);
        setColunasSugeridas(colunasNumericas);
      }

      // Tentar mapeamento automático primeiro
      const tentarMapeamentoAutomatico = () => {
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

        return dadosFormatados;
      };

      const dadosFormatados = tentarMapeamentoAutomatico();

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
      
      if (percentualZerado > 80 && tipo === "fornecedor") {
        // Salvar dados temporários e mostrar seletor de colunas
        setDadosTemporarios(jsonData);
        setMostrarSeletor(true);
        toast.warning(
          `Detectamos que ${percentualZerado.toFixed(0)}% das comissões estão zeradas. Por favor, selecione manualmente a coluna correta.`,
          { duration: 10000 }
        );
        console.warn("Colunas disponíveis:", Object.keys(jsonData[0] || {}));
        console.warn("Primeira linha original:", jsonData[0]);
        setUploading(false);
        return; // Não importa ainda, aguarda seleção manual
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

  const processarComColunasSelecionadas = () => {
    if (!colunaComissao) {
      toast.error("Selecione a coluna de comissão");
      return;
    }

    const parseValor = (str: string): number => {
      if (!str) return 0;
      const limpo = String(str).replace(/[^\d.,\-]/g, "");
      if (limpo.includes('.') && limpo.includes(',')) {
        return parseFloat(limpo.replace(/\./g, "").replace(",", ".")) || 0;
      }
      if (limpo.includes(',')) {
        return parseFloat(limpo.replace(",", ".")) || 0;
      }
      return parseFloat(limpo) || 0;
    };

    const dadosFormatados: DadosExcel[] = dadosTemporarios.map((row: ExcelRow) => {
      const valorComissao = parseValor(String(row[colunaComissao] || 0));
      const valorProduto = colunaValor ? parseValor(String(row[colunaValor] || 0)) : 0;

      return {
        contrato: String(row.contrato || row.numero_contrato || row.numerocontrato || ""),
        cliente: String(row.cliente || row.nome_cliente || row.nomecliente || ""),
        cpfCliente: String(row.cpf_cliente || row.cpfcliente || row.cpf || ""),
        fornecedor: String(row.fornecedor || row.banco || row.financeira || ""),
        funcionario: String(row.funcionario || row.vendedor || row.agente || ""),
        cpfFuncionario: String(row.cpf_funcionario || row.cpffuncionario || ""),
        produto: String(row.produto || row.nome_produto || row.nomeproduto || ""),
        prazo: parseInt(String(row.prazo || row.meses || 0)) || undefined,
        valorComissao,
        valorProduto,
        dataVenda: new Date(),
        dataPagamento: undefined,
        status: "",
        observacoes: "",
        ...row
      };
    });

    console.log("Dados processados com colunas manuais:", dadosFormatados.slice(0, 3));
    toast.success(`${dadosFormatados.length} registros importados com sucesso!`);
    onImport(dadosFormatados);
    setMostrarSeletor(false);
    setDadosTemporarios([]);
    setColunaComissao("");
    setColunaValor("");
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

  return (
    <>
      {/* Dialog para seleção manual de colunas */}
      <Dialog open={mostrarSeletor} onOpenChange={setMostrarSeletor}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              Selecione as Colunas Corretas
            </DialogTitle>
            <DialogDescription>
              Não conseguimos detectar automaticamente a coluna de comissão no seu Excel. 
              Por favor, selecione manualmente qual coluna contém os valores de comissão paga pelo banco.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Coluna de Comissão Paga (Obrigatório) *</Label>
              <Select value={colunaComissao} onValueChange={setColunaComissao}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a coluna de comissão..." />
                </SelectTrigger>
                <SelectContent>
                  {colunasSugeridas.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col}
                      {dadosTemporarios[0] && (
                        <span className="text-xs text-muted-foreground ml-2">
                          (Ex: {String(dadosTemporarios[0][col]).substring(0, 20)})
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Coluna de Valor do Contrato (Opcional)</Label>
              <Select value={colunaValor} onValueChange={setColunaValor}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a coluna de valor..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhuma</SelectItem>
                  {colunasSugeridas.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col}
                      {dadosTemporarios[0] && (
                        <span className="text-xs text-muted-foreground ml-2">
                          (Ex: {String(dadosTemporarios[0][col]).substring(0, 20)})
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {dadosTemporarios[0] && colunaComissao && (
              <div className="bg-green-50 p-3 rounded border border-green-200">
                <p className="text-sm font-medium text-green-900 mb-2">Preview dos valores:</p>
                <div className="text-xs font-mono space-y-1">
                  {dadosTemporarios.slice(0, 3).map((row, idx) => (
                    <div key={idx}>
                      Linha {idx + 1}: R$ {String(row[colunaComissao])}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setMostrarSeletor(false);
                setDadosTemporarios([]);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={processarComColunasSelecionadas} disabled={!colunaComissao}>
              Importar com Colunas Selecionadas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Conteúdo original */}
      {apenasButton ? (
        botaoUpload
      ) : (
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
      )}
    </>
  );
}
