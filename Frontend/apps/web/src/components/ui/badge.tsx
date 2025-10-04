import * as React from 'react';
import { cn } from '@/lib/utils.js';

type BadgeVariant = 'default' | 'outline';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export const Badge = ({ className, variant = 'default', ...props }: BadgeProps) => (
  <span
    className={cn(
      'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
      variant === 'default'
        ? 'bg-primary text-primary-foreground hover:bg-primary/80'
        : 'border-border text-muted-foreground',
      className
    )}
    {...props}
  />
);
