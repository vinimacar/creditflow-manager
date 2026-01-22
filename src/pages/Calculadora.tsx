import React, { useState } from 'react';
import { simularEmprestimo, TipoEmprestimo } from '../lib/calculadora';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';

const tipos: { label: string; value: TipoEmprestimo }[] = [
  { label: 'Consignado', value: 'consignado' },
  { label: 'Pessoal', value: 'pessoal' },
];

export default function CalculadoraPage() {
  const [tipo, setTipo] = useState<TipoEmprestimo>('consignado');
  const [valor, setValor] = useState(10000);
  const [taxa, setTaxa] = useState(18);
  const [prazo, setPrazo] = useState(24);
  type ResultadoEmprestimo = ReturnType<typeof simularEmprestimo> | null;
  const [resultado, setResultado] = useState<ResultadoEmprestimo>(null);

  function simular(e: React.FormEvent) {
    e.preventDefault();
    setResultado(simularEmprestimo(tipo, valor, taxa, prazo));
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Calculadora de Empréstimos</h1>
      <form onSubmit={simular} className="space-y-4 bg-white dark:bg-zinc-900 rounded shadow p-4">
        <div>
          <Label htmlFor="tipo">Tipo de Empréstimo</Label>
          <select
            id="tipo"
            value={tipo}
            onChange={e => setTipo(e.target.value as TipoEmprestimo)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {tipos.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <Label htmlFor="valor">Valor solicitado (R$)</Label>
          <Input type="number" min={100} step={100} id="valor" value={valor} onChange={e => setValor(Number(e.target.value))} />
        </div>
        <div>
          <Label htmlFor="taxa">Taxa de juros anual (%)</Label>
          <Input type="number" min={0} step={0.01} id="taxa" value={taxa} onChange={e => setTaxa(Number(e.target.value))} />
        </div>
        <div>
          <Label htmlFor="prazo">Prazo (meses)</Label>
          <Input type="number" min={1} max={120} id="prazo" value={prazo} onChange={e => setPrazo(Number(e.target.value))} />
        </div>
        <Button type="submit" className="w-full">Simular</Button>
      </form>
      {resultado && (
        <div className="mt-6 bg-zinc-50 dark:bg-zinc-800 rounded p-4">
          <h2 className="font-semibold mb-2">Resultado</h2>
          <div>Parcela: <b>R$ {resultado.valorParcela.toFixed(2)}</b></div>
          <div>Total pago: <b>R$ {resultado.valorTotal.toFixed(2)}</b></div>
          <div>Prazos: <b>{resultado.prazoMeses} meses</b></div>
          <div className="overflow-x-auto mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mês</TableHead>
                  <TableHead>Saldo Devedor</TableHead>
                  <TableHead>Juros</TableHead>
                  <TableHead>Amortização</TableHead>
                  <TableHead>Parcela</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resultado.tabela.map((linha) => (
                  <TableRow key={linha.mes}>
                    <TableCell>{linha.mes}</TableCell>
                    <TableCell>R$ {linha.saldoDevedor.toFixed(2)}</TableCell>
                    <TableCell>R$ {linha.juros.toFixed(2)}</TableCell>
                    <TableCell>R$ {linha.amortizacao.toFixed(2)}</TableCell>
                    <TableCell>R$ {linha.parcela.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
      {/* SPA fallback script removed as it is not valid in React JSX */}
    </div>
  );
}
