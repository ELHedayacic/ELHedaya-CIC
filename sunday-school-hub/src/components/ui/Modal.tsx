import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  maxWidth = "max-w-lg",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  maxWidth?: string;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-twilight-950/80 backdrop-blur-sm data-[state=open]:animate-fade-up" />
        <Dialog.Content
          className={`fixed left-1/2 top-1/2 z-50 w-[92vw] ${maxWidth} -translate-x-1/2 -translate-y-1/2 rounded-xl2 border border-black/10 bg-twilight-850 p-6 shadow-card focus:outline-none max-h-[85vh] overflow-y-auto`}
        >
          <div className="mb-4 flex items-start justify-between">
            <div>
              <Dialog.Title className="font-display text-lg font-semibold text-twilight-50">
                {title}
              </Dialog.Title>
              {description && (
                <Dialog.Description className="mt-1 text-sm text-twilight-200">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close asChild>
              <button
                aria-label="Close"
                className="rounded-full p-1.5 text-twilight-200 transition-colors hover:bg-black/10 hover:text-twilight-50"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
