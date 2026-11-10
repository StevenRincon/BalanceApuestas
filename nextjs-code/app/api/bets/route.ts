import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Bet } from '@/models/Bet';

// GET /api/bets - Listar apuestas con filtros opcionales
export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const sport = searchParams.get('sport');

    const filter: Record<string, unknown> = {};
    if (status && status !== 'todas') {
      filter.status = status;
    }
    if (sport && sport !== 'todos') {
      filter.sport = sport;
    }

    const bets = await Bet.find(filter).sort({ date: -1, createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: bets });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al obtener apuestas';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/bets - Registrar una nueva apuesta
export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();

    const { date, sport, event, market, amount, odds, status, notes } = body;

    if (!sport || !event || !market || !amount || !odds) {
      return NextResponse.json(
        { success: false, error: 'Todos los campos principales son obligatorios' },
        { status: 400 }
      );
    }

    const numericAmount = Number(amount);
    const numericOdds = Number(odds);
    const betStatus = status || 'pendiente';

    // Cálculo explícito de ganancia neta según el estado
    let netProfit = 0;
    if (betStatus === 'ganada') {
      netProfit = Number((numericAmount * (numericOdds - 1)).toFixed(2));
    } else if (betStatus === 'perdida') {
      netProfit = -Number(numericAmount.toFixed(2));
    }

    const newBet = await Bet.create({
      date: date ? new Date(date) : new Date(),
      sport,
      event,
      market,
      amount: numericAmount,
      odds: numericOdds,
      status: betStatus,
      netProfit,
      notes: notes || '',
    });

    return NextResponse.json({ success: true, data: newBet }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al crear apuesta';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// DELETE /api/bets - Eliminación en lote (Bulk Delete) o por filtros
// Ejemplos de uso:
// - Body: { "ids": ["65e...", "65f..."] } -> Elimina las apuestas especificadas
// - Query: /api/bets?status=nula -> Elimina todas las apuestas nulas
// - Query: /api/bets?clearAll=true -> Elimina todo el historial
export async function DELETE(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    const clearAll = searchParams.get('clearAll') === 'true';

    // 1. Si se envía un cuerpo JSON con lista de IDs a eliminar
    let bodyIds: string[] = [];
    try {
      const body = await request.json();
      if (body && Array.isArray(body.ids)) {
        bodyIds = body.ids;
      }
    } catch {
      // Si la petición no tiene body JSON, se ignoran los IDs
    }

    if (bodyIds.length > 0) {
      const result = await Bet.deleteMany({ _id: { $in: bodyIds } });
      return NextResponse.json({
        success: true,
        message: `${result.deletedCount} apuestas eliminadas correctamente`,
        deletedCount: result.deletedCount,
      });
    }

    // 2. Si se solicita eliminar por estado (ej. ?status=nula o ?status=perdida)
    if (statusParam) {
      const result = await Bet.deleteMany({ status: statusParam });
      return NextResponse.json({
        success: true,
        message: `${result.deletedCount} apuestas con estado "${statusParam}" eliminadas`,
        deletedCount: result.deletedCount,
      });
    }

    // 3. Si se solicita limpiar todo el historial (?clearAll=true)
    if (clearAll) {
      const result = await Bet.deleteMany({});
      return NextResponse.json({
        success: true,
        message: `Historial de apuestas reiniciado (${result.deletedCount} eliminadas)`,
        deletedCount: result.deletedCount,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error:
          'Debes proporcionar un array de "ids" en el cuerpo de la petición, o el parámetro "?status=...", o "?clearAll=true". Para eliminar una sola apuesta usa DELETE /api/bets/[id].',
      },
      { status: 400 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al eliminar apuestas';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

