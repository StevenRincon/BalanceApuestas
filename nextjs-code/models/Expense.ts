import mongoose, { Schema, Document, Model } from 'mongoose';

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

export default Expense;
