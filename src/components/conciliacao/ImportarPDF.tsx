import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Tesseract from "tesseract.js";
import * as pdfjsLib from "pdfjs-dist";
import { DadosExcel } from "./ImportarExcel";

// Configurar worker do PDF.js usando import do node_modules
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface ImportarPDFProps {
  onImport: (dados: DadosExcel[]) => void;
  tipo: "interno" | "fornecedor";
  apenasButton?: boolean;
}

export function ImportarPDF({ onImport, tipo, apenasButton = false }: ImportarPDFProps) {
  const [uploading, setUploading] = useState(false);
  const [progresso, setProgresso] = useState<string>("");

  const extrairTextoComOCR = async (imageData: ImageData): Promise<string> => {
    try {
      const result = await Tesseract.recognize(imageData, "por", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgresso(`Reconhecendo texto: ${Math.round(m.progress * 100)}%`);
          }
        },
      });
      return result.data.text;
    } catch (error) {
      console.error("Erro no OCR:", error);
      throw error;
    }
  };

  const processarPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let textoCompleto = "";

    setProgresso(`Processando ${pdf.numPages} páginas...`);

    for (let i = 1; i <= pdf.numPages; i++) {
      setProgresso(`Processando página ${i} de ${pdf.numPages}...`);
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 });
      
      // Criar canvas para renderizar a página
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) continue;

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({
        canvasContext: context,
        viewport: viewport,
        canvas: canvas,
      }).promise;

      // Extrair texto com OCR
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const texto = await extrairTextoComOCR(imageData);
      textoCompleto += texto + "\n\n";
    }

    return textoCompleto;
  };

  const parseTextoParaDados = (texto: string): DadosExcel[] => {
    const dados: DadosExcel[] = [];
    const linhas = texto.split("\n").filter(l => l.trim());

    // Padrões comuns para extrair informações
    const padraoContrato = /contrato[:\s#]*([\d\-/]+)/i;
    const padraoCPF = /(\d{3}\.?\d{3}\.?\d{3}-?\d{2})/;
    const padraoValor = /R\$?\s*(\d+(?:\.\d{3})*(?:,\d{2})?)/;
    const padraoData = /(\d{2}\/\d{2}\/\d{4})/;

    let registroAtual: Partial<DadosExcel> = {};
    let contemDados = false;

    for (let i = 0; i < linhas.length; i++) {
      const linha = linhas[i].trim();
      
      // Detectar número de contrato
      const matchContrato = linha.match(padraoContrato);
      if (matchContrato) {
        // Se já temos um registro, salvar antes de começar novo
        if (contemDados && registroAtual.contrato) {
          dados.push(registroAtual as DadosExcel);
        }
        registroAtual = { contrato: matchContrato[1] };
        contemDados = true;
      }

      // Detectar CPF
      const matchCPF = linha.match(padraoCPF);
      if (matchCPF && !registroAtual.cpfCliente) {
        registroAtual.cpfCliente = matchCPF[1];
      }

      // Detectar valores
      const matchValor = linha.match(padraoValor);
      if (matchValor) {
        const valor = parseFloat(matchValor[1].replace(/\./g, "").replace(",", "."));
        if (!registroAtual.valorProduto) {
          registroAtual.valorProduto = valor;
        } else if (!registroAtual.valorComissao) {
          registroAtual.valorComissao = valor;
        }
      }

      // Detectar datas
      const matchData = linha.match(padraoData);
      if (matchData && !registroAtual.dataVenda) {
        const [dia, mes, ano] = matchData[1].split("/");
        registroAtual.dataVenda = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
      }

      // Detectar nomes (heurística: linhas com 2-4 palavras maiúsculas podem ser nomes)
      if (/^[A-ZÁÀÃÂÉÊÍÓÔÕÚÇ\s]{10,}$/.test(linha)) {
        if (!registroAtual.cliente) {
          registroAtual.cliente = linha;
        } else if (!registroAtual.funcionario) {
          registroAtual.funcionario = linha;
        } else if (!registroAtual.fornecedor) {
          registroAtual.fornecedor = linha;
        }
      }
    }

    // Adicionar último registro
    if (contemDados && registroAtual.contrato) {
      dados.push(registroAtual as DadosExcel);
    }

    // Preencher campos obrigatórios vazios com valores padrão
    return dados.map(d => ({
      contrato: d.contrato || "SEM-CONTRATO",
      cliente: d.cliente || "Cliente não identificado",
      fornecedor: d.fornecedor || "Fornecedor não identificado",
      funcionario: d.funcionario || "Funcionário não identificado",
      produto: d.produto || "Produto não identificado",
      valorComissao: d.valorComissao || 0,
      valorProduto: d.valorProduto || 0,
      dataVenda: d.dataVenda || new Date(),
      cpfCliente: d.cpfCliente,
      cpfFuncionario: d.cpfFuncionario,
      observacoes: "Importado via OCR - Verificar dados",
    }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".pdf")) {
      toast.error("Por favor, selecione um arquivo PDF");
      return;
    }

    setUploading(true);
    setProgresso("Iniciando processamento...");

    try {
      // Processar PDF e extrair texto com OCR
      const textoExtraido = await processarPDF(file);
      
      if (!textoExtraido.trim()) {
        toast.error("Não foi possível extrair texto do PDF");
        return;
      }

      setProgresso("Analisando dados extraídos...");

      // Converter texto em dados estruturados
      const dados = parseTextoParaDados(textoExtraido);

      if (dados.length === 0) {
        toast.warning("Nenhum registro válido encontrado no PDF. Verifique o formato do arquivo.");
        return;
      }

      onImport(dados);
      toast.success(`${dados.length} registros extraídos do PDF com sucesso!`);
      
      // Resetar input
      event.target.value = "";
    } catch (error) {
      console.error("Erro ao processar PDF:", error);
      toast.error("Erro ao processar PDF. Verifique o arquivo e tente novamente.");
    } finally {
      setUploading(false);
      setProgresso("");
    }
  };

  const buttonContent = (
    <Button
      variant="outline"
      className="gap-2 w-full"
      disabled={uploading}
      asChild
    >
      <label className="cursor-pointer">
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileUpload}
          className="hidden"
          disabled={uploading}
        />
        {uploading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {progresso || "Processando..."}
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            Importar PDF (OCR)
          </>
        )}
      </label>
    </Button>
  );

  if (apenasButton) {
    return buttonContent;
  }

  return (
    <Card className="p-6">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
          <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1 space-y-4">
          <div>
            <h3 className="text-lg font-semibold">
              Importar {tipo === "interno" ? "Dados Internos" : "Dados do Fornecedor"} (PDF)
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Faça upload de um PDF contendo os dados de vendas. O sistema irá extrair automaticamente
              as informações usando tecnologia OCR (Reconhecimento Óptico de Caracteres).
            </p>
          </div>

          {buttonContent}

          {uploading && progresso && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <p className="text-sm text-blue-700 dark:text-blue-400">{progresso}</p>
              </div>
            </div>
          )}

          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg">
            <p className="text-sm text-amber-800 dark:text-amber-400">
              <strong>Dica:</strong> Para melhores resultados, certifique-se que o PDF contenha:
              números de contrato, CPFs, valores (R$), datas (DD/MM/AAAA) e nomes de clientes/funcionários.
              Após a importação, revise os dados extraídos.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
