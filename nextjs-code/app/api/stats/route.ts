import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Bet } from '@/models/Bet';
import { Expense } from '@/models/Expense';
import { Settings } from '@/models/Settings';

// GET /api/stats - Cálculo automático de KPIs en tiempo real
export async function GET() {
  try {
    await connectDB();

    // Consultas concurrentes optimizadas
    const [settingsDoc, bets, expenses] = await Promise.all([
      Settings.findOne().lean(),
      Bet.find().lean(),
      Expense.find().lean(),
    ]);

    const initialBankroll = settingsDoc?.initialBankroll ?? 2000000;
    const currency = settingsDoc?.currency ?? 'COP';

    // 1. Total Gastos (compra de picks, suscripciones, etc.)
    const totalExpenses = expenses.reduce((acc: number, curr: { amount?: number }) => acc + (Number(curr.amount) || 0), 0);

    // 2. Conteo de apuestas por estado
    const wonBets = bets.filter((b: { status?: string }) => b.status === 'ganada');
    const lostBets = bets.filter((b: { status?: string }) => b.status === 'perdida');
    const voidBets = bets.filter((b: { status?: string }) => b.status === 'nula');
    const pendingBets = bets.filter((b: { status?: string }) => b.status === 'pendiente');

    const wonCount = wonBets.length;
    const lostCount = lostBets.length;
    const voidCount = voidBets.length;
    const pendingCount = pendingBets.length;
    const totalBets = bets.length;

    // 3. Beneficio neto de apuestas
    const bettingProfitLoss = bets.reduce((acc: number, curr: { netProfit?: number }) => acc + (Number(curr.netProfit) || 0), 0);

    // 4. Total apostado en apuestas resueltas con riesgo (para Yield)
    const totalStaked = [...wonBets, ...lostBets].reduce(
      (acc: number, curr: { amount?: number }) => acc + (Number(curr.amount) || 0),
      0
    );

    // 5. Beneficio Neto Global (Apuestas - Gastos)
    const totalProfitLoss = bettingProfitLoss - totalExpenses;

    // 6. Balance Total Actual del Bankroll
    const currentBankroll = initialBankroll + totalProfitLoss;

    // 7. Win Rate (%) = Ganadas / (Ganadas + Perdidas) * 100
    const winRate =
      wonCount + lostCount > 0 ? (wonCount / (wonCount + lostCount)) * 100 : 0;

    // 8. Yield (%) = (Ganancia Neta / Total Apostado en resueltas) * 100
    const yieldRate = totalStaked > 0 ? (bettingProfitLoss / totalStaked) * 100 : 0;

    // 9. ROI (%) = (Beneficio Neto Global / Capital Inicial) * 100
    const roiRate = initialBankroll > 0 ? (totalProfitLoss / initialBankroll) * 100 : 0;

    // 10. Cuota promedio
    const resolvedBets = [...wonBets, ...lostBets, ...voidBets];
    const avgOdds =
      resolvedBets.length > 0
        ? resolvedBets.reduce((acc, b) => acc + (Number(b.odds) || 0), 0) / resolvedBets.length
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        currency,
        initialBankroll,
        currentBankroll: Number(currentBankroll.toFixed(2)),
        totalProfitLoss: Number(totalProfitLoss.toFixed(2)),
        bettingProfitLoss: Number(bettingProfitLoss.toFixed(2)),
        totalExpenses: Number(totalExpenses.toFixed(2)),
        totalStaked: Number(totalStaked.toFixed(2)),
        winRate: Number(winRate.toFixed(2)),
        yield: Number(yieldRate.toFixed(2)),
        roi: Number(roiRate.toFixed(2)),
        avgOdds: Number(avgOdds.toFixed(2)),
        counts: {
          total: totalBets,
          won: wonCount,
          lost: lostCount,
          void: voidCount,
          pending: pendingCount,
          resolved: wonCount + lostCount + voidCount,
        },
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al calcular estadísticas';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
