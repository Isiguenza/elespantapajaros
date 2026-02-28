"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Minus,
  Trash,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import type { Product, Category, CartItem, Frosting } from "@/lib/types";
import { EmployeePinModal } from "@/components/employee-pin-modal";

export default function BarPage() {
  const router = useRouter();
  
  // Products & Cart
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [frostings, setFrostings] = useState<Frosting[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [employeeName, setEmployeeName] = useState<string | null>(null);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  
  // Frosting dialog
  const [frostingDialogOpen, setFrostingDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [productsRes, categoriesRes, frostingsRes] = await Promise.all([
        fetch("/api/products?active=true"),
        fetch("/api/categories"),
        fetch("/api/frostings?active=true"),
      ]);
      if (productsRes.ok) setProducts(await productsRes.json());
      if (categoriesRes.ok) setCategories(await categoriesRes.json());
      if (frostingsRes.ok) setFrostings(await frostingsRes.json());
    } catch (error) {
      toast.error("Error cargando productos");
    } finally {
      setLoading(false);
    }
  }


  const filteredProducts = products.filter((p) => {
    const matchesCategory = !selectedCategory || p.categoryId === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const openFrostingDialog = useCallback((product: Product) => {
    setSelectedProduct(product);
    setFrostingDialogOpen(true);
  }, []);

  const addToCartWithFrosting = useCallback((frostingId: string | null, frostingName: string | null) => {
    if (!selectedProduct) return;

    setCart((prev) => {
      const existing = prev.find(
        (item) =>
          item.productId === selectedProduct.id &&
          item.frostingId === frostingId
      );
      if (existing) {
        return prev.map((item) =>
          item.productId === selectedProduct.id && item.frostingId === frostingId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          unitPrice: parseFloat(selectedProduct.price),
          quantity: 1,
          notes: "",
          frostingId,
          frostingName,
        },
      ];
    });
    setFrostingDialogOpen(false);
    setSelectedProduct(null);
  }, [selectedProduct]);

  const updateQuantity = useCallback((productId: string, frostingId: string | null | undefined, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.productId === productId && item.frostingId === frostingId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }, []);

  const removeItem = useCallback((productId: string, frostingId: string | null | undefined) => {
    setCart((prev) => prev.filter((item) => !(item.productId === productId && item.frostingId === frostingId)));
  }, []);

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);

  function initiateOrder() {
    if (cart.length === 0) {
      toast.error("Agrega al menos un producto");
      return;
    }

    if (!employeeId) {
      setPinModalOpen(true);
      return;
    }

    handleSubmitOrder();
  }

  async function handleSubmitOrder() {
    if (!employeeId) return;
    
    setSubmitting(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cart, userId: employeeId }),
      });

      if (!res.ok) throw new Error();

      const order = await res.json();
      toast.success(`Orden #${order.orderNumber} creada`);
      
      // Clear cart and redirect to payment
      setCart([]);
      router.push(`/orders/pay/${order.id}`);
    } catch (error) {
      toast.error("Error creando orden");
    } finally {
      setSubmitting(false);
    }
  }

  function handlePinSuccess(empId: string, empName: string) {
    setEmployeeId(empId);
    setEmployeeName(empName);
    setPinModalOpen(false);
    // Execute order creation after PIN verification
    setTimeout(() => handleSubmitOrder(), 100);
  }


  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Cargando...
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Take Orders + Cart - Full Width */}
      <div className="flex w-full flex-col">
        {/* Header */}
        <div className="border-b p-4">
          <h1 className="text-2xl font-bold">Vista de Bar</h1>
          <p className="text-sm text-muted-foreground">Toma órdenes y cobra</p>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Products Grid (65%) */}
          <div className="flex w-[65%] flex-col border-r">
            <div className="border-b p-4 space-y-3">
              {/* Search */}
              <div className="relative">
                <MagnifyingGlass className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar productos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Categories */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedCategory === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                >
                  Todos
                </Button>
                {categories.map((cat) => (
                  <Button
                    key={cat.id}
                    variant={selectedCategory === cat.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    {cat.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Products Grid */}
            <ScrollArea className="flex-1 p-4">
              <div className="grid grid-cols-2 gap-3">
                {filteredProducts.map((product) => (
                  <Card
                    key={product.id}
                    className="cursor-pointer transition-all hover:shadow-md active:scale-[0.98]"
                    onClick={() => openFrostingDialog(product)}
                  >
                    <CardContent className="p-3">
                      <div className="mb-2 flex aspect-square items-center justify-center rounded-lg bg-muted text-3xl">
                        🍹
                      </div>
                      <h3 className="font-medium text-sm leading-tight">
                        {product.name}
                      </h3>
                      <p className="mt-1 text-base font-bold text-primary">
                        {formatCurrency(parseFloat(product.price))}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Cart (35%) */}
          <div className="flex w-[35%] flex-col bg-muted/30">
            <div className="border-b bg-background p-4">
              <h2 className="text-lg font-semibold">Carrito</h2>
            </div>

            <ScrollArea className="flex-1 p-4">
              {cart.length === 0 ? (
                <div className="flex h-32 items-center justify-center text-muted-foreground text-sm">
                  Carrito vacío
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item, idx) => (
                    <div key={`${item.productId}-${item.frostingId}-${idx}`} className="rounded-lg border bg-background p-3 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.productName}</p>
                          {item.frostingName && (
                            <p className="text-xs text-blue-600">
                              {item.frostingName}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(item.unitPrice)} c/u
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.productId, item.frostingId)}
                        >
                          <Trash className="size-4 text-destructive" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.productId, item.frostingId, -1)}
                        >
                          <Minus className="size-3" />
                        </Button>
                        <span className="w-6 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.productId, item.frostingId, 1)}
                        >
                          <Plus className="size-3" />
                        </Button>
                        <span className="ml-auto font-semibold text-sm">
                          {formatCurrency(item.unitPrice * item.quantity)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {cart.length > 0 && (
              <div className="border-t bg-background p-4 space-y-3">
                <div className="flex items-center justify-between text-xl font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(cartTotal)}</span>
                </div>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={initiateOrder}
                  disabled={submitting}
                >
                  {submitting ? "Creando..." : "Cobrar"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Frosting Selection Dialog */}
      <Dialog open={frostingDialogOpen} onOpenChange={setFrostingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Seleccionar Escarchado</DialogTitle>
            <DialogDescription>
              {selectedProduct?.name} - Los escarchados son gratuitos
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start h-auto py-3"
              onClick={() => addToCartWithFrosting(null, null)}
            >
              <div className="text-left">
                <p className="font-medium">Sin Escarchado</p>
              </div>
            </Button>

            {frostings.map((frosting) => (
              <Button
                key={frosting.id}
                variant="outline"
                className="w-full justify-start h-auto py-3"
                onClick={() => addToCartWithFrosting(frosting.id, frosting.name)}
              >
                <div className="text-left">
                  <p className="font-medium">{frosting.name}</p>
                  {frosting.description && (
                    <p className="text-sm text-muted-foreground">
                      {frosting.description}
                    </p>
                  )}
                </div>
              </Button>
            ))}
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setFrostingDialogOpen(false);
                setSelectedProduct(null);
              }}
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Employee PIN Modal */}
      <EmployeePinModal
        open={pinModalOpen}
        onClose={() => setPinModalOpen(false)}
        onSuccess={handlePinSuccess}
        title="Identificación de Empleado"
        subtitle="Para crear la orden"
      />
    </div>
  );
}
