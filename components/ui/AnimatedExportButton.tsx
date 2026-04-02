'use client';

import React, { useState } from 'react';
import { FileDown, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AnimatedExportButtonProps {
  onExport: () => Promise<void>;
  disabled?: boolean;
}

const AnimatedExportButton: React.FC<AnimatedExportButtonProps> = ({ onExport, disabled }) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleClick = async () => {
    if (status === 'loading' || disabled) return;

    setStatus('loading');
    try {
      await onExport();
      setStatus('success');
    } catch (error) {
      console.error("Export error:", error);
      setStatus('error');
      toast.error("Export Failed", { description: "Could not generate the Excel file." });
    } finally {
      setTimeout(() => setStatus('idle'), 2500);
    }
  };

  const buttonContent = {
    idle: <><FileDown className="mr-2 h-4 w-4" /> Export</>,
    loading: <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Exporting...</>,
    success: <><Check className="mr-2 h-4 w-4" /> Done!</>,
    error: <><X className="mr-2 h-4 w-4" /> Error</>,
  };

  return (
    <Button
      onClick={handleClick}
      disabled={disabled || status === 'loading'}
      variant="outline"
      className={cn(
        "relative overflow-hidden transition-all duration-300 ease-in-out",
        status === 'success' && 'bg-green-500 hover:bg-green-600 text-white',
        status === 'error' && 'bg-red-500 hover:bg-red-600 text-white border-red-700 animate-shake',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute bottom-0 left-0 w-full h-0 bg-blue-500/30 transition-all duration-1000 ease-out",
          status === 'loading' && 'h-full',
          status === 'success' && 'h-full !bg-green-600',
          status === 'error' && 'h-0'
        )}
      />
      
      {/* Text and Icon content */}
      <span className="relative z-10 flex items-center">
        {buttonContent[status]}
      </span>
    </Button>
  );
};

// Add this animation to your global CSS file (e.g., globals.css)
/*
@keyframes shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
  40%, 60% { transform: translate3d(4px, 0, 0); }
}
.animate-shake {
  animation: shake 0.82s cubic-bezier(.36,.07,.19,.97) both;
}
*/

export default AnimatedExportButton;