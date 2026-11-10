import mongoose from 'mongoose';

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

export default connectDB;
