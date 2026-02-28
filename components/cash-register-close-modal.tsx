"use client";

import { useState, useEffect } from "react";
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
import { EmployeeNumpadModal } from "@/components/employee-numpad-modal";

interface CashRegisterCloseModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  registerId: string;
  userRole?: string; // admin, manager, cashier
  summary: {
    initialCash: number;
    expectedCash: number;
    totalSales: number;
    cashSales: number;
    terminalSales: number;
    transferSales: number;
    withdrawals: number;
    deposits: number;
  };
}

export function CashRegisterCloseModal({
  open,
  onClose,
  onSuccess,
  registerId,
  userRole = "cashier",
  summary,
}: CashRegisterCloseModalProps) {
  const [finalCash, setFinalCash] = useState("");
  const [vouchersTotal, setVouchersTotal] = useState("");
  const [receiptsTotal, setReceiptsTotal] = useState("");
  const [closureNotes, setClosureNotes] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [employeeName, setEmployeeName] = useState<string | null>(null);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  
  const [requiresSupervisor, setRequiresSupervisor] = useState(false);
  const [supervisorId, setSupervisorId] = useState<string | null>(null);
  const [supervisorReason, setSupervisorReason] = useState("");
  const [supervisorPinModalOpen, setSupervisorPinModalOpen] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  const isAdmin = userRole === "admin" || userRole === "manager";

  const finalCashNum = parseFloat(finalCash) || 0;
  const difference = finalCashNum - summary.expectedCash;
  const absDifference = Math.abs(difference);
  const tolerance = 10; // Debe venir de env

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open]);

  // Update requiresSupervisor when difference changes
  useEffect(() => {
    if (absDifference > tolerance && finalCashNum > 0) {
      setRequiresSupervisor(true);
    } else {
      setRequiresSupervisor(false);
      setSupervisorReason("");
    }
  }, [absDifference, tolerance, finalCashNum]);

  function handleEmployeePinSuccess(empId: string, empName: string) {
    setEmployeeId(empId);
    setEmployeeName(empName);
    setPinModalOpen(false);
    
    // Check if requires supervisor/confirmation
    if (absDifference > tolerance) {
      if (isAdmin) {
        // Admin solo necesita confirmar
        setShowConfirmDialog(true);
      } else {
        // Cajero necesita supervisor
        setRequiresSupervisor(true);
        setSupervisorPinModalOpen(true);
      }
    } else {
      handleCloseRegister(empId, null, null);
    }
  }

  function handleConfirmWithDifference() {
    if (!supervisorReason.trim()) {
      toast.error("Debes ingresar el motivo de la diferencia");
      return;
    }
    setShowConfirmDialog(false);
    // Admin acepta la diferencia sin necesidad de otro PIN
    handleCloseRegister(employeeId!, null, supervisorReason);
  }

  function handleSupervisorPinSuccess(supId: string, supName: string) {
    setSupervisorId(supId);
    setSupervisorPinModalOpen(false);
    
    if (!supervisorReason.trim()) {
      toast.error("Debes ingresar el motivo de la diferencia");
      return;
    }
    
    handleCloseRegister(employeeId!, supId, supervisorReason);
  }

  async function handleCloseRegister(
    closedBy: string,
    supId: string | null,
    supReason: string | null
  ) {
    setLoading(true);

    try {
      const res = await fetch(`/api/cash-register/${registerId}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          finalCash: finalCashNum,
          vouchersTotal: parseFloat(vouchersTotal) || 0,
          receiptsTotal: parseFloat(receiptsTotal) || 0,
          closureNotes: closureNotes.trim() || null,
          closedBy,
          supervisorId: supId,
          supervisorReason: supReason,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.requiresSupervisor) {
          setRequiresSupervisor(true);
          toast.error(data.message);
          return;
        }
        throw new Error(data.error);
      }

      toast.success("Caja cerrada exitosamente");
      onSuccess();
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error cerrando caja");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFinalCash("");
    setVouchersTotal("");
    setReceiptsTotal("");
    setClosureNotes("");
    setEmployeeId(null);
    setEmployeeName(null);
    setRequiresSupervisor(false);
    setSupervisorId(null);
    setSupervisorReason("");
  }

  function initiateClose() {
    if (!finalCash || finalCashNum < 0) {
      toast.error("Ingresa el efectivo contado");
      return;
    }

    if (!employeeId) {
      setPinModalOpen(true);
      return;
    }

    handleCloseRegister(employeeId, supervisorId, supervisorReason);
  }

  function handleDialogClose(isOpen: boolean) {
    if (!isOpen) {
      resetForm();
      onClose();
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cerrar Caja</DialogTitle>
            <DialogDescription>
              Realiza el arqueo y cierra la caja registradora
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Resumen */}
            <div className="rounded-lg border p-4 space-y-2 bg-muted/30">
              <h3 className="font-semibold">Resumen de Caja</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Efectivo inicial:</div>
                <div className="font-medium text-right">{formatCurrency(summary.initialCash)}</div>
                
                <div>Ventas en efectivo:</div>
                <div className="font-medium text-right text-green-600">+{formatCurrency(summary.cashSales)}</div>
                
                <div>Retiros (sangrías):</div>
                <div className="font-medium text-right text-red-600">-{formatCurrency(summary.withdrawals)}</div>
                
                <div>Ingresos:</div>
                <div className="font-medium text-right text-green-600">+{formatCurrency(summary.deposits)}</div>
                
                <div className="col-span-2"><hr className="my-2" /></div>
                
                <div className="font-bold">Efectivo esperado:</div>
                <div className="font-bold text-right text-lg">{formatCurrency(summary.expectedCash)}</div>
              </div>
            </div>

            {/* Ventas totales */}
            <div className="rounded-lg border p-4 space-y-2">
              <h3 className="font-semibold">Ventas Totales</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Efectivo:</div>
                <div className="text-right">{formatCurrency(summary.cashSales)}</div>
                
                <div>Terminal:</div>
                <div className="text-right">{formatCurrency(summary.terminalSales)}</div>
                
                <div>Transferencia:</div>
                <div className="text-right">{formatCurrency(summary.transferSales)}</div>
                
                <div className="col-span-2"><hr className="my-2" /></div>
                
                <div className="font-bold">Total:</div>
                <div className="font-bold text-right">{formatCurrency(summary.totalSales)}</div>
              </div>
            </div>

            {/* Arqueo */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="finalCash" className="text-base font-semibold">
                  Efectivo Contado *
                </Label>
                <Input
                  id="finalCash"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={finalCash}
                  onChange={(e) => setFinalCash(e.target.value)}
                  className="mt-2 text-xl font-bold"
                  autoFocus
                />
              </div>

              {finalCash && parseFloat(finalCash) > 0 && (
                <div className={`rounded-lg p-4 ${
                  absDifference <= tolerance
                    ? "bg-green-50 border border-green-200"
                    : "bg-red-50 border border-red-200"
                }`}>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Diferencia:</span>
                    <span className={`text-xl font-bold ${
                      difference >= 0 ? "text-green-600" : "text-red-600"
                    }`}>
                      {difference >= 0 ? "+" : ""}{formatCurrency(difference)}
                    </span>
                  </div>
                  {absDifference > tolerance && (
                    <p className="text-sm text-red-600 mt-2">
                      ⚠️ La diferencia excede la tolerancia de ±{formatCurrency(tolerance)}. 
                      Se requiere autorización de supervisor.
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="vouchersTotal">Vales</Label>
                  <Input
                    id="vouchersTotal"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={vouchersTotal}
                    onChange={(e) => setVouchersTotal(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="receiptsTotal">Recibos</Label>
                  <Input
                    id="receiptsTotal"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={receiptsTotal}
                    onChange={(e) => setReceiptsTotal(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="closureNotes">Notas de Cierre</Label>
                <Textarea
                  id="closureNotes"
                  placeholder="Observaciones del cierre..."
                  value={closureNotes}
                  onChange={(e) => setClosureNotes(e.target.value)}
                  rows={3}
                />
              </div>

              {requiresSupervisor && !supervisorId && (
                <div>
                  <Label htmlFor="supervisorReason">Motivo de la Diferencia *</Label>
                  <Textarea
                    id="supervisorReason"
                    placeholder="Explica el motivo de la diferencia..."
                    value={supervisorReason}
                    onChange={(e) => setSupervisorReason(e.target.value)}
                    rows={2}
                    className="mt-2"
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={initiateClose} disabled={loading}>
              {loading ? "Cerrando..." : "Cerrar Caja"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Employee PIN Modal */}
      <EmployeeNumpadModal
        open={pinModalOpen}
        onClose={() => setPinModalOpen(false)}
        onSuccess={handleEmployeePinSuccess}
        title="Identificación de Empleado"
        subtitle="Para cerrar la caja"
      />

      {/* Supervisor PIN Modal */}
      <EmployeeNumpadModal
        open={supervisorPinModalOpen}
        onClose={() => setSupervisorPinModalOpen(false)}
        onSuccess={handleSupervisorPinSuccess}
        title="Autorización de Supervisor"
        subtitle="Diferencia excede tolerancia"
      />

      {/* Admin Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>⚠️ Confirmar Cierre con Diferencia</DialogTitle>
            <DialogDescription>
              La diferencia de {difference >= 0 ? "+" : ""}{formatCurrency(difference)} excede la tolerancia de ±{formatCurrency(tolerance)}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
              <p className="text-sm text-yellow-800">
                <strong>Efectivo esperado:</strong> {formatCurrency(summary.expectedCash)}
              </p>
              <p className="text-sm text-yellow-800">
                <strong>Efectivo contado:</strong> {formatCurrency(finalCashNum)}
              </p>
              <p className="text-sm text-yellow-800 font-bold mt-2">
                <strong>Diferencia:</strong> {difference >= 0 ? "+" : ""}{formatCurrency(difference)}
              </p>
            </div>

            <div>
              <Label htmlFor="adminReason">Motivo de la Diferencia *</Label>
              <Textarea
                id="adminReason"
                placeholder="Explica el motivo de la diferencia..."
                value={supervisorReason}
                onChange={(e) => setSupervisorReason(e.target.value)}
                rows={3}
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmWithDifference}>
              Confirmar y Cerrar Caja
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
