"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Minus, Trash } from "@phosphor-icons/react";
import { toast } from "sonner";
import type { Product, Category, CartItem, Frosting, DryTopping, Extra } from "@/lib/types";

export default function BarPage() {
  const router = useRouter();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [frostings, setFrostings] = useState<Frosting[]>([]);
  const [toppings, setToppings] = useState<DryTopping[]>([]);
  const [extras, setExtras] = useState<Extra[]>([]);
  
  // Flujo de modificadores
  const [flowStep, setFlowStep] = useState<'products' | 'frostings' | 'toppings' | 'extras'>('products');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedFrosting, setSelectedFrosting] = useState<Frosting | null>(null);
  const [selectedTopping, setSelectedTopping] = useState<DryTopping | null>(null);
  const [selectedExtras, setSelectedExtras] = useState<Extra[]>([]);
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [employeeName, setEmployeeName] = useState<string>('');
  const [showDashboard, setShowDashboard] = useState(true);
  const [authStep, setAuthStep] = useState<'idle' | 'employee' | 'pin'>('idle');
  const [employeeCode, setEmployeeCode] = useState('');
  const [pin, setPin] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [cashRegisterOpen, setCashRegisterOpen] = useState(false);
  const [checkingRegister, setCheckingRegister] = useState(true);
  const [authenticating, setAuthenticating] = useState(false);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    checkCashRegister();
    restoreSession();
  }, []);

  useEffect(() => {
    const checkInactivity = setInterval(() => {
      if (employeeId) {
        const now = Date.now();
        const inactiveTime = now - lastActivity;
        const TEN_MINUTES = 10 * 60 * 1000;
        
        if (inactiveTime > TEN_MINUTES) {
          handleSessionExpired();
        }
      }
    }, 60000);

    return () => clearInterval(checkInactivity);
  }, [employeeId, lastActivity]);

  useEffect(() => {
    const updateActivity = () => setLastActivity(Date.now());
    
    window.addEventListener('click', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('touchstart', updateActivity);
    
    return () => {
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('touchstart', updateActivity);
    };
  }, []);

  function restoreSession() {
    const savedSession = localStorage.getItem('barSession');
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        const now = Date.now();
        const sessionAge = now - session.timestamp;
        const TEN_MINUTES = 10 * 60 * 1000;
        
        if (sessionAge < TEN_MINUTES) {
          setEmployeeId(session.employeeId);
          setEmployeeName(session.employeeName);
          setShowDashboard(false);
          setLastActivity(session.timestamp);
          fetchData();
        } else {
          localStorage.removeItem('barSession');
        }
      } catch (error) {
        console.error('Error restoring session:', error);
        localStorage.removeItem('barSession');
      }
    }
  }

  function saveSession(empId: string, empName: string) {
    const session = {
      employeeId: empId,
      employeeName: empName,
      timestamp: Date.now()
    };
    localStorage.setItem('barSession', JSON.stringify(session));
  }

  function handleSessionExpired() {
    localStorage.removeItem('barSession');
    setEmployeeId(null);
    setEmployeeName('');
    setShowDashboard(true);
    setCart([]);
    toast.error('Sesión expirada por inactividad');
  }

  async function checkCashRegister() {
    try {
      const res = await fetch('/api/cash-register/current');
      if (res.ok) {
        const data = await res.json();
        const isOpen = !!data;
        setCashRegisterOpen(isOpen);
      } else {
        setCashRegisterOpen(false);
      }
    } catch (error) {
      console.error('Error checking cash register:', error);
      setCashRegisterOpen(false);
    } finally {
      setCheckingRegister(false);
    }
  }

  function handleOpenComanda() {
    if (!cashRegisterOpen) {
      toast.error('La caja está cerrada. Abre la caja registradora primero.');
      return;
    }
    setAuthStep('employee');
  }

  function handleNumberClick(num: string) {
    if (authStep === 'employee') {
      if (employeeCode.length < 6) {
        setEmployeeCode(prev => prev + num);
      }
    } else if (authStep === 'pin') {
      if (pin.length < 4) {
        setPin(prev => prev + num);
      }
    }
  }

  function handleBackspace() {
    if (authStep === 'employee') {
      setEmployeeCode(prev => prev.slice(0, -1));
    } else if (authStep === 'pin') {
      setPin(prev => prev.slice(0, -1));
    }
  }

  function handleClear() {
    if (authStep === 'employee') {
      setEmployeeCode('');
    } else if (authStep === 'pin') {
      setPin('');
    }
  }

  async function handleEmployeeSubmit() {
    if (employeeCode.length !== 6) {
      toast.error('Ingresa un código de empleado válido (6 dígitos)');
      return;
    }
    setAuthStep('pin');
  }

  async function handlePinSubmit() {
    if (pin.length !== 4) {
      toast.error('Ingresa un PIN válido (4 dígitos)');
      return;
    }

    setAuthenticating(true);
    try {
      const res = await fetch('/api/employees/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: employeeCode, pin }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Código o PIN inválido');
      }

      const data = await res.json();
      handlePinSuccess(data.employee.id, data.employee.name);
    } catch (error: any) {
      toast.error(error.message || 'Error al autenticar');
      setPin('');
    } finally {
      setAuthenticating(false);
    }
  }

  function handleCancel() {
    setAuthStep('idle');
    setEmployeeCode('');
    setPin('');
  }

  async function fetchData() {
    try {
      const [productsRes, categoriesRes, frostingsRes, toppingsRes, extrasRes] = await Promise.all([
        fetch("/api/products?active=true"),
        fetch("/api/categories"),
        fetch("/api/frostings"),
        fetch("/api/dry-toppings"),
        fetch("/api/extras"),
      ]);
      
      if (productsRes.ok) setProducts(await productsRes.json());
      if (categoriesRes.ok) setCategories(await categoriesRes.json());
      if (frostingsRes.ok) setFrostings(await frostingsRes.json());
      if (toppingsRes.ok) setToppings(await toppingsRes.json());
      if (extrasRes.ok) setExtras(await extrasRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error("Error cargando datos");
    } finally {
      setLoading(false);
    }
  }

  // Iniciar flujo de modificadores
  function handleProductClick(product: Product) {
    setSelectedProduct(product);
    setSelectedFrosting(null);
    setSelectedTopping(null);
    setSelectedExtras([]);
    setFlowStep('frostings');
  }

  function handleFrostingSelect(frosting: Frosting | null) {
    setSelectedFrosting(frosting);
    setFlowStep('toppings');
  }

  function handleToppingSelect(topping: DryTopping | null) {
    setSelectedTopping(topping);
    setFlowStep('extras');
  }

  function toggleExtra(extra: Extra) {
    if (selectedExtras.find(e => e.id === extra.id)) {
      setSelectedExtras(selectedExtras.filter(e => e.id !== extra.id));
    } else {
      setSelectedExtras([...selectedExtras, extra]);
    }
  }

  function handleConfirmExtras() {
    if (!selectedProduct) return;

    const newItem: CartItem = {
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      unitPrice: parseFloat(selectedProduct.price),
      quantity: 1,
      notes: "",
      frostingId: selectedFrosting?.id,
      frostingName: selectedFrosting?.name,
      dryToppingId: selectedTopping?.id,
      dryToppingName: selectedTopping?.name,
      extraId: selectedExtras.length > 0 ? selectedExtras[0].id : undefined,
      extraName: selectedExtras.length > 0 ? selectedExtras[0].name : undefined,
    };

    setCart([...cart, newItem]);
    toast.success(`${selectedProduct.name} agregado`);
    resetFlow();
  }

  function resetFlow() {
    setFlowStep('products');
    setSelectedProduct(null);
    setSelectedFrosting(null);
    setSelectedTopping(null);
    setSelectedExtras([]);
  }

  function handleBackInFlow() {
    if (flowStep === 'frostings') {
      resetFlow();
    } else if (flowStep === 'toppings') {
      setFlowStep('frostings');
    } else if (flowStep === 'extras') {
      setFlowStep('toppings');
    }
  }

  function updateQuantity(productId: string, delta: number) {
    const item = cart.find((i) => i.productId === productId);
    if (!item) return;

    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      removeFromCart(productId);
    } else {
      setCart(
        cart.map((i) =>
          i.productId === productId ? { ...i, quantity: newQty } : i
        )
      );
    }
  }

  function removeFromCart(productId: string) {
    setCart(cart.filter((item) => item.productId !== productId));
  }

  async function handleCheckout() {
    if (cart.length === 0) {
      toast.error("El carrito está vacío");
      return;
    }
    if (!employeeId) {
      toast.error("No hay empleado autenticado");
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
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            notes: item.notes,
          })),
          employeeId,
          paymentStatus: "pending",
        }),
      });

      if (!res.ok) throw new Error();
      const order = await res.json();
      setCart([]);
      toast.success("Orden creada");
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
    setShowDashboard(false);
    setAuthStep('idle');
    setEmployeeCode('');
    setPin('');
    setLastActivity(Date.now());
    saveSession(empId, empName);
    toast.success(`Bienvenido, ${empName}`);
    fetchData();
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount);

  const cartTotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);

  // Dashboard de bienvenida
  if (showDashboard) {
    return (
      <div className="flex h-screen bg-background">
        <div className="flex-1 p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">¡Feliz Año Nuevo!</h1>
            <p className="text-muted-foreground">México y LatAm</p>
          </div>

          <div className="absolute top-8 right-8 text-right">
            <div className="text-5xl font-bold">
              {currentTime.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          <div className="mb-8 bg-card rounded-lg p-6 border">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">📝</span>
              <h2 className="text-xl font-semibold">Notas del día</h2>
            </div>
            <div className="space-y-3">
              <div>
                <div className="font-semibold">PoloTeam</div>
                <div className="text-sm text-muted-foreground">Louise Kunkaden</div>
                <p className="text-sm text-muted-foreground mt-1">
                  Recuerden empezar el nuevo año con todo y a por todo. ¡Sí les deseo un hermoso inicio de año!
                </p>
                <div className="text-xs text-muted-foreground mt-2">Hoy a las 00:00 AM</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-card rounded-lg p-6 border">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">📊</span>
                <h3 className="font-semibold">Producto más vendidos</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm">1. Cappuccino</div>
                    <div className="text-xs text-muted-foreground">820 unidades</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm">2. Americano</div>
                    <div className="text-xs text-muted-foreground">482 unidades</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm">3. Dona Moka</div>
                    <div className="text-xs text-muted-foreground">369 unidades</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg p-6 border">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">🎯</span>
                <h3 className="font-semibold">Metas del año</h3>
              </div>
              <div className="text-center py-8">
                <div className="text-6xl font-bold text-primary">47</div>
                <div className="text-sm text-muted-foreground mt-2">+5.14% versus el año pasado</div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-96 bg-card border-l flex flex-col items-center justify-center p-8">
          {authStep === 'idle' && (
            <>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold mb-2">Ingresa tu PIN</h2>
                <p className="text-muted-foreground text-sm">Para comenzar tu turno</p>
                {!cashRegisterOpen && !checkingRegister && (
                  <p className="text-destructive text-sm mt-2">⚠️ Caja cerrada</p>
                )}
              </div>
              <Button
                onClick={handleOpenComanda}
                disabled={checkingRegister}
                size="lg"
                className="px-12 py-6 text-lg"
              >
                ✓ Ingresar comanda
              </Button>
            </>
          )}

          {authStep === 'employee' && (
            <div className="w-full">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold mb-2">Código de Empleado</h2>
                <p className="text-muted-foreground text-sm">Ingresa tu código (6 dígitos)</p>
              </div>
              
              <div className="mb-6 text-center">
                <div className="text-3xl font-mono tracking-widest h-12 flex items-center justify-center">
                  {employeeCode.padEnd(6, '·')}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '←'].map((key) => (
                  <Button
                    key={key}
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      if (key === 'C') handleClear();
                      else if (key === '←') handleBackspace();
                      else handleNumberClick(key);
                    }}
                    className="h-14 text-lg"
                  >
                    {key}
                  </Button>
                ))}
              </div>

              <div className="space-y-2">
                <Button
                  onClick={handleEmployeeSubmit}
                  disabled={employeeCode.length !== 6}
                  className="w-full"
                  size="lg"
                >
                  Siguiente →
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="w-full"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {authStep === 'pin' && (
            <div className="w-full">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold mb-2">Ingresa tu PIN</h2>
                <p className="text-muted-foreground text-sm">PIN de 4 dígitos</p>
              </div>
              
              <div className="mb-6 text-center">
                <div className="text-3xl font-mono tracking-widest h-12 flex items-center justify-center">
                  {pin.split('').map((_, i) => '●').join(' ').padEnd(7, '·')}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '←'].map((key) => (
                  <Button
                    key={key}
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      if (key === 'C') handleClear();
                      else if (key === '←') handleBackspace();
                      else handleNumberClick(key);
                    }}
                    className="h-14 text-lg"
                  >
                    {key}
                  </Button>
                ))}
              </div>

              <div className="space-y-2">
                <Button
                  onClick={handlePinSubmit}
                  disabled={pin.length !== 4 || authenticating}
                  className="w-full"
                  size="lg"
                >
                  {authenticating ? 'Verificando...' : 'Ingresar ✓'}
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="w-full"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Cargando...
      </div>
    );
  }

  // Filtrar productos por categoría seleccionada
  const filteredProducts = selectedCategory
    ? products.filter(p => p.categoryId === selectedCategory)
    : [];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* SIDEBAR - CARRITO */}
      <div className="w-80 bg-card border-r flex flex-col">
        {/* Header del carrito */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold">Orden</h2>
            <span className="font-bold">{formatCurrency(cartTotal)}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {cart.length} {cart.length === 1 ? 'producto' : 'productos'}
          </div>
        </div>

        {/* Items del carrito */}
        <div className="flex-1 overflow-auto p-4 space-y-2">
          {cart.length === 0 ? (
            <div className="text-muted-foreground text-center py-8 text-sm">
              Carrito vacío
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.productId} className="bg-muted rounded-lg p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{item.productName}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatCurrency(item.unitPrice)} c/u
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFromCart(item.productId)}
                  >
                    <Trash className="size-4 text-destructive" />
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.productId, -1)}
                      className="h-8 w-8 p-0"
                    >
                      <Minus className="size-3" />
                    </Button>
                    <span className="font-semibold w-8 text-center">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.productId, 1)}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="size-3" />
                    </Button>
                  </div>
                  <span className="font-semibold">
                    {formatCurrency(item.unitPrice * item.quantity)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer - botón cobrar */}
        <div className="p-4 border-t">
          <Button
            onClick={handleCheckout}
            disabled={cart.length === 0 || submitting}
            className="w-full"
            size="lg"
          >
            {submitting ? "Procesando..." : "Cobrar"}
          </Button>
        </div>
      </div>

      {/* COLUMNA DE CATEGORÍAS */}
      <div className="w-48 border-r flex flex-col overflow-y-auto">
        {categories.map((category) => {
          const isSelected = selectedCategory === category.id;
          const categoryColor = category.color || '#6B7280';
          
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`p-4 text-left border-b transition-all ${
                isSelected ? 'font-semibold' : 'hover:bg-muted/50'
              }`}
              style={{
                backgroundColor: isSelected ? `${categoryColor}20` : 'transparent',
                borderWidth: isSelected ? '2px' : '0px',
                borderColor: isSelected ? categoryColor : 'transparent',
                color: isSelected ? categoryColor : 'inherit',
              }}
            >
              <div>{category.name}</div>
            </button>
          );
        })}
      </div>

      {/* AREA PRINCIPAL - FLUJO DINÁMICO */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header con título y botón back */}
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            {flowStep === 'products' && <h2 className="text-2xl font-bold">Selecciona un producto</h2>}
            {flowStep === 'frostings' && (
              <div>
                <h2 className="text-2xl font-bold">Escarchado</h2>
                <p className="text-sm text-muted-foreground">{selectedProduct?.name}</p>
              </div>
            )}
            {flowStep === 'toppings' && (
              <div>
                <h2 className="text-2xl font-bold">Topping Seco</h2>
                <p className="text-sm text-muted-foreground">{selectedProduct?.name}</p>
              </div>
            )}
            {flowStep === 'extras' && (
              <div>
                <h2 className="text-2xl font-bold">Extras</h2>
                <p className="text-sm text-muted-foreground">{selectedProduct?.name}</p>
              </div>
            )}
          </div>
          {flowStep !== 'products' && (
            <Button variant="outline" onClick={handleBackInFlow}>
              ← Atrás
            </Button>
          )}
        </div>

        {/* VISTA: PRODUCTOS */}
        {flowStep === 'products' && (
          <div className="flex-1 overflow-auto p-6">
            {!selectedCategory ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Selecciona una categoría para ver productos
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No hay productos en esta categoría
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-4">
                {filteredProducts.map((product) => {
                  const category = categories.find(c => c.id === product.categoryId);
                  return (
                    <button
                      key={product.id}
                      onClick={() => handleProductClick(product)}
                      className="rounded-lg overflow-hidden relative hover:scale-105 transition-transform"
                      style={{ minHeight: '140px' }}
                    >
                      {product.imageUrl ? (
                        <div className="absolute inset-0">
                          <img 
                            src={product.imageUrl} 
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/60" />
                        </div>
                      ) : (
                        <div className="absolute inset-0 bg-muted" />
                      )}
                      <div className="relative z-10 p-4 flex flex-col justify-between h-full min-h-[140px]">
                        <div className="text-left">
                          <div className={`font-semibold mb-1 ${product.imageUrl ? 'text-white' : ''}`}>
                            {product.name}
                          </div>
                          <div className={`text-sm ${product.imageUrl ? 'text-white/90' : 'text-muted-foreground'}`}>
                            {formatCurrency(parseFloat(product.price))}
                          </div>
                        </div>
                      </div>
                      <div 
                        className="absolute bottom-0 left-0 right-0 h-1"
                        style={{ backgroundColor: category?.color || '#6B7280' }}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* VISTA: ESCARCHADOS */}
        {flowStep === 'frostings' && (
          <div className="flex-1 p-8 overflow-auto">
            <div className="grid grid-cols-4 gap-4 max-w-6xl">
              <button
                onClick={() => handleFrostingSelect(null)}
                className="h-32 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center font-semibold transition-colors border-2 border-transparent hover:border-primary"
              >
                Sin escarchado
              </button>
              {frostings.map((frosting) => (
                <button
                  key={frosting.id}
                  onClick={() => handleFrostingSelect(frosting)}
                  className="h-32 rounded-lg bg-primary/10 hover:bg-primary/20 flex items-center justify-center font-semibold transition-colors border-2 border-transparent hover:border-primary"
                >
                  {frosting.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* VISTA: TOPPINGS */}
        {flowStep === 'toppings' && (
          <div className="flex-1 p-8 overflow-auto">
            <div className="grid grid-cols-4 gap-4 max-w-6xl">
              <button
                onClick={() => handleToppingSelect(null)}
                className="h-32 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center font-semibold transition-colors border-2 border-transparent hover:border-primary"
              >
                Sin topping
              </button>
              {toppings.map((topping) => (
                <button
                  key={topping.id}
                  onClick={() => handleToppingSelect(topping)}
                  className="h-32 rounded-lg bg-primary/10 hover:bg-primary/20 flex items-center justify-center font-semibold transition-colors border-2 border-transparent hover:border-primary"
                >
                  {topping.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* VISTA: EXTRAS */}
        {flowStep === 'extras' && (
          <div className="flex-1 flex flex-col p-8 overflow-auto">
            <div className="grid grid-cols-4 gap-4 max-w-6xl mb-6">
              {extras.map((extra) => (
                <button
                  key={extra.id}
                  onClick={() => toggleExtra(extra)}
                  className={`h-32 rounded-lg flex flex-col items-center justify-center font-semibold transition-colors border-2 ${
                    selectedExtras.find(e => e.id === extra.id)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted hover:bg-muted/80 border-transparent hover:border-primary'
                  }`}
                >
                  <div>{extra.name}</div>
                  <div className="text-sm opacity-80">{formatCurrency(parseFloat(extra.price))}</div>
                </button>
              ))}
            </div>
            <div className="flex gap-4 max-w-6xl">
              <Button
                onClick={handleConfirmExtras}
                size="lg"
                className="flex-1"
              >
                Agregar al carrito
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
