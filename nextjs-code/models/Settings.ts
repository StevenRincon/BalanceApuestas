import mongoose, { Schema, Document, Model } from 'mongoose';

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
      default: 2000000,
      min: [0, 'El bankroll inicial no puede ser negativo'],
    },
    currency: {
      type: String,
      default: 'COP',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Settings: Model<ISettingsDocument> =
  mongoose.models.Settings || mongoose.model<ISettingsDocument>('Settings', SettingsSchema);

export default Settings;
