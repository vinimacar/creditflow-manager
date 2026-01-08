import { Card } from "@/components/ui/card";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
  type TooltipItem,
} from "chart.js";
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DadosGrafico {
  labels: string[];
  valores: number[];
  comparacao?: number[];
}

interface GraficoModernoProps {
  titulo: string;
  tipo: "linha" | "barra" | "pizza";
  dados: DadosGrafico;
  feedback?: {
    tipo: "positivo" | "negativo" | "neutro" | "alerta";
    mensagem: string;
  };
  formatarValor?: (valor: number) => string;
}

export function GraficoModerno({
  titulo,
  tipo,
  dados,
  feedback,
  formatarValor = (v) => `R$ ${v.toLocaleString("pt-BR")}`,
}: GraficoModernoProps) {
  const corPrincipal = "rgb(59, 130, 246)";
  const corSecundaria = "rgb(16, 185, 129)";
  const corFundo = "rgba(59, 130, 246, 0.1)";

  const configLinha = {
    labels: dados.labels,
    datasets: [
      {
        label: "Atual",
        data: dados.valores,
        borderColor: corPrincipal,
        backgroundColor: corFundo,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      ...(dados.comparacao
        ? [
            {
              label: "Período Anterior",
              data: dados.comparacao,
              borderColor: corSecundaria,
              backgroundColor: "rgba(16, 185, 129, 0.1)",
              fill: true,
              tension: 0.4,
              pointRadius: 4,
              pointHoverRadius: 6,
              borderDash: [5, 5],
            },
          ]
        : []),
    ],
  };

  const configBarra = {
    labels: dados.labels,
    datasets: [
      {
        label: "Valores",
        data: dados.valores,
        backgroundColor: corPrincipal,
        borderRadius: 8,
        barThickness: 40,
      },
    ],
  };

  const configPizza = {
    labels: dados.labels,
    datasets: [
      {
        data: dados.valores,
        backgroundColor: [
          "rgb(59, 130, 246)",
          "rgb(16, 185, 129)",
          "rgb(245, 158, 11)",
          "rgb(239, 68, 68)",
          "rgb(139, 92, 246)",
          "rgb(236, 72, 153)",
        ],
        borderWidth: 0,
      },
    ],
  };

  const opcoes: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: tipo !== "pizza",
        position: "top" as const,
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        titleFont: { size: 14 },
        bodyFont: { size: 13 },
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
        callbacks: {
          label: function (context: unknown) {
            const ctx = context as { dataset: { label?: string }; parsed: { y?: number } | number };
            let label = ctx.dataset.label || "";
            if (label) {
              label += ": ";
            }
            const valor = typeof ctx.parsed === 'number' ? ctx.parsed : ctx.parsed.y;
            if (valor !== null && valor !== undefined) {
              label += formatarValor(valor);
            }
            return label;
          },
        },
      },
    },
    scales:
      tipo !== "pizza"
        ? {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function (value: string | number) {
                  return formatarValor(Number(value));
                },
              },
              grid: {
                color: "rgba(0, 0, 0, 0.05)",
              },
            },
            x: {
              grid: {
                display: false,
              },
            },
          }
        : undefined,
  };

  const getFeedbackIcon = () => {
    switch (feedback?.tipo) {
      case "positivo":
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case "negativo":
        return <TrendingDown className="w-5 h-5 text-red-600" />;
      case "alerta":
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      default:
        return null;
    }
  };

  const getFeedbackVariant = () => {
    switch (feedback?.tipo) {
      case "negativo":
      case "alerta":
        return "destructive" as const;
      default:
        return "default" as const;
    }
  };

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-1">{titulo}</h3>
        {feedback && (
          <Alert variant={getFeedbackVariant()} className="mt-4">
            <div className="flex items-start gap-2">
              {getFeedbackIcon()}
              <div className="flex-1">
                <AlertTitle className="text-sm font-semibold mb-1">
                  {feedback.tipo === "positivo"
                    ? "Desempenho Positivo"
                    : feedback.tipo === "negativo"
                    ? "Atenção Necessária"
                    : feedback.tipo === "alerta"
                    ? "Alerta"
                    : "Informação"}
                </AlertTitle>
                <AlertDescription className="text-sm">
                  {feedback.mensagem}
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}
      </div>

      <div style={{ height: tipo === "pizza" ? "300px" : "350px" }}>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {tipo === "linha" && <Line data={configLinha} options={opcoes as any} />}
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {tipo === "barra" && <Bar data={configBarra} options={opcoes as any} />}
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {tipo === "pizza" && <Doughnut data={configPizza} options={opcoes as any} />}
      </div>
    </Card>
  );
}
