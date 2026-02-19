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

export default function CashRegisterPage() {
  const [register, setRegister] = useState<CashRegister | null>(null);
  const [loading, setLoading] = useState(true);

  // Open dialog
  const [openDialogVisible, setOpenDialogVisible] = useState(false);
  const [initialCash, setInitialCash] = useState("");

  // Close dialog
  const [closeDialogVisible, setCloseDialogVisible] = useState(false);
  const [finalCash, setFinalCash] = useState("");
  const [closeNotes, setCloseNotes] = useState("");

  // Cash movement dialog
  const [movementDialogVisible, setMovementDialogVisible] = useState(false);
  const [movementType, setMovementType] = useState<"cash_in" | "cash_out">("cash_in");
  const [movementAmount, setMovementAmount] = useState("");
  const [movementDesc, setMovementDesc] = useState("");

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCurrentRegister();
  }, []);

  async function fetchCurrentRegister() {
    try {
      const res = await fetch("/api/cash-register/current");
      if (res.ok) {
        const data = await res.json();
        setRegister(data);
      } else if (res.status === 404) {
        setRegister(null);
      }
    } catch {
      console.error("Error fetching register");
    } finally {
      setLoading(false);
    }
  }

  async function handleOpen() {
    if (!initialCash || parseFloat(initialCash) < 0) {
      toast.error("Ingresa un monto inicial válido");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/cash-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initialCash: parseFloat(initialCash) }),
      });
      if (!res.ok) throw new Error();
      toast.success("Caja abierta");
      setOpenDialogVisible(false);
      setInitialCash("");
      fetchCurrentRegister();
    } catch {
      toast.error("Error abriendo caja");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleClose() {
    if (!finalCash) {
      toast.error("Ingresa el efectivo final");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/cash-register/${register!.id}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          finalCash: parseFloat(finalCash),
          notes: closeNotes || null,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Caja cerrada — corte realizado");
      setCloseDialogVisible(false);
      setFinalCash("");
      setCloseNotes("");
      fetchCurrentRegister();
    } catch {
      toast.error("Error cerrando caja");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMovement() {
    if (!movementAmount || parseFloat(movementAmount) <= 0) {
      toast.error("Ingresa un monto válido");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/cash-register/${register!.id}/transaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: movementType,
          amount: parseFloat(movementAmount),
          description: movementDesc || null,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success(movementType === "cash_in" ? "Entrada registrada" : "Salida registrada");
      setMovementDialogVisible(false);
      setMovementAmount("");
      setMovementDesc("");
      fetchCurrentRegister();
    } catch {
      toast.error("Error registrando movimiento");
    } finally {
      setSubmitting(false);
    }
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
              <Button onClick={handleOpen} disabled={submitting}>
                {submitting ? "Abriendo..." : "Abrir Caja"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Register is open
  const expectedCash =
    parseFloat(register.initialCash) + parseFloat(register.totalSales || "0");

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
          onClick={() => {
            setMovementType("cash_in");
            setMovementDialogVisible(true);
          }}
        >
          <ArrowDown className="mr-1 size-4 text-green-600" />
          Entrada de Efectivo
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setMovementType("cash_out");
            setMovementDialogVisible(true);
          }}
        >
          <ArrowUp className="mr-1 size-4 text-red-600" />
          Salida de Efectivo
        </Button>
        <div className="flex-1" />
        <Button variant="destructive" onClick={() => setCloseDialogVisible(true)}>
          <Lock className="mr-1 size-4" />
          Cerrar Caja / Corte
        </Button>
      </div>

      {/* Close Dialog */}
      <Dialog open={closeDialogVisible} onOpenChange={setCloseDialogVisible}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cerrar Caja — Corte</DialogTitle>
            <DialogDescription>
              Cuenta el efectivo en caja y registra el monto final
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Efectivo inicial</span>
                <span>{formatCurrency(register.initialCash)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Ventas en efectivo</span>
                <span>{formatCurrency(register.totalSales)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Esperado</span>
                <span>{formatCurrency(expectedCash)}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Efectivo contado en caja</Label>
              <Input
                type="number"
                step="0.01"
                value={finalCash}
                onChange={(e) => setFinalCash(e.target.value)}
                placeholder="0.00"
                className="text-xl"
                autoFocus
              />
              {finalCash && (
                <div
                  className={`rounded p-2 text-center font-bold ${
                    parseFloat(finalCash) - expectedCash >= 0
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  Diferencia: {formatCurrency(parseFloat(finalCash) - expectedCash)}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Notas (opcional)</Label>
              <Textarea
                value={closeNotes}
                onChange={(e) => setCloseNotes(e.target.value)}
                placeholder="Observaciones del corte"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseDialogVisible(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleClose} disabled={submitting}>
              {submitting ? "Cerrando..." : "Cerrar Caja"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Movement Dialog */}
      <Dialog open={movementDialogVisible} onOpenChange={setMovementDialogVisible}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {movementType === "cash_in" ? "Entrada de Efectivo" : "Salida de Efectivo"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Monto</Label>
              <Input
                type="number"
                step="0.01"
                value={movementAmount}
                onChange={(e) => setMovementAmount(e.target.value)}
                placeholder="0.00"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Input
                value={movementDesc}
                onChange={(e) => setMovementDesc(e.target.value)}
                placeholder="Ej: Cambio de billetes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMovementDialogVisible(false)}>
              Cancelar
            </Button>
            <Button onClick={handleMovement} disabled={submitting}>
              {submitting ? "Registrando..." : "Registrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
