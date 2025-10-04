import * as React from 'react';
import { cn } from '@/lib/utils.js';

export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn('text-sm font-medium leading-none text-muted-foreground', className)}
      {...props}
    />
  )
);

Label.displayName = 'Label';
