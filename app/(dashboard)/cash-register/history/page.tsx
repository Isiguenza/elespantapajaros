"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye } from "@phosphor-icons/react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Separator } from "@/components/ui/separator";
import type { CashRegister } from "@/lib/types";

export default function CashRegisterHistoryPage() {
  const [registers, setRegisters] = useState<CashRegister[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CashRegister | null>(null);

  useEffect(() => {
    fetchRegisters();
  }, []);

  async function fetchRegisters() {
    try {
      const res = await fetch("/api/cash-register?status=closed");
      if (res.ok) setRegisters(await res.json());
    } catch {
      console.error("Error fetching registers");
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (amount: string | number | null) => {
    if (amount === null) return "$0.00";
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(typeof amount === "string" ? parseFloat(amount) : amount);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Historial de Cortes</h1>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Apertura</TableHead>
                <TableHead>Cierre</TableHead>
                <TableHead className="text-right">Inicial</TableHead>
                <TableHead className="text-right">Ventas</TableHead>
                <TableHead className="text-right">Final</TableHead>
                <TableHead className="text-right">Diferencia</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : registers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                    No hay cortes registrados
                  </TableCell>
                </TableRow>
              ) : (
                registers.map((reg) => {
                  const diff = parseFloat(reg.difference || "0");
                  return (
                    <TableRow key={reg.id}>
                      <TableCell>
                        {format(new Date(reg.openedAt), "dd MMM yyyy", { locale: es })}
                      </TableCell>
                      <TableCell>
                        {format(new Date(reg.openedAt), "HH:mm")}
                      </TableCell>
                      <TableCell>
                        {reg.closedAt
                          ? format(new Date(reg.closedAt), "HH:mm")
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(reg.initialCash)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(reg.totalSales)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(reg.finalCash)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            diff >= 0 ? "text-green-600" : "text-destructive"
                          }
                        >
                          {formatCurrency(diff)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelected(reg)}
                        >
                          <Eye className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Detalle de Corte —{" "}
              {selected &&
                format(new Date(selected.openedAt), "dd MMM yyyy", {
                  locale: es,
                })}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Apertura</span>
                <span>{format(new Date(selected.openedAt), "HH:mm")}</span>
                <span className="text-muted-foreground">Cierre</span>
                <span>
                  {selected.closedAt
                    ? format(new Date(selected.closedAt), "HH:mm")
                    : "—"}
                </span>
                <span className="text-muted-foreground">Órdenes</span>
                <span>{selected.totalOrders || 0}</span>
              </div>
              <Separator />
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Efectivo inicial</span>
                  <span>{formatCurrency(selected.initialCash)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Ventas</span>
                  <span>{formatCurrency(selected.totalSales)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Esperado</span>
                  <span>{formatCurrency(selected.expectedCash)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Contado</span>
                  <span>{formatCurrency(selected.finalCash)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Diferencia</span>
                  <span
                    className={
                      parseFloat(selected.difference || "0") >= 0
                        ? "text-green-600"
                        : "text-destructive"
                    }
                  >
                    {formatCurrency(selected.difference)}
                  </span>
                </div>
              </div>
              {selected.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground">Notas</p>
                    <p className="text-sm">{selected.notes}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
