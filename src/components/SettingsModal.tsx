import React, { useState } from 'react';
import { ISettings } from '../types';
import { X, Sliders, DollarSign } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ISettings;
  onSaveSettings: (settings: ISettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [bankroll, setBankroll] = useState<string>(settings.initialBankroll.toString());
  const [currency, setCurrency] = useState<string>(settings.currency || 'EUR');
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(bankroll);
    if (isNaN(val) || val <= 0) {
      setError('El bankroll inicial debe ser un número mayor a cero.');
      return;
    }

    onSaveSettings({
      initialBankroll: val,
      currency,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-cyan-400" />
            <h3 className="text-lg font-bold text-slate-100">Configuración de Bankroll</h3>
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
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Capital Inicial de Apuestas (Bankroll Base)
            </label>
            <div className="relative">
              <input
                type="number"
                step="50"
                min="10"
                value={bankroll}
                onChange={(e) => setBankroll(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/90 pl-3 pr-10 py-2.5 text-sm text-slate-100 font-mono font-bold focus:border-cyan-500 focus:outline-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono">
                {currency}
              </span>
            </div>
            <p className="mt-1.5 text-[11px] text-slate-400">
              Monto inicial asignado para tu operativa. Utilizado como base para el cálculo del ROI (Return on Investment).
            </p>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Moneda Principal</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800/90 px-3 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none"
            >
              <option value="COP">Pesos Colombianos (COP - $)</option>
              <option value="USD">Dólares (USD - $)</option>
              <option value="EUR">Euros (EUR - €)</option>
              <option value="MXN">Pesos Mexicanos (MXN - $)</option>
              <option value="ARS">Pesos Argentinos (ARS - $)</option>
              <option value="GBP">Libras (GBP - £)</option>
            </select>
          </div>

          <div className="rounded-lg bg-slate-800/50 border border-slate-800 p-3 text-slate-400 text-[11px] space-y-1">
            <div className="font-semibold text-slate-300">Fórmulas aplicadas:</div>
            <div>• <strong className="text-slate-200">Balance Actual:</strong> Capital Inicial + Ganancias Apuestas - Gastos</div>
            <div>• <strong className="text-slate-200">ROI:</strong> (Beneficio Neto Global / Capital Inicial) × 100</div>
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
              className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 font-semibold text-white shadow-md transition-colors"
            >
              Guardar Configuración
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
