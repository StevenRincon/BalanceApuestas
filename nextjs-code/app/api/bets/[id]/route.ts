import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Bet } from '@/models/Bet';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// DELETE /api/bets/[id] - Eliminar apuesta
export async function DELETE(request: Request, context: RouteContext) {
  try {
    await connectDB();
    const resolvedParams = await context.params;
    const { id } = resolvedParams;

    const deletedBet = await Bet.findByIdAndDelete(id);

    if (!deletedBet) {
      return NextResponse.json(
        { success: false, error: 'Apuesta no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Apuesta eliminada con éxito' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al eliminar apuesta';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// PATCH /api/bets/[id] - Actualizar estado o datos de una apuesta
export async function PATCH(request: Request, context: RouteContext) {
  try {
    await connectDB();
    const resolvedParams = await context.params;
    const { id } = resolvedParams;
    const body = await request.json();

    const existingBet = await Bet.findById(id);
    if (!existingBet) {
      return NextResponse.json(
        { success: false, error: 'Apuesta no encontrada' },
        { status: 404 }
      );
    }

    // Actualizar campos permitidos
    if (body.status !== undefined) existingBet.status = body.status;
    if (body.amount !== undefined) existingBet.amount = Number(body.amount);
    if (body.odds !== undefined) existingBet.odds = Number(body.odds);
    if (body.sport !== undefined) existingBet.sport = body.sport;
    if (body.event !== undefined) existingBet.event = body.event;
    if (body.market !== undefined) existingBet.market = body.market;
    if (body.notes !== undefined) existingBet.notes = body.notes;
    if (body.date !== undefined) existingBet.date = new Date(body.date);

    // Recalcular netProfit si cambió estado, amount o odds
    if (existingBet.status === 'ganada') {
      existingBet.netProfit = Number(
        (existingBet.amount * (existingBet.odds - 1)).toFixed(2)
      );
    } else if (existingBet.status === 'perdida') {
      existingBet.netProfit = -Number(existingBet.amount.toFixed(2));
    } else {
      existingBet.netProfit = 0;
    }

    await existingBet.save();

    return NextResponse.json({ success: true, data: existingBet });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al actualizar apuesta';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
