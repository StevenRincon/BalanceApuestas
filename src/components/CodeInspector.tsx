import React, { useState } from 'react';
import { Copy, Check, FileCode, Folder, Database, Server, Globe, FileText } from 'lucide-react';

interface CodeFile {
  path: string;
  name: string;
  category: 'config' | 'lib' | 'models' | 'api' | 'frontend';
  description: string;
  code: string;
}

const NEXTJS_FILES: CodeFile[] = [
  {
    path: 'lib/mongodb.ts',
    name: 'mongodb.ts',
    category: 'lib',
    description: 'Conexión singleton a MongoDB Mongoose optimizada para serverless en Vercel (reutiliza socket en warm lambdas).',
    code: `import mongoose from 'mongoose';

/**
 * Conexión singleton a MongoDB optimizada para entornos Serverless (Vercel + Next.js App Router).
 * En desarrollo y entornos serverless, los archivos pueden re-ejecutarse en cada invocación.
 * Para evitar saturar el pool de conexiones de MongoDB Atlas, cacheamos la conexión en el objeto global.
 */

declare global {
  // eslint-disable-next-line no-var
  var mongoose: {
    conn: typeof import('mongoose') | null;
    promise: Promise<typeof import('mongoose')> | null;
  };
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.warn(
    '⚠️ ADVERTENCIA: La variable de entorno MONGODB_URI no está definida. Configúrala en .env.local o en Vercel.'
  );
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (!MONGODB_URI) {
    throw new Error(
      'Por favor define la variable de entorno MONGODB_URI en tu archivo .env.local o en las variables de entorno de Vercel.'
    );
  }

  // Si ya existe una conexión activa, reutilízala inmediatamente
  if (cached.conn) {
    return cached.conn;
  }

  // Si no hay una promesa de conexión en curso, créala con opciones optimizadas para serverless
  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Desactivar buffer para que falle rápido si la conexión cae
      maxPoolSize: 10,       // Mantener un pool acotado para serverless
      serverSelectionTimeoutMS: 5000, // Timeout de 5s para evitar bloqueos
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;`,
  },
  {
    path: 'models/Bet.ts',
    name: 'Bet.ts',
    category: 'models',
    description: 'Esquema de Mongoose para Apuestas Deportivas con cálculo automático de ganancia neta en hook pre-save.',
    code: `import mongoose, { Schema, Document, Model } from 'mongoose';

export type BetStatus = 'ganada' | 'perdida' | 'nula' | 'pendiente';

export interface IBetDocument extends Document {
  date: Date;
  sport: string;
  event: string;
  market: string;
  amount: number;
  odds: number;
  status: BetStatus;
  netProfit: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BetSchema = new Schema<IBetDocument>(
  {
    date: {
      type: Date,
      default: Date.now,
      required: [true, 'La fecha es obligatoria'],
      index: true,
    },
    sport: {
      type: String,
      required: [true, 'El deporte es obligatorio'],
      trim: true,
      index: true,
    },
    event: {
      type: String,
      required: [true, 'El evento o partido es obligatorio'],
      trim: true,
    },
    market: {
      type: String,
      required: [true, 'El mercado o pronóstico es obligatorio'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'El monto apostado es obligatorio'],
      min: [0.01, 'El monto debe ser mayor a 0'],
    },
    odds: {
      type: Number,
      required: [true, 'La cuota (odds) es obligatoria'],
      min: [1.01, 'La cuota debe ser al menos 1.01'],
    },
    status: {
      type: String,
      enum: {
        values: ['ganada', 'perdida', 'nula', 'pendiente'],
        message: '{VALUE} no es un estado válido (ganada, perdida, nula, pendiente)',
      },
      default: 'pendiente',
      index: true,
    },
    netProfit: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Middleware para calcular automáticamente la ganancia neta antes de guardar
BetSchema.pre('save', function (next) {
  if (this.status === 'ganada') {
    this.netProfit = Number((this.amount * (this.odds - 1)).toFixed(2));
  } else if (this.status === 'perdida') {
    this.netProfit = -Number(this.amount.toFixed(2));
  } else {
    // nula o pendiente
    this.netProfit = 0;
  }
  next();
});

// Evitar sobreescribir el modelo al recompilar rutas en Next.js
export const Bet: Model<IBetDocument> =
  mongoose.models.Bet || mongoose.model<IBetDocument>('Bet', BetSchema);

export default Bet;`,
  },
  {
    path: 'models/Expense.ts',
    name: 'Expense.ts',
    category: 'models',
    description: 'Esquema de Gastos para compra de apuestas, membresías VIP de tipsters y software de cuotas.',
    code: `import mongoose, { Schema, Document, Model } from 'mongoose';

export type ExpenseCategory =
  | 'compra de apuestas'
  | 'tipster'
  | 'membresia'
  | 'herramientas'
  | 'software'
  | 'otro';

export interface IExpenseDocument extends Document {
  date: Date;
  concept: string;
  category: ExpenseCategory;
  amount: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpenseDocument>(
  {
    date: {
      type: Date,
      default: Date.now,
      required: [true, 'La fecha del gasto es obligatoria'],
      index: true,
    },
    concept: {
      type: String,
      required: [true, 'El concepto del gasto es obligatorio'],
      trim: true,
    },
    category: {
      type: String,
      default: 'compra de apuestas',
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'El monto del gasto es obligatorio'],
      min: [0.01, 'El monto debe ser mayor a 0'],
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const Expense: Model<IExpenseDocument> =
  mongoose.models.Expense || mongoose.model<IExpenseDocument>('Expense', ExpenseSchema);

export default Expense;`,
  },
  {
    path: 'models/Settings.ts',
    name: 'Settings.ts',
    category: 'models',
    description: 'Esquema de Configuración con Capital Inicial (Bankroll) y Moneda preferida.',
    code: `import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISettingsDocument extends Document {
  initialBankroll: number;
  currency: string;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettingsDocument>(
  {
    initialBankroll: {
      type: Number,
      required: [true, 'El capital inicial (bankroll) es obligatorio'],
      default: 1000,
      min: [0, 'El bankroll inicial no puede ser negativo'],
    },
    currency: {
      type: String,
      default: 'EUR',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Settings: Model<ISettingsDocument> =
  mongoose.models.Settings || mongoose.model<ISettingsDocument>('Settings', SettingsSchema);

export default Settings;`,
  },
  {
    path: 'app/api/bets/route.ts',
    name: 'bets/route.ts',
    category: 'api',
    description: 'Ruta API (GET y POST) para listar y registrar apuestas con filtros por deporte y estado.',
    code: `import { NextResponse } from 'next/server';
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
export async function DELETE(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    const clearAll = searchParams.get('clearAll') === 'true';

    // 1. Array de IDs en cuerpo JSON
    let bodyIds: string[] = [];
    try {
      const body = await request.json();
      if (body && Array.isArray(body.ids)) bodyIds = body.ids;
    } catch {}

    if (bodyIds.length > 0) {
      const result = await Bet.deleteMany({ _id: { $in: bodyIds } });
      return NextResponse.json({
        success: true,
        message: \`\${result.deletedCount} apuestas eliminadas\`,
        deletedCount: result.deletedCount,
      });
    }

    // 2. Por estado (?status=nula)
    if (statusParam) {
      const result = await Bet.deleteMany({ status: statusParam });
      return NextResponse.json({
        success: true,
        message: \`\${result.deletedCount} apuestas con estado "\${statusParam}" eliminadas\`,
        deletedCount: result.deletedCount,
      });
    }

    // 3. Limpiar todo (?clearAll=true)
    if (clearAll) {
      const result = await Bet.deleteMany({});
      return NextResponse.json({
        success: true,
        message: \`Historial reiniciado (\${result.deletedCount} eliminadas)\`,
        deletedCount: result.deletedCount,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Especifica "ids" en el cuerpo o "?status=..." o "?clearAll=true"' },
      { status: 400 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al eliminar apuestas';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}`,
  },
  {
    path: 'app/api/bets/[id]/route.ts',
    name: 'bets/[id]/route.ts',
    category: 'api',
    description: 'Ruta API para eliminar (DELETE) una apuesta individual por su ID o modificar su estado (PATCH).',
    code: `import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Bet } from '@/models/Bet';

interface RouteContext {
  params: Promise<{ id: string }> | { id: string };
}

// DELETE /api/bets/[id] - Eliminar apuesta individual
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
      return NextResponse.json({ success: false, error: 'Apuesta no encontrada' }, { status: 404 });
    }

    if (body.status !== undefined) existingBet.status = body.status;
    if (body.amount !== undefined) existingBet.amount = Number(body.amount);
    if (body.odds !== undefined) existingBet.odds = Number(body.odds);

    if (existingBet.status === 'ganada') {
      existingBet.netProfit = Number((existingBet.amount * (existingBet.odds - 1)).toFixed(2));
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
}`,
  },
  {
    path: 'app/api/expenses/route.ts',
    name: 'expenses/route.ts',
    category: 'api',
    description: 'Ruta API para registrar, listar y eliminar en lote o por categoría ("compra de apuestas", "tipster").',
    code: `import { NextResponse } from 'next/server';
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

// POST /api/expenses - Registrar un nuevo gasto o compra de apuesta
export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const { date, concept, category, amount, notes } = body;

    if (!concept || !amount) {
      return NextResponse.json({ success: false, error: 'Concepto y monto obligatorios' }, { status: 400 });
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

// DELETE /api/expenses - Eliminación en lote o por categoría (ej. compras de apuestas)
export async function DELETE(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const categoryParam = searchParams.get('category');
    const clearAll = searchParams.get('clearAll') === 'true';

    // 1. Por array de IDs en cuerpo JSON
    let bodyIds: string[] = [];
    try {
      const body = await request.json();
      if (body && Array.isArray(body.ids)) bodyIds = body.ids;
    } catch {}

    if (bodyIds.length > 0) {
      const result = await Expense.deleteMany({ _id: { $in: bodyIds } });
      return NextResponse.json({
        success: true,
        message: \`\${result.deletedCount} gastos eliminados\`,
        deletedCount: result.deletedCount,
      });
    }

    // 2. Por categoría (ej. ?category=compra de apuestas)
    if (categoryParam) {
      const result = await Expense.deleteMany({
        category: { $regex: new RegExp(\`^\${categoryParam}$\`, 'i') },
      });
      return NextResponse.json({
        success: true,
        message: \`\${result.deletedCount} registros de "\${categoryParam}" eliminados\`,
        deletedCount: result.deletedCount,
      });
    }

    // 3. Limpiar todos los gastos (?clearAll=true)
    if (clearAll) {
      const result = await Expense.deleteMany({});
      return NextResponse.json({
        success: true,
        message: \`Historial de gastos vaciado (\${result.deletedCount} registros)\`,
        deletedCount: result.deletedCount,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Envía "ids" en el cuerpo o "?category=compra de apuestas" o "?clearAll=true"' },
      { status: 400 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al eliminar gastos';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}`,
  },
  {
    path: 'app/api/expenses/[id]/route.ts',
    name: 'expenses/[id]/route.ts',
    category: 'api',
    description: 'Ruta API para eliminar (DELETE) un gasto o compra de apuesta individual por su ID.',
    code: `import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Expense } from '@/models/Expense';

interface RouteContext {
  params: Promise<{ id: string }> | { id: string };
}

// DELETE /api/expenses/[id] - Eliminar gasto individual
export async function DELETE(request: Request, context: RouteContext) {
  try {
    await connectDB();
    const resolvedParams = await context.params;
    const { id } = resolvedParams;

    const deletedExpense = await Expense.findByIdAndDelete(id);

    if (!deletedExpense) {
      return NextResponse.json({ success: false, error: 'Gasto no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Gasto o compra de apuesta eliminado con éxito' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al eliminar gasto';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}`,
  },
  {
    path: 'app/api/stats/route.ts',
    name: 'stats/route.ts',
    category: 'api',
    description: 'Ruta API con cálculo automático en tiempo real de Balance Total, Profit/Loss, ROI, Yield y Win Rate.',
    code: `import { NextResponse } from 'next/server';
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

    const initialBankroll = settingsDoc?.initialBankroll ?? 1000;
    const currency = settingsDoc?.currency ?? 'EUR';

    // 1. Total Gastos (compra de picks, suscripciones, etc.)
    const totalExpenses = expenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

    // 2. Conteo de apuestas por estado
    const wonBets = bets.filter((b) => b.status === 'ganada');
    const lostBets = bets.filter((b) => b.status === 'perdida');
    const voidBets = bets.filter((b) => b.status === 'nula');
    const pendingBets = bets.filter((b) => b.status === 'pendiente');

    const wonCount = wonBets.length;
    const lostCount = lostBets.length;
    const voidCount = voidBets.length;
    const pendingCount = pendingBets.length;
    const totalBets = bets.length;

    // 3. Beneficio neto de apuestas
    const bettingProfitLoss = bets.reduce((acc, curr) => acc + (Number(curr.netProfit) || 0), 0);

    // 4. Total apostado en apuestas resueltas con riesgo (para Yield)
    const totalStaked = [...wonBets, ...lostBets].reduce(
      (acc, curr) => acc + (Number(curr.amount) || 0),
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
}`,
  },
  {
    path: '.env.example',
    name: '.env.example',
    category: 'config',
    description: 'Variables de entorno necesarias para conectar MongoDB Atlas en local (.env.local) y en Vercel.',
    code: `# ========================================================
# VARIABLES DE ENTORNO PARA NEXT.JS + VERCEL + MONGODB
# ========================================================

# Cadena de conexión de MongoDB Atlas (obtenida en Atlas > Connect > Drivers)
# Ejemplo: mongodb+srv://usuario:password@cluster0.abcde.mongodb.net/bankroll_db?retryWrites=true&w=majority
MONGODB_URI="mongodb+srv://<USUARIO>:<PASSWORD>@<TU-CLUSTER>.mongodb.net/bankroll_db?retryWrites=true&w=majority"

# URL base de la aplicación
NEXT_PUBLIC_APP_URL="https://tu-dominio.vercel.app"`,
  },
];

export const CodeInspector: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<CodeFile>(NEXTJS_FILES[0]);
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCategoryIcon = (cat: CodeFile['category']) => {
    switch (cat) {
      case 'lib':
        return <Database className="h-4 w-4 text-emerald-400" />;
      case 'models':
        return <Server className="h-4 w-4 text-cyan-400" />;
      case 'api':
        return <Globe className="h-4 w-4 text-amber-400" />;
      case 'frontend':
        return <FileCode className="h-4 w-4 text-indigo-400" />;
      default:
        return <FileText className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 backdrop-blur-sm overflow-hidden">
      {/* Barra superior */}
      <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-slate-900/90">
        <div>
          <div className="flex items-center gap-2">
            <Folder className="h-4 w-4 text-emerald-400" />
            <h3 className="text-base font-bold text-slate-100">
              Arquitectura del Proyecto Next.js (App Router) + Mongoose
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Estructura modular lista para copiar, clonar y desplegar en Vercel con MongoDB Atlas
          </p>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white font-medium text-xs transition-colors shadow-sm self-start md:self-auto"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-white" />
              <span>¡Copiado al Portapapeles!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copiar {selectedFile.name}</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[540px]">
        {/* Selector de archivos (columna izquierda) */}
        <div className="lg:col-span-4 border-r border-slate-800 bg-slate-950/60 p-3 space-y-1">
          <div className="px-2 py-1 text-[11px] font-semibold uppercase text-slate-400 tracking-wider">
            Archivos del Proyecto Next.js
          </div>

          <div className="space-y-1">
            {NEXTJS_FILES.map((file) => {
              const isSelected = selectedFile.path === file.path;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs transition-colors ${
                    isSelected
                      ? 'bg-slate-800 text-white font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  {getCategoryIcon(file.category)}
                  <div className="truncate flex-1">
                    <div className="truncate font-mono">{file.path}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Resumen de estructura de carpetas */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 px-2">
            <span className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider block mb-2">
              Estructura de Carpetas
            </span>
            <pre className="text-[11px] font-mono text-slate-400 leading-relaxed overflow-x-auto bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/80">
{`app/
├── api/
│   ├── bets/
│   │   ├── route.ts
│   │   └── [id]/route.ts
│   ├── expenses/
│   │   ├── route.ts
│   │   └── [id]/route.ts
│   ├── settings/
│   │   └── route.ts
│   └── stats/
│       └── route.ts
├── page.tsx
└── layout.tsx
lib/
└── mongodb.ts
models/
├── Bet.ts
├── Expense.ts
└── Settings.ts
.env.local`}
            </pre>
          </div>
        </div>

        {/* Visor de código (columna derecha) */}
        <div className="lg:col-span-8 flex flex-col bg-slate-950/90">
          <div className="px-4 py-2.5 border-b border-slate-800 bg-slate-900/40 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono text-emerald-400 font-semibold">{selectedFile.path}</span>
            </div>
            <span className="text-slate-400 font-mono text-[11px]">
              {selectedFile.code.split('\n').length} líneas
            </span>
          </div>

          {/* Descripción del archivo */}
          <div className="px-4 py-2 bg-slate-900/20 text-xs text-slate-300 border-b border-slate-800/60 flex items-center gap-2">
            <span className="text-emerald-400 font-semibold shrink-0">Propósito:</span>
            <span>{selectedFile.description}</span>
          </div>

          {/* Editor de solo lectura con scroll */}
          <div className="flex-1 overflow-x-auto p-4 font-mono text-xs text-slate-300 leading-relaxed">
            <pre>
              <code>{selectedFile.code}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
