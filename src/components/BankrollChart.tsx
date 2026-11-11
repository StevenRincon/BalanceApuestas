import React, { useState, useMemo } from 'react';
import { IBet, IExpense } from '../types';
import { calculateNetProfit, formatCurrency } from '../utils/calculations';

interface BankrollChartProps {
  bets: IBet[];
  expenses: IExpense[];
  initialBankroll: number;
  currency: string;
}

interface Point {
  index: number;
  date: string;
  label: string;
  type: 'initial' | 'bet' | 'expense';
  delta: number;
  balance: number;
  x: number;
  y: number;
}

export const BankrollChart: React.FC<BankrollChartProps> = ({
  bets,
  expenses,
  initialBankroll,
  currency,
}) => {
  const [activePoint, setActivePoint] = useState<Point | null>(null);

  // Unificar y ordenar cronológicamente apuestas resueltas y gastos
  const timelinePoints = useMemo(() => {
    type EventItem = {
      date: string;
      label: string;
      type: 'bet' | 'expense';
      delta: number;
    };

    const items: EventItem[] = [];

    // Apuestas resueltas
    bets
      .filter((b) => b.status === 'ganada' || b.status === 'perdida' || b.status === 'nula')
      .forEach((b) => {
        items.push({
          date: b.date,
          label: `${b.sport}: ${b.event}`,
          type: 'bet',
          delta: calculateNetProfit(b.amount, b.odds, b.status),
        });
      });

    // Gastos
    expenses.forEach((e) => {
      items.push({
        date: e.date,
        label: `Gasto: ${e.concept}`,
        type: 'expense',
        delta: -e.amount,
      });
    });

    // Ordenar por fecha ascendente
    items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningBalance = initialBankroll;
    const history: {
      date: string;
      label: string;
      type: 'initial' | 'bet' | 'expense';
      delta: number;
      balance: number;
    }[] = [
      {
        date: items[0]?.date || new Date().toISOString().slice(0, 10),
        label: 'Capital Inicial (Bankroll)',
        type: 'initial',
        delta: 0,
        balance: initialBankroll,
      },
    ];

    items.forEach((item) => {
      runningBalance += item.delta;
      history.push({
        date: item.date,
        label: item.label,
        type: item.type,
        delta: item.delta,
        balance: Number(runningBalance.toFixed(2)),
      });
    });

    return history;
  }, [bets, expenses, initialBankroll]);

  // Dimensiones del gráfico SVG
  const width = 800;
  const height = 260;
  const paddingX = 40;
  const paddingY = 30;

  const balances = timelinePoints.map((p) => p.balance);
  const minBal = Math.min(...balances, initialBankroll * 0.9);
  const maxBal = Math.max(...balances, initialBankroll * 1.1);
  const range = maxBal - minBal || 1;

  // Mapeo a coordenadas SVG
  const points: Point[] = timelinePoints.map((p, i) => {
    const x =
      paddingX +
      (i / Math.max(timelinePoints.length - 1, 1)) * (width - paddingX * 2);
    const y =
      height -
      paddingY -
      ((p.balance - minBal) / range) * (height - paddingY * 2);
    return {
      ...p,
      index: i,
      x,
      y,
    };
  });

  const pathD = points.reduce((acc, curr, i) => {
    return i === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
  }, '');

  const areaD =
    points.length > 0
      ? `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${
          points[0].x
        } ${height - paddingY} Z`
      : '';

  const isNetProfit =
    (points[points.length - 1]?.balance ?? initialBankroll) >= initialBankroll;
  const lineColor = isNetProfit ? '#10B981' : '#F43F5E';
  const gradientId = isNetProfit ? 'bankrollGreen' : 'bankrollRed';

  return (
    <div className="relative rounded-xl border border-slate-800 bg-slate-900/70 p-5 backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-100 tracking-tight">
            Evolución del Bankroll
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Trayectoria acumulada incluyendo apuestas resueltas y deducción de gastos
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono tabular-nums">
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="inline-block h-2 w-2 rounded-full bg-slate-500" />
            <span>Inicio: {formatCurrency(initialBankroll, currency)}</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: lineColor }}
            />
            <span className={isNetProfit ? 'text-emerald-400' : 'text-rose-400'}>
              Actual:{' '}
              {formatCurrency(
                points[points.length - 1]?.balance ?? initialBankroll,
                currency
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Viewport SVG */}
      <div className="w-full overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-52 sm:h-64 overflow-visible"
        >
          <defs>
            <linearGradient id="bankrollGreen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="bankrollRed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#F43F5E" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Líneas horizontales de guía */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
            const yVal = height - paddingY - pct * (height - paddingY * 2);
            const val = minBal + pct * range;
            return (
              <g key={pct}>
                <line
                  x1={paddingX}
                  y1={yVal}
                  x2={width - paddingX}
                  y2={yVal}
                  stroke="#334155"
                  strokeDasharray="3 3"
                  strokeOpacity="0.5"
                  strokeWidth="1"
                />
                <text
                  x={paddingX - 6}
                  y={yVal + 3}
                  textAnchor="end"
                  className="text-[10px] fill-slate-500 font-mono tabular-nums"
                >
                  {formatCurrency(val, currency)}
                </text>
              </g>
            );
          })}

          {/* Área sombreada */}
          {areaD && (
            <path d={areaD} fill={`url(#${gradientId})`} className="transition-all duration-300" />
          )}

          {/* Línea principal */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke={lineColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-300"
            />
          )}

          {/* Puntos interactivos */}
          {points.map((p) => {
            const isHovered = activePoint?.index === p.index;
            const ptColor =
              p.type === 'initial'
                ? '#94A3B8'
                : p.delta > 0
                ? '#10B981'
                : p.delta < 0
                ? '#F43F5E'
                : '#CBD5E1';

            return (
              <g key={p.index} className="cursor-pointer">
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 6 : 4}
                  fill="#0F172A"
                  stroke={ptColor}
                  strokeWidth={isHovered ? 3 : 2}
                  onMouseEnter={() => setActivePoint(p)}
                  onMouseLeave={() => setActivePoint(null)}
                />
              </g>
            );
          })}

          {/* Línea vertical indicadora al hacer hover */}
          {activePoint && (
            <line
              x1={activePoint.x}
              y1={paddingY}
              x2={activePoint.x}
              y2={height - paddingY}
              stroke="#64748B"
              strokeDasharray="2 2"
              strokeWidth="1"
            />
          )}
        </svg>
      </div>

      {/* Tooltip contextual flotante */}
      {activePoint && (
        <div
          className="absolute z-20 pointer-events-none rounded-lg border border-slate-700 bg-slate-900/95 p-2.5 shadow-xl backdrop-blur-md text-xs"
          style={{
            left: `${Math.min(Math.max((activePoint.x / width) * 100, 15), 85)}%`,
            top: '40%',
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="font-semibold text-slate-200">{activePoint.label}</div>
          <div className="mt-1 flex items-center justify-between gap-4 text-slate-400 font-mono text-[11px]">
            <span>Fecha: {activePoint.date}</span>
            {activePoint.type !== 'initial' && (
              <span
                className={`font-semibold ${
                  activePoint.delta > 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {activePoint.delta > 0 ? '+' : ''}
                {formatCurrency(activePoint.delta, currency)}
              </span>
            )}
          </div>
          <div className="mt-1 pt-1 border-t border-slate-800 flex justify-between gap-3 text-slate-300 font-mono font-medium">
            <span>Balance:</span>
            <span>{formatCurrency(activePoint.balance, currency)}</span>
          </div>
        </div>
      )}
    </div>
  );
};
