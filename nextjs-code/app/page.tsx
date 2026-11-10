'use client';

import { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  Percent,
  Plus,
  Receipt,
  Trash2,
  Sliders,
  RefreshCw,
} from 'lucide-react';

interface Bet {
  _id: string;
  date: string;
  sport: string;
  event: string;
  market: string;
  amount: number;
  odds: number;
  status: 'ganada' | 'perdida' | 'nula' | 'pendiente';
  netProfit: number;
  notes?: string;
}

interface Expense {
  _id: string;
  date: string;
  concept: string;
  category: string;
  amount: number;
  notes?: string;
}

interface StatsData {
  currency: string;
  initialBankroll: number;
  currentBankroll: number;
  totalProfitLoss: number;
  bettingProfitLoss: number;
  totalExpenses: number;
  totalStaked: number;
  winRate: number;
  yield: number;
  roi: number;
  counts: {
    total: number;
    won: number;
    lost: number;
    void: number;
    pending: number;
    resolved: number;
  };
}

export default function BankrollDashboard() {
  const [bets, setBets] = useState<Bet[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Estados de formularios
  const [showBetModal, setShowBetModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Filtros
  const [statusFilter, setStatusFilter] = useState('todas');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [betsRes, expensesRes, statsRes] = await Promise.all([
        fetch('/api/bets').then((r) => r.json()),
        fetch('/api/expenses').then((r) => r.json()),
        fetch('/api/stats').then((r) => r.json()),
      ]);

      if (betsRes.success) setBets(betsRes.data);
      if (expensesRes.success) setExpenses(expensesRes.data);
      if (statsRes.success) setStats(statsRes.data);
    } catch (err) {
      console.error('Error cargando datos de MongoDB:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteBet = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar esta apuesta?')) return;
    try {
      const res = await fetch(`/api/bets/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (err) {
      console.error('Error al eliminar apuesta:', err);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este gasto?')) return;
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (err) {
      console.error('Error al eliminar gasto:', err);
    }
  };

  const handleUpdateBetStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/bets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (err) {
      console.error('Error actualizando estado:', err);
    }
  };

  const currencySymbol = stats?.currency === 'USD' ? '$' : '€';

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 lg:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Cabecera Principal */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">
              Bankroll Manager & Estadísticas
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Desplegado en Vercel con MongoDB Atlas · Cálculo automático en tiempo real
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowExpenseModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-rose-600/90 hover:bg-rose-500 text-white transition-colors"
            >
              <Receipt className="h-4 w-4" />
              <span>Registrar Gasto</span>
            </button>
            <button
              onClick={() => setShowBetModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Nueva Apuesta</span>
            </button>
            <button
              onClick={fetchData}
              title="Recargar datos"
              className="p-2 text-slate-400 hover:text-slate-200 border border-slate-800 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {/* Tarjetas de Métricas Principales (KPIs) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Balance Total */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
            <span className="text-xs font-medium uppercase text-slate-400">Balance Total</span>
            <div className="mt-2 text-2xl font-bold font-mono text-cyan-400">
              {currencySymbol}
              {stats?.currentBankroll?.toFixed(2) ?? '0.00'}
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              Capital base: {currencySymbol}{stats?.initialBankroll ?? 0}
            </p>
          </div>

          {/* Profit / Loss Total */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
            <span className="text-xs font-medium uppercase text-slate-400">Profit / Loss Global</span>
            <div
              className={`mt-2 text-2xl font-bold font-mono ${
                (stats?.totalProfitLoss ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {(stats?.totalProfitLoss ?? 0) >= 0 ? '+' : ''}
              {currencySymbol}
              {stats?.totalProfitLoss?.toFixed(2) ?? '0.00'}
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              Apuestas - Gastos (-{currencySymbol}{stats?.totalExpenses?.toFixed(2) ?? '0.00'})
            </p>
          </div>

          {/* ROI */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
            <span className="text-xs font-medium uppercase text-slate-400">ROI (%)</span>
            <div
              className={`mt-2 text-2xl font-bold font-mono ${
                (stats?.roi ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {(stats?.roi ?? 0) >= 0 ? '+' : ''}
              {stats?.roi?.toFixed(2) ?? '0.00'}%
            </div>
            <p className="mt-2 text-[11px] text-slate-500">Retorno s/ Capital Inicial</p>
          </div>

          {/* Yield */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
            <span className="text-xs font-medium uppercase text-slate-400">Yield (%)</span>
            <div
              className={`mt-2 text-2xl font-bold font-mono ${
                (stats?.yield ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {(stats?.yield ?? 0) >= 0 ? '+' : ''}
              {stats?.yield?.toFixed(2) ?? '0.00'}%
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              Apostado: {currencySymbol}{stats?.totalStaked?.toFixed(2) ?? '0.00'}
            </p>
          </div>

          {/* Win Rate */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
            <span className="text-xs font-medium uppercase text-slate-400">Win Rate</span>
            <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">
              {stats?.winRate?.toFixed(2) ?? '0.00'}%
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              {stats?.counts?.won ?? 0}G · {stats?.counts?.lost ?? 0}P · {stats?.counts?.pending ?? 0} Pend
            </p>
          </div>
        </div>

        {/* Tablas de Apuestas y Gastos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Listado de Apuestas (2 cols) */}
          <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Apuestas Registradas</h2>
              <div className="flex gap-1 text-xs">
                {['todas', 'ganada', 'perdida', 'pendiente'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded capitalize ${
                      statusFilter === st
                        ? 'bg-slate-700 text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 pb-2">
                    <th className="py-2">Fecha/Deporte</th>
                    <th className="py-2">Evento & Mercado</th>
                    <th className="py-2 text-right">Monto</th>
                    <th className="py-2 text-right">Cuota</th>
                    <th className="py-2 text-right">P/L</th>
                    <th className="py-2 text-center">Estado</th>
                    <th className="py-2 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {bets
                    .filter((b) => statusFilter === 'todas' || b.status === statusFilter)
                    .map((bet) => (
                      <tr key={bet._id} className="hover:bg-slate-800/30">
                        <td className="py-2.5 font-sans">
                          <div>{new Date(bet.date).toLocaleDateString()}</div>
                          <div className="text-[11px] text-slate-400">{bet.sport}</div>
                        </td>
                        <td className="py-2.5 font-sans">
                          <div className="font-medium text-slate-200">{bet.event}</div>
                          <div className="text-[11px] text-slate-400">{bet.market}</div>
                        </td>
                        <td className="py-2.5 text-right">{currencySymbol}{bet.amount}</td>
                        <td className="py-2.5 text-right">@{bet.odds.toFixed(2)}</td>
                        <td
                          className={`py-2.5 text-right font-semibold ${
                            bet.status === 'ganada'
                              ? 'text-emerald-400'
                              : bet.status === 'perdida'
                              ? 'text-rose-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {bet.status === 'pendiente'
                            ? 'Pendiente'
                            : `${bet.netProfit > 0 ? '+' : ''}${currencySymbol}${bet.netProfit.toFixed(2)}`}
                        </td>
                        <td className="py-2.5 text-center font-sans">
                          <select
                            value={bet.status}
                            onChange={(e) => handleUpdateBetStatus(bet._id, e.target.value)}
                            className="bg-slate-800 text-[11px] rounded px-2 py-1 border border-slate-700 text-slate-200"
                          >
                            <option value="ganada">Ganada</option>
                            <option value="perdida">Perdida</option>
                            <option value="nula">Nula</option>
                            <option value="pendiente">Pendiente</option>
                          </select>
                        </td>
                        <td className="py-2.5 text-right">
                          <button
                            onClick={() => handleDeleteBet(bet._id)}
                            className="text-slate-500 hover:text-rose-400 p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Listado de Gastos (1 col) */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Gastos & Picks</h2>
              <span className="text-xs font-mono text-rose-400 font-semibold">
                -{currencySymbol}{stats?.totalExpenses?.toFixed(2) ?? '0.00'}
              </span>
            </div>

            <div className="space-y-3">
              {expenses.map((exp) => (
                <div
                  key={exp._id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40 border border-slate-800"
                >
                  <div>
                    <div className="text-xs font-medium text-slate-200">{exp.concept}</div>
                    <div className="text-[11px] text-slate-400 capitalize">
                      {new Date(exp.date).toLocaleDateString()} · {exp.category}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-rose-400">
                      -{currencySymbol}{exp.amount.toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleDeleteExpense(exp._id)}
                      className="text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
