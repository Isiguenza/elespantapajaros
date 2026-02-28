"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  CurrencyDollar,
  LockOpen,
  Lock,
  Spinner,
  Receipt,
  ArrowUp,
  ArrowDown,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { CashRegister } from "@/lib/types";
import { CashRegisterCloseModal } from "@/components/cash-register-close-modal";
import { WithdrawModal } from "@/components/withdraw-modal";
import { DepositModal } from "@/components/deposit-modal";
import { EmployeePinModal } from "@/components/employee-pin-modal";

export default function CashRegisterPage() {
  const [register, setRegister] = useState<CashRegister | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Open dialog
  const [openDialogVisible, setOpenDialogVisible] = useState(false);
  const [initialCash, setInitialCash] = useState("");
  const [openingEmployeeId, setOpeningEmployeeId] = useState<string | null>(null);
  const [pinModalForOpen, setPinModalForOpen] = useState(false);

  // Advanced modals
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [closeModalKey, setCloseModalKey] = useState(0);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [depositModalOpen, setDepositModalOpen] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      // Cargar usuario primero
      const userRes = await fetch("/api/auth/me");
      if (userRes.ok) {
        const user = await userRes.json();
        setCurrentUser(user);
      }

      // Luego cargar registro
      const registerRes = await fetch("/api/cash-register/current");
      if (registerRes.ok) {
        const data = await registerRes.json();
        setRegister(data);
      } else if (registerRes.status === 404) {
        setRegister(null);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }

  function initiateOpen() {
    const amount = parseFloat(initialCash);
    if (!initialCash || isNaN(amount) || amount <= 0) {
      toast.error("Ingresa un monto inicial válido");
      return;
    }
    
    if (!currentUser) {
      toast.error("No hay usuario autenticado");
      return;
    }
    
    // Usar usuario autenticado del dashboard
    setOpeningEmployeeId(currentUser.id);
    setOpenDialogVisible(false);
    handleOpenPinSuccess(currentUser.id, currentUser.name);
  }

  async function handleOpen() {
    if (!openingEmployeeId) {
      toast.error("Debes identificarte primero");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/cash-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          initialCash: parseFloat(initialCash),
          employeeId: openingEmployeeId,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Caja abierta");
      setOpenDialogVisible(false);
      setInitialCash("");
      setOpeningEmployeeId(null);
      loadData();
    } catch {
      toast.error("Error abriendo caja");
    } finally {
      setSubmitting(false);
    }
  }

  function handleOpenPinSuccess(empId: string, empName: string) {
    setOpeningEmployeeId(empId);
    setPinModalForOpen(false);
    toast.success(`Identificado: ${empName}`);
    // Abrir caja después de autenticación
    setTimeout(() => handleOpen(), 100);
  }

  async function handleCloseSuccess() {
    toast.success("Caja cerrada exitosamente");
    setCloseModalOpen(false);
    await loadData();
  }

  function handleCloseModalOpen() {
    // Force fresh state by incrementing key (forces re-mount)
    setCloseModalKey(prev => prev + 1);
    setCloseModalOpen(true);
  }

  function handleWithdrawSuccess() {
    setWithdrawModalOpen(false);
    loadData();
  }

  function handleDepositSuccess() {
    setDepositModalOpen(false);
    loadData();
  }

  const formatCurrency = (amount: string | number | null) => {
    if (amount === null) return "$0.00";
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(typeof amount === "string" ? parseFloat(amount) : amount);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="size-8 animate-spin" />
      </div>
    );
  }

  // No register open
  if (!register) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Caja Registradora</h1>
        <Card className="mx-auto max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-12">
            <LockOpen className="mb-4 size-16 text-muted-foreground" />
            <h2 className="text-xl font-semibold">No hay caja abierta</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Abre la caja para comenzar a registrar ventas
            </p>
            <Button
              className="mt-6"
              size="lg"
              onClick={() => setOpenDialogVisible(true)}
            >
              <LockOpen className="mr-2 size-4" />
              Abrir Caja
            </Button>
          </CardContent>
        </Card>

        {/* Open Dialog */}
        <Dialog open={openDialogVisible} onOpenChange={setOpenDialogVisible}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Abrir Caja</DialogTitle>
              <DialogDescription>
                Ingresa el monto inicial de efectivo en caja
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label>Efectivo inicial</Label>
              <Input
                type="number"
                step="0.01"
                value={initialCash}
                onChange={(e) => setInitialCash(e.target.value)}
                placeholder="0.00"
                className="text-xl"
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenDialogVisible(false)}>
                Cancelar
              </Button>
              <Button onClick={initiateOpen} disabled={submitting}>
                {submitting ? "Abriendo..." : "Continuar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Register is open
  // expectedCash = initialCash + cashSales - withdrawals + deposits
  const expectedCash =
    parseFloat(register.initialCash) + 
    parseFloat(register.cashSales || "0") - 
    parseFloat(register.withdrawals || "0") + 
    parseFloat(register.deposits || "0");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Caja Registradora</h1>
        <Badge variant="default" className="gap-1">
          <LockOpen className="size-3" />
          Abierta
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Efectivo Inicial</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(register.initialCash)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(register.totalSales)}
            </p>
            <p className="text-xs text-muted-foreground">
              {register.totalOrders || 0} órdenes
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Efectivo Esperado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(expectedCash)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Abierta desde</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">
              {format(new Date(register.openedAt), "HH:mm", { locale: es })}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(register.openedAt), "dd MMM yyyy", { locale: es })}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => setDepositModalOpen(true)}
        >
          <ArrowDown className="mr-1 size-4 text-green-600" />
          Depósito
        </Button>
        <Button
          variant="outline"
          onClick={() => setWithdrawModalOpen(true)}
        >
          <ArrowUp className="mr-1 size-4 text-red-600" />
          Sangría (Retiro)
        </Button>
        <div className="flex-1" />
        <Button variant="destructive" onClick={handleCloseModalOpen}>
          <Lock className="mr-1 size-4" />
          Cerrar Caja / Corte
        </Button>
      </div>

      {/* Advanced Modals */}
      {register && (
        <>
          <CashRegisterCloseModal
            key={closeModalKey}
            open={closeModalOpen}
            onClose={() => setCloseModalOpen(false)}
            onSuccess={handleCloseSuccess}
            registerId={register.id}
            userRole={currentUser?.role || "cashier"}
            summary={{
              initialCash: parseFloat(register.initialCash),
              expectedCash,
              totalSales: parseFloat(register.totalSales || "0"),
              cashSales: parseFloat(register.cashSales || "0"),
              terminalSales: parseFloat(register.terminalSales || "0"),
              transferSales: parseFloat(register.transferSales || "0"),
              withdrawals: parseFloat(register.withdrawals || "0"),
              deposits: parseFloat(register.deposits || "0"),
            }}
          />
          <WithdrawModal
            open={withdrawModalOpen}
            onClose={() => setWithdrawModalOpen(false)}
            onSuccess={handleWithdrawSuccess}
            registerId={register.id}
          />
          <DepositModal
            open={depositModalOpen}
            onClose={() => setDepositModalOpen(false)}
            onSuccess={handleDepositSuccess}
            registerId={register.id}
          />
        </>
      )}

      {/* TODO: Implementar PIN Modal mejorado
          - Usar PinPad directamente (sin email)
          - Pedir número de empleado con numpad
          - Luego pedir PIN con numpad
          - Similar al flujo de PinPad actual pero con número de empleado primero
      */}
    </div>
  );
}
