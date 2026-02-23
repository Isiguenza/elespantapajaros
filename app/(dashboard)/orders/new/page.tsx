"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Plus,
  Minus,
  ShoppingCart,
  Trash,
  MagnifyingGlass,
  X,
} from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { Product, Category, CartItem, Frosting } from "@/lib/types";

export default function NewOrderPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [frostings, setFrostings] = useState<Frosting[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
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

  const updateItemNotes = useCallback((productId: string, frostingId: string | null | undefined, notes: string) => {
    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId && item.frostingId === frostingId ? { ...item, notes } : item
      )
    );
  }, []);

  const removeItem = useCallback((productId: string, frostingId: string | null | undefined) => {
    setCart((prev) => prev.filter((item) => !(item.productId === productId && item.frostingId === frostingId)));
  }, []);

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);

  async function handleSubmitOrder() {
    if (cart.length === 0) {
      toast.error("Agrega al menos un producto");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            notes: item.notes || null,
          })),
          customerName: customerName || null,
          notes: orderNotes || null,
        }),
      });

      if (!res.ok) throw new Error("Error creando orden");

      const order = await res.json();
      toast.success(`Orden #${order.orderNumber} creada`);
      router.push(`/orders/pay/${order.id}`);
    } catch (error) {
      toast.error("Error al crear la orden");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Nueva Orden</h1>
        <Sheet open={cartOpen} onOpenChange={setCartOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="lg" className="relative gap-2">
              <ShoppingCart className="size-5" />
              <span>Carrito</span>
              {cartCount > 0 && (
                <Badge className="absolute -right-2 -top-2 size-6 rounded-full p-0 text-xs">
                  {cartCount}
                </Badge>
              )}
              {cartCount > 0 && (
                <span className="ml-1 font-semibold">
                  {formatCurrency(cartTotal)}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="flex w-full flex-col sm:max-w-lg">
            <SheetHeader>
              <SheetTitle>
                Carrito ({cartCount} {cartCount === 1 ? "producto" : "productos"})
              </SheetTitle>
            </SheetHeader>

            <ScrollArea className="flex-1 -mx-6 px-6">
              {cart.length === 0 ? (
                <div className="flex h-32 items-center justify-center text-muted-foreground">
                  El carrito está vacío
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div
                      key={item.productId}
                      className="rounded-lg border p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{item.productName}</p>
                          {item.frostingName && (
                            <p className="text-xs text-blue-600">
                              Escarchado: {item.frostingName}
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground">
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
                        <span className="w-8 text-center font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.productId, item.frostingId, 1)}
                        >
                          <Plus className="size-3" />
                        </Button>
                        <span className="ml-auto font-semibold">
                          {formatCurrency(item.unitPrice * item.quantity)}
                        </span>
                      </div>
                      <Input
                        placeholder="Notas (ej: sin hielo)"
                        value={item.notes}
                        onChange={(e) =>
                          updateItemNotes(item.productId, item.frostingId, e.target.value)
                        }
                        className="text-sm"
                      />
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {cart.length > 0 && (
              <>
                <Separator className="my-2" />
                <div className="space-y-3">
                  <Input
                    placeholder="Nombre del cliente (opcional)"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                  <Textarea
                    placeholder="Notas de la orden (opcional)"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    rows={2}
                  />
                  <div className="flex items-center justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(cartTotal)}</span>
                  </div>
                </div>
                <SheetFooter className="mt-2">
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleSubmitOrder}
                    disabled={submitting}
                  >
                    {submitting ? "Creando..." : "Cobrar"}
                  </Button>
                </SheetFooter>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>

      {/* Search + Categories */}
      <div className="mb-4 space-y-3">
        <div className="relative">
          <MagnifyingGlass className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar producto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="size-4 text-muted-foreground" />
            </button>
          )}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
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
              className="whitespace-nowrap"
            >
              {cat.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-16 rounded bg-muted" />
                  <div className="mt-2 h-4 w-3/4 rounded bg-muted" />
                  <div className="mt-1 h-4 w-1/2 rounded bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-muted-foreground">
            No hay productos disponibles
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.map((product) => {
              const inCart = cart.find((c) => c.productId === product.id);
              return (
                <Card
                  key={product.id}
                  className="cursor-pointer transition-all hover:shadow-md active:scale-[0.98]"
                  onClick={() => openFrostingDialog(product)}
                >
                  <CardContent className="relative p-4">
                    {product.imageUrl ? (
                      <div className="mb-2 aspect-square overflow-hidden rounded-lg bg-muted">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="size-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="mb-2 flex aspect-square items-center justify-center rounded-lg bg-muted text-3xl">
                        🍹
                      </div>
                    )}
                    <h3 className="font-medium leading-tight">
                      {product.name}
                    </h3>
                    <p className="mt-1 text-lg font-bold text-primary">
                      {formatCurrency(parseFloat(product.price))}
                    </p>
                    {inCart && (
                      <Badge className="absolute right-2 top-2">
                        {inCart.quantity}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Bottom Fixed Bar for iPad */}
      {cartCount > 0 && (
        <div className="mt-4 flex items-center justify-between rounded-lg bg-primary p-4 text-primary-foreground lg:hidden">
          <div>
            <p className="text-sm opacity-90">{cartCount} productos</p>
            <p className="text-xl font-bold">{formatCurrency(cartTotal)}</p>
          </div>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => setCartOpen(true)}
          >
            Ver Carrito
          </Button>
        </div>
      )}

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
              className="w-full justify-start h-auto py-4"
              onClick={() => addToCartWithFrosting(null, null)}
            >
              <div className="text-left">
                <p className="font-medium">Sin Escarchado</p>
                <p className="text-sm text-muted-foreground">Continuar sin escarchado</p>
              </div>
            </Button>

            {frostings.map((frosting) => (
              <Button
                key={frosting.id}
                variant="outline"
                className="w-full justify-start h-auto py-4"
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
    </div>
  );
}
