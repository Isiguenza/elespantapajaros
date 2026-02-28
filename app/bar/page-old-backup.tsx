"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Minus, Trash, X } from "@phosphor-icons/react";
import { toast } from "sonner";
import type { Product, Category, CartItem } from "@/lib/types";

export default function BarPage() {
  const router = useRouter();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
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

  // Verificar inactividad cada minuto
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
    }, 60000); // Check every minute

    return () => clearInterval(checkInactivity);
  }, [employeeId, lastActivity]);

  // Actualizar actividad en interacciones
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
        console.log('Cash register check:', { data, isOpen });
        setCashRegisterOpen(isOpen);
      } else {
        console.log('Cash register not found, status:', res.status);
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
    console.log('handleOpenComanda called, cashRegisterOpen:', cashRegisterOpen);
    if (!cashRegisterOpen) {
      toast.error('La caja está cerrada. Abre la caja registradora primero.');
      return;
    }
    console.log('Starting auth flow...');
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
      const [productsRes, categoriesRes] = await Promise.all([
        fetch("/api/products?active=true"),
        fetch("/api/categories"),
      ]);
      if (productsRes.ok) setProducts(await productsRes.json());
      if (categoriesRes.ok) setCategories(await categoriesRes.json());
    } catch (error) {
      toast.error("Error cargando datos");
    } finally {
      setLoading(false);
    }
  }

  const filteredProducts = products.filter((p) => 
    !selectedCategory || p.categoryId === selectedCategory
  );

  function addToCart(product: Product) {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: parseFloat(product.price),
        notes: "",
        frostingId: null,
        frostingName: null,
        dryToppingId: null,
        dryToppingName: null,
        extraId: null,
        extraName: null,
      }];
    });
  }

  function updateQuantity(productId: string, delta: number) {
    setCart(prev => {
      return prev
        .map(item => {
          if (item.productId === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null);
    });
  }

  function removeFromCart(productId: string) {
    setCart(prev => prev.filter(item => item.productId !== productId));
  }

  async function handleCheckout() {
    if (!employeeId) {
      toast.error("Debes identificarte primero");
      return;
    }
    if (cart.length === 0) {
      toast.error("El carrito está vacío");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId,
          items: cart.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            frostingId: item.frostingId,
            dryToppingId: item.dryToppingId,
            extraId: item.extraId,
          })),
        }),
      });

      if (!res.ok) throw new Error();
      const order = await res.json();
      
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

  const productColors = [
    "bg-orange-600", "bg-pink-600", "bg-purple-600", "bg-blue-600",
    "bg-green-600", "bg-yellow-600", "bg-red-600", "bg-indigo-600"
  ];

  if (showDashboard) {
    return (
      <div className="flex h-screen bg-background">
        {/* Dashboard izquierda */}
        <div className="flex-1 p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">¡Feliz Año Nuevo!</h1>
            <p className="text-muted-foreground">México y LatAm</p>
          </div>

          {/* Reloj */}
          <div className="absolute top-8 right-8 text-right">
            <div className="text-5xl font-bold">
              {currentTime.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          {/* Notas del día */}
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

          {/* Grid de stats */}
          <div className="grid grid-cols-2 gap-6">
            {/* Productos más vendidos */}
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

            {/* Metas del año */}
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

        {/* Numpad derecha */}
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
      <div className="flex h-screen items-center justify-center bg-black text-white">
        Cargando...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-black">
      {/* SIDEBAR - CARRITO */}
      <div className="w-80 bg-neutral-900 border-r border-neutral-800 flex flex-col">
        {/* Header del carrito */}
        <div className="p-4 border-b border-neutral-800">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-white font-semibold">Nombre</h2>
            <span className="text-white font-bold">${cartTotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="flex-1">
              <X className="size-4" />
            </Button>
            <span className="text-neutral-400 text-sm">2</span>
          </div>
        </div>

        {/* Items del carrito */}
        <div className="flex-1 overflow-auto p-4 space-y-2">
          {cart.length === 0 ? (
            <div className="text-neutral-500 text-center py-8">
              Carrito vacío
            </div>
          ) : (
            cart.map((item, idx) => (
              <div key={item.productId} className="bg-neutral-800 rounded-lg p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="text-white font-medium text-sm">{idx + 1}. {item.productName}</div>
                    {item.frostingName && (
                      <div className="text-neutral-400 text-xs">◻ {item.frostingName}</div>
                    )}
                    {item.dryToppingName && (
                      <div className="text-neutral-400 text-xs">↙ Tamaño Medio</div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFromCart(item.productId)}
                  >
                    <Trash className="size-4 text-red-500" />
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.productId, -1)}
                    >
                      <Minus className="size-3" />
                    </Button>
                    <span className="text-white font-semibold w-8 text-center">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.productId, 1)}
                    >
                      <Plus className="size-3" />
                    </Button>
                  </div>
                  <div className="text-white font-semibold">
                    {formatCurrency(item.unitPrice * item.quantity)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer - Total y cobrar */}
        <div className="p-4 border-t border-neutral-800 space-y-3">
          <div className="flex items-center justify-between text-white">
            <span className="text-lg">Total</span>
            <span className="text-2xl font-bold">{formatCurrency(cartTotal)}</span>
          </div>
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            size="lg"
            onClick={handleCheckout}
            disabled={submitting || cart.length === 0}
          >
            {submitting ? "Procesando..." : "Cobrar"}
          </Button>
        </div>
      </div>

      {/* AREA PRINCIPAL - PRODUCTOS */}
      <div className="flex-1 flex flex-col">
        {/* Top bar - Categorías */}
        <div className="p-4 border-b border-neutral-800">
          <div className="flex gap-2 overflow-x-auto">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              onClick={() => setSelectedCategory(null)}
              className="whitespace-nowrap"
            >
              Todo
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(cat.id)}
                className="whitespace-nowrap"
              >
                {cat.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Grid de productos */}
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-4 gap-4">
            {filteredProducts.map((product, idx) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className={`${productColors[idx % productColors.length]} rounded-lg p-4 text-left hover:opacity-90 transition-opacity`}
              >
                <div className="text-white font-semibold mb-1">{product.name}</div>
                <div className="text-white text-sm opacity-90">{formatCurrency(parseFloat(product.price))}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
