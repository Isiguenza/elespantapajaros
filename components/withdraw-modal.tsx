"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { EmployeePinModal } from "@/components/employee-pin-modal";

interface WithdrawModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  registerId: string;
}

export function WithdrawModal({
  open,
  onClose,
  onSuccess,
  registerId,
}: WithdrawModalProps) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [pinModalOpen, setPinModalOpen] = useState(false);

  const formatCurrency = (num: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(num);

  function handlePinSuccess(empId: string, empName: string) {
    setEmployeeId(empId);
    setPinModalOpen(false);
    handleWithdraw(empId);
  }

  async function handleWithdraw(userId: string) {
    const amountNum = parseFloat(amount);

    if (!amountNum || amountNum <= 0) {
      toast.error("Ingresa un monto válido");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/cash-register/${registerId}/withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountNum,
          userId,
          description: description.trim() || "Sangría de caja",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      toast.success(`Retiro registrado: ${formatCurrency(amountNum)}`);
      onSuccess();
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error registrando retiro");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setAmount("");
    setDescription("");
    setEmployeeId(null);
  }

  function initiateWithdraw() {
    if (!employeeId) {
      setPinModalOpen(true);
      return;
    }
    handleWithdraw(employeeId);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sangría de Caja</DialogTitle>
            <DialogDescription>
              Registra un retiro de efectivo de la caja
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Monto a Retirar *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-2 text-xl font-bold"
                autoFocus
              />
              {amount && parseFloat(amount) > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  {formatCurrency(parseFloat(amount))}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Motivo del Retiro</Label>
              <Textarea
                id="description"
                placeholder="Ej: Depósito bancario, pago a proveedor..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            {employeeId && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                <p className="text-sm text-blue-800">
                  ✓ Empleado verificado
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={initiateWithdraw} disabled={loading}>
              {loading ? "Procesando..." : "Registrar Retiro"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EmployeePinModal
        open={pinModalOpen}
        onClose={() => setPinModalOpen(false)}
        onSuccess={handlePinSuccess}
        title="Identificación de Empleado"
        subtitle="Para autorizar el retiro"
      />
    </>
  );
}
