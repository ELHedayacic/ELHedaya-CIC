import { useEffect, useRef, useState } from "react";
import { Lock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
import { formatCurrency, extractFunctionErrorMessage } from "@/lib/utils";

declare global {
  interface Window {
    Square?: any;
  }
}

const SQUARE_APP_ID = import.meta.env.VITE_SQUARE_APPLICATION_ID as string;
const SQUARE_LOCATION_ID = import.meta.env.VITE_SQUARE_LOCATION_ID as string;
const SQUARE_ENV = (import.meta.env.VITE_SQUARE_ENV as string) ?? "sandbox";

const SDK_URL =
  SQUARE_ENV === "production"
    ? "https://web.squarecdn.com/v1/square.js"
    : "https://sandbox.web.squarecdn.com/v1/square.js";

export function SquarePaymentForm({
  amount,
  studentId,
  feeStructureId,
  note,
  onSuccess,
}: {
  amount: number;
  studentId?: string | null;
  feeStructureId?: string | null;
  note?: string;
  onSuccess: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const cardInstance = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [sdkMissingConfig] = useState(!SQUARE_APP_ID || !SQUARE_LOCATION_ID);

  useEffect(() => {
    if (sdkMissingConfig) return;

    let cancelled = false;

    async function init() {
      if (!window.Square) {
        await loadScript(SDK_URL);
      }
      if (cancelled || !window.Square) return;

      const payments = window.Square.payments(SQUARE_APP_ID, SQUARE_LOCATION_ID);
      const card = await payments.card();
      await card.attach(cardRef.current);
      cardInstance.current = card;
      setReady(true);
    }

    init().catch((err) => setError(err.message ?? "Could not load the payment form"));

    return () => {
      cancelled = true;
      cardInstance.current?.destroy?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handlePay() {
    setError(null);
    if (!cardInstance.current) return;
    setProcessing(true);

    try {
      const result = await cardInstance.current.tokenize();
      if (result.status !== "OK") {
        throw new Error(result.errors?.[0]?.message ?? "Card could not be verified");
      }

      const { data, error: fnError } = await supabase.functions.invoke("process-payment", {
        body: {
          sourceId: result.token,
          amount,
          studentId: studentId ?? null,
          feeStructureId: feeStructureId ?? null,
          note,
        },
      });

      if (fnError || data?.error) {
        throw new Error(data?.error ?? (await extractFunctionErrorMessage(fnError)));
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message ?? "Something went wrong processing your payment");
    } finally {
      setProcessing(false);
    }
  }

  if (sdkMissingConfig) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-500">
        <AlertCircle className="h-4 w-4 shrink-0" />
        Square isn't configured yet. Add VITE_SQUARE_APPLICATION_ID and VITE_SQUARE_LOCATION_ID to your .env file.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-coral-500/30 bg-coral-500/10 px-4 py-3 text-sm text-coral-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div ref={cardRef} className="rounded-xl border border-black/10 bg-twilight-900/70 p-3.5 min-h-[56px]" />

      <Button className="w-full" onClick={handlePay} disabled={!ready} loading={processing}>
        <Lock className="h-4 w-4" /> Pay {formatCurrency(amount)}
      </Button>

      <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-twilight-200">
        <Lock className="h-3 w-3" /> Payments are processed securely by Square. Card details never touch our servers.
      </p>
    </div>
  );
}

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Square SDK"));
    document.head.appendChild(script);
  });
}
