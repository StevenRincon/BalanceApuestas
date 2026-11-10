import React, { useState } from 'react';
import {
  ExternalLink,
  CheckCircle2,
  Copy,
  Check,
  Server,
  Cloud,
  Terminal,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

export const VercelGuide: React.FC = () => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const steps = [
    {
      number: '01',
      title: 'Configurar MongoDB Atlas (Base de Datos en la Nube)',
      description:
        'Crea un clúster gratuito M0 en MongoDB Atlas y obtén tu cadena de conexión.',
      icon: Cloud,
      tips: [
        'Accede a mongodb.com/cloud/atlas y crea una cuenta gratuita.',
        'Crea una organización y un clúster compartido gratuito (M0 Sandbox).',
        'En "Database Access", crea un usuario (ej. app_user) y guarda su contraseña.',
        'En "Network Access", añade IP: 0.0.0.0/0 (permite acceso desde las IPs dinámicas serverless de Vercel).',
        'En tu clúster haz clic en "Connect" → "Drivers" (Node.js) y copia la URI generada.',
      ],
      codeSnippet: `mongodb+srv://<USUARIO>:<PASSWORD>@<TU-CLUSTER>.mongodb.net/bankroll_db?retryWrites=true&w=majority`,
    },
    {
      number: '02',
      title: 'Subir el Código a GitHub',
      description: 'Inicializa tu repositorio Git y haz push a tu cuenta de GitHub.',
      icon: Terminal,
      tips: [
        'Asegúrate de que .env.local esté en tu .gitignore para no exponer tu contraseña.',
        'Sube el proyecto a tu repositorio personal o de organización.',
      ],
      codeSnippet: `git init
git add .
git commit -m "feat: Bankroll Manager con Next.js y MongoDB"
git branch -M main
git remote add origin https://github.com/tu-usuario/bankroll-manager.git
git push -u origin main`,
    },
    {
      number: '03',
      title: 'Importar en Vercel',
      description:
        'Conecta tu cuenta de Vercel con GitHub e importa el proyecto con un solo clic.',
      icon: Server,
      tips: [
        'Inicia sesión en vercel.com con tu cuenta de GitHub.',
        'Haz clic en "Add New..." → "Project".',
        'Selecciona el repositorio bankroll-manager y presiona "Import".',
        'Next.js se autodetecta automáticamente como Framework Preset.',
      ],
      codeSnippet: null,
    },
    {
      number: '04',
      title: 'Añadir Variable de Entorno MONGODB_URI',
      description:
        'Pega la cadena de conexión de MongoDB en la configuración del proyecto en Vercel.',
      icon: ShieldCheck,
      tips: [
        'En la pantalla de configuración antes del deploy, despliega "Environment Variables".',
        'Nombre de la clave: MONGODB_URI',
        'Valor: Tu URI completa con tu contraseña real reemplazada.',
        'Aplica para los entornos: Production, Preview y Development.',
      ],
      codeSnippet: `Key:   MONGODB_URI
Value: mongodb+srv://usuario:tuPasswordReal@cluster0.abcde.mongodb.net/bankroll_db?retryWrites=true&w=majority`,
    },
    {
      number: '05',
      title: 'Desplegar y Verificar',
      description:
        'Presiona "Deploy". En menos de 45 segundos tendrás tu app lista en producción con SSL.',
      icon: CheckCircle2,
      tips: [
        'Vercel compilará la aplicación y creará las funciones Serverless para /api/bets, /api/expenses y /api/stats.',
        'La utilidad singleton (lib/mongodb.ts) evitará saturar conexiones en las lambdas.',
        'Tu app estará disponible en tu-proyecto.vercel.app con soporte para dominios personalizados gratuitos.',
      ],
      codeSnippet: `npm run build && next start`,
    },
  ];

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 backdrop-blur-sm space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-cyan-400" />
            <h3 className="text-lg font-bold text-slate-100">
              Guía Paso a Paso: Despliegue en Vercel & Conexión MongoDB
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Instrucciones para poner en producción tu aplicación de Bankroll en minutos sin costes de infraestructura
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://vercel.com/new"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-white text-slate-950 transition-colors shadow-sm"
          >
            <span>Ir a Vercel</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <a
            href="https://www.mongodb.com/cloud/atlas/register"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm"
          >
            <span>Crear MongoDB Atlas</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* Tarjetas de pasos */}
      <div className="space-y-4">
        {steps.map((step, idx) => {
          const StepIcon = step.icon;
          return (
            <div
              key={step.number}
              className="rounded-xl border border-slate-800 bg-slate-950/60 p-5 transition-all hover:border-slate-700"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 font-mono text-sm font-bold text-emerald-400">
                  {step.number}
                </div>

                <div className="flex-1 space-y-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      <span>{step.title}</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">{step.description}</p>
                  </div>

                  {/* Lista de pautas */}
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {step.tips.map((tip, tipIdx) => (
                      <li key={tipIdx} className="flex items-start gap-2">
                        <ChevronRight className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Snippet si aplica */}
                  {step.codeSnippet && (
                    <div className="relative mt-2 rounded-lg bg-slate-900 border border-slate-800 p-3 font-mono text-xs text-slate-300">
                      <pre className="overflow-x-auto">{step.codeSnippet}</pre>
                      <button
                        onClick={() => copyToClipboard(step.codeSnippet!, idx)}
                        className="absolute right-2 top-2 p-1.5 text-slate-400 hover:text-slate-200 bg-slate-800 rounded transition-colors"
                        title="Copiar comando"
                      >
                        {copiedIndex === idx ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
