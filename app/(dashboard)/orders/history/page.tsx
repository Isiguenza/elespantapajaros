"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MagnifyingGlass, Eye } from "@phosphor-icons/react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Order } from "@/lib/types";

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  preparing: "Preparando",
  ready: "Lista",
  delivered: "Entregada",
  cancelled: "Cancelada",
};

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  preparing: "secondary",
  ready: "default",
  delivered: "default",
  cancelled: "destructive",
};

const paymentLabels: Record<string, string> = {
  pending: "Pendiente",
  paid: "Pagado",
  failed: "Fallido",
  refunded: "Reembolsado",
};

const methodLabels: Record<string, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  terminal_mercadopago: "Terminal",
  split: "Dividido",
};

const splitMethodLabels: Record<string, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  terminal_mercadopago: "Terminal",
};

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  async function fetchOrders() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/orders?${params.toString()}&limit=100`);
      if (res.ok) setOrders(await res.json());
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (amount: string | number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(typeof amount === "string" ? parseFloat(amount) : amount);

  const filteredOrders = orders.filter((o) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      o.orderNumber.toString().includes(q) ||
      o.customerName?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Historial de Órdenes</h1>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por # o cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="preparing">Preparando</SelectItem>
            <SelectItem value="ready">Lista</SelectItem>
            <SelectItem value="delivered">Entregada</SelectItem>
            <SelectItem value="cancelled">Cancelada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">#</TableHead>
                <TableHead>Mesa</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
                <TableHead className="text-right">Propina</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-32 text-center">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-32 text-center text-muted-foreground">
                    No hay órdenes
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => {
                  const subtotal = parseFloat((order as any).subtotal || "0");
                  const tip = parseFloat((order as any).tip || "0");
                  const total = parseFloat(order.total || "0");
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-bold">
                        {order.orderNumber}
                      </TableCell>
                      <TableCell className="text-sm">
                        {(order as any).tableId ? `Mesa` : "Para llevar"}
                      </TableCell>
                      <TableCell>{order.customerName || "—"}</TableCell>
                      <TableCell className="text-right text-sm">
                        {formatCurrency(subtotal || total)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {tip > 0 ? (
                          <span className="text-blue-400">
                            {formatCurrency(tip)}
                            <span className="text-blue-400/60 ml-1 text-xs">
                              {(() => {
                                const s = subtotal || total;
                                if (s > 0) {
                                  const pct = Math.round((tip / s) * 100);
                                  if ([10, 15, 20].includes(pct)) return `(${pct}%)`;
                                  return "(Otro)";
                                }
                                return "";
                              })()}
                            </span>
                          </span>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(total)}
                      </TableCell>
                      <TableCell>
                        {order.paymentMethod ? (
                          <Badge variant="outline" className="text-xs">
                            {methodLabels[order.paymentMethod] || order.paymentMethod}
                          </Badge>
                        ) : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariants[order.status]}>
                          {statusLabels[order.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(order.createdAt), "dd MMM HH:mm", {
                          locale: es,
                        })}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
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

      {/* Order Detail Dialog */}
      <Dialog
        open={!!selectedOrder}
        onOpenChange={() => setSelectedOrder(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Orden #{selectedOrder?.orderNumber}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Badge variant={statusVariants[selectedOrder.status]}>
                  {statusLabels[selectedOrder.status]}
                </Badge>
                <Badge variant="outline">
                  {paymentLabels[selectedOrder.paymentStatus]}
                </Badge>
              </div>
              {selectedOrder.customerName && (
                <p className="text-sm">
                  <strong>Cliente:</strong> {selectedOrder.customerName}
                </p>
              )}
              <div className="space-y-2">
                {selectedOrder.items?.map((item) => {
                  const isVoided = (item as any).voided;
                  return (
                    <div
                      key={item.id}
                      className={`flex justify-between text-sm ${isVoided ? 'line-through opacity-50' : ''}`}
                    >
                      <div>
                        <span>{item.quantity}x {item.productName}</span>
                        {isVoided && (item as any).voidReason && (
                          <p className="text-xs text-red-400 no-underline">
                            Eliminado: {(item as any).voidReason}
                          </p>
                        )}
                      </div>
                      <span className="font-medium">
                        {formatCurrency(item.subtotal)}
                      </span>
                    </div>
                  );
                })}
                {(() => {
                  const subtotal = parseFloat((selectedOrder as any).subtotal || "0");
                  const tip = parseFloat((selectedOrder as any).tip || "0");
                  const total = parseFloat(selectedOrder.total || "0");
                  
                  // Intentar parsear splitBillData
                  let splitData: any = null;
                  try {
                    const raw = (selectedOrder as any).splitBillData;
                    if (raw) {
                      splitData = typeof raw === "string" ? JSON.parse(raw) : raw;
                      if (!splitData?.finalized) splitData = null;
                    }
                  } catch { splitData = null; }
                  
                  return (
                    <>
                      {/* Desglose por persona si fue cuenta dividida */}
                      {splitData && splitData.persons && (
                        <div className="border-t pt-3 space-y-3">
                          <p className="text-sm font-semibold text-muted-foreground">
                            Cuenta dividida — {splitData.guestCount} pax
                          </p>
                          {splitData.persons.map((person: any, idx: number) => (
                            <div key={idx} className="bg-muted/30 rounded-lg p-3 space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold">Pax {idx + 1}</span>
                                <Badge variant="outline" className="text-xs">
                                  {splitMethodLabels[person.method] || person.method || "—"}
                                </Badge>
                              </div>
                              {person.items?.map((item: any, iIdx: number) => (
                                <div key={iIdx} className="flex justify-between text-xs text-muted-foreground">
                                  <span>{item.qty}x {item.name}</span>
                                  <span>{formatCurrency(item.price)}</span>
                                </div>
                              ))}
                              <div className="flex justify-between text-xs pt-1 border-t border-border/50">
                                <span>Subtotal</span>
                                <span>{formatCurrency(person.subtotal)}</span>
                              </div>
                              {person.tipAmount > 0 && (
                                <div className="flex justify-between text-xs text-blue-400">
                                  <span>Propina ({person.tipLabel})</span>
                                  <span>{formatCurrency(person.tipAmount)}</span>
                                </div>
                              )}
                              <div className="flex justify-between text-sm font-semibold">
                                <span>Total</span>
                                <span>{formatCurrency(person.total)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Totales generales */}
                      {subtotal > 0 && tip > 0 && (
                        <>
                          <div className="flex justify-between border-t pt-2 text-sm">
                            <span>Subtotal</span>
                            <span>{formatCurrency(subtotal)}</span>
                          </div>
                          <div className="flex justify-between text-sm text-blue-400">
                            <span>Propina {(() => {
                              if (splitData) return "";
                              if (subtotal > 0 && tip > 0) {
                                const pct = Math.round((tip / subtotal) * 100);
                                if ([10, 15, 20].includes(pct)) return `(${pct}%)`;
                                return "(Otro)";
                              }
                              return "";
                            })()}</span>
                            <span>{formatCurrency(tip)}</span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between border-t pt-2 text-lg font-bold">
                        <span>Total</span>
                        <span>{formatCurrency(total)}</span>
                      </div>
                    </>
                  );
                })()}
              </div>
              <p className="text-xs text-muted-foreground">
                {format(new Date(selectedOrder.createdAt), "PPpp", {
                  locale: es,
                })}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
