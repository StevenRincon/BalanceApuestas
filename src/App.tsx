import React, { useState, useEffect, useMemo } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Percent,
  Sliders,
  Plus,
  Receipt,
  Download,
  RotateCcw,
  Code2,
  Rocket,
  LayoutDashboard,
  CheckCircle2,
  Target,
} from 'lucide-react';
import { IBet, IExpense, ISettings, BetStatus } from './types';
import {
  initialBets,
  initialExpenses,
  initialSettings,
} from './data/initialData';
import {
  calculateStats,
  formatCurrency,
  formatPercent,
  calculateNetProfit,
} from './utils/calculations';
import { StatCard } from './components/StatCard';
import { BankrollChart } from './components/BankrollChart';
import { BetsTable } from './components/BetsTable';
import { ExpensesTable } from './components/ExpensesTable';
import { BetModal } from './components/BetModal';
import { ExpenseModal } from './components/ExpenseModal';
import { SettingsModal } from './components/SettingsModal';
import { CodeInspector } from './components/CodeInspector';
import { VercelGuide } from './components/VercelGuide';

type ActiveTab = 'dashboard' | 'code' | 'deploy';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Estado con persistencia en localStorage
  const [bets, setBets] = useState<IBet[]>(() => {
    try {
      const saved = localStorage.getItem('betvault_bets');
      return saved ? JSON.parse(saved) : initialBets;
    } catch {
      return initialBets;
    }
  });

  const [expenses, setExpenses] = useState<IExpense[]>(() => {
    try {
      const saved = localStorage.getItem('betvault_expenses');
      return saved ? JSON.parse(saved) : initialExpenses;
    } catch {
      return initialExpenses;
    }
  });

  const [settings, setSettings] = useState<ISettings>(() => {
    try {
      const saved = localStorage.getItem('betvault_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.currency) return parsed;
      }
      return initialSettings;
    } catch {
      return initialSettings;
    }
  });

  const handleQuickCurrencyChange = (newCurr: string) => {
    if (newCurr === settings.currency) return;
    if (newCurr === 'COP') {
      const newBankroll = settings.initialBankroll < 50000 ? 2000000 : settings.initialBankroll;
      setSettings({ initialBankroll: newBankroll, currency: 'COP' });
      // Si las apuestas actuales eran en valores pequeños (ej. 50 EUR), ajustar a valores estándar de COP
      if (bets.length > 0 && bets[0].amount < 1000) {
        setBets(initialBets);
        setExpenses(initialExpenses);
      }
    } else if (settings.currency === 'COP') {
      const newBankroll = settings.initialBankroll >= 50000 ? 2000 : settings.initialBankroll;
      setSettings({ initialBankroll: newBankroll, currency: newCurr });
    } else {
      setSettings((prev) => ({ ...prev, currency: newCurr }));
    }
  };

  // Modales
  const [isBetModalOpen, setIsBetModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Sincronizar con localStorage
  useEffect(() => {
    localStorage.setItem('betvault_bets', JSON.stringify(bets));
  }, [bets]);

  useEffect(() => {
    localStorage.setItem('betvault_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('betvault_settings', JSON.stringify(settings));
  }, [settings]);

  // Cálculos estadísticos en tiempo real
  const stats = useMemo(() => {
    return calculateStats(bets, expenses, settings.initialBankroll);
  }, [bets, expenses, settings.initialBankroll]);

  // Handlers para Apuestas
  const handleSaveBet = (newBetData: Omit<IBet, 'id' | '_id'>) => {
    const newBet: IBet = {
      ...newBetData,
      id: `bet-${Date.now()}`,
    };
    setBets((prev) => [newBet, ...prev]);
  };

  const handleDeleteBet = (id: string) => {
    setBets((prev) => prev.filter((b) => (b.id || b._id) !== id));
  };

  const handleDeleteMultipleBets = (ids: string[]) => {
    const idSet = new Set(ids);
    setBets((prev) => prev.filter((b) => !idSet.has(b.id || b._id || '')));
  };

  const handleUpdateBetStatus = (id: string, newStatus: BetStatus) => {
    setBets((prev) =>
      prev.map((bet) => {
        if ((bet.id || bet._id) === id) {
          const netProfit = calculateNetProfit(bet.amount, bet.odds, newStatus);
          return {
            ...bet,
            status: newStatus,
            netProfit,
          };
        }
        return bet;
      })
    );
  };

  // Handlers para Gastos
  const handleSaveExpense = (newExpenseData: Omit<IExpense, 'id' | '_id'>) => {
    const newExpense: IExpense = {
      ...newExpenseData,
      id: `exp-${Date.now()}`,
    };
    setExpenses((prev) => [newExpense, ...prev]);
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => (e.id || e._id) !== id));
  };

  const handleDeleteMultipleExpenses = (ids: string[]) => {
    const idSet = new Set(ids);
    setExpenses((prev) => prev.filter((e) => !idSet.has(e.id || e._id || '')));
  };

  const handleDeleteExpensesByCategory = (category: string) => {
    setExpenses((prev) =>
      prev.filter(
        (e) => !e.category.toLowerCase().includes(category.toLowerCase()) && e.category.toLowerCase() !== 'tipster'
      )
    );
  };

  // Handler para Configuración
  const handleSaveSettings = (newSettings: ISettings) => {
    setSettings(newSettings);
  };

  // Resetear a datos iniciales
  const handleResetData = () => {
    if (confirm('¿Restablecer datos de prueba iniciales?')) {
      setBets(initialBets);
      setExpenses(initialExpenses);
      setSettings(initialSettings);
    }
  };

  // Exportar a JSON
  const handleExportData = () => {
    const backup = {
      exportedAt: new Date().toISOString(),
      settings,
      stats,
      bets,
      expenses,
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `bankroll-backup-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar Contract: 3 Zones strictly separated */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-2 whitespace-nowrap shrink-0">
            <span className="text-lg font-extrabold tracking-tight text-white flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Wallet className="h-4 w-4" />
              </span>
              BetVault
            </span>
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">
              · Bankroll & Stats Manager
            </span>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === 'dashboard' ? 'text-emerald-400 font-semibold' : ''
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Panel de Control</span>
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === 'code' ? 'text-emerald-400 font-semibold' : ''
              }`}
            >
              <Code2 className="h-4 w-4" />
              <span>Código Next.js + MongoDB</span>
            </button>
            <button
              onClick={() => setActiveTab('deploy')}
              className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === 'deploy' ? 'text-emerald-400 font-semibold' : ''
              }`}
            >
              <Rocket className="h-4 w-4" />
              <span>Despliegue en Vercel</span>
            </button>
          </nav>

          {/* Zone 3: Currency Switcher & Actions */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Selector rápido de moneda */}
            <div className="flex items-center p-0.5 rounded-lg border border-slate-800 bg-slate-900 text-xs font-mono">
              {(['COP', 'USD', 'EUR'] as const).map((curr) => (
                <button
                  key={curr}
                  onClick={() => handleQuickCurrencyChange(curr)}
                  className={`px-2 py-1 rounded font-semibold text-[11px] transition-colors ${
                    settings.currency === curr
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title={`Cambiar moneda a ${curr}`}
                >
                  {curr}
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsSettingsModalOpen(true)}
              title="Configurar capital inicial y moneda"
              className="p-2 text-slate-400 hover:text-slate-200 border border-slate-800 rounded-lg hover:bg-slate-900 transition-colors"
            >
              <Sliders className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsBetModalOpen(true)}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Nueva Apuesta</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navegación móvil de pestañas */}
      <div className="md:hidden flex border-b border-slate-800 bg-slate-900/60 px-4 py-2 text-xs overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${
            activeTab === 'dashboard' ? 'bg-slate-800 text-emerald-400 font-semibold' : 'text-slate-400'
          }`}
        >
          Panel de Control
        </button>
        <button
          onClick={() => setActiveTab('code')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${
            activeTab === 'code' ? 'bg-slate-800 text-emerald-400 font-semibold' : 'text-slate-400'
          }`}
        >
          Código Next.js
        </button>
        <button
          onClick={() => setActiveTab('deploy')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${
            activeTab === 'deploy' ? 'bg-slate-800 text-emerald-400 font-semibold' : 'text-slate-400'
          }`}
        >
          Guía Vercel
        </button>
      </div>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 lg:py-8 space-y-6">
        {activeTab === 'dashboard' && (
          <>
            {/* Barra de Acciones y Resumen Rápido */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl border border-slate-800 bg-slate-900/50">
              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                <span>Capital Base: <strong className="text-slate-200">{formatCurrency(settings.initialBankroll, settings.currency)}</strong></span>
                <span aria-hidden="true">·</span>
                <span>Apuestas: <strong className="text-slate-200">{stats.totalBetsCount}</strong></span>
                <span aria-hidden="true">·</span>
                <span>Gastos deducidos: <strong className="text-rose-400">-{formatCurrency(stats.totalExpenses, settings.currency)}</strong></span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsExpenseModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600/90 hover:bg-rose-500 text-white transition-colors"
                >
                  <Receipt className="h-3.5 w-3.5" />
                  <span>Deducir Gasto</span>
                </button>
                <button
                  onClick={handleExportData}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Exportar JSON</span>
                </button>
                <button
                  onClick={handleResetData}
                  title="Restablecer datos de demostración"
                  className="p-1.5 text-slate-400 hover:text-slate-200 border border-slate-800 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* 5 KPIs Principales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <StatCard
                title="Balance Total"
                value={formatCurrency(stats.currentBankroll, settings.currency)}
                subtitle="Capital actual disponible"
                icon={Wallet}
                trend={stats.currentBankroll >= stats.initialBankroll ? 'positive' : 'negative'}
                badgeText={`Base: ${formatCurrency(stats.initialBankroll, settings.currency)}`}
              />

              <StatCard
                title="Profit / Loss Global"
                value={`${stats.totalProfitLoss >= 0 ? '+' : ''}${formatCurrency(
                  stats.totalProfitLoss,
                  settings.currency
                )}`}
                subtitle="Beneficio neto apuestas - gastos"
                icon={stats.totalProfitLoss >= 0 ? TrendingUp : TrendingDown}
                trend={stats.totalProfitLoss >= 0 ? 'positive' : 'negative'}
                badgeText={`Apuestas: ${formatCurrency(stats.bettingProfitLoss, settings.currency)}`}
              />

              <StatCard
                title="ROI"
                value={formatPercent(stats.roi)}
                subtitle="Retorno sobre bankroll inicial"
                icon={Target}
                trend={stats.roi >= 0 ? 'positive' : 'negative'}
                badgeText="(P/L ÷ Capital) × 100"
              />

              <StatCard
                title="Yield"
                value={formatPercent(stats.yield)}
                subtitle="Rendimiento por euro apostado"
                icon={Percent}
                trend={stats.yield >= 0 ? 'positive' : 'negative'}
                badgeText={`Staked: ${formatCurrency(stats.totalStaked, settings.currency)}`}
              />

              <StatCard
                title="Win Rate"
                value={formatPercent(stats.winRate)}
                subtitle="Efectividad en apuestas resueltas"
                icon={CheckCircle2}
                trend={stats.winRate >= 50 ? 'positive' : 'negative'}
                badgeText={`${stats.wonCount}G · ${stats.lostCount}P · ${stats.pendingCount}Pend`}
              />
            </div>

            {/* Gráfico de Evolución del Bankroll */}
            <BankrollChart
              bets={bets}
              expenses={expenses}
              initialBankroll={settings.initialBankroll}
              currency={settings.currency}
            />

            {/* Tabla de Apuestas */}
            <BetsTable
              bets={bets}
              currency={settings.currency}
              onDeleteBet={handleDeleteBet}
              onDeleteMultipleBets={handleDeleteMultipleBets}
              onUpdateStatus={handleUpdateBetStatus}
              onOpenBetModal={() => setIsBetModalOpen(true)}
            />

            {/* Tabla de Gastos de Apuestas */}
            <ExpensesTable
              expenses={expenses}
              currency={settings.currency}
              onDeleteExpense={handleDeleteExpense}
              onDeleteMultipleExpenses={handleDeleteMultipleExpenses}
              onDeleteByCategory={handleDeleteExpensesByCategory}
              onOpenExpenseModal={() => setIsExpenseModalOpen(true)}
            />
          </>
        )}

        {activeTab === 'code' && <CodeInspector />}

        {activeTab === 'deploy' && <VercelGuide />}
      </main>

      {/* Footer minimalista */}
      <footer className="border-t border-slate-900 bg-slate-950 px-6 py-6 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            BetVault · Sports Betting Bankroll Management · Next.js (App Router) + Mongoose
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <button
              onClick={() => setActiveTab('code')}
              className="hover:text-slate-200 transition-colors"
            >
              Explorar Código
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setActiveTab('deploy')}
              className="hover:text-slate-200 transition-colors"
            >
              Guía Vercel
            </button>
          </div>
        </div>
      </footer>

      {/* Modales de Interacción */}
      <BetModal
        isOpen={isBetModalOpen}
        onClose={() => setIsBetModalOpen(false)}
        onSaveBet={handleSaveBet}
        currency={settings.currency}
      />

      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSaveExpense={handleSaveExpense}
        currency={settings.currency}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
      />
    </div>
  );
}
