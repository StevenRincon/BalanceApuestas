import { IBet, IExpense, IStats, BetStatus } from '../types';

export function calculateNetProfit(amount: number, odds: number, status: BetStatus): number {
  if (status === 'ganada') {
    return Number((amount * (odds - 1)).toFixed(2));
  }
  if (status === 'perdida') {
    return -Number(amount.toFixed(2));
  }
  return 0; // nula o pendiente
}

export function calculateStats(
  bets: IBet[],
  expenses: IExpense[],
  initialBankroll: number
): IStats {
  const totalExpenses = expenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  const wonBets = bets.filter((b) => b.status === 'ganada');
  const lostBets = bets.filter((b) => b.status === 'perdida');
  const voidBets = bets.filter((b) => b.status === 'nula');
  const pendingBets = bets.filter((b) => b.status === 'pendiente');

  const wonCount = wonBets.length;
  const lostCount = lostBets.length;
  const voidCount = voidBets.length;
  const pendingCount = pendingBets.length;
  const totalBetsCount = bets.length;
  const resolvedBetsCount = wonCount + lostCount + voidCount;

  // Beneficio neto solo de apuestas
  const bettingProfitLoss = bets.reduce((acc, curr) => acc + (Number(curr.netProfit) || 0), 0);

  // Total apostado en apuestas resueltas (para cálculo de Yield financiero deportivo)
  const totalStaked = [...wonBets, ...lostBets].reduce(
    (acc, curr) => acc + (Number(curr.amount) || 0),
    0
  );

  // Beneficio neto global (descontando gastos de tipsters, software, etc.)
  const totalProfitLoss = bettingProfitLoss - totalExpenses;

  // Balance actual
  const currentBankroll = initialBankroll + totalProfitLoss;

  // Win Rate = Ganadas / (Ganadas + Perdidas) * 100
  const winRate =
    wonCount + lostCount > 0 ? (wonCount / (wonCount + lostCount)) * 100 : 0;

  // Yield = (Ganancia Neta / Total Apostado en apuestas resueltas) * 100
  const yieldVal = totalStaked > 0 ? (bettingProfitLoss / totalStaked) * 100 : 0;

  // ROI = (Beneficio Neto Global / Capital Inicial) * 100
  const roi = initialBankroll > 0 ? (totalProfitLoss / initialBankroll) * 100 : 0;

  // Cuota promedio ponderada o simple
  const resolvedBets = [...wonBets, ...lostBets, ...voidBets];
  const avgOdds =
    resolvedBets.length > 0
      ? resolvedBets.reduce((acc, b) => acc + (Number(b.odds) || 1), 0) / resolvedBets.length
      : 0;

  return {
    initialBankroll,
    currentBankroll,
    totalProfitLoss,
    bettingProfitLoss,
    totalExpenses,
    totalStaked,
    resolvedBetsCount,
    wonCount,
    lostCount,
    voidCount,
    pendingCount,
    totalBetsCount,
    winRate: Number(winRate.toFixed(2)),
    yield: Number(yieldVal.toFixed(2)),
    roi: Number(roi.toFixed(2)),
    avgOdds: Number(avgOdds.toFixed(2)),
  };
}

export function formatCurrency(amount: number, currency: string = 'COP'): string {
  const isNegative = amount < 0;
  const abs = Math.abs(amount);

  if (currency === 'COP') {
    // Formato estándar en Colombia: $1.250.000 COP
    const formatted = Math.round(abs).toLocaleString('es-CO');
    return `${isNegative ? '-' : ''}$${formatted} COP`;
  }

  const symbol = currency === 'USD' ? '$' : currency === 'GBP' ? '£' : '€';
  const formatted = abs.toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${isNegative ? '-' : ''}${symbol}${formatted}`;
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}
