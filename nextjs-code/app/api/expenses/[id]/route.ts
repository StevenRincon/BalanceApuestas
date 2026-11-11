import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Expense } from '@/models/Expense';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// DELETE /api/expenses/[id] - Eliminar un gasto
export async function DELETE(request: Request, context: RouteContext) {
  try {
    await connectDB();
    const resolvedParams = await context.params;
    const { id } = resolvedParams;

    const deletedExpense = await Expense.findByIdAndDelete(id);

    if (!deletedExpense) {
      return NextResponse.json(
        { success: false, error: 'Gasto no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Gasto eliminado con éxito' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al eliminar gasto';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
