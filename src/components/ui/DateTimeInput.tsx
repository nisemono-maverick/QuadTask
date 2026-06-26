import { Calendar } from 'lucide-react';
import { cn } from '../../utils';

interface DateTimeInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

export function DateTimeInput({ label, error, className, ...props }: DateTimeInputProps) {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-text-primary mb-1.5">{label}</label>}
      <div className="relative">
        <input
          type="datetime-local"
          className={cn(
            'w-full rounded-lg border border-border-default bg-bg-primary px-3 py-2 pr-9 text-sm text-text-primary',
            'focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-primary/20',
            'transition-all hover:border-border-focus/50',
            '[&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-2 [&::-webkit-calendar-picker-indicator]:top-1/2 [&::-webkit-calendar-picker-indicator]:-translate-y-1/2 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0',
            error && 'border-danger focus:border-danger focus:ring-danger/20',
            className
          )}
          {...props}
        />
        <Calendar className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
      </div>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
