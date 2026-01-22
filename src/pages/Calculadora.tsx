import React, { useState } from 'react';
import { simularEmprestimo, TipoEmprestimo } from '../lib/calculadora';

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
          <label className="block mb-1">Tipo de Empréstimo</label>
          <select value={tipo} onChange={e => setTipo(e.target.value as TipoEmprestimo)} className="input">
            {tipos.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block mb-1">Valor solicitado (R$)</label>
          <input type="number" min={100} step={100} value={valor} onChange={e => setValor(Number(e.target.value))} className="input" />
        </div>
        <div>
          <label className="block mb-1">Taxa de juros anual (%)</label>
          <input type="number" min={0} step={0.01} value={taxa} onChange={e => setTaxa(Number(e.target.value))} className="input" />
        </div>
        <div>
          <label className="block mb-1">Prazo (meses)</label>
          <input type="number" min={1} max={120} value={prazo} onChange={e => setPrazo(Number(e.target.value))} className="input" />
        </div>
        <button type="submit" className="btn btn-primary w-full">Simular</button>
      </form>
      {resultado && (
        <div className="mt-6 bg-zinc-50 dark:bg-zinc-800 rounded p-4">
          <h2 className="font-semibold mb-2">Resultado</h2>
          <div>Parcela: <b>R$ {resultado.valorParcela.toFixed(2)}</b></div>
          <div>Total pago: <b>R$ {resultado.valorTotal.toFixed(2)}</b></div>
          <div>Prazos: <b>{resultado.prazoMeses} meses</b></div>
          <div className="overflow-x-auto mt-4">
            <table className="min-w-full text-xs">
              <thead>
                <tr>
                  <th>Mês</th>
                  <th>Saldo Devedor</th>
                  <th>Juros</th>
                  <th>Amortização</th>
                  <th>Parcela</th>
                </tr>
              </thead>
              <tbody>
                {resultado.tabela.map((linha) => (
                  <tr key={linha.mes}>
                    <td>{linha.mes}</td>
                    <td>R$ {linha.saldoDevedor.toFixed(2)}</td>
                    <td>R$ {linha.juros.toFixed(2)}</td>
                    <td>R$ {linha.amortizacao.toFixed(2)}</td>
                    <td>R$ {linha.parcela.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* SPA fallback script removed as it is not valid in React JSX */}
    </div>
  );
}
