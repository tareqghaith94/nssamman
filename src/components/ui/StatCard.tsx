import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  href?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatCard({ title, value, icon, href, trend, className }: StatCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (href) navigate(href);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'glass-card rounded-xl p-6 animate-fade-in',
        href && 'cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all duration-200',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-heading font-bold text-foreground">{value}</p>
          {trend && (
            <p className={cn(
              'mt-2 text-sm font-medium',
              trend.isPositive ? 'text-success' : 'text-destructive'
            )}>
              {trend.isPositive ? '+' : ''}{trend.value}% from last month
            </p>
          )}
        </div>
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
      </div>
    </div>
  );
}
