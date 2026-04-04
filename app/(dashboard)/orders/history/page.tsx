"use client";

import { useEffect, useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MagnifyingGlass, Eye, Receipt, ShoppingBag, Trash } from "@phosphor-icons/react";
import { toast } from "sonner";
import { format, isToday, isYesterday } from "date-fns";
import { es } from "date-fns/locale";
import type { Order } from "@/lib/types";

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
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders?status=delivered&limit=200`);
      if (res.ok) {
        const data: Order[] = await res.json();
        // Solo órdenes cobradas (paymentStatus = paid)
        setOrders(data.filter(o => o.paymentStatus === "paid"));
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteOrder(orderId: string, orderNumber: number) {
    if (!confirm(`¿Eliminar orden #${orderNumber}? Se revertirá de la caja registradora.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setOrders(orders.filter(o => o.id !== orderId));
      setSelectedOrder(null);
      toast.success(`Orden #${orderNumber} eliminada y revertida de caja`);
    } catch {
      toast.error("Error eliminando orden");
    } finally {
      setDeleting(false);
    }
  }

  const formatCurrency = (amount: string | number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(typeof amount === "string" ? parseFloat(amount) : amount);

  const filteredOrders = useMemo(() => {
    if (!search) return orders;
    const q = search.toLowerCase();
    return orders.filter(
      (o) =>
        o.orderNumber.toString().includes(q) ||
        o.customerName?.toLowerCase().includes(q) ||
        (o.table as any)?.number?.toString().includes(q)
    );
  }, [orders, search]);

  // Agrupar por día
  const groupedByDay = useMemo(() => {
    const groups: { label: string; dateKey: string; orders: Order[]; dayTotal: number }[] = [];
    const map = new Map<string, Order[]>();

    for (const order of filteredOrders) {
      const d = new Date(order.createdAt);
      const key = format(d, "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(order);
    }

    // Ordenar por fecha desc
    const sortedKeys = Array.from(map.keys()).sort((a, b) => b.localeCompare(a));

    for (const key of sortedKeys) {
      const dayOrders = map.get(key)!;
      const d = new Date(key + "T12:00:00");
      let label: string;
      if (isToday(d)) {
        label = "Hoy";
      } else if (isYesterday(d)) {
        label = "Ayer";
      } else {
        label = format(d, "EEEE d 'de' MMMM", { locale: es });
        label = label.charAt(0).toUpperCase() + label.slice(1);
      }
      const dayTotal = dayOrders.reduce((sum, o) => sum + parseFloat(o.total || "0"), 0);
      groups.push({ label, dateKey: key, orders: dayOrders, dayTotal });
    }

    return groups;
  }, [filteredOrders]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Historial de Ventas</h1>
        <Badge variant="outline" className="text-sm">
          {orders.length} órdenes
        </Badge>
      </div>

      <div className="relative">
        <MagnifyingGlass className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por #, cliente o mesa..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Cargando...
        </div>
      ) : groupedByDay.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <Receipt className="size-12 mb-3 opacity-50" />
          <p>No hay ventas registradas</p>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedByDay.map((group) => (
            <div key={group.dateKey}>
              {/* Day header */}
              <div className="flex items-center justify-between mb-3 sticky top-0 bg-background z-10 py-2">
                <h2 className="text-lg font-semibold">{group.label}</h2>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {group.orders.length} orden{group.orders.length !== 1 ? "es" : ""}
                  </span>
                  <Badge variant="secondary" className="font-semibold">
                    {formatCurrency(group.dayTotal)}
                  </Badge>
                </div>
              </div>

              {/* Orders list */}
              <div className="space-y-2">
                {group.orders.map((order) => {
                  const total = parseFloat(order.total || "0");
                  const tip = parseFloat((order as any).tip || "0");
                  const tableNum = (order as any).table?.number;

                  return (
                    <button
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className="w-full text-left rounded-lg border bg-card p-4 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-sm">
                            #{order.orderNumber}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {tableNum ? `Mesa ${tableNum}` : "Para llevar"}
                              </span>
                              {order.customerName && (
                                <span className="text-sm text-muted-foreground">
                                  — {order.customerName}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(order.createdAt), "HH:mm", { locale: es })}
                              </span>
                              {order.paymentMethod && (
                                <Badge variant="outline" className="text-xs py-0 h-5">
                                  {methodLabels[order.paymentMethod] || order.paymentMethod}
                                </Badge>
                              )}
                              {tip > 0 && (
                                <span className="text-xs text-blue-500">
                                  +{formatCurrency(tip)} propina
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold">
                            {formatCurrency(total)}
                          </span>
                          <Eye className="size-4 text-muted-foreground" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order Detail Dialog */}
      <Dialog
        open={!!selectedOrder}
        onOpenChange={() => setSelectedOrder(null)}
      >
        <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Orden #{selectedOrder?.orderNumber}
              {(() => {
                const tableNum = (selectedOrder as any)?.table?.number;
                return tableNum ? (
                  <Badge variant="secondary">Mesa {tableNum}</Badge>
                ) : (
                  <Badge variant="outline">
                    <ShoppingBag className="size-3 mr-1" />
                    Para llevar
                  </Badge>
                );
              })()}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 overflow-y-auto flex-1 pr-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>
                  {format(new Date(selectedOrder.createdAt), "EEEE d 'de' MMMM, HH:mm", { locale: es })}
                </span>
                {selectedOrder.paymentMethod && (
                  <Badge variant="outline" className="text-xs">
                    {methodLabels[selectedOrder.paymentMethod] || selectedOrder.paymentMethod}
                  </Badge>
                )}
              </div>

              {selectedOrder.customerName && (
                <p className="text-sm">
                  <strong>Cliente:</strong> {selectedOrder.customerName}
                </p>
              )}

              <div className="space-y-2">
                {(!selectedOrder.items || selectedOrder.items.length === 0) && (
                  <p className="text-sm text-muted-foreground italic">Sin detalle de productos</p>
                )}
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

              <div className="pt-3 border-t">
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  disabled={deleting}
                  onClick={() => handleDeleteOrder(selectedOrder.id, selectedOrder.orderNumber)}
                >
                  <Trash className="size-4 mr-2" />
                  {deleting ? "Eliminando..." : "Eliminar orden y revertir de caja"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
