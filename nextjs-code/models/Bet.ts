import mongoose, { Schema, Document, Model } from 'mongoose';

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
BetSchema.pre('save', function (this: IBetDocument, next: () => void) {
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

export default Bet;
