import React, { useState } from 'react';
import { IBet, BetStatus } from '../types';
import { formatCurrency } from '../utils/calculations';
import { Trash2, Search, Filter, ArrowUpDown } from 'lucide-react';

interface BetsTableProps {
  bets: IBet[];
  currency: string;
  onDeleteBet: (id: string) => void;
  onDeleteMultipleBets?: (ids: string[]) => void;
  onUpdateStatus: (id: string, newStatus: BetStatus) => void;
  onOpenBetModal: () => void;
}

export const BetsTable: React.FC<BetsTableProps> = ({
  bets,
  currency,
  onDeleteBet,
  onDeleteMultipleBets,
  onUpdateStatus,
  onOpenBetModal,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('todas');
  const [sportFilter, setSportFilter] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Lista de deportes únicos
  const availableSports = Array.from(new Set(bets.map((b) => b.sport))).filter(Boolean);

  const filteredBets = bets.filter((bet) => {
    const matchesStatus = statusFilter === 'todas' || bet.status === statusFilter;
    const matchesSport = sportFilter === 'todos' || bet.sport === sportFilter;
    const matchesSearch =
      bet.event.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bet.market.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (bet.notes && bet.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesStatus && matchesSport && matchesSearch;
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredBets.length && filteredBets.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredBets.map((b) => (b._id || b.id || '')));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`¿Deseas eliminar las ${selectedIds.length} apuestas seleccionadas?`)) {
      if (onDeleteMultipleBets) {
        onDeleteMultipleBets(selectedIds);
      } else {
        selectedIds.forEach((id) => onDeleteBet(id));
      }
      setSelectedIds([]);
    }
  };

  const getStatusBadge = (status: BetStatus, id: string) => {
    const statusMap = {
      ganada: {
        label: 'Ganada',
        classes: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      },
      perdida: {
        label: 'Perdida',
        classes: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      },
      nula: {
        label: 'Nula',
        classes: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
      },
      pendiente: {
        label: 'Pendiente',
        classes: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      },
    };

    const current = statusMap[status] || statusMap.pendiente;

    return (
      <select
        value={status}
        onChange={(e) => onUpdateStatus(id, e.target.value as BetStatus)}
        className={`text-xs font-medium rounded px-2.5 py-1 border outline-none cursor-pointer bg-slate-900 transition-colors ${current.classes}`}
      >
        <option value="ganada" className="bg-slate-900 text-emerald-400">Ganada</option>
        <option value="perdida" className="bg-slate-900 text-rose-400">Perdida</option>
        <option value="nula" className="bg-slate-900 text-slate-400">Nula</option>
        <option value="pendiente" className="bg-slate-900 text-amber-400">Pendiente</option>
      </select>
    );
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 backdrop-blur-sm">
      {/* Cabecera y Controles de Filtro */}
      <div className="flex flex-col gap-4 mb-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-100 tracking-tight">
            Registro Histórico de Apuestas
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {filteredBets.length} {filteredBets.length === 1 ? 'apuesta' : 'apuestas'} encontradas
          </p>
        </div>

        {/* Buscador y selectores */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar evento, equipo o mercado..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-56 sm:w-64 rounded-lg border border-slate-700 bg-slate-800/80 pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Filtro por deporte */}
          {availableSports.length > 0 && (
            <select
              value={sportFilter}
              onChange={(e) => setSportFilter(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs text-slate-300 focus:border-emerald-500 focus:outline-none"
            >
              <option value="todos">Todos los deportes</option>
              {availableSports.map((sport) => (
                <option key={sport} value={sport}>
                  {sport}
                </option>
              ))}
            </select>
          )}

          {/* Botón de eliminación en lote si hay selección */}
          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 rounded-lg bg-rose-600/90 hover:bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors whitespace-nowrap shrink-0 animate-fade-in"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Eliminar {selectedIds.length} seleccionadas</span>
            </button>
          )}

          <button
            onClick={onOpenBetModal}
            className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 transition-colors whitespace-nowrap shrink-0"
          >
            + Nueva Apuesta
          </button>
        </div>
      </div>

      {/* Segmented control para estados (Ganada, Perdida, Nula, Pendiente) */}
      <div className="flex items-center gap-1 p-1 bg-slate-800/60 rounded-lg mb-4 overflow-x-auto text-xs w-fit">
        {[
          { key: 'todas', label: 'Todas' },
          { key: 'ganada', label: 'Ganadas' },
          { key: 'perdida', label: 'Perdidas' },
          { key: 'nula', label: 'Nulas' },
          { key: 'pendiente', label: 'Pendientes' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors ${
              statusFilter === tab.key
                ? 'bg-slate-700 text-slate-100 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tabla de Apuestas */}
      {filteredBets.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-slate-400">No se encontraron apuestas con los filtros seleccionados.</p>
          <button
            onClick={onOpenBetModal}
            className="mt-3 text-xs font-medium text-emerald-400 hover:text-emerald-300 underline underline-offset-4"
          >
            Registrar una nueva apuesta ahora
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[11px] font-medium tracking-wider">
                <th className="py-3 px-2 w-8 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredBets.length && filteredBets.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-0 cursor-pointer"
                    title="Seleccionar todas"
                  />
                </th>
                <th className="py-3 px-3">Fecha · Deporte</th>
                <th className="py-3 px-3">Evento & Mercado</th>
                <th className="py-3 px-3 text-right">Monto</th>
                <th className="py-3 px-3 text-right">Cuota</th>
                <th className="py-3 px-3 text-right">P/L Neto</th>
                <th className="py-3 px-3 text-center">Estado</th>
                <th className="py-3 px-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono tabular-nums">
              {filteredBets.map((bet) => {
                const betId = bet._id || bet.id || '';
                const isSelected = selectedIds.includes(betId);
                const isWon = bet.status === 'ganada';
                const isLost = bet.status === 'perdida';
                const isVoid = bet.status === 'nula';

                return (
                  <tr
                    key={betId}
                    className={`transition-colors group ${
                      isSelected ? 'bg-slate-800/60' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-3 px-2 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(betId)}
                        className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-0 cursor-pointer"
                      />
                    </td>

                    <td className="py-3 px-3 font-sans">
                      <div className="text-slate-200 font-medium">{bet.date}</div>
                      <div className="text-[11px] text-slate-400">{bet.sport}</div>
                    </td>

                    <td className="py-3 px-3 font-sans">
                      <div className="text-slate-200 font-medium">{bet.event}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-xs">
                        {bet.market}
                        {bet.notes && <span className="italic ml-2 text-slate-500">({bet.notes})</span>}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right text-slate-300">
                      {formatCurrency(bet.amount, currency)}
                    </td>

                    <td className="py-3 px-3 text-right font-semibold text-slate-200">
                      @{bet.odds.toFixed(2)}
                    </td>

                    <td
                      className={`py-3 px-3 text-right font-semibold ${
                        isWon
                          ? 'text-emerald-400'
                          : isLost
                          ? 'text-rose-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {bet.status === 'pendiente'
                        ? 'En juego'
                        : `${bet.netProfit > 0 ? '+' : ''}${formatCurrency(
                            bet.netProfit,
                            currency
                          )}`}
                    </td>

                    <td className="py-3 px-3 text-center font-sans">
                      {getStatusBadge(bet.status, betId)}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar la apuesta de "${bet.event}"?`)) {
                            onDeleteBet(betId);
                          }
                        }}
                        title="Eliminar apuesta"
                        className="text-slate-500 hover:text-rose-400 p-1.5 rounded transition-colors inline-flex items-center justify-center"
                      >
                        <Trash2 className="h-4 w-4" />
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
