"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, Trash, MagnifyingGlass, DotsThree, QrCode, Stamp, Camera, X, Money, CreditCard, Check, Spinner, Bank, House, Coffee, ShoppingBag, Users } from "@phosphor-icons/react";
import { SlideToConfirm } from "@/components/ui/slide-to-confirm";
import { toast } from "sonner";
import type { Product, Category, CartItem, Frosting, DryTopping, Extra, LoyaltyCard, CategoryFlow, ModifierStep, ModifierOption, Table, Order } from "@/lib/types";

export default function BarPage() {
  const router = useRouter();
  
  // Estados del sistema de mesas
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [showTableSelection, setShowTableSelection] = useState(true);
  const [deliveryOrders, setDeliveryOrders] = useState<Order[]>([]);
  const [showCustomerNameDialog, setShowCustomerNameDialog] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [tablesWithReadyItems, setTablesWithReadyItems] = useState<Set<string>>(new Set());
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [frostings, setFrostings] = useState<Frosting[]>([]);
  const [toppings, setToppings] = useState<DryTopping[]>([]);
  const [extras, setExtras] = useState<Extra[]>([]);
  
  // Estados para variantes de productos
  const [showVariantDialog, setShowVariantDialog] = useState(false);
  const [selectedProductForVariant, setSelectedProductForVariant] = useState<Product | null>(null);
  
  // Estados para diálogo de comentarios
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [pendingCartItem, setPendingCartItem] = useState<CartItem | null>(null);
  const [tempNotes, setTempNotes] = useState("");
  
  // Estados para número de personas
  const [guestCount, setGuestCount] = useState(2);
  const [showGuestCountDialog, setShowGuestCountDialog] = useState(false);
  const [tempGuestCount, setTempGuestCount] = useState(2);
  
  // Flujo de modificadores dinámico
  const [categoryFlow, setCategoryFlow] = useState<CategoryFlow | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1); // -1 = productos
  const [stepSelections, setStepSelections] = useState<Record<string, any>>({});
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Estados legacy para compatibilidad (se usarán según el tipo de paso)
  const [selectedFrosting, setSelectedFrosting] = useState<Frosting | null>(null);
  const [selectedTopping, setSelectedTopping] = useState<DryTopping | null>(null);
  const [selectedExtras, setSelectedExtras] = useState<Extra[]>([]);
  const [productNotes, setProductNotes] = useState<string>("");
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Estados de pago inline
  const [showingPayment, setShowingPayment] = useState(false);
  const [showingLoyaltyStep, setShowingLoyaltyStep] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "terminal_mercadopago" | "transfer" | null>(null);
  const [cashReceived, setCashReceived] = useState("");
  
  // Estados de propina
  const [tipPercentage, setTipPercentage] = useState<number>(0);
  const [customTip, setCustomTip] = useState<string>("");
  const [showCustomTip, setShowCustomTip] = useState(false);
  
  // Estados de división de cuenta
  const [splitBillMode, setSplitBillMode] = useState(false);
  const [currentPersonIndex, setCurrentPersonIndex] = useState(0); // Para carousel
  const [itemAssignments, setItemAssignments] = useState<Record<number, number[]>>({}); // personIndex -> [cartItemIndexes]
  const [individualPayments, setIndividualPayments] = useState<Record<number, { paid: boolean, method: string | null, amount: number }>>({}); // personIndex -> payment info
  const [individualTips, setIndividualTips] = useState<Record<number, { percentage: number, custom: string, showCustom: boolean }>>({}); // propina por persona
  const [showIndividualDetails, setShowIndividualDetails] = useState(true); // Para colapsar/expandir cuentas
  const [waitingForTerminal, setWaitingForTerminal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [confirmingOrder, setConfirmingOrder] = useState(false);
  
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
  
  // Loyalty card states
  const [loyaltyCard, setLoyaltyCard] = useState<LoyaltyCard | null>(null);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [manualStampDialogOpen, setManualStampDialogOpen] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [manualBarcodeInput, setManualBarcodeInput] = useState("");
  const [loadingCard, setLoadingCard] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanningRef = useRef<boolean>(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    checkCashRegister();
    restoreSession();
    // No cargar mesas ni delivery orders hasta que se muestre la pantalla de selección
    // Esto acelera la carga inicial
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
    if (selectedCategory) {
      loadCategoryFlow(selectedCategory);
    }
  }, [selectedCategory]);

  // Recargar mesas y delivery orders cuando se muestra la pantalla de selección
  useEffect(() => {
    if (showTableSelection) {
      console.log("🔄 Recargando mesas y delivery orders...");
      fetchTables();
      fetchDeliveryOrders();
    }
  }, [showTableSelection]);

  // Polling para actualizar estado de items del carrito automáticamente
  useEffect(() => {
    if (!selectedTable && !customerName) return; // No hay mesa/orden activa
    if (cart.length === 0) return; // No hay items
    
    const interval = setInterval(async () => {
      try {
        // Obtener IDs únicos de órdenes en el carrito
        const orderIds = [...new Set(cart.filter(item => item.orderId).map(item => item.orderId))];
        
        if (orderIds.length === 0) return;
        
        // Consultar estado de cada orden
        for (const orderId of orderIds) {
          const res = await fetch(`/api/orders/${orderId}`);
          if (res.ok) {
            const order = await res.json();
            
            // Actualizar estado de items en el carrito
            setCart(prevCart => {
              return prevCart.map(item => {
                if (item.orderId === orderId) {
                  // Buscar el item correspondiente en la orden
                  const orderItem = order.items?.find((oi: any) => oi.id === item.itemId);
                  if (orderItem) {
                    return {
                      ...item,
                      orderStatus: order.status,
                      deliveredToTable: orderItem.deliveredToTable || false,
                    };
                  }
                }
                return item;
              });
            });
          }
        }
      } catch (error) {
        console.error('Error polling order status:', error);
      }
    }, 3000); // Cada 3 segundos
    
    return () => clearInterval(interval);
  }, [cart.length, selectedTable, customerName]);

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

  async function fetchTables() {
    try {
      const res = await fetch("/api/tables");
      if (res.ok) {
        const data = await res.json();
        setTables(data);
        // Verificar qué mesas tienen items ready
        await checkTablesWithReadyItems(data);
      }
    } catch (error) {
      console.error('Error fetching tables:', error);
      toast.error("Error cargando mesas");
    }
  }

  async function checkTablesWithReadyItems(tablesToCheck: Table[]) {
    try {
      const tablesWithReady = new Set<string>();
      
      // Verificar cada mesa ocupada
      for (const table of tablesToCheck) {
        if (table.status === "occupied") {
          const ordersRes = await fetch(`/api/orders?tableId=${table.id}&status=ready`);
          if (ordersRes.ok) {
            const orders = await ordersRes.json();
            if (orders.length > 0) {
              tablesWithReady.add(table.id);
            }
          }
        }
      }
      
      setTablesWithReadyItems(tablesWithReady);
    } catch (error) {
      console.error('Error checking tables with ready items:', error);
    }
  }

  async function fetchDeliveryOrders() {
    try {
      // Cargar órdenes Para Llevar activas (sin mesa, status preparing, ready o pending)
      const res = await fetch("/api/orders?status=preparing,ready,pending&noTable=true");
      if (res.ok) {
        const deliveryOnly = await res.json();
        setDeliveryOrders(deliveryOnly);
      }
    } catch (error) {
      console.error('Error fetching delivery orders:', error);
    }
  }

  async function handleSelectTable(table: Table) {
    setSelectedTable(table);
    setShowTableSelection(false);
    
    // Cargar todas las órdenes de la mesa (preparing, ready, pending)
    try {
      console.log("📋 Cargando órdenes de mesa:", table.id);
      
      // Buscar órdenes de esta mesa con status preparing, ready o pending
      const ordersRes = await fetch(`/api/orders?tableId=${table.id}&status=preparing,ready,pending`);
      
      if (ordersRes.ok) {
        const orders = await ordersRes.json();
        console.log("📦 Órdenes encontradas:", orders);
        console.log("📊 Cantidad de órdenes:", orders.length);
        orders.forEach((order: any) => {
          console.log(`  - Orden ${order.id}: status=${order.status}, items=${order.items?.length || 0}, paymentStatus=${order.paymentStatus}`);
        });
        
        // Verificar si hay órdenes con status delivered (no deberían aparecer)
        const deliveredOrders = orders.filter((o: any) => o.status === 'delivered');
        if (deliveredOrders.length > 0) {
          console.error("⚠️ ERROR: Se encontraron órdenes con status 'delivered' que no deberían estar aquí:", deliveredOrders);
        }
        
        if (orders.length > 0) {
          // Combinar todos los items de todas las órdenes
          const allCartItems: CartItem[] = [];
          
          for (const order of orders) {
            console.log(`🔄 Procesando orden ${order.id} con status ${order.status}`);
            const items = order.items.map((item: any) => ({
              productId: item.productId,
              productName: item.productName,
              unitPrice: parseFloat(item.unitPrice),
              quantity: item.quantity,
              notes: item.notes || "",
              frostingId: item.frostingId,
              frostingName: item.frostingName,
              dryToppingId: item.dryToppingId,
              dryToppingName: item.dryToppingName,
              extraId: item.extraId,
              extraName: item.extraName,
              customModifiers: item.customModifiers,
              sentToKitchen: order.status === "preparing" || order.status === "ready" || order.status === "delivered", // Marcar como enviados
              orderStatus: order.status, // Guardar status para mostrar badge correcto
              orderId: order.id, // Guardar ID de la orden
              itemId: item.id, // Guardar ID del item en BD
              deliveredToTable: item.deliveredToTable || false, // Estado de entrega física
            }));
            allCartItems.push(...items);
          }
          
          console.log("🛒 Items cargados al carrito:", allCartItems);
          setCart(allCartItems);
          setCurrentOrderId(orders[0].id); // Usar el ID de la primera orden
          toast.success(`Cuenta de Mesa ${table.number} cargada (${allCartItems.length} items)`);
        } else {
          toast.success(`Mesa ${table.number} seleccionada`);
        }
      }
    } catch (error) {
      console.error('Error loading table orders:', error);
      toast.error("Error cargando cuenta de la mesa");
    }
  }

  function handleChangeTable() {
    setShowTableSelection(true);
    setSelectedTable(null);
    setCart([]);
    setCurrentOrderId(null);
    setCustomerName("");
  }

  function handleNewDeliveryOrder() {
    console.log("🛍️ handleNewDeliveryOrder called");
    const name = prompt("Nombre del cliente (opcional):");
    setCustomerName(name || "");
    setSelectedTable(null);
    setGuestCount(1); // Para llevar es 1 persona por default
    setShowTableSelection(false);
  }

  function handleConfirmCustomerName() {
    if (!customerName.trim()) {
      toast.error("Por favor ingresa el nombre del cliente");
      return;
    }
    
    setShowCustomerNameDialog(false);
    toast.success(`Orden Para Llevar - ${customerName}`);
  }

  async function handleSelectDeliveryOrder(order: Order) {
    setSelectedTable(null);
    setShowTableSelection(false);
    setCustomerName(order.customerName || "");
    
    // Cargar items de la orden al carrito
    try {
      const items = order.items?.map((item: any) => ({
        productId: item.productId,
        productName: item.productName,
        unitPrice: parseFloat(item.unitPrice),
        quantity: item.quantity,
        notes: item.notes || "",
        frostingId: item.frostingId,
        frostingName: item.frostingName,
        dryToppingId: item.dryToppingId,
        dryToppingName: item.dryToppingName,
        extraId: item.extraId,
        extraName: item.extraName,
        customModifiers: item.customModifiers,
        sentToKitchen: order.status === "preparing" || order.status === "ready" || order.status === "delivered",
        orderStatus: order.status,
        orderId: order.id,
        itemId: item.id,
        deliveredToTable: item.deliveredToTable || false,
      })) || [];
      
      setCart(items);
      setCurrentOrderId(order.id);
      toast.success(`Orden Para Llevar - ${order.customerName || `#${order.orderNumber}`} cargada`);
    } catch (error) {
      console.error('Error loading delivery order:', error);
      toast.error("Error cargando orden");
    }
  }

  async function handleMarkAsDelivered(index: number) {
    const item = cart[index];
    if (!item.itemId) {
      toast.error("No se puede marcar este item");
      return;
    }
    
    try {
      // Actualizar deliveredToTable en BD
      const res = await fetch(`/api/order-items/${item.itemId}/delivered`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveredToTable: true }),
      });
      
      if (!res.ok) throw new Error();
      
      // Actualizar en estado local
      const updatedCart = [...cart];
      updatedCart[index] = {
        ...updatedCart[index],
        deliveredToTable: true,
      };
      
      setCart(updatedCart);
      toast.success("Platillo marcado como entregado");
    } catch (error) {
      console.error('Error marking as delivered:', error);
      toast.error("Error al marcar como entregado");
    }
  }

  async function handleReleaseTable() {
    const orderType = selectedTable ? `Mesa ${selectedTable.number}` : `Orden Para Llevar - ${customerName}`;
    
    // Confirmar si hay items en el carrito
    if (cart.length > 0) {
      const confirmed = window.confirm(
        `¿Liberar ${orderType}?\n\nHay ${cart.length} items en el carrito que se perderán.`
      );
      if (!confirmed) return;
    }

    try {
      // Si hay mesa, cancelar todas las órdenes activas de la mesa
      if (selectedTable) {
        console.log("🗑️ Liberando mesa:", selectedTable.id);
        
        // Buscar todas las órdenes activas de esta mesa
        const ordersRes = await fetch(`/api/orders?tableId=${selectedTable.id}&status=preparing,ready,pending,delivered`);
        if (ordersRes.ok) {
          const orders = await ordersRes.json();
          console.log(`📦 Órdenes a cancelar: ${orders.length}`, orders);
          
          // Cancelar cada orden
          for (const order of orders) {
            console.log(`❌ Cancelando orden ${order.id}`);
            const cancelRes = await fetch(`/api/orders/${order.id}/status`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "cancelled" }),
            });
            console.log(`✅ Orden ${order.id} cancelada:`, cancelRes.ok);
          }
        } else {
          console.error("❌ Error buscando órdenes:", ordersRes.status);
        }
        
        // Actualizar estado de mesa a "available"
        const res = await fetch(`/api/tables/${selectedTable.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...selectedTable,
            status: "available",
          }),
        });

        if (!res.ok) throw new Error();
      }
      
      // Si hay orden creada (Para Llevar con items enviados a cocina), marcarla como cancelada
      if (currentOrderId && !selectedTable) {
        await fetch(`/api/orders/${currentOrderId}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "cancelled" }),
        });
      }

      toast.success(`${orderType} liberada`);
      
      // Volver a selección de mesas
      setShowTableSelection(true);
      setSelectedTable(null);
      setCart([]);
      setCurrentOrderId(null);
      setCustomerName("");
      
      // Recargar mesas y delivery orders
      fetchTables();
      fetchDeliveryOrders();
    } catch (error) {
      toast.error("Error liberando orden");
    }
  }

  async function handleSendToKitchen() {
    console.log("🍳 handleSendToKitchen called");
    
    // Verificar que hay items pendientes de enviar
    const pendingItems = cart.filter(item => !item.sentToKitchen);
    
    if (pendingItems.length === 0) {
      toast.error("No hay items pendientes para enviar a cocina");
      return;
    }

    const itemsData = pendingItems.map(item => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      notes: item.notes || "",
      frostingId: item.frostingId || null,
      frostingName: item.frostingName || null,
      dryToppingId: item.dryToppingId || null,
      dryToppingName: item.dryToppingName || null,
      extraId: item.extraId || null,
      extraName: item.extraName || null,
      customModifiers: item.customModifiers || null,
    }));

    try {
      // SIEMPRE crear una nueva orden para evitar confusión en cocina
      console.log("🆕 Creando nueva orden separada");
      const orderData = {
        tableId: selectedTable?.id || null,
        items: itemsData,
        status: "preparing",
        paymentMethod: null,
        loyaltyCardId: null,
        customerName: customerName || null,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error creating order");
      }

      const createdOrder = await res.json();
      console.log("✅ Nueva orden creada:", createdOrder.id);
      const orderId = createdOrder.id;
      
      // Si no había currentOrderId, guardarlo
      if (!currentOrderId) {
        setCurrentOrderId(createdOrder.id);
      }
      
      // Actualizar estado de la mesa a "occupied" solo si hay mesa seleccionada
      if (selectedTable) {
        await fetch(`/api/tables/${selectedTable.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...selectedTable,
            status: "occupied",
          }),
        });
      }

      // Marcar items como enviados a cocina en el carrito local
      const updatedCart: CartItem[] = cart.map(item => 
        item.sentToKitchen ? item : { ...item, sentToKitchen: true, orderId: orderId, orderStatus: "preparing" as const } as CartItem
      );
      setCart(updatedCart);
      
      const orderType = selectedTable ? `Mesa ${selectedTable.number}` : "Para Llevar";
      toast.success(`${pendingItems.length} items enviados a cocina (${orderType})`);
      
      // Recargar órdenes delivery si es Para Llevar
      if (!selectedTable) {
        fetchDeliveryOrders();
      }
    } catch (error) {
      toast.error("Error enviando a cocina");
      console.error("Error:", error);
    }
  }

  async function fetchData() {
    try {
      // Cargar categorías y datos esenciales al inicio
      const [categoriesRes, frostingsRes, toppingsRes, extrasRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/frostings"),
        fetch("/api/dry-toppings"),
        fetch("/api/extras"),
      ]);
      
      if (categoriesRes.ok) setCategories(await categoriesRes.json());
      if (frostingsRes.ok) setFrostings(await frostingsRes.json());
      if (toppingsRes.ok) setToppings(await toppingsRes.json());
      if (extrasRes.ok) setExtras(await extrasRes.json());
      
      // Cargar productos en segundo plano (sin caché por quota issues)
      fetchAndCacheProducts();
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error("Error cargando datos");
    } finally {
      setLoading(false);
    }
  }
  
  async function fetchAndCacheProducts() {
    try {
      const productsRes = await fetch("/api/products?active=true");
      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData);
        // No guardar en localStorage - causa quota exceeded error
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  }

  // Cargar flujo de categoría y productos si no están cargados
  async function loadCategoryFlow(categoryId: string) {
    try {
      // Si no hay productos cargados aún, cargarlos ahora
      if (products.length === 0) {
        fetchAndCacheProducts();
      }
      
      const res = await fetch(`/api/categories/${categoryId}/flow`);
      if (res.ok) {
        const flow = await res.json();
        setCategoryFlow(flow);
      }
    } catch (error) {
      console.error("Error loading category flow:", error);
      // Usar flujo predeterminado en caso de error
      setCategoryFlow({
        categoryId,
        useDefaultFlow: true,
        steps: [],
      });
    }
  }

  // Agregar producto directamente al carrito (flujo simplificado)
  function handleProductClick(product: Product) {
    // Si el producto tiene variantes, mostrar dialog de selección
    if (product.hasVariants && product.variants) {
      setSelectedProductForVariant(product);
      setShowVariantDialog(true);
      return;
    }

    // Crear item temporal y mostrar diálogo de comentarios
    const newItem: CartItem = {
      productId: product.id,
      productName: product.name,
      unitPrice: parseFloat(product.price),
      quantity: 1,
      notes: "",
      frostingId: undefined,
      frostingName: undefined,
      dryToppingId: undefined,
      dryToppingName: undefined,
      extraId: undefined,
      extraName: undefined,
      customModifiers: null,
    };
    setPendingCartItem(newItem);
    setTempNotes("");
    setShowNotesDialog(true);
  }

  // Agregar producto con variante seleccionada
  function handleAddVariant(variantName: string, variantPrice: string) {
    if (!selectedProductForVariant) return;

    const newItem: CartItem = {
      productId: selectedProductForVariant.id,
      productName: `${selectedProductForVariant.name} - ${variantName}`,
      unitPrice: parseFloat(variantPrice),
      quantity: 1,
      notes: "",
      frostingId: undefined,
      frostingName: undefined,
      dryToppingId: undefined,
      dryToppingName: undefined,
      extraId: undefined,
      extraName: undefined,
      customModifiers: null,
    };
    
    // Cerrar diálogo de variantes y abrir diálogo de comentarios
    setShowVariantDialog(false);
    setPendingCartItem(newItem);
    setTempNotes("");
    setShowNotesDialog(true);
  }
  
  // Confirmar y agregar item con comentarios al carrito
  function handleConfirmNotes() {
    if (!pendingCartItem) return;
    
    const itemWithNotes = {
      ...pendingCartItem,
      notes: tempNotes.trim(),
    };
    
    setCart([...cart, itemWithNotes]);
    toast.success(`${pendingCartItem.productName} agregado`);
    
    // Limpiar estados
    setShowNotesDialog(false);
    setPendingCartItem(null);
    setTempNotes("");
    setSelectedProductForVariant(null);
  }
  
  // Cancelar diálogo de comentarios
  function handleCancelNotes() {
    setShowNotesDialog(false);
    setPendingCartItem(null);
    setTempNotes("");
    setSelectedProductForVariant(null);
  }

  // Abrir dialog de personalización para un item del carrito
  function handleCustomizeItem(index: number) {
    const item = cart[index];
    setSelectedProduct(products.find(p => p.id === item.productId) || null);
    setProductNotes(item.notes || "");
    // Aquí podrías abrir un dialog de personalización si lo necesitas
  }

  function handleStepSelection(selection: any) {
    if (!categoryFlow || currentStepIndex < 0) return;
    
    const currentStep = categoryFlow.steps[currentStepIndex];
    
    // Guardar selección del paso actual
    setStepSelections({
      ...stepSelections,
      [currentStep.id]: selection,
    });
    
    // Avanzar al siguiente paso o mostrar pantalla de notas
    if (currentStepIndex < categoryFlow.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      // Último paso completado, mostrar pantalla de notas
      setCurrentStepIndex(categoryFlow.steps.length); // Índice especial para notas
    }
  }

  function finishFlowAndAddToCart() {
    if (!selectedProduct || !categoryFlow) return;

    // Calcular precio total con modificadores custom
    let totalPrice = parseFloat(selectedProduct.price);
    const customModifiersData: Record<string, any> = {};

    categoryFlow.steps.forEach((step) => {
      const selection = stepSelections[step.id];
      if (!selection) return;

      if (step.stepType === "custom" && step.options) {
        // Para pasos custom, guardar en customModifiers y sumar precio
        const selectedOptions = Array.isArray(selection) ? selection : [selection];
        customModifiersData[step.id] = {
          stepName: step.stepName,
          options: selectedOptions.map((opt: ModifierOption) => {
            totalPrice += parseFloat(opt.price);
            return {
              id: opt.id,
              name: opt.name,
              price: opt.price,
            };
          }),
        };
      } else if (step.stepType === "extra") {
        // Para extras, sumar precio
        const selectedExtras = Array.isArray(selection) ? selection : [selection];
        selectedExtras.forEach((extra: Extra) => {
          totalPrice += parseFloat(extra.price);
        });
      }
    });

    const newItem: CartItem = {
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      unitPrice: totalPrice,
      quantity: 1,
      notes: productNotes,
      frostingId: selectedFrosting?.id,
      frostingName: selectedFrosting?.name,
      dryToppingId: selectedTopping?.id,
      dryToppingName: selectedTopping?.name,
      extraId: selectedExtras.length > 0 ? selectedExtras[0].id : undefined,
      extraName: selectedExtras.length > 0 ? selectedExtras[0].name : undefined,
      customModifiers: Object.keys(customModifiersData).length > 0 ? JSON.stringify(customModifiersData) : null,
    };

    // Buscar si ya existe un item idéntico en el carrito
    const existingItemIndex = cart.findIndex((item) => 
      item.productId === newItem.productId &&
      item.frostingId === newItem.frostingId &&
      item.dryToppingId === newItem.dryToppingId &&
      item.extraId === newItem.extraId &&
      item.customModifiers === newItem.customModifiers
    );

    if (existingItemIndex >= 0) {
      // Si existe, incrementar cantidad
      const updatedCart = [...cart];
      updatedCart[existingItemIndex].quantity += 1;
      setCart(updatedCart);
      toast.success(`${selectedProduct.name} agregado (${updatedCart[existingItemIndex].quantity})`);
    } else {
      // Si no existe, agregar nuevo item
      setCart([...cart, newItem]);
      toast.success(`${selectedProduct.name} agregado`);
    }
    
    resetFlow();
  }

  function resetFlow() {
    setCurrentStepIndex(-1);
    setSelectedProduct(null);
    setStepSelections({});
    setSelectedFrosting(null);
    setSelectedTopping(null);
    setSelectedExtras([]);
    setProductNotes("");
  }

  function handleBackInFlow() {
    if (currentStepIndex === 0) {
      resetFlow();
    } else if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  }

  function toggleExtra(extra: Extra) {
    if (selectedExtras.find(e => e.id === extra.id)) {
      setSelectedExtras(selectedExtras.filter(e => e.id !== extra.id));
    } else {
      setSelectedExtras([...selectedExtras, extra]);
    }
  }

  function updateQuantity(index: number, delta: number) {
    const item = cart[index];
    if (!item) return;

    // No permitir editar items enviados a cocina
    if (item.sentToKitchen) {
      toast.error("No se puede modificar un item ya enviado a cocina");
      return;
    }

    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      removeFromCart(index);
    } else {
      const updatedCart = [...cart];
      updatedCart[index] = { ...updatedCart[index], quantity: newQty };
      setCart(updatedCart);
    }
  }

  function removeFromCart(index: number) {
    const item = cart[index];
    
    // No permitir eliminar items enviados a cocina
    if (item && item.sentToKitchen) {
      toast.error("No se puede eliminar un item ya enviado a cocina");
      return;
    }
    
    setCart(cart.filter((_, i) => i !== index));
  }

  // Camera functions
  async function startCamera() {
    try {
      // Verificar contexto seguro (HTTPS)
      if (typeof window !== 'undefined' && !window.isSecureContext) {
        toast.error("La cámara requiere HTTPS. Usa el input manual.");
        return;
      }

      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error("Tu navegador no soporta acceso a la cámara. Usa el input manual.");
        return;
      }

      console.log("📷 Solicitando acceso a cámara...");

      // Constraints más flexibles para iPad
      const constraints = {
        video: {
          facingMode: { ideal: "environment" }, // ideal en lugar de exact
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log("✅ Stream obtenido:", stream.getVideoTracks());
      
      // Guardar stream inmediatamente
      streamRef.current = stream;
      
      // Activar cámara PRIMERO para que el video se monte en el DOM
      setCameraActive(true);
      
      console.log("🔍 Verificando videoRef.current:", videoRef.current);
      
      // Esperar un pequeño delay para que el video se monte en el DOM
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log("🔍 Verificando videoRef.current después del delay:", videoRef.current);
      
      if (videoRef.current) {
        console.log("✅ videoRef.current existe, asignando stream...");
        videoRef.current.srcObject = stream;
        
        console.log("📹 Stream asignado al video. Dimensiones del track:", 
          stream.getVideoTracks()[0].getSettings());
        
        // Protección contra cierre automático en iPad
        const videoTrack = stream.getVideoTracks()[0];
        videoTrack.addEventListener('ended', () => {
          console.warn("⚠️ Video track terminado inesperadamente - posible cierre automático de iPad");
          toast.error("La cámara se detuvo. Por favor, abre la cámara de nuevo.");
          setCameraActive(false);
        });
        
        // Prevenir pause automático en iPad
        const handlePause = (e: Event) => {
          console.warn("⚠️ Video pausado - reintentando reproducir...");
          if (videoRef.current && cameraActive) {
            videoRef.current.play().catch(err => {
              console.error("❌ No se pudo reanudar video:", err);
            });
          }
        };
        
        videoRef.current.addEventListener('pause', handlePause);
        
        // Esperar a que el video cargue metadata
        const handleLoadedMetadata = () => {
          console.log("✅ Video metadata cargada. VideoWidth:", 
            videoRef.current?.videoWidth, 
            "VideoHeight:", 
            videoRef.current?.videoHeight);
        };
        
        videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
        
        // Esperar a que el video esté listo y reproducirlo explícitamente
        try {
          await videoRef.current.play();
          console.log("✅ Video reproduciendo");
          
          // Start scanning después de un pequeño delay para asegurar que el video esté listo
          setTimeout(() => scanQRCode(), 100);
        } catch (playError) {
          console.error("❌ Error al reproducir video:", playError);
          toast.error("Error al iniciar video. Intenta de nuevo.");
          // Limpiar stream si falla el play
          stream.getTracks().forEach(track => track.stop());
          streamRef.current = null;
          setCameraActive(false);
        }
      } else {
        console.error("❌ videoRef.current es NULL después del delay!");
        toast.error("Error: elemento de video no disponible");
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        setCameraActive(false);
      }
    } catch (error: any) {
      console.error("❌ Error accessing camera:", error);
      
      // Manejo específico de errores para iPad
      if (error.name === 'NotAllowedError') {
        toast.error("Permiso de cámara denegado. Por favor permite el acceso en Configuración.");
      } else if (error.name === 'NotFoundError') {
        toast.error("No se encontró cámara. Verifica que tu dispositivo tenga cámara.");
      } else if (error.name === 'NotReadableError') {
        toast.error("La cámara está en uso por otra aplicación. Ciérrala e intenta de nuevo.");
      } else if (error.name === 'OverconstrainedError') {
        toast.error("Configuración de cámara no soportada. Usando input manual.");
      } else {
        toast.error(`Error de cámara: ${error.message || 'Desconocido'}. Usa el input manual.`);
      }
    }
  }

  function stopCamera() {
    scanningRef.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }

  async function scanQRCode() {
    if (!videoRef.current || !canvasRef.current) return;
    
    scanningRef.current = true;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;

    // Load jsQR dynamically
    if (!(window as any).jsQR) {
      try {
        await loadJsQR();
      } catch (error) {
        console.error("Error loading jsQR:", error);
        toast.error("Error cargando detector de QR");
        return;
      }
    }

    const scan = () => {
      if (!scanningRef.current || video.readyState !== video.HAVE_ENOUGH_DATA) {
        if (scanningRef.current) {
          requestAnimationFrame(scan);
        }
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      const code = (window as any).jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code) {
        console.log("✅ QR detectado:", code.data);
        scanningRef.current = false;
        stopCamera();
        
        // Buscar cliente automáticamente
        handleQRCodeDetected(code.data);
        return;
      }

      if (scanningRef.current) {
        requestAnimationFrame(scan);
      }
    };

    requestAnimationFrame(scan);
  }

  async function loadJsQR() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Clean up camera on unmount or dialog close
  useEffect(() => {
    if (!qrDialogOpen && cameraActive) {
      stopCamera();
    }
  }, [qrDialogOpen]);

  // Loyalty card functions
  async function handleQRCodeDetected(code: string) {
    if (!code.trim()) {
      toast.error("Código QR inválido");
      return;
    }

    setLoadingCard(true);
    try {
      console.log("🔍 Buscando cliente con código:", code);
      const res = await fetch(`/api/loyalty/search?barcode=${encodeURIComponent(code)}`);
      
      if (!res.ok) {
        toast.error("Tarjeta no encontrada");
        setQrCode("");
        return;
      }
      
      const card = await res.json();
      console.log("✅ Cliente encontrado:", card);
      setLoyaltyCard(card);
      setQrDialogOpen(false);
      setQrCode("");
      toast.success(`Cliente: ${card.customerName}`);
      
      // Si estamos en el paso de loyalty, avanzar automáticamente a pago
      if (showingLoyaltyStep) {
        skipLoyaltyAndProceedToPayment();
      }
    } catch (error) {
      console.error("❌ Error buscando tarjeta:", error);
      toast.error("Error al buscar tarjeta");
      setQrCode("");
    } finally {
      setLoadingCard(false);
    }
  }

  async function handleQRSubmit() {
    if (!qrCode.trim()) {
      toast.error("Ingresa el código QR");
      return;
    }

    await handleQRCodeDetected(qrCode);
  }

  async function handleManualStampSubmit() {
    if (!manualBarcodeInput.trim()) {
      toast.error("Ingresa el código de barras");
      return;
    }

    setLoadingCard(true);
    try {
      const res = await fetch(`/api/loyalty-cards/barcode/${manualBarcodeInput}`);
      if (!res.ok) {
        toast.error("Tarjeta no encontrada");
        return;
      }
      
      const card = await res.json();
      
      // Agregar sello
      const stampRes = await fetch(`/api/loyalty-cards/${card.id}/stamp`, {
        method: "POST",
      });

      if (!stampRes.ok) {
        toast.error("Error al agregar sello");
        return;
      }

      const updated = await stampRes.json();
      toast.success(`Sello agregado a ${card.customerName}`);
      setManualStampDialogOpen(false);
      setManualBarcodeInput("");
    } catch (error) {
      toast.error("Error al procesar sello");
    } finally {
      setLoadingCard(false);
    }
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
    // Validar que haya mesa O nombre de cliente (Para Llevar)
    if (!selectedTable && !customerName) {
      toast.error("No hay mesa ni cliente seleccionado");
      return;
    }

    // Si ya existe una orden (items fueron enviados a cocina), usar esa orden para cobrar
    if (currentOrderId) {
      console.log("💰 Usando orden existente para cobrar:", currentOrderId);
      // Ir directo a pago sin crear nueva orden
      if (loyaltyCard) {
        setShowingPayment(true);
      } else {
        setShowingLoyaltyStep(true);
      }
      return;
    }

    // Solo crear nueva orden si no hay una existente (items no enviados a cocina)
    setSubmitting(true);
    try {
      const orderData = {
        items: cart.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          notes: item.notes,
          frostingId: item.frostingId,
          frostingName: item.frostingName,
          dryToppingId: item.dryToppingId,
          dryToppingName: item.dryToppingName,
          extraId: item.extraId,
          extraName: item.extraName,
          customModifiers: item.customModifiers,
        })),
        employeeId,
        tableId: selectedTable?.id || null, // null para Para Llevar
        paymentStatus: "pending",
        loyaltyCardId: loyaltyCard?.id || null,
        customerName: customerName || loyaltyCard?.customerName || null,
      };

      const orderType = selectedTable ? `Mesa ${selectedTable.number}` : `Para Llevar - ${customerName}`;
      console.log("📦 Creando orden para", orderType);
      
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (!res.ok) throw new Error();
      const order = await res.json();
      
      // Actualizar estado de mesa a "occupied" solo si hay mesa
      if (selectedTable) {
        await fetch(`/api/tables/${selectedTable.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "occupied" }),
        });
      }
      
      setCurrentOrderId(order.id);
      // Si ya tiene cliente frecuente, ir directo a pago, si no, mostrar paso de loyalty
      if (loyaltyCard) {
        setShowingPayment(true);
      } else {
        setShowingLoyaltyStep(true);
      }
      toast.success(`Orden creada para ${orderType}`);
    } catch (error) {
      toast.error("Error creando orden");
    } finally {
      setSubmitting(false);
    }
  }

  function skipLoyaltyAndProceedToPayment() {
    setShowingLoyaltyStep(false);
    setShowingPayment(true);
  }

  async function handlePayCash() {
    if (!currentOrderId) return;
    setProcessing(true);
    try {
      const res = await fetch(`/api/orders/${currentOrderId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod: "cash",
          loyaltyCardId: loyaltyCard?.id || null,
          loyaltyStamps: 1,
          userId: employeeId,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Pago en efectivo registrado");
      setPaymentCompleted(true);
    } catch {
      toast.error("Error procesando pago");
    } finally {
      setProcessing(false);
    }
  }

  async function handlePayTransfer() {
    if (!currentOrderId) return;
    setProcessing(true);
    try {
      const res = await fetch(`/api/orders/${currentOrderId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod: "transfer",
          loyaltyCardId: loyaltyCard?.id || null,
          loyaltyStamps: 1,
          userId: employeeId,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Pago por transferencia registrado");
      setPaymentCompleted(true);
    } catch {
      toast.error("Error procesando pago");
    } finally {
      setProcessing(false);
    }
  }

  function handleConfirmOrder() {
    // El pago ya marcó la orden como delivered y liberó la mesa automáticamente
    // Solo necesitamos limpiar la UI y volver a selección de mesas
    
    const orderType = selectedTable ? "Mesa liberada" : "Orden Para Llevar completada";
    toast.success(`Orden completada - ${orderType}`);
    
    // Limpiar todo y volver a selección de mesas
    setCart([]);
    setLoyaltyCard(null);
    setShowingPayment(false);
    setShowingLoyaltyStep(false);
    setPaymentMethod(null);
    setCashReceived("");
    setCurrentOrderId(null);
    setPaymentCompleted(false);
    setSelectedTable(null);
    setCustomerName("");
    setShowTableSelection(true);
    
    // Recargar delivery orders para quitar la orden completada
    fetchDeliveryOrders();
    
    // Recargar mesas para actualizar estados
    fetchTables();
  }

  // CÓDIGO ORIGINAL CON INTEGRACIÓN A TERMINAL MERCADOPAGO - COMENTADO PARA USO FUTURO
  // async function handlePayTerminal() {
  //   if (!currentOrderId) return;
  //   setProcessing(true);
  //   setWaitingForTerminal(true);
  //   try {
  //     const res = await fetch(`/api/orders/${currentOrderId}/pay`, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         paymentMethod: "terminal_mercadopago",
  //         loyaltyCardId: loyaltyCard?.id || null,
  //         loyaltyStamps: 1,
  //         userId: employeeId,
  //       }),
  //     });
  //     
  //     if (!res.ok) {
  //       const errorData = await res.json();
  //       toast.error(errorData.error || "Error enviando pago a terminal");
  //       if (errorData.hint) {
  //         toast.error(errorData.hint, { duration: 5000 });
  //       }
  //       setProcessing(false);
  //       setWaitingForTerminal(false);
  //       return;
  //     }
  //
  //     // Poll order status - webhook updates paymentStatus to "paid"
  //     const pollInterval = setInterval(async () => {
  //       try {
  //         const statusRes = await fetch(`/api/orders/${currentOrderId}`);
  //         if (statusRes.ok) {
  //           const updatedOrder = await statusRes.json();
  //           
  //           if (updatedOrder.paymentStatus === "paid") {
  //             clearInterval(pollInterval);
  //             
  //             // Webhook puede poner status incorrecto - asegurar que sea "delivered"
  //             if (updatedOrder.status !== "delivered") {
  //               console.log("🔧 Corrigiendo status a delivered después de pago terminal");
  //               await fetch(`/api/orders/${currentOrderId}/status`, {
  //                 method: "PATCH",
  //                 headers: { "Content-Type": "application/json" },
  //                 body: JSON.stringify({ status: "delivered" }),
  //               });
  //             }
  //             
  //             // Liberar mesa si es necesario
  //             if (selectedTable) {
  //               await fetch(`/api/tables/${selectedTable.id}`, {
  //                 method: "PUT",
  //                 headers: { "Content-Type": "application/json" },
  //                 body: JSON.stringify({ ...selectedTable, status: "available" }),
  //               });
  //             }
  //             
  //             setWaitingForTerminal(false);
  //             toast.success("Pago confirmado por terminal");
  //             setPaymentCompleted(true);
  //             setProcessing(false);
  //           } else if (updatedOrder.paymentStatus === "failed") {
  //             clearInterval(pollInterval);
  //             setWaitingForTerminal(false);
  //             setProcessing(false);
  //             toast.error("Pago rechazado en terminal");
  //           }
  //         }
  //       } catch (err) {
  //         console.error("Error polling order:", err);
  //       }
  //     }, 2000);
  //
  //     // Timeout after 2 minutes
  //     setTimeout(() => {
  //       clearInterval(pollInterval);
  //       if (waitingForTerminal) {
  //         setWaitingForTerminal(false);
  //         setProcessing(false);
  //         toast.error("Tiempo de espera agotado");
  //       }
  //     }, 120000);
  //   } catch (error) {
  //     toast.error("Error enviando pago a terminal");
  //     setProcessing(false);
  //     setWaitingForTerminal(false);
  //   }
  // }

  // VERSIÓN SIMPLIFICADA - Terminal funciona igual que efectivo (confirmación directa)
  async function handlePayTerminal() {
    if (!currentOrderId) return;
    setProcessing(true);
    try {
      const res = await fetch(`/api/orders/${currentOrderId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod: "terminal_mercadopago",
          loyaltyCardId: loyaltyCard?.id || null,
          loyaltyStamps: 1,
          userId: employeeId,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Pago con terminal registrado");
      setPaymentCompleted(true);
    } catch {
      toast.error("Error procesando pago");
    } finally {
      setProcessing(false);
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
      <div className="flex h-screen items-center justify-center bg-neutral-950">
        <div className="w-full max-w-md p-8 bg-neutral-900 rounded-lg shadow-2xl border border-neutral-800 flex flex-col items-center gap-6">
          {/* Header con logo/titulo */}
          <div className="text-center mb-4">
            <h1 className="text-3xl font-bold text-white mb-2">BRUMA Marisquería</h1>
            <div className="w-16 h-1 bg-blue-600 mx-auto rounded-full"></div>
          </div>

          {authStep === 'idle' && (
            <>
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-white mb-2">Comandera</h2>
                <p className="text-neutral-400 text-sm">Sistema POS</p>
                {!cashRegisterOpen && !checkingRegister && (
                  <div className="mt-4 p-3 bg-red-950/50 border border-red-800/50 rounded-lg">
                    <p className="text-red-400 text-sm font-medium">⚠️ Caja cerrada</p>
                  </div>
                )}
              </div>
              <Button
                onClick={handleOpenComanda}
                disabled={checkingRegister}
                size="lg"
                className="px-12 py-6 text-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                Iniciar Sesión
              </Button>
            </>
          )}

          {authStep === 'employee' && (
            <div className="w-full">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-white mb-2">Código de Empleado</h2>
                <p className="text-neutral-400 text-sm">6 dígitos</p>
              </div>
              
              <div className="mb-6 text-center">
                <div className="text-4xl font-mono tracking-widest h-16 flex items-center justify-center bg-neutral-950 rounded-lg border border-neutral-800 text-white">
                  {employeeCode.padEnd(6, '·')}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
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
                    className="h-16 text-xl font-semibold bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700 hover:border-blue-600"
                  >
                    {key}
                  </Button>
                ))}
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleEmployeeSubmit}
                  disabled={employeeCode.length !== 6}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                  size="lg"
                >
                  Siguiente →
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="w-full bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {authStep === 'pin' && (
            <div className="w-full">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-white mb-2">PIN de Seguridad</h2>
                <p className="text-neutral-400 text-sm">4 dígitos</p>
              </div>
              
              <div className="mb-6 text-center">
                <div className="text-4xl font-mono tracking-widest h-16 flex items-center justify-center bg-neutral-950 rounded-lg border border-neutral-800 text-white">
                  {pin.split('').map((_, i) => '●').join(' ').padEnd(7, '·')}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
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
                    className="h-16 text-xl font-semibold bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700 hover:border-blue-600"
                  >
                    {key}
                  </Button>
                ))}
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handlePinSubmit}
                  disabled={pin.length !== 4 || authenticating}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                  size="lg"
                >
                  {authenticating ? 'Verificando...' : 'Ingresar'}
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="w-full bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700"
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

  // Vista de selección de mesas
  if (showTableSelection) {
    return (
      <div className="flex h-screen bg-neutral-950">
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-neutral-800 bg-neutral-950">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2 text-white">BRUMA Marisquería</h1>
                <p className="text-neutral-400">Selecciona una mesa para comenzar</p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => router.push("/dashboard")}
                className="bg-neutral-900 border-neutral-800 text-white hover:bg-neutral-800"
              >
                Volver al Dashboard
              </Button>
            </div>
          </div>

          {/* Grid de mesas */}
          <div className="flex-1 overflow-auto p-6">
            <div className="grid grid-cols-6 gap-4 max-w-screen-2xl">
              {/* Opción Nueva Orden Para Llevar */}
              <button
                className="rounded-lg overflow-hidden relative hover:scale-[1.02] transition-all bg-gradient-to-br from-blue-900/80 to-blue-950 border border-blue-800/50 shadow-md hover:border-blue-700/70 min-h-[160px]"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNewDeliveryOrder();
                }}
              >
                <div className="relative z-10 p-6 flex flex-col items-center justify-center h-full">
                  <div className="text-5xl mb-3">
                    🛍️
                  </div>
                  <div className="text-lg font-bold text-white mb-1">
                    Para Llevar
                  </div>
                  <div className="text-xs text-blue-200/70 mb-3">
                    Nueva Orden
                  </div>
                  <Badge className="bg-blue-950/50 text-blue-200 border-blue-700/50">
                    + Nuevo
                  </Badge>
                </div>
              </button>

              {/* Órdenes Para Llevar Activas */}
              {deliveryOrders.map((order, index) => (
                <button
                  key={order.id}
                  className="rounded-lg overflow-hidden relative hover:scale-[1.02] transition-all bg-gradient-to-br from-green-900/80 to-green-950 border border-green-800/50 shadow-md hover:border-green-700/70 min-h-[160px]"
                  onClick={() => handleSelectDeliveryOrder(order)}
                >
                  <div className="relative z-10 p-6 flex flex-col items-center justify-center h-full">
                    <div className="text-5xl mb-3">
                      📦
                    </div>
                    <div className="text-lg font-bold text-white mb-1">
                      {order.customerName || `Delivery ${index + 1}`}
                    </div>
                    <div className="text-xs text-green-200/70 mb-3">
                      Orden #{order.orderNumber}
                    </div>
                    <Badge className="bg-green-950/50 text-green-200 border-green-700/50">
                      {order.items?.length || 0} items
                    </Badge>
                  </div>
                </button>
              ))}

              {/* Mesas */}
              {tables.map((table) => {
                const statusConfig = {
                  available: {
                    gradient: "from-green-900/80 to-green-950",
                    border: "border-green-800/50",
                    hoverBorder: "hover:border-green-700/70",
                    textColor: "text-green-200/70",
                    badgeBg: "bg-green-950/50",
                    badgeText: "text-green-200",
                    badgeBorder: "border-green-700/50",
                  },
                  occupied: {
                    gradient: "from-red-900/80 to-red-950",
                    border: "border-red-800/50",
                    hoverBorder: "hover:border-red-700/70",
                    textColor: "text-red-200/70",
                    badgeBg: "bg-red-950/50",
                    badgeText: "text-red-200",
                    badgeBorder: "border-red-700/50",
                  },
                  reserved: {
                    gradient: "from-amber-900/80 to-amber-950",
                    border: "border-amber-800/50",
                    hoverBorder: "hover:border-amber-700/70",
                    textColor: "text-amber-200/70",
                    badgeBg: "bg-amber-950/50",
                    badgeText: "text-amber-200",
                    badgeBorder: "border-amber-700/50",
                  },
                };

                const statusLabels = {
                  available: "Disponible",
                  occupied: "Ocupada",
                  reserved: "Reservada",
                };

                const config = statusConfig[table.status];

                return (
                  <button
                    key={table.id}
                    className={`rounded-lg overflow-hidden relative hover:scale-[1.02] transition-all bg-gradient-to-br ${config.gradient} border ${config.border} ${config.hoverBorder} shadow-md min-h-[160px]`}
                    onClick={() => handleSelectTable(table)}
                  >
                    <div className="relative z-10 p-6 flex flex-col items-center justify-center h-full">
                      <div className="text-5xl font-bold text-white mb-3">
                        {table.number}
                      </div>
                      <div className="text-sm font-medium text-white mb-1">
                        {table.name || `Mesa ${table.number}`}
                      </div>
                      <div className={`text-xs ${config.textColor} mb-3 flex items-center gap-1 justify-center`}>
                        <Users className="size-3" weight="fill" />
                        <span>{table.capacity} {table.capacity === 1 ? "persona" : "personas"}</span>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Badge className={`${config.badgeBg} ${config.badgeText} ${config.badgeBorder}`}>
                          {statusLabels[table.status]}
                        </Badge>
                        {tablesWithReadyItems.has(table.id) && (
                          <Badge className="bg-green-700/80 text-green-100 border-green-600/50 animate-pulse">
                            ✓ Platillos listos
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Filtrar productos por categoría o búsqueda
  const filteredProducts = searchQuery
    ? products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())) // Buscar en todas las categorías
    : selectedCategory
    ? products.filter(p => p.categoryId === selectedCategory)
    : [];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* SIDEBAR - CARRITO */}
      <div className="w-80 bg-neutral-950 border-r border-neutral-800 flex flex-col">
        {/* Header del carrito */}
        <div className="p-4 border-b border-neutral-800">
          {/* Row de botones superior */}
          {(selectedTable || customerName) && (
            <div className="mb-3 flex items-center gap-2">
              {/* Botón Home */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleChangeTable}
                className="bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-white p-3"
              >
                <House className="size-4" weight="fill" />
              </Button>
              
              {/* Botón Mesa con dropdown - flex-1 para ocupar todo el espacio */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-white flex items-center gap-2 justify-start"
                  >
                    {selectedTable ? (
                      <>
                        <Coffee className="size-4" />
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{selectedTable.name || `Mesa ${selectedTable.number}`}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="size-4" />
                        <div className="flex flex-col items-start">
                          <span className="font-medium">Para Llevar</span>
                          {customerName && (
                            <span className="text-xs text-neutral-400">{customerName}</span>
                          )}
                        </div>
                      </>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem 
                    onClick={handleReleaseTable}
                    className="text-red-400 focus:text-red-300"
                  >
                    <X className="mr-2 size-4" />
                    Liberar mesa
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Botón Número de Personas */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTempGuestCount(guestCount);
                  setShowGuestCountDialog(true);
                }}
                className="bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-white flex items-center gap-2"
              >
                <Users className="size-4" weight="fill" />
                <span>{guestCount}</span>
              </Button>
            </div>
          )}
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-white">Orden</h2>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-neutral-400 hover:text-white">
                    <DotsThree className="size-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setQrDialogOpen(true)}>
                    <QrCode className="mr-2 size-4" />
                    Leer QR
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setManualStampDialogOpen(true)}>
                    <Stamp className="mr-2 size-4" />
                    Asignar sellos manual
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <span className="font-bold text-white">{formatCurrency(cartTotal)}</span>
            </div>
          </div>
          {loyaltyCard && (
            <div className="mb-2 p-2 bg-blue-950/30 rounded text-sm flex items-start justify-between gap-2 border border-blue-900/50">
              <div className="flex-1">
                <div className="font-medium text-white">{loyaltyCard.customerName}</div>
                <div className="text-xs text-neutral-400">
                  {loyaltyCard.stamps} sellos • {loyaltyCard.rewardsAvailable} recompensas
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLoyaltyCard(null)}
                className="h-6 w-6 p-0 text-neutral-400 hover:text-white"
              >
                <X className="size-4" />
              </Button>
            </div>
          )}
          <div className="text-sm text-neutral-500">
            {cart.length} {cart.length === 1 ? 'producto' : 'productos'}
          </div>
        </div>

        {/* Items del carrito */}
        <div className="flex-1 overflow-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-neutral-500 text-center py-8 text-sm">
              Carrito vacío
            </div>
          ) : (
            cart.map((item, index) => (
              <div key={index} className={`rounded-lg overflow-hidden ${item.sentToKitchen ? 'bg-neutral-900 border border-neutral-800' : 'bg-neutral-900 border border-neutral-800'}`}>
                <div className={`p-3 ${item.sentToKitchen ? 'opacity-75' : ''}`}>
                  <div className="flex items-start gap-3 mb-2">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                      {item.quantity}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="font-medium text-sm text-white">{item.productName}</div>
                            {item.sentToKitchen && item.orderStatus === "ready" && !item.deliveredToTable && (
                              <Badge variant="default" className="text-xs bg-green-600">
                                ✓ Listo para mesa
                              </Badge>
                            )}
                            {item.sentToKitchen && item.deliveredToTable && (
                              <Badge variant="secondary" className="text-xs bg-blue-600">
                                ✓ Entregado
                              </Badge>
                            )}
                            {item.sentToKitchen && item.orderStatus === "preparing" && (
                              <Badge variant="destructive" className="text-xs">
                                En cocina
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0 flex items-start gap-2">
                          <span className="font-semibold text-white">
                            {formatCurrency(item.unitPrice * item.quantity)}
                          </span>
                          {!item.sentToKitchen && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromCart(index)}
                              className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                            >
                              <Trash className="size-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-neutral-500 mt-0.5">
                        {formatCurrency(item.unitPrice)} c/u
                      </div>
                      {/* Resumen de modificadores */}
                      {(item.frostingName || item.dryToppingName || item.extraName || item.customModifiers || item.notes) && (
                        <div className="mt-1 space-y-0.5">
                          {item.frostingName && (
                            <div className="text-xs text-muted-foreground flex items-start gap-1">
                              <span className="opacity-50">↳</span>
                              <span>{item.frostingName}</span>
                            </div>
                          )}
                          {item.dryToppingName && (
                            <div className="text-xs text-muted-foreground flex items-start gap-1">
                              <span className="opacity-50">↳</span>
                              <span>{item.dryToppingName}</span>
                            </div>
                          )}
                          {item.extraName && (
                            <div className="text-xs text-muted-foreground flex items-start gap-1">
                              <span className="opacity-50">↳</span>
                              <span>{item.extraName}</span>
                            </div>
                          )}
                          {item.customModifiers && (() => {
                            try {
                              const modifiers = JSON.parse(item.customModifiers);
                              return Object.values(modifiers).map((mod: any, idx: number) => (
                                <div key={idx} className="text-xs text-muted-foreground flex items-start gap-1">
                                  <span className="opacity-50">↳</span>
                                  <span>{mod.stepName}: {mod.options.map((opt: any) => opt.name).join(', ')}</span>
                                </div>
                              ));
                            } catch (e) {
                              return null;
                            }
                          })()}
                          {item.notes && (
                            <div className="text-xs text-yellow-600 dark:text-yellow-500 flex items-start gap-1 italic">
                              <span className="opacity-50">↳</span>
                              <span>{item.notes}</span>
                            </div>
                          )}
                        </div>
                      )}
                      {!item.sentToKitchen && (
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(index, -1)}
                            className="h-7 w-7 p-0 bg-neutral-800 border-neutral-700 hover:bg-neutral-700 text-white"
                          >
                            <Minus className="size-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(index, 1)}
                            className="h-7 w-7 p-0 bg-neutral-800 border-neutral-700 hover:bg-neutral-700 text-white"
                          >
                            <Plus className="size-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Footer para items ready no entregados */}
                {item.sentToKitchen && item.orderStatus === "ready" && !item.deliveredToTable && (
                  <div className="bg-neutral-800 p-2 opacity-100 border-t border-neutral-700">
                    <Button
                      onClick={() => handleMarkAsDelivered(index)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white border-0 font-semibold shadow-lg"
                      size="sm"
                    >
                      <span className="mr-2">✓</span>
                      Marcar como entregado a mesa
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer - botones de acción */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950 space-y-3">
          {/* Total */}
          <div className="flex items-center justify-between px-2 py-3 bg-neutral-900 rounded-lg border border-neutral-800">
            <span className="text-neutral-400 text-sm">Total</span>
            <span className="text-white text-2xl font-bold">{formatCurrency(cartTotal)}</span>
          </div>
          {/* Botón Enviar a Cocina */}
          {cart.some(item => !item.sentToKitchen) && (
            <Button
              onClick={handleSendToKitchen}
              disabled={cart.length === 0}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold"
              size="lg"
            >
              Enviar a Cocina ({cart.filter(item => !item.sentToKitchen).length})
            </Button>
          )}
          
          {/* Botón Cobrar */}
          <Button
            onClick={handleCheckout}
            disabled={cart.length === 0 || submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            size="lg"
          >
            {submitting ? "Procesando..." : "Cobrar"}
          </Button>
        </div>
      </div>

      {/* VISTA DE PAGO O CATEGORÍAS/PRODUCTOS */}
      {showingLoyaltyStep ? (
        // Vista de Cliente Frecuente
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold">Cliente Frecuente</h2>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowingLoyaltyStep(false);
                  setCurrentOrderId(null);
                }}
              >
                ← Cancelar
              </Button>
            </div>

            <Card>
              <CardContent className="p-8 space-y-4">
                <p className="text-muted-foreground text-center">
                  ¿El cliente tiene tarjeta de cliente frecuente?
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setQrDialogOpen(true)}
                    className="h-24 flex flex-col gap-2"
                  >
                    <QrCode className="size-8" />
                    <span>Leer QR</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={skipLoyaltyAndProceedToPayment}
                    className="h-24 flex flex-col gap-2"
                  >
                    <X className="size-8" />
                    <span>Sin tarjeta</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {loyaltyCard && (
              <Card className="border-primary">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-semibold text-lg">{loyaltyCard.customerName}</p>
                      <p className="text-sm text-muted-foreground">
                        {loyaltyCard.stamps} sellos • {loyaltyCard.rewardsAvailable} recompensas
                      </p>
                    </div>
                    <Button onClick={skipLoyaltyAndProceedToPayment} size="lg">
                      Continuar →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      ) : splitBillMode ? (
        // Vista de División de Cuenta
        <div className="flex-1 flex items-center justify-center p-8 bg-neutral-950">
          <div className="w-full max-w-6xl space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-white">Dividir Cuenta</h2>
              <Button 
                variant="outline" 
                onClick={() => setSplitBillMode(false)}
                className="bg-neutral-900 border-neutral-800 text-white hover:bg-neutral-800"
              >
                ← Regresar
              </Button>
            </div>

            {/* Mensaje de todos pagados */}
            {Object.values(individualPayments).every(p => p.paid) && (
              <Card className="bg-neutral-900 border-green-600">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-green-600 p-3 rounded-full">
                      <Check className="size-8 text-white" weight="bold" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xl font-bold text-white">¡Todos han pagado!</p>
                      <p className="text-neutral-400 text-sm">Total recaudado: {formatCurrency(
                        Object.values(individualPayments).reduce((sum, p) => sum + p.amount, 0)
                      )}</p>
                      
                      {/* Desglose colapsable */}
                      <div className="mt-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowIndividualDetails(!showIndividualDetails)}
                          className="text-xs text-neutral-400 hover:text-white p-0 h-auto"
                        >
                          {showIndividualDetails ? '▼ Ocultar desglose' : '▶ Ver desglose'}
                        </Button>
                        
                        {showIndividualDetails && (
                          <div className="mt-3 space-y-2 text-sm">
                            {Object.entries(individualPayments).map(([index, payment]) => (
                              <div key={index} className="flex justify-between text-neutral-300">
                                <span>Persona {parseInt(index) + 1}:</span>
                                <span className="font-semibold">{formatCurrency(payment.amount)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-center text-xs text-neutral-400 mb-3">
                      Desliza para confirmar y liberar mesa
                    </p>
                    <SlideToConfirm 
                      onConfirm={async () => {
                        if (!currentOrderId) return;
                        
                        setConfirmingOrder(true);
                        try {
                          // Marcar orden como pagada y liberar mesa
                          const res = await fetch(`/api/orders/${currentOrderId}/pay`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              paymentMethod: "cash", // Pago dividido se registra como cash
                              loyaltyCardId: loyaltyCard?.id || null,
                              loyaltyStamps: 1,
                              userId: employeeId,
                            }),
                          });
                          
                          if (!res.ok) throw new Error();
                          
                          toast.success("Pago dividido completado - Mesa liberada");
                          
                          // Limpiar todo y volver a selección de mesas
                          setCart([]);
                          setLoyaltyCard(null);
                          setSplitBillMode(false);
                          setShowingPayment(false);
                          setPaymentMethod(null);
                          setCurrentOrderId(null);
                          setPaymentCompleted(false);
                          setSelectedTable(null);
                          setCustomerName("");
                          setGuestCount(1);
                          setItemAssignments({});
                          setIndividualPayments({});
                          setIndividualTips({});
                          setShowIndividualDetails(true);
                          setShowTableSelection(true);
                          
                          // Recargar mesas para actualizar estados
                          fetchTables();
                        } catch {
                          toast.error("Error procesando pago dividido");
                        } finally {
                          setConfirmingOrder(false);
                        }
                      }} 
                      disabled={confirmingOrder} 
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Carousel de personas - oculto cuando todos pagaron y está colapsado */}
            {(!Object.values(individualPayments).every(p => p.paid) || showIndividualDetails) && (
              <div className="space-y-4">
                {/* Navegación del carousel */}
                <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPersonIndex(Math.max(0, currentPersonIndex - 1))}
                  disabled={currentPersonIndex === 0}
                  className="bg-neutral-900 border-neutral-800 text-white hover:bg-neutral-800 disabled:opacity-30"
                >
                  ← Anterior
                </Button>
                <div className="text-center">
                  <p className="text-white font-semibold">Persona {currentPersonIndex + 1} de {guestCount}</p>
                  <div className="flex gap-1 mt-2 justify-center">
                    {Array.from({ length: guestCount }).map((_, idx) => (
                      <div
                        key={idx}
                        className={`h-2 w-2 rounded-full ${
                          idx === currentPersonIndex ? 'bg-blue-600' : 'bg-neutral-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPersonIndex(Math.min(guestCount - 1, currentPersonIndex + 1))}
                  disabled={currentPersonIndex === guestCount - 1}
                  className="bg-neutral-900 border-neutral-800 text-white hover:bg-neutral-800 disabled:opacity-30"
                >
                  Siguiente →
                </Button>
              </div>

              {/* Persona actual */}
              {(() => {
                const personIndex = currentPersonIndex;
                const assignedItems = itemAssignments[personIndex] || [];
                const personTotal = assignedItems.reduce((sum, cartIndex) => {
                  return sum + (cart[cartIndex].unitPrice * cart[cartIndex].quantity);
                }, 0);
                
                // Propina individual de esta persona
                const personTipData = individualTips[personIndex] || { percentage: 0, custom: '', showCustom: false };
                const personTip = personTipData.showCustom 
                  ? parseFloat(personTipData.custom) || 0 
                  : (personTotal * personTipData.percentage / 100);
                const personFinalTotal = personTotal + personTip;
                const hasPaid = individualPayments[personIndex]?.paid || false;

                // Obtener todos los items asignados a OTRAS personas
                const itemsAssignedToOthers = Object.entries(itemAssignments)
                  .filter(([idx]) => parseInt(idx) !== personIndex)
                  .flatMap(([_, items]) => items);

                return (
                  <Card 
                    className={`bg-neutral-900 border-2 ${
                      hasPaid 
                        ? 'border-green-600' 
                        : 'border-neutral-800'
                    }`}
                  >
                    <CardContent className="p-6">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-4 pb-4 border-b border-neutral-800">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${hasPaid ? 'bg-green-600' : 'bg-blue-600'}`}>
                            <Users className="size-5 text-white" weight="fill" />
                          </div>
                          <h4 className="text-xl font-bold text-white">
                            Persona {personIndex + 1}
                          </h4>
                        </div>
                        {hasPaid && (
                          <Badge className="bg-green-600 text-white border-0">
                            <Check className="size-3 mr-1" weight="bold" />
                            Pagado
                          </Badge>
                        )}
                      </div>

                      {/* Lista de items del carrito con checkboxes */}
                      <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                        {cart.map((item, cartIndex) => {
                          const isAssigned = assignedItems.includes(cartIndex);
                          const isAssignedToOther = itemsAssignedToOthers.includes(cartIndex);
                          const isDisabled = hasPaid || isAssignedToOther;

                          return (
                            <label
                              key={cartIndex}
                              className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                                isDisabled
                                  ? 'opacity-40 cursor-not-allowed bg-neutral-950 border-neutral-800'
                                  : isAssigned 
                                  ? 'bg-blue-600/20 border-blue-600 cursor-pointer' 
                                  : 'bg-neutral-950 border-neutral-800 cursor-pointer hover:bg-neutral-900 hover:border-neutral-700'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isAssigned}
                                disabled={isDisabled}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setItemAssignments(prev => ({
                                      ...prev,
                                      [personIndex]: [...(prev[personIndex] || []), cartIndex]
                                    }));
                                  } else {
                                    setItemAssignments(prev => ({
                                      ...prev,
                                      [personIndex]: (prev[personIndex] || []).filter(i => i !== cartIndex)
                                    }));
                                  }
                                }}
                                className="size-5 cursor-pointer accent-blue-600"
                              />
                              <div className="flex-1 text-sm">
                                <span className="text-white font-medium">{item.quantity}x {item.productName}</span>
                                {(item.frostingName || item.dryToppingName || item.extraName) && (
                                  <div className="text-xs text-neutral-400 mt-1">
                                    {item.frostingName && `• ${item.frostingName} `}
                                    {item.dryToppingName && `• ${item.dryToppingName} `}
                                    {item.extraName && `• ${item.extraName}`}
                                  </div>
                                )}
                              </div>
                              <span className="text-sm font-semibold text-blue-400">
                                {formatCurrency(item.unitPrice * item.quantity)}
                              </span>
                            </label>
                          );
                        })}
                      </div>

                      {/* Controles de Propina Individual */}
                      <div className="bg-neutral-900 rounded-lg p-3 border border-neutral-800 mb-3">
                        <h4 className="text-sm font-semibold text-white mb-2">Propina (Servicio)</h4>
                        <div className="grid grid-cols-3 gap-2 mb-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setIndividualTips(prev => ({
                                ...prev,
                                [personIndex]: { percentage: 10, custom: '', showCustom: false }
                              }));
                            }}
                            className={`h-10 text-sm font-semibold ${
                              personTipData.percentage === 10 && !personTipData.showCustom
                                ? 'bg-blue-600 border-blue-500 text-white hover:bg-blue-700'
                                : 'bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700'
                            }`}
                          >
                            10%
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setIndividualTips(prev => ({
                                ...prev,
                                [personIndex]: { percentage: 15, custom: '', showCustom: false }
                              }));
                            }}
                            className={`h-10 text-sm font-semibold ${
                              personTipData.percentage === 15 && !personTipData.showCustom
                                ? 'bg-blue-600 border-blue-500 text-white hover:bg-blue-700'
                                : 'bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700'
                            }`}
                          >
                            15%
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setIndividualTips(prev => ({
                                ...prev,
                                [personIndex]: { percentage: 0, custom: '', showCustom: true }
                              }));
                            }}
                            className={`h-10 text-sm font-semibold ${
                              personTipData.showCustom
                                ? 'bg-blue-600 border-blue-500 text-white hover:bg-blue-700'
                                : 'bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700'
                            }`}
                          >
                            Otro
                          </Button>
                        </div>
                        {personTipData.showCustom && (
                          <Input
                            type="number"
                            placeholder="0.00"
                            value={personTipData.custom}
                            onChange={(e) => {
                              setIndividualTips(prev => ({
                                ...prev,
                                [personIndex]: { ...personTipData, custom: e.target.value }
                              }));
                            }}
                            className="bg-neutral-950 border-neutral-800 text-white text-sm h-9"
                          />
                        )}
                      </div>

                      {/* Total de esta persona */}
                      <div className="bg-neutral-950 rounded-lg p-4 border border-neutral-800 space-y-2">
                        <div className="flex justify-between text-sm text-neutral-400">
                          <span>Subtotal:</span>
                          <span className="font-semibold">{formatCurrency(personTotal)}</span>
                        </div>
                        {personTip > 0 && (
                          <div className="flex justify-between text-sm text-blue-400">
                            <span>Propina {personTipData.showCustom ? '' : `(${personTipData.percentage}%)`}:</span>
                            <span className="font-semibold">{formatCurrency(personTip)}</span>
                          </div>
                        )}
                        <div className="border-t border-neutral-800 pt-2 mt-2"></div>
                        <div className="flex justify-between text-xl font-bold text-white">
                          <span>Total:</span>
                          <span>{formatCurrency(personFinalTotal)}</span>
                        </div>
                      </div>

                      {/* Botón de cobro individual */}
                      {!hasPaid && assignedItems.length > 0 && (
                        <Button
                          onClick={() => {
                            setIndividualPayments(prev => ({
                              ...prev,
                              [personIndex]: { paid: true, method: 'cash', amount: personFinalTotal }
                            }));
                            toast.success(`Persona ${personIndex + 1} - Pago registrado: ${formatCurrency(personFinalTotal)}`);
                          }}
                          className="w-full mt-4 h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold"
                        >
                          <Check className="mr-2 size-5" weight="bold" />
                          Cobrar {formatCurrency(personFinalTotal)}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })()}
            </div>
            )}
          </div>
        </div>
      ) : showingPayment ? (
        // Vista de Pago Inline
        <div className="flex-1 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-5xl space-y-3 my-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold">Procesar Pago</h2>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowingPayment(false);
                  setPaymentMethod(null);
                  setCashReceived("");
                  setWaitingForTerminal(false);
                  setProcessing(false);
                }}
              >
                ← Cancelar
              </Button>
            </div>

            {/* Grid: Resumen + Propina en 2 columnas */}
            <div className="grid grid-cols-2 gap-3">
              {/* Resumen agrupado de items */}
              <Card>
                <CardContent className="p-3">
                  <h3 className="font-semibold mb-2 text-sm">Resumen de la orden</h3>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                  {(() => {
                    // Agrupar items por productName + modificadores
                    const groupedItems = cart.reduce((acc, item) => {
                      const key = `${item.productName}-${item.frostingName || ''}-${item.dryToppingName || ''}-${item.extraName || ''}-${item.customModifiers || ''}`;
                      if (!acc[key]) {
                        acc[key] = { ...item, quantity: 0 };
                      }
                      acc[key].quantity += item.quantity;
                      return acc;
                    }, {} as Record<string, CartItem>);

                    return Object.values(groupedItems).map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm py-1">
                        <div className="flex-1">
                          <span className="font-medium">{item.quantity} x {item.productName}</span>
                          {(item.frostingName || item.dryToppingName || item.extraName) && (
                            <div className="text-xs text-muted-foreground ml-4">
                              {item.frostingName && `• ${item.frostingName} `}
                              {item.dryToppingName && `• ${item.dryToppingName} `}
                              {item.extraName && `• ${item.extraName}`}
                            </div>
                          )}
                        </div>
                        <span className="text-muted-foreground">
                          {formatCurrency(item.unitPrice * item.quantity)}
                        </span>
                      </div>
                    ));
                  })()}
                </div>
              </CardContent>
            </Card>

              {/* Sección de Propina */}
              <Card className="bg-neutral-900 border-neutral-800">
                <CardContent className="p-3">
                  <h3 className="font-semibold mb-2 text-sm text-white">Propina (Servicio)</h3>
                
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setTipPercentage(10);
                      setCustomTip("");
                      setShowCustomTip(false);
                    }}
                    className={`h-12 text-base font-semibold ${
                      tipPercentage === 10 && !showCustomTip
                        ? 'bg-blue-600 border-blue-500 text-white hover:bg-blue-700'
                        : 'bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700'
                    }`}
                  >
                    10%
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setTipPercentage(15);
                      setCustomTip("");
                      setShowCustomTip(false);
                    }}
                    className={`h-12 text-base font-semibold ${
                      tipPercentage === 15 && !showCustomTip
                        ? 'bg-blue-600 border-blue-500 text-white hover:bg-blue-700'
                        : 'bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700'
                    }`}
                  >
                    15%
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCustomTip(true);
                      setTipPercentage(0);
                    }}
                    className={`h-12 text-base font-semibold ${
                      showCustomTip
                        ? 'bg-blue-600 border-blue-500 text-white hover:bg-blue-700'
                        : 'bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700'
                    }`}
                  >
                    Otro
                  </Button>
                </div>

                {showCustomTip && (
                  <div className="mb-3">
                    <Label className="text-neutral-400 text-xs mb-1 block">Monto personalizado</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={customTip}
                      onChange={(e) => setCustomTip(e.target.value)}
                      className="bg-neutral-950 border-neutral-800 text-white text-base h-10"
                    />
                  </div>
                )}

                {(tipPercentage > 0 || (showCustomTip && parseFloat(customTip) > 0)) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setTipPercentage(0);
                      setCustomTip("");
                      setShowCustomTip(false);
                    }}
                    className="w-full bg-neutral-800 border-neutral-700 text-neutral-400 hover:bg-neutral-700 hover:text-white"
                  >
                    Sin propina
                  </Button>
                )}
              </CardContent>
            </Card>
            </div>

            {/* Total + División en Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Total de la orden */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3">
                <div className="space-y-2">
                  {/* Subtotal */}
                  <div className="flex items-center justify-between text-neutral-400 text-sm">
                    <span>Subtotal:</span>
                    <span className="font-semibold">{formatCurrency(cartTotal)}</span>
                  </div>
                  
                  {/* Propina si existe */}
                  {(() => {
                    const tipAmount = showCustomTip 
                      ? parseFloat(customTip) || 0 
                      : (cartTotal * tipPercentage / 100);
                    
                    if (tipAmount > 0) {
                      return (
                        <div className="flex items-center justify-between text-blue-400 text-sm">
                          <span>
                            Propina {showCustomTip ? '' : `(${tipPercentage}%)`}:
                          </span>
                          <span className="font-semibold">{formatCurrency(tipAmount)}</span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  
                  {/* Divider */}
                  <div className="border-t border-neutral-700"></div>
                  
                  {/* Total Final */}
                  <div className="flex items-center justify-between">
                    <span className="text-base font-medium text-white">Total a pagar:</span>
                    <span className="text-2xl font-bold text-white">
                      {formatCurrency(
                        cartTotal + (showCustomTip 
                          ? parseFloat(customTip) || 0 
                          : (cartTotal * tipPercentage / 100))
                      )}
                    </span>
                  </div>
                  
                  {loyaltyCard && (
                    <p className="text-xs text-neutral-400 mt-2">
                      Cliente: {loyaltyCard.customerName} • Se agregará 1 sello
                    </p>
                  )}
                </div>
              </div>

              {/* Indicador de División de Cuenta */}
              {Object.keys(individualPayments).length > 0 ? (
                <Card className="bg-neutral-900 border-neutral-800">
                  <CardContent className="p-3">
                    <div className="flex flex-col justify-center h-full">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Users className="size-4 text-blue-400" weight="fill" />
                          <p className="text-sm font-semibold text-white">División de Cuenta</p>
                        </div>
                        {Object.values(individualPayments).every(p => p.paid) ? (
                          <Badge className="bg-green-600 text-white text-xs">
                            <Check className="size-3 mr-1" weight="bold" />
                            Completo
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-600 text-white text-xs">
                            Pendiente
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-neutral-400">
                        {Object.values(individualPayments).filter(p => p.paid).length} de {guestCount} {guestCount === 1 ? 'persona ha' : 'personas han'} pagado
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div></div>
              )}
            </div>

            {/* Botón Dividir Cuenta - solo si hay más de 1 persona */}
            {!paymentCompleted && guestCount > 1 && (
              <div className="max-w-md mx-auto">
                <Button
                  variant="outline"
                  onClick={() => {
                    // Solo inicializar si no hay datos previos (persistencia)
                    if (Object.keys(itemAssignments).length === 0) {
                      const initialAssignments: Record<number, number[]> = {};
                      const initialPayments: Record<number, { paid: boolean, method: string | null, amount: number }> = {};
                      const initialTips: Record<number, { percentage: number, custom: string, showCustom: boolean }> = {};
                      for (let i = 0; i < guestCount; i++) {
                        initialAssignments[i] = [];
                        initialPayments[i] = { paid: false, method: null, amount: 0 };
                        initialTips[i] = { percentage: 0, custom: '', showCustom: false };
                      }
                      setItemAssignments(initialAssignments);
                      setIndividualPayments(initialPayments);
                      setIndividualTips(initialTips);
                    }
                    setCurrentPersonIndex(0);
                    setSplitBillMode(true);
                  }}
                  className="w-full h-14 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white border-0"
                >
                  <Users className="mr-2 size-5" weight="fill" />
                  {Object.keys(individualPayments).length > 0 ? 'Continuar División' : 'Dividir Cuenta'} ({guestCount} {guestCount === 1 ? 'persona' : 'personas'})
                </Button>
              </div>
            )}

            {/* Vista de confirmación con slide button */}
            {paymentCompleted ? (
              <div className="space-y-6">
                <Card className="border-green-500 bg-green-500/10">
                  <CardContent className="flex flex-col items-center justify-center p-8">
                    <Check className="mb-4 size-20 text-green-600" weight="bold" />
                    <p className="text-2xl font-bold mb-2">Pago Completado</p>
                    <p className="text-muted-foreground">
                      {paymentMethod === "cash" && "Efectivo recibido"}
                      {paymentMethod === "transfer" && "Transferencia confirmada"}
                      {paymentMethod === "terminal_mercadopago" && "Pago con terminal confirmado"}
                    </p>
                    <p className="text-3xl font-bold mt-4">{formatCurrency(cartTotal)}</p>
                  </CardContent>
                </Card>

                <div>
                  <p className="text-center text-sm text-muted-foreground mb-4">
                    Desliza para confirmar y liberar mesa
                  </p>
                  <SlideToConfirm onConfirm={handleConfirmOrder} disabled={confirmingOrder} />
                </div>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-3">
                <Card
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    paymentMethod === "cash" ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setPaymentMethod("cash")}
                >
                  <CardContent className="flex flex-col items-center justify-center p-6">
                    <Money className="mb-3 size-16 text-green-600" />
                    <p className="text-lg font-semibold">Efectivo</p>
                  </CardContent>
                </Card>

                <Card
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    paymentMethod === "terminal_mercadopago" ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setPaymentMethod("terminal_mercadopago")}
                >
                  <CardContent className="flex flex-col items-center justify-center p-6">
                    <CreditCard className="mb-3 size-16 text-blue-600" />
                    <p className="text-lg font-semibold">Terminal</p>
                  </CardContent>
                </Card>

                <Card
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    paymentMethod === "transfer" ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setPaymentMethod("transfer")}
                >
                  <CardContent className="flex flex-col items-center justify-center p-6">
                    <Bank className="mb-3 size-16 text-purple-600" />
                    <p className="text-lg font-semibold">Transferencia</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Detalles de pago en efectivo */}
            {paymentMethod === "cash" && !processing && (
              <Card>
                <CardContent className="space-y-4 p-6">
                  <div>
                    <Label className="text-base font-medium">Efectivo recibido</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      className="mt-2 text-3xl font-bold"
                      autoFocus
                    />
                  </div>
                  {parseFloat(cashReceived) > 0 && (
                    <div className="flex items-center justify-between rounded-lg bg-muted p-4">
                      <span className="text-lg font-medium">Cambio</span>
                      <span
                        className={`text-2xl font-bold ${
                          parseFloat(cashReceived) - cartTotal >= 0 
                            ? "text-green-600" 
                            : "text-destructive"
                        }`}
                      >
                        {formatCurrency(Math.max(0, parseFloat(cashReceived) - cartTotal))}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Botón de pago */}
            {paymentMethod && !paymentCompleted && (
              <Button
                size="lg"
                className="w-full text-xl py-8"
                disabled={
                  processing ||
                  (paymentMethod === "cash" && parseFloat(cashReceived) < cartTotal)
                }
                onClick={
                  paymentMethod === "cash" 
                    ? handlePayCash 
                    : paymentMethod === "transfer"
                    ? handlePayTransfer
                    : handlePayTerminal
                }
              >
                {processing ? (
                  <>
                    <Spinner className="mr-2 size-6 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 size-6" />
                    Cobrar {formatCurrency(cartTotal)}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* COLUMNA DE CATEGORÍAS VERTICAL */}
          <div className="w-64 bg-neutral-950 border-r border-neutral-800 flex flex-col overflow-y-auto">
            {/* Searchbar */}
            <div className="p-4 border-b border-neutral-800">
              <div className="relative">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-500" />
                <Input
                  placeholder="Buscar productos..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (e.target.value) setSelectedCategory(null);
                  }}
                  className="pl-9 bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-500 focus:border-blue-600"
                />
              </div>
            </div>

            {/* Categorías */}
            <div className="p-3 space-y-2">
              {categories.map((category) => {
                const isSelected = selectedCategory === category.id;
                const categoryColor = category.color || '#6B7280';
                
                return (
                  <button
                    key={category.id}
                    onClick={() => {
                      setSelectedCategory(category.id);
                      setSearchQuery('');
                      resetFlow();
                    }}
                    className={`w-full px-4 py-4 text-left rounded-lg transition-all font-medium relative overflow-hidden ${
                      isSelected 
                        ? 'bg-neutral-900 border-2 shadow-lg' 
                        : 'bg-neutral-900/50 border border-neutral-800 hover:bg-neutral-900 hover:border-neutral-700'
                    }`}
                    style={{
                      borderColor: isSelected ? categoryColor : undefined,
                      color: isSelected ? categoryColor : '#fff',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span>{category.name}</span>
                      {isSelected && (
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: categoryColor }}
                        />
                      )}
                    </div>
                    {isSelected && (
                      <div 
                        className="absolute left-0 top-0 bottom-0 w-1"
                        style={{ backgroundColor: categoryColor }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* AREA PRINCIPAL - FLUJO DINÁMICO */}
          <div className="flex-1 flex flex-col overflow-hidden bg-neutral-900">
        {/* Header con título y botón back */}
        <div className="p-4 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
          <div>
            {currentStepIndex === -1 && <h2 className="text-2xl font-bold text-white">Selecciona un producto</h2>}
            {currentStepIndex >= 0 && categoryFlow && currentStepIndex === categoryFlow.steps.length && (
              <div>
                <h2 className="text-2xl font-bold text-white">Notas (opcional)</h2>
                <p className="text-sm text-neutral-400">{selectedProduct?.name}</p>
              </div>
            )}
            {currentStepIndex >= 0 && categoryFlow && categoryFlow.steps[currentStepIndex] && (
              <div>
                <h2 className="text-2xl font-bold text-white">{categoryFlow.steps[currentStepIndex].stepName}</h2>
                <p className="text-sm text-neutral-400">{selectedProduct?.name}</p>
              </div>
            )}
          </div>
          {currentStepIndex >= 0 && (
            <Button 
              variant="outline" 
              onClick={handleBackInFlow}
              className="bg-neutral-900 border-neutral-800 text-white hover:bg-neutral-800"
            >
              ← Atrás
            </Button>
          )}
        </div>

        {/* VISTA: PRODUCTOS */}
        {currentStepIndex === -1 && (
          <div className="flex-1 overflow-auto p-6">
            {!selectedCategory ? (
              <div className="flex items-center justify-center h-full text-neutral-500">
                Selecciona una categoría para ver productos
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex items-center justify-center h-full text-neutral-500">
                No hay productos en esta categoría
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {filteredProducts.map((product) => {
                  const category = categories.find(c => c.id === product.categoryId);
                  return (
                    <button
                      key={product.id}
                      onClick={() => handleProductClick(product)}
                      className="rounded-lg overflow-hidden relative hover:scale-[1.02] transition-all bg-neutral-800 border border-neutral-700 hover:border-blue-600 hover:shadow-xl"
                      style={{ minHeight: '180px' }}
                    >
                      {product.imageUrl ? (
                        <div className="absolute inset-0">
                          <img 
                            src={product.imageUrl} 
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                        </div>
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-neutral-900" />
                      )}
                      <div className="relative z-10 p-4 flex flex-col justify-between h-full min-h-[180px]">
                        <div className="text-left">
                          <div className="font-semibold text-white text-lg mb-2">
                            {product.name}
                          </div>
                        </div>
                          
                        <div className="text-left">
                          <div className="text-2xl font-bold text-white">
                            {formatCurrency(parseFloat(product.price))}
                          </div>
                          {category && (
                            <div 
                              className="inline-block px-2 py-1 rounded text-xs font-medium mt-2"
                              style={{ 
                                backgroundColor: `${category.color || '#6B7280'}20`,
                                color: category.color || '#6B7280',
                                border: `1px solid ${category.color || '#6B7280'}40`
                              }}
                            >
                              {category.name}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* VISTAS DINÁMICAS DE PASOS */}
        {currentStepIndex >= 0 && categoryFlow && categoryFlow.steps[currentStepIndex] && (() => {
          const currentStep = categoryFlow.steps[currentStepIndex];
          
          // Renderizar según tipo de paso
          if (currentStep.stepType === "frosting") {
            return (
              <div className="flex-1 p-8 overflow-auto">
                <div className="grid grid-cols-4 gap-4 max-w-6xl">
                  {currentStep.includeNoneOption && (
                    <button
                      onClick={() => handleStepSelection(null)}
                      className="h-32 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center font-semibold transition-colors border-2 border-transparent hover:border-primary"
                    >
                      Sin {currentStep.stepName.toLowerCase()}
                    </button>
                  )}
                  {frostings.map((frosting) => (
                    <button
                      key={frosting.id}
                      onClick={() => {
                        setSelectedFrosting(frosting);
                        handleStepSelection(frosting);
                      }}
                      className="h-32 rounded-lg bg-primary/10 hover:bg-primary/20 flex items-center justify-center font-semibold transition-colors border-2 border-transparent hover:border-primary"
                    >
                      {frosting.name}
                    </button>
                  ))}
                </div>
              </div>
            );
          } else if (currentStep.stepType === "topping") {
            return (
              <div className="flex-1 p-8 overflow-auto">
                <div className="grid grid-cols-4 gap-4 max-w-6xl">
                  {currentStep.includeNoneOption && (
                    <button
                      onClick={() => handleStepSelection(null)}
                      className="h-32 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center font-semibold transition-colors border-2 border-transparent hover:border-primary"
                    >
                      Sin {currentStep.stepName.toLowerCase()}
                    </button>
                  )}
                  {toppings.map((topping) => (
                    <button
                      key={topping.id}
                      onClick={() => {
                        setSelectedTopping(topping);
                        handleStepSelection(topping);
                      }}
                      className="h-32 rounded-lg bg-primary/10 hover:bg-primary/20 flex items-center justify-center font-semibold transition-colors border-2 border-transparent hover:border-primary"
                    >
                      {topping.name}
                    </button>
                  ))}
                </div>
              </div>
            );
          } else if (currentStep.stepType === "extra") {
            return (
              <div className="flex-1 flex flex-col p-8 overflow-auto">
                <div className="grid grid-cols-4 gap-4 max-w-6xl mb-6">
                  {currentStep.includeNoneOption && (
                    <button
                      onClick={() => handleStepSelection([])}
                      className="h-32 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center font-semibold transition-colors border-2 border-transparent hover:border-primary"
                    >
                      Sin {currentStep.stepName.toLowerCase()}
                    </button>
                  )}
                  {extras.map((extra) => (
                    <button
                      key={extra.id}
                      onClick={() => {
                        const newExtras = selectedExtras.find(e => e.id === extra.id)
                          ? selectedExtras.filter(e => e.id !== extra.id)
                          : [...selectedExtras, extra];
                        setSelectedExtras(newExtras);
                        // Avanzar automáticamente después de seleccionar
                        setTimeout(() => handleStepSelection(newExtras), 300);
                      }}
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
              </div>
            );
          } else if (currentStep.stepType === "custom" && currentStep.options) {
            // Renderizar opciones personalizadas
            return (
              <div className="flex-1 p-8 overflow-auto">
                <div className="grid grid-cols-4 gap-4 max-w-6xl">
                  {currentStep.includeNoneOption && (
                    <button
                      onClick={() => handleStepSelection(null)}
                      className="h-32 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center font-semibold transition-colors border-2 border-transparent hover:border-primary"
                    >
                      Sin {currentStep.stepName.toLowerCase()}
                    </button>
                  )}
                  {currentStep.options.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleStepSelection(option)}
                      className="h-32 rounded-lg bg-primary/10 hover:bg-primary/20 flex flex-col items-center justify-center font-semibold transition-colors border-2 border-transparent hover:border-primary"
                    >
                      <div>{option.name}</div>
                      {parseFloat(option.price) > 0 && (
                        <div className="text-sm opacity-80 mt-1">
                          +{formatCurrency(parseFloat(option.price))}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          }
          
          return null;
        })()}

        {/* VISTA: NOTAS (después del último paso) */}
        {currentStepIndex >= 0 && categoryFlow && currentStepIndex === categoryFlow.steps.length && (
          <div className="flex-1 flex flex-col p-8 overflow-auto">
            <div className="max-w-2xl mx-auto w-full space-y-6">
              <div>
                <Label htmlFor="product-notes" className="text-lg">¿Alguna nota especial para este producto?</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Opcional: indica preferencias, alergias o instrucciones especiales
                </p>
              </div>
              
              <textarea
                id="product-notes"
                value={productNotes}
                onChange={(e) => setProductNotes(e.target.value)}
                placeholder="Ej: Sin azúcar, extra picante, sin cebolla..."
                className="w-full h-32 p-4 rounded-lg border bg-background resize-none"
              />

              <div className="flex gap-4">
                <Button
                  onClick={finishFlowAndAddToCart}
                  size="lg"
                  className="flex-1"
                >
                  Agregar al carrito
                </Button>
              </div>
            </div>
          </div>
        )}
          </div>
        </>
      )}

      {/* Dialog de Selección de Variantes */}
      <Dialog open={showVariantDialog} onOpenChange={setShowVariantDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedProductForVariant?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Selecciona una opción:
            </p>
            {selectedProductForVariant?.variants && JSON.parse(selectedProductForVariant.variants).map((variant: any, index: number) => (
              <Button
                key={index}
                variant="outline"
                className="w-full justify-between h-auto py-4"
                onClick={() => handleAddVariant(variant.name, variant.price)}
              >
                <span className="font-semibold">{variant.name}</span>
                <span className="text-lg">{formatCurrency(parseFloat(variant.price))}</span>
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVariantDialog(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Número de Personas */}
      <Dialog open={showGuestCountDialog} onOpenChange={setShowGuestCountDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Número de Personas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setTempGuestCount(Math.max(1, tempGuestCount - 1))}
                className="h-16 w-16 p-0"
              >
                <Minus className="size-6" />
              </Button>
              <div className="text-6xl font-bold w-32 text-center">
                {tempGuestCount}
              </div>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setTempGuestCount(tempGuestCount + 1)}
                className="h-16 w-16 p-0"
              >
                <Plus className="size-6" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Ajusta el número de comensales en la mesa
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGuestCountDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={() => {
              setGuestCount(tempGuestCount);
              setShowGuestCountDialog(false);
              toast.success(`Número de personas actualizado: ${tempGuestCount}`);
            }}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Comentarios para Producto */}
      <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingCartItem?.productName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="item-notes">Comentarios especiales (opcional)</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Instrucciones, preferencias o alergias
              </p>
              <textarea
                id="item-notes"
                value={tempNotes}
                onChange={(e) => setTempNotes(e.target.value)}
                placeholder="Ej: Sin cebolla, extra picante, término medio..."
                className="w-full h-24 p-3 mt-2 rounded-lg border bg-background resize-none"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelNotes}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmNotes}>
              {tempNotes.trim() ? "Agregar con comentario" : "Agregar sin comentario"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Nombre de Cliente Para Llevar */}
      <Dialog open={showCustomerNameDialog} onOpenChange={setShowCustomerNameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Orden Para Llevar</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre del Cliente</Label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Ej: Juan Pérez"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleConfirmCustomerName();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCustomerNameDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmCustomerName}>
              Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Leer QR */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leer QR de Tarjeta de Lealtad</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Camera Toggle Button */}
            <div className="flex justify-center">
              {!cameraActive ? (
                <Button onClick={startCamera} variant="outline" className="w-full">
                  <Camera className="mr-2 size-4" />
                  Abrir Cámara
                </Button>
              ) : (
                <Button onClick={stopCamera} variant="outline" className="w-full">
                  <X className="mr-2 size-4" />
                  Cerrar Cámara
                </Button>
              )}
            </div>

            {/* Video Preview */}
            {cameraActive ? (
              <div className="relative rounded-lg overflow-hidden bg-black" style={{ minHeight: '256px' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-64 object-cover"
                  style={{ minHeight: '256px', display: 'block' }}
                  onLoadedMetadata={() => console.log("🎥 Video onLoadedMetadata disparado")}
                  onPlaying={() => console.log("▶️ Video onPlaying disparado")}
                  onError={(e) => console.error("❌ Video onError:", e)}
                />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-0 border-2 border-primary/50 pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-primary rounded-lg" />
                </div>
              </div>
            ) : (
              <div className="relative rounded-lg overflow-hidden bg-muted border-2 border-dashed" style={{ minHeight: '256px' }}>
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  <div className="text-center">
                    <Camera className="mx-auto mb-2 size-12 opacity-50" />
                    <p>Presiona "Abrir Cámara" para escanear</p>
                  </div>
                </div>
              </div>
            )}

            {/* Manual Input */}
            <div>
              <Label htmlFor="qr-code">O ingresa el código manualmente</Label>
              <Input
                id="qr-code"
                value={qrCode}
                onChange={(e) => setQrCode(e.target.value)}
                placeholder="Código de barras"
                onKeyDown={(e) => e.key === "Enter" && handleQRSubmit()}
                disabled={cameraActive}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { stopCamera(); setQrDialogOpen(false); }}>
              Cancelar
            </Button>
            <Button onClick={handleQRSubmit} disabled={loadingCard || !qrCode.trim()}>
              {loadingCard ? "Buscando..." : "Buscar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Asignar Sellos Manual */}
      <Dialog open={manualStampDialogOpen} onOpenChange={setManualStampDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar Sello Manual</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="manual-barcode">Código de Barras</Label>
              <Input
                id="manual-barcode"
                value={manualBarcodeInput}
                onChange={(e) => setManualBarcodeInput(e.target.value)}
                placeholder="Escanea o ingresa el código"
                onKeyDown={(e) => e.key === "Enter" && handleManualStampSubmit()}
                autoFocus
              />
              <p className="text-xs text-muted-foreground mt-1">
                Para clientes que ya pagaron pero olvidaron escanear su tarjeta
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManualStampDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleManualStampSubmit} disabled={loadingCard}>
              {loadingCard ? "Procesando..." : "Agregar Sello"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
