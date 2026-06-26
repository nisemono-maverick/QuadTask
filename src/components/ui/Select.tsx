import { useState, useRef, useEffect, type ReactNode } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../utils';

interface SelectOption {
  value: string;
  label: ReactNode;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function Select({ value, onChange, options, placeholder = '请选择', label, className, size = 'md' }: SelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className={cn('relative w-full', className)} ref={containerRef}>
      {label && <label className="block text-sm font-medium text-text-primary mb-1.5">{label}</label>}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'flex w-full items-center justify-between rounded-lg border border-border-default bg-bg-primary text-left text-text-primary transition-all hover:border-border-focus focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-primary/20',
          size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm',
          open && 'border-border-focus ring-2 ring-primary/20'
        )}
      >
        <span className={cn('block truncate', !selected && 'text-text-tertiary')}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={cn(
            'shrink-0 text-text-tertiary transition-transform duration-200',
            size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4',
            open && 'rotate-180'
          )}
        />
      </button>
      {open && (
        <div
          className={cn(
            'absolute z-50 mt-1 min-w-[140px] rounded-xl border border-border-default bg-bg-primary shadow-xl animate-in fade-in zoom-in-95 duration-150',
            size === 'sm' ? 'text-xs' : 'text-sm'
          )}
          style={{ width: containerRef.current?.offsetWidth }}
        >
          <div className="max-h-60 overflow-y-auto p-1">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-text-primary transition-colors hover:bg-bg-secondary',
                  option.value === value && 'bg-primary-light text-primary'
                )}
              >
                <span className="truncate">{option.label}</span>
                {option.value === value && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
