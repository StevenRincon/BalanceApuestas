import React, { useState } from 'react';
import { IExpense } from '../types';
import { X, Receipt } from 'lucide-react';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveExpense: (expense: Omit<IExpense, 'id' | '_id'>) => void;
  currency: string;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSaveExpense,
  currency,
}) => {
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [concept, setConcept] = useState<string>('');
  const [category, setCategory] = useState<IExpense['category']>('tipster');
  const [amount, setAmount] = useState<string>(currency === 'COP' ? '60000' : '30');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const numAmount = parseFloat(amount) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!concept.trim()) {
      setError('Por favor indica el concepto del gasto (ej. Suscripción Tipster Pro).');
      return;
    }
    if (numAmount <= 0) {
      setError('El monto del gasto debe ser mayor a 0.');
      return;
    }

    onSaveExpense({
      date,
      concept: concept.trim(),
      category,
      amount: numAmount,
      notes: notes.trim(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-rose-400" />
            <h3 className="text-lg font-bold text-slate-100">Registrar Gasto de Apuestas</h3>
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
            <label className="block text-slate-300 font-medium mb-1">Concepto del Gasto</label>
            <input
              type="text"
              placeholder="Ej. Suscripción VIP Tipster, Software Surebets..."
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800/90 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-rose-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Categoría</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as IExpense['category'])}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/90 px-3 py-2 text-slate-100 focus:border-rose-500 focus:outline-none capitalize"
              >
                <option value="tipster">Tipster / Canal VIP</option>
                <option value="software">Software / Bots</option>
                <option value="membresia">Membresía</option>
                <option value="herramientas">Herramientas</option>
                <option value="otro">Otro gasto</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Fecha</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/90 px-3 py-2 text-slate-100 focus:border-rose-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Monto del Gasto ({currency})
            </label>
            <input
              type="number"
              step={currency === 'COP' ? '5000' : '1'}
              min={currency === 'COP' ? '1000' : '0.1'}
              placeholder={currency === 'COP' ? '60000' : '30'}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800/90 px-3 py-2 text-slate-100 font-mono focus:border-rose-500 focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Este valor se restará directamente del balance total del bankroll y del ROI.
            </p>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Notas / Factura (Opcional)</label>
            <input
              type="text"
              placeholder="Ej. Plan trimestral con 20% de descuento"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800/90 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-rose-500 focus:outline-none"
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
              className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 font-semibold text-white shadow-md transition-colors"
            >
              Deducir Gasto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
