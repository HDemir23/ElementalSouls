'use client';

import type { Element } from '@elementalsouls/shared';
import { Button } from '@/components/ui/button.jsx';
import { cn } from '@/lib/utils.js';

const elements: Element[] = ['Fire', 'Water', 'Earth', 'Air'];
const palettes: Record<Element, string> = {
  Fire: 'from-orange-400 to-rose-500',
  Water: 'from-sky-400 to-blue-600',
  Earth: 'from-emerald-400 to-lime-500',
  Air: 'from-purple-400 to-cyan-400'
};

interface Props {
  value: Element;
  onChange: (element: Element) => void;
  disabled?: boolean;
}

export const ElementPicker = ({ value, onChange, disabled }: Props) => (
  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
    {elements.map((element) => (
      <Button
        key={element}
        type="button"
        disabled={disabled}
        onClick={() => onChange(element)}
        className={cn(
          'relative flex h-20 flex-col items-center justify-center overflow-hidden border text-base shadow-sm text-white',
          value === element ? 'border-primary ring-2 ring-primary' : 'border-border',
          'bg-gradient-to-br',
          palettes[element]
        )}
        variant="ghost"
      >
        <span className="absolute inset-0 opacity-80" aria-hidden />
        <span className={cn('relative font-semibold drop-shadow-md', palettes[element])}>{element}</span>
        <span className="relative text-xs text-white/80">{value === element ? 'Selected' : 'Select'}</span>
      </Button>
    ))}
  </div>
);
