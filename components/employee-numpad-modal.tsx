"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PinPad } from "@/components/ui/pin-pad";
import { toast } from "sonner";

interface EmployeeNumpadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (employeeId: string, employeeName: string) => void;
  title?: string;
  subtitle?: string;
}

export function EmployeeNumpadModal({
  open,
  onClose,
  onSuccess,
  title = "Identificación de Empleado",
  subtitle,
}: EmployeeNumpadModalProps) {
  const [step, setStep] = useState<"employee" | "pin">("employee");
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleEmployeeNumberComplete(number: string) {
    setEmployeeNumber(number);
    setStep("pin");
  }

  async function handlePinComplete(pin: string) {
    setLoading(true);

    try {
      const res = await fetch("/api/employees/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: employeeNumber,
          pin,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "PIN incorrecto - intenta de nuevo");
        // NO regresar a employee, quedarse en PIN para reintentar
        setLoading(false);
        return;
      }

      toast.success(`Bienvenido, ${data.employee.name}`);
      onSuccess(data.employee.id, data.employee.name);
      handleClose();
    } catch (error) {
      toast.error("Error verificando PIN - intenta de nuevo");
      // Quedarse en pantalla de PIN
      setLoading(false);
    }
  }

  function handleClose() {
    setStep("employee");
    setEmployeeNumber("");
    setLoading(false);
    onClose();
  }

  function handleCancel() {
    if (step === "pin") {
      setStep("employee");
      setEmployeeNumber("");
    } else {
      handleClose();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </DialogHeader>

        {step === "employee" ? (
          <PinPad
            key="employee-number"
            title="Número de Empleado"
            subtitle="Ingresa tu número de empleado"
            maxLength={6}
            onComplete={handleEmployeeNumberComplete}
            onCancel={handleCancel}
          />
        ) : (
          <PinPad
            key="employee-pin"
            title="PIN de Empleado"
            subtitle={`Empleado #${employeeNumber}`}
            maxLength={4}
            onComplete={handlePinComplete}
            onCancel={handleCancel}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
