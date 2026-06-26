import { type ReactNode, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils';
import { Button } from './Button';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  footer?: ReactNode;
}

export function Dialog({ open, onClose, title, description, children, className, footer }: DialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        className={cn(
          'flex w-full max-w-lg max-h-[90vh] flex-col rounded-2xl bg-bg-primary shadow-2xl border border-border-default overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-200',
          className
        )}
      >
        {(title || description) && (
          <div className="flex shrink-0 items-start justify-between px-6 py-4 border-b border-border-default">
            <div>
              {title && <h2 className="text-lg font-semibold text-text-primary">{title}</h2>}
              {description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="ml-2 -mr-2">
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
        {footer && <div className="flex shrink-0 justify-end gap-2 px-6 py-4 border-t border-border-default bg-bg-secondary">{footer}</div>}
      </div>
    </div>
  );
}
