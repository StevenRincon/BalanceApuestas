import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Expense } from '@/models/Expense';

// GET /api/expenses - Listar todos los gastos
export async function GET() {
  try {
    await connectDB();
    const expenses = await Expense.find().sort({ date: -1, createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: expenses });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al obtener gastos';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/expenses - Registrar un nuevo gasto
export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();

    const { date, concept, category, amount, notes } = body;

    if (!concept || !amount) {
      return NextResponse.json(
        { success: false, error: 'El concepto y el monto son obligatorios' },
        { status: 400 }
      );
    }

    const newExpense = await Expense.create({
      date: date ? new Date(date) : new Date(),
      concept: concept.trim(),
      category: category || 'compra de apuestas',
      amount: Number(amount),
      notes: notes || '',
    });

    return NextResponse.json({ success: true, data: newExpense }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al registrar gasto';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// DELETE /api/expenses - Eliminación en lote o por categoría (ej. compras de apuestas o tipsters)
// Ejemplos de uso:
// - Body: { "ids": ["65e...", "65f..."] } -> Elimina los gastos seleccionados
// - Query: /api/expenses?category=compra de apuestas -> Elimina todas las compras de apuestas
// - Query: /api/expenses?category=tipster -> Elimina todos los gastos de tipsters
// - Query: /api/expenses?clearAll=true -> Elimina todos los gastos registrados
export async function DELETE(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const categoryParam = searchParams.get('category');
    const clearAll = searchParams.get('clearAll') === 'true';

    // 1. Si se envía un cuerpo JSON con lista de IDs a eliminar
    let bodyIds: string[] = [];
    try {
      const body = await request.json();
      if (body && Array.isArray(body.ids)) {
        bodyIds = body.ids;
      }
    } catch {
      // Ignorar si no hay cuerpo JSON
    }

    if (bodyIds.length > 0) {
      const result = await Expense.deleteMany({ _id: { $in: bodyIds } });
      return NextResponse.json({
        success: true,
        message: `${result.deletedCount} gastos/compras eliminados correctamente`,
        deletedCount: result.deletedCount,
      });
    }

    // 2. Si se solicita eliminar por categoría (ej. "compra de apuestas", "tipster", "software")
    if (categoryParam) {
      const result = await Expense.deleteMany({
        category: { $regex: new RegExp(`^${categoryParam}$`, 'i') },
      });
      return NextResponse.json({
        success: true,
        message: `${result.deletedCount} registros en la categoría "${categoryParam}" eliminados`,
        deletedCount: result.deletedCount,
      });
    }

    // 3. Si se solicita limpiar todos los gastos (?clearAll=true)
    if (clearAll) {
      const result = await Expense.deleteMany({});
      return NextResponse.json({
        success: true,
        message: `Todos los gastos han sido eliminados (${result.deletedCount} registros)`,
        deletedCount: result.deletedCount,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error:
          'Debes proporcionar un array de "ids" en el cuerpo de la petición, el parámetro "?category=compra de apuestas", o "?clearAll=true". Para eliminar un único gasto por ID usa DELETE /api/expenses/[id].',
      },
      { status: 400 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al eliminar gastos';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

