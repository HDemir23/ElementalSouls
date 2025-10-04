'use client';

import { useEffect, useState } from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { cn } from '@/lib/utils.js';

interface ToastMessage {
  id: string;
  title: string;
  description?: string;
}

type Listener = (toast: ToastMessage) => void;
const listeners = new Set<Listener>();

export const pushToast = (toast: Omit<ToastMessage, 'id'>) => {
  const message: ToastMessage = { id: crypto.randomUUID(), ...toast };
  listeners.forEach((listener) => listener(message));
};

export const TxToast = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handler: Listener = (toast) => setToasts((prev) => [...prev, toast]);
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  const remove = (id: string) => setToasts((prev) => prev.filter((toast) => toast.id !== id));

  return (
    <ToastPrimitive.Provider swipeDirection="right">
      {toasts.map((toast) => (
        <ToastPrimitive.Root
          key={toast.id}
          duration={6000}
          onOpenChange={(open) => {
            if (!open) remove(toast.id);
          }}
          className={cn(
            'pointer-events-auto relative ml-auto mt-2 w-full max-w-sm rounded-md border bg-white p-4 shadow-lg',
            'data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:slide-in-from-right-5',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:slide-out-to-right-5'
          )}
        >
          <ToastPrimitive.Title className="text-sm font-semibold text-foreground">
            {toast.title}
          </ToastPrimitive.Title>
          {toast.description && (
            <ToastPrimitive.Description className="mt-1 text-sm text-muted-foreground">
              {toast.description}
            </ToastPrimitive.Description>
          )}
        </ToastPrimitive.Root>
      ))}
      <ToastPrimitive.Viewport className="fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2" />
    </ToastPrimitive.Provider>
  );
};
