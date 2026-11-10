import React from 'react';
import { IExpense } from '../types';
import { formatCurrency } from '../utils/calculations';
import { Trash2, Plus, Receipt } from 'lucide-react';

interface ExpensesTableProps {
  expenses: IExpense[];
  currency: string;
  onDeleteExpense: (id: string) => void;
  onDeleteMultipleExpenses?: (ids: string[]) => void;
  onDeleteByCategory?: (category: string) => void;
  onOpenExpenseModal: () => void;
}

export const ExpensesTable: React.FC<ExpensesTableProps> = ({
  expenses,
  currency,
  onDeleteExpense,
  onDeleteMultipleExpenses,
  onDeleteByCategory,
  onOpenExpenseModal,
}) => {
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [filterCategory, setFilterCategory] = React.useState<string>('todas');

  const filteredExpenses = expenses.filter((e) => {
    if (filterCategory === 'todas') return true;
    return e.category.toLowerCase().includes(filterCategory.toLowerCase());
  });

  const totalExpenses = filteredExpenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredExpenses.length && filteredExpenses.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredExpenses.map((e) => (e._id || e.id || '')));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`¿Eliminar los ${selectedIds.length} gastos seleccionados?`)) {
      if (onDeleteMultipleExpenses) {
        onDeleteMultipleExpenses(selectedIds);
      } else {
        selectedIds.forEach((id) => onDeleteExpense(id));
      }
      setSelectedIds([]);
    }
  };

  const handleDeleteBetPurchases = () => {
    const betPurchases = expenses.filter(
      (e) => e.category.toLowerCase() === 'compra de apuestas' || e.category.toLowerCase() === 'tipster'
    );
    if (betPurchases.length === 0) {
      alert('No hay compras de apuestas ni tipsters registrados para eliminar.');
      return;
    }
    if (confirm(`¿Deseas eliminar todas las compras de apuestas y tipsters (${betPurchases.length} registros)?`)) {
      if (onDeleteByCategory) {
        onDeleteByCategory('compra de apuestas');
      } else if (onDeleteMultipleExpenses) {
        onDeleteMultipleExpenses(betPurchases.map((b) => b._id || b.id || ''));
      } else {
        betPurchases.forEach((p) => onDeleteExpense(p._id || p.id || ''));
      }
      setSelectedIds([]);
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 backdrop-blur-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-rose-400" />
            <h3 className="text-base font-semibold text-slate-100 tracking-tight">
              Gastos & Compra de Apuestas
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Deducción directa sobre el balance global (tipsters VIP, herramientas, membresías)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="text-right mr-2">
            <span className="text-[11px] text-slate-400 block">Total Deducido</span>
            <span className="text-sm font-mono font-bold text-rose-400 tabular-nums">
              -{formatCurrency(totalExpenses, currency)}
            </span>
          </div>

          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 rounded-lg bg-rose-600/90 hover:bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors whitespace-nowrap shrink-0"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Eliminar {selectedIds.length} seleccionados</span>
            </button>
          )}

          <button
            onClick={handleDeleteBetPurchases}
            className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 px-2.5 py-1.5 text-xs font-medium text-rose-300 transition-colors whitespace-nowrap shrink-0"
            title="Eliminar compras de picks o tipsters VIP"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Eliminar Compras de Apuestas</span>
          </button>

          <button
            onClick={onOpenExpenseModal}
            className="flex items-center gap-1.5 rounded-lg bg-rose-600/90 hover:bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Registrar Gasto</span>
          </button>
        </div>
      </div>

      {/* Filtro por categoría */}
      <div className="flex items-center gap-1 p-1 bg-slate-800/60 rounded-lg mb-4 overflow-x-auto text-xs w-fit">
        {[
          { key: 'todas', label: 'Todos los gastos' },
          { key: 'compra de apuestas', label: 'Compra de apuestas' },
          { key: 'tipster', label: 'Tipsters VIP' },
          { key: 'software', label: 'Software' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterCategory(tab.key)}
            className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors ${
              filterCategory === tab.key
                ? 'bg-slate-700 text-slate-100 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filteredExpenses.length === 0 ? (
        <div className="py-8 text-center border border-dashed border-slate-800 rounded-lg">
          <p className="text-xs text-slate-400">No hay gastos ni compras registradas en esta vista.</p>
          <button
            onClick={onOpenExpenseModal}
            className="mt-2 text-xs font-medium text-rose-400 hover:text-rose-300 underline underline-offset-4"
          >
            Añadir primer gasto
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[11px] font-medium tracking-wider">
                <th className="py-2.5 px-2 w-8 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredExpenses.length && filteredExpenses.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-700 bg-slate-800 text-rose-500 focus:ring-0 cursor-pointer"
                    title="Seleccionar todos"
                  />
                </th>
                <th className="py-2.5 px-3">Fecha</th>
                <th className="py-2.5 px-3">Concepto & Detalle</th>
                <th className="py-2.5 px-3">Categoría</th>
                <th className="py-2.5 px-3 text-right">Monto</th>
                <th className="py-2.5 px-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono tabular-nums">
              {filteredExpenses.map((exp) => {
                const expId = exp._id || exp.id || '';
                const isSelected = selectedIds.includes(expId);
                return (
                  <tr
                    key={expId}
                    className={`transition-colors group ${
                      isSelected ? 'bg-slate-800/60' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-2.5 px-2 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(expId)}
                        className="rounded border-slate-700 bg-slate-800 text-rose-500 focus:ring-0 cursor-pointer"
                      />
                    </td>

                    <td className="py-2.5 px-3 font-sans text-slate-300">
                      {exp.date}
                    </td>

                    <td className="py-2.5 px-3 font-sans">
                      <div className="text-slate-200 font-medium">{exp.concept}</div>
                      {exp.notes && (
                        <div className="text-[11px] text-slate-400">{exp.notes}</div>
                      )}
                    </td>

                    <td className="py-2.5 px-3 font-sans">
                      <span className="text-slate-400 text-xs capitalize">
                        {exp.category}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-right font-semibold text-rose-400">
                      -{formatCurrency(exp.amount, currency)}
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar el gasto "${exp.concept}"?`)) {
                            onDeleteExpense(expId);
                          }
                        }}
                        title="Eliminar gasto"
                        className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors inline-flex items-center justify-center"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
