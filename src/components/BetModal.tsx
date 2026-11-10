import React, { useState } from 'react';
import { IBet, BetStatus } from '../types';
import { calculateNetProfit, formatCurrency } from '../utils/calculations';
import { X, TrendingUp } from 'lucide-react';

interface BetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveBet: (bet: Omit<IBet, 'id' | '_id'>) => void;
  currency: string;
}

const COMMON_SPORTS = [
  'Fútbol',
  'Baloncesto',
  'Tenis',
  'MMA / UFC',
  'Béisbol',
  'Fútbol Americano (NFL)',
  'Fórmula 1 / Motor',
  'Hockey (NHL)',
  'eSports',
  'Otro',
];

export const BetModal: React.FC<BetModalProps> = ({
  isOpen,
  onClose,
  onSaveBet,
  currency,
}) => {
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [sport, setSport] = useState<string>('Fútbol');
  const [customSport, setCustomSport] = useState<string>('');
  const [event, setEvent] = useState<string>('');
  const [market, setMarket] = useState<string>('');
  const [amount, setAmount] = useState<string>(currency === 'COP' ? '50000' : '50');
  const [odds, setOdds] = useState<string>('1.90');
  const [status, setStatus] = useState<BetStatus>('pendiente');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const numAmount = parseFloat(amount) || 0;
  const numOdds = parseFloat(odds) || 1;
  const potentialProfit = numAmount * (numOdds - 1);
  const potentialLoss = -numAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const resolvedSport = sport === 'Otro' ? customSport.trim() : sport;

    if (!resolvedSport) {
      setError('Por favor indica el deporte.');
      return;
    }
    if (!event.trim()) {
      setError('Por favor escribe el evento o partido (ej. Real Madrid vs Barcelona).');
      return;
    }
    if (!market.trim()) {
      setError('Por favor especifica el mercado (ej. Más de 2.5 goles).');
      return;
    }
    if (numAmount <= 0) {
      setError('El monto apostado debe ser mayor a 0.');
      return;
    }
    if (numOdds < 1.01) {
      setError('La cuota debe ser como mínimo 1.01.');
      return;
    }

    const netProfit = calculateNetProfit(numAmount, numOdds, status);

    onSaveBet({
      date,
      sport: resolvedSport,
      event: event.trim(),
      market: market.trim(),
      amount: numAmount,
      odds: numOdds,
      status,
      netProfit,
      notes: notes.trim(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-slate-100">Registrar Nueva Apuesta</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Fecha</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/90 px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Deporte</label>
              <select
                value={sport}
                onChange={(e) => setSport(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/90 px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
              >
                {COMMON_SPORTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {sport === 'Otro' && (
            <div>
              <label className="block text-slate-300 font-medium mb-1">Especificar Deporte</label>
              <input
                type="text"
                placeholder="Nombre del deporte..."
                value={customSport}
                onChange={(e) => setCustomSport(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/90 px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Evento / Partido
            </label>
            <input
              type="text"
              placeholder="Ej. Manchester City vs Real Madrid"
              value={event}
              onChange={(e) => setEvent(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800/90 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Mercado / Pronóstico
            </label>
            <input
              type="text"
              placeholder="Ej. Más de 2.5 Goles · Hándicap -1.5 · Gana Local"
              value={market}
              onChange={(e) => setMarket(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800/90 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Monto Apostado (Stake)
              </label>
              <input
                type="number"
                step={currency === 'COP' ? '5000' : '0.5'}
                min={currency === 'COP' ? '1000' : '0.1'}
                placeholder={currency === 'COP' ? '50000' : '50'}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/90 px-3 py-2 text-slate-100 font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Cuota Decimal (Odds)
              </label>
              <input
                type="number"
                step="0.01"
                min="1.01"
                placeholder="1.90"
                value={odds}
                onChange={(e) => setOdds(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/90 px-3 py-2 text-slate-100 font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Vista previa en tiempo real de rendimiento */}
          <div className="rounded-lg bg-slate-800/50 border border-slate-800 p-3 flex items-center justify-between font-mono text-xs">
            <div className="text-slate-400">
              <span>Si gana: </span>
              <span className="font-semibold text-emerald-400">
                +{formatCurrency(potentialProfit, currency)}
              </span>
            </div>
            <div className="text-slate-400">
              <span>Si pierde: </span>
              <span className="font-semibold text-rose-400">
                {formatCurrency(potentialLoss, currency)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Estado de la Apuesta</label>
            <div className="grid grid-cols-4 gap-2">
              {(['pendiente', 'ganada', 'perdida', 'nula'] as BetStatus[]).map((st) => (
                <button
                  type="button"
                  key={st}
                  onClick={() => setStatus(st)}
                  className={`py-2 px-2 rounded-lg capitalize font-medium text-center transition-all ${
                    status === st
                      ? st === 'ganada'
                        ? 'bg-emerald-600 text-white font-semibold'
                        : st === 'perdida'
                        ? 'bg-rose-600 text-white font-semibold'
                        : st === 'nula'
                        ? 'bg-slate-600 text-white font-semibold'
                        : 'bg-amber-600 text-white font-semibold'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Notas u Observaciones (Opcional)</label>
            <input
              type="text"
              placeholder="Ej. Tipster VIP, alineaciones confirmadas..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800/90 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-slate-400 hover:text-slate-200 font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-semibold text-white shadow-md transition-colors"
            >
              Guardar Apuesta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
