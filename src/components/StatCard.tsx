import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  trend?: 'positive' | 'negative' | 'neutral';
  badgeText?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend = 'neutral',
  badgeText,
}) => {
  const trendColor =
    trend === 'positive'
      ? 'text-emerald-400'
      : trend === 'negative'
      ? 'text-rose-400'
      : 'text-slate-100';

  const iconBg =
    trend === 'positive'
      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      : trend === 'negative'
      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
      : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70 p-5 backdrop-blur-sm transition-all duration-200 hover:border-slate-700/80">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-xs font-medium tracking-wide uppercase text-slate-400">
            {title}
          </span>
          <div className={`mt-2 text-2xl lg:text-3xl font-bold font-mono tabular-nums tracking-tight ${trendColor}`}>
            {value}
          </div>
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border ${iconBg}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800/80">
        <span className="truncate">{subtitle}</span>
        {badgeText && (
          <span className="font-mono text-[11px] text-slate-400 shrink-0 font-medium">
            {badgeText}
          </span>
        )}
      </div>
    </div>
  );
};
