"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PinPad } from "@/components/ui/pin-pad";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface EmployeePinModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (employeeId: string, employeeName: string) => void;
  title?: string;
  subtitle?: string;
}

export function EmployeePinModal({ 
  open, 
  onClose, 
  onSuccess,
  title = "Identificación de Empleado",
  subtitle = "Ingresa tu email y PIN",
}: EmployeePinModalProps) {
  const [step, setStep] = useState<"email" | "pin">("email");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Ingresa tu email");
      return;
    }
    setStep("pin");
  }

  async function handlePinComplete(pin: string) {
    setLoading(true);
    
    try {
      const res = await fetch("/api/employees/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          identifier: email.trim(),
          pin 
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        toast.error(error.error || "PIN incorrecto");
        setLoading(false);
        return;
      }

      const data = await res.json();
      toast.success(`Bienvenido ${data.employee.name}`);
      onSuccess(data.employee.id, data.employee.name);
      
      // Reset
      setEmail("");
      setStep("email");
    } catch (error) {
      toast.error("Error verificando PIN");
    } finally {
      setLoading(false);
    }
  }

  function handleCancel() {
    setEmail("");
    setStep("email");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {step === "email" ? (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <Label htmlFor="employee-email">Email o Código de Empleado</Label>
              <Input
                id="employee-email"
                type="text"
                placeholder="empleado@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                className="mt-2"
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleCancel} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" className="flex-1">
                Continuar
              </Button>
            </div>
          </form>
        ) : (
          <div>
            <div className="mb-4 text-center">
              <p className="text-sm text-muted-foreground">
                {email}
              </p>
            </div>
            <PinPad
              onComplete={handlePinComplete}
              onCancel={() => setStep("email")}
              title="Ingresa tu PIN"
              subtitle={subtitle}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
