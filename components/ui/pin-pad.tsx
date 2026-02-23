"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Backspace } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface PinPadProps {
  onComplete: (pin: string) => void;
  onCancel?: () => void;
  title?: string;
  subtitle?: string;
  maxLength?: number;
}

export function PinPad({
  onComplete,
  onCancel,
  title = "Ingresa tu PIN",
  subtitle = "PIN de 4 dígitos",
  maxLength = 4,
}: PinPadProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handleNumberClick = (num: number) => {
    if (pin.length < maxLength) {
      const newPin = pin + num;
      setPin(newPin);
      setError("");
      
      if (newPin.length === maxLength) {
        // Auto-submit when max length reached
        setTimeout(() => {
          onComplete(newPin);
        }, 100);
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError("");
  };

  const handleClear = () => {
    setPin("");
    setError("");
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      </div>

      {/* PIN Display */}
      <div className="flex justify-center gap-3">
        {Array.from({ length: maxLength }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-14 w-14 rounded-lg border-2 flex items-center justify-center transition-all",
              i < pin.length
                ? "border-primary bg-primary/10"
                : "border-muted-foreground/30"
            )}
          >
            {i < pin.length && (
              <div className="h-3 w-3 rounded-full bg-primary" />
            )}
          </div>
        ))}
      </div>

      {error && (
        <p className="text-center text-sm text-destructive">{error}</p>
      )}

      {/* Number Pad */}
      <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <Button
            key={num}
            variant="outline"
            size="lg"
            className="h-16 text-2xl font-semibold"
            onClick={() => handleNumberClick(num)}
          >
            {num}
          </Button>
        ))}
        <Button
          variant="outline"
          size="lg"
          className="h-16 text-lg"
          onClick={handleClear}
        >
          Borrar
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="h-16 text-2xl font-semibold"
          onClick={() => handleNumberClick(0)}
        >
          0
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="h-16"
          onClick={handleBackspace}
        >
          <Backspace className="size-6" />
        </Button>
      </div>

      {onCancel && (
        <Button
          variant="ghost"
          className="w-full"
          onClick={onCancel}
        >
          Cancelar
        </Button>
      )}
    </div>
  );
}
