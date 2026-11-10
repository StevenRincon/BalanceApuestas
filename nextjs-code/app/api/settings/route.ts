import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Settings } from '@/models/Settings';

// GET /api/settings - Obtener configuración (capital inicial y moneda)
export async function GET() {
  try {
    await connectDB();
    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({
        initialBankroll: 2000000,
        currency: 'COP',
      });
    }

    return NextResponse.json({ success: true, data: settings });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al obtener configuración';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// PUT /api/settings - Actualizar capital inicial y moneda
export async function PUT(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const { initialBankroll, currency } = body;

    let settings = await Settings.findOne();

    if (!settings) {
      settings = new Settings();
    }

    if (initialBankroll !== undefined) {
      settings.initialBankroll = Number(initialBankroll);
    }
    if (currency !== undefined) {
      settings.currency = currency;
    }

    await settings.save();

    return NextResponse.json({ success: true, data: settings });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al actualizar configuración';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
