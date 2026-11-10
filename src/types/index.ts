export type BetStatus = 'ganada' | 'perdida' | 'nula' | 'pendiente';

export interface IBet {
  _id?: string;
  id?: string;
  date: string;
  sport: string;
  event: string;
  market: string;
  amount: number;
  odds: number;
  status: BetStatus;
  netProfit: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IExpense {
  _id?: string;
  id?: string;
  date: string;
  concept: string;
  category: 'tipster' | 'software' | 'membresia' | 'herramientas' | 'otro';
  amount: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ISettings {
  initialBankroll: number;
  currency: string;
  updatedAt?: string;
}

export interface IStats {
  initialBankroll: number;
  currentBankroll: number;
  totalProfitLoss: number;
  bettingProfitLoss: number;
  totalExpenses: number;
  totalStaked: number;
  resolvedBetsCount: number;
  wonCount: number;
  lostCount: number;
  voidCount: number;
  pendingCount: number;
  totalBetsCount: number;
  winRate: number; // Won / (Won + Lost) * 100
  yield: number;   // Betting Profit / Total Staked * 100
  roi: number;     // Total ProfitLoss / Initial Bankroll * 100
  avgOdds: number;
}
