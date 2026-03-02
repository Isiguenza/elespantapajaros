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
import { Plus, Minus, Trash, MagnifyingGlass, DotsThree, QrCode, Stamp, Camera, X, Money, CreditCard, Check, Spinner, Bank } from "@phosphor-icons/react";
import { SlideToConfirm } from "@/components/ui/slide-to-confirm";
import { toast } from "sonner";
import type { Product, Category, CartItem, Frosting, DryTopping, Extra, LoyaltyCard, CategoryFlow, ModifierStep, ModifierOption } from "@/lib/types";

export default function BarPage() {
  const router = useRouter();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [frostings, setFrostings] = useState<Frosting[]>([]);
  const [toppings, setToppings] = useState<DryTopping[]>([]);
  const [extras, setExtras] = useState<Extra[]>([]);
  
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

  // Cargar flujo de categoría
  async function loadCategoryFlow(categoryId: string) {
    try {
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

  // Iniciar flujo de modificadores
  function handleProductClick(product: Product) {
    setSelectedProduct(product);
    setStepSelections({});
    setSelectedFrosting(null);
    setSelectedTopping(null);
    setSelectedExtras([]);
    
    // Iniciar en el primer paso del flujo
    if (categoryFlow && categoryFlow.steps.length > 0) {
      setCurrentStepIndex(0);
    } else {
      // Sin flujo configurado, ir directo al carrito
      addToCartDirectly(product);
    }
  }

  function addToCartDirectly(product: Product) {
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
    setCart([...cart, newItem]);
    toast.success(`${product.name} agregado`);
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
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        console.log("📹 Stream asignado al video. Dimensiones del track:", 
          stream.getVideoTracks()[0].getSettings());
        
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
          setCameraActive(true);
          
          // Start scanning después de un pequeño delay para asegurar que el video esté listo
          setTimeout(() => scanQRCode(), 100);
        } catch (playError) {
          console.error("❌ Error al reproducir video:", playError);
          toast.error("Error al iniciar video. Intenta de nuevo.");
          // Limpiar stream si falla el play
          stream.getTracks().forEach(track => track.stop());
        }
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
        setQrCode(code.data);
        stopCamera();
        toast.success("Código detectado");
        scanningRef.current = false;
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
  async function handleQRSubmit() {
    if (!qrCode.trim()) {
      toast.error("Ingresa el código QR");
      return;
    }

    setLoadingCard(true);
    try {
      const res = await fetch(`/api/loyalty-cards/barcode/${qrCode}`);
      if (!res.ok) {
        toast.error("Tarjeta no encontrada");
        return;
      }
      
      const card = await res.json();
      setLoyaltyCard(card);
      setQrDialogOpen(false);
      setQrCode("");
      toast.success(`Cliente: ${card.customerName}`);
    } catch (error) {
      toast.error("Error al buscar tarjeta");
    } finally {
      setLoadingCard(false);
    }
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
          paymentStatus: "pending",
          loyaltyCardId: loyaltyCard?.id || null,
        }),
      });

      if (!res.ok) throw new Error();
      const order = await res.json();
      
      setCurrentOrderId(order.id);
      // Si ya tiene cliente frecuente, ir directo a pago, si no, mostrar paso de loyalty
      if (loyaltyCard) {
        setShowingPayment(true);
      } else {
        setShowingLoyaltyStep(true);
      }
      toast.success("Orden creada");
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

  async function handleConfirmOrder() {
    if (!currentOrderId) return;
    setConfirmingOrder(true);
    try {
      const res = await fetch(`/api/orders/${currentOrderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "preparing" }),
      });
      
      if (!res.ok) throw new Error();
      
      toast.success("Orden enviada a cocina");
      
      // Limpiar todo y volver a la vista de productos
      setCart([]);
      setLoyaltyCard(null);
      setShowingPayment(false);
      setPaymentMethod(null);
      setCashReceived("");
      setCurrentOrderId(null);
      setPaymentCompleted(false);
    } catch {
      toast.error("Error confirmando orden");
    } finally {
      setConfirmingOrder(false);
    }
  }

  async function handlePayTerminal() {
    if (!currentOrderId) return;
    setProcessing(true);
    setWaitingForTerminal(true);
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
      
      if (!res.ok) {
        const errorData = await res.json();
        toast.error(errorData.error || "Error enviando pago a terminal");
        if (errorData.hint) {
          toast.error(errorData.hint, { duration: 5000 });
        }
        setProcessing(false);
        setWaitingForTerminal(false);
        return;
      }

      // Poll for payment status
      const pollInterval = setInterval(async () => {
        const statusRes = await fetch(`/api/orders/${currentOrderId}`);
        if (statusRes.ok) {
          const updatedOrder = await statusRes.json();
          if (updatedOrder.paymentStatus === "paid") {
            clearInterval(pollInterval);
            setWaitingForTerminal(false);
            toast.success("Pago confirmado por terminal");
            setPaymentCompleted(true);
            setProcessing(false);
          } else if (updatedOrder.paymentStatus === "failed") {
            clearInterval(pollInterval);
            setWaitingForTerminal(false);
            setProcessing(false);
            toast.error("Pago rechazado en terminal");
          }
        }
      }, 2000);

      // Timeout after 2 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        if (waitingForTerminal) {
          setWaitingForTerminal(false);
          setProcessing(false);
          toast.error("Tiempo de espera agotado");
        }
      }, 120000);
    } catch (error) {
      toast.error("Error enviando pago a terminal");
      setProcessing(false);
      setWaitingForTerminal(false);
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

  // Filtrar productos por categoría o búsqueda
  const filteredProducts = searchQuery
    ? products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())) // Buscar en todas las categorías
    : selectedCategory
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
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
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
              <span className="font-bold">{formatCurrency(cartTotal)}</span>
            </div>
          </div>
          {loyaltyCard && (
            <div className="mb-2 p-2 bg-primary/10 rounded text-sm">
              <div className="font-medium">{loyaltyCard.customerName}</div>
              <div className="text-xs text-muted-foreground">
                {loyaltyCard.stamps} sellos • {loyaltyCard.rewardsAvailable} recompensas
              </div>
            </div>
          )}
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
            cart.map((item, index) => (
              <div key={index} className="bg-muted rounded-lg p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{item.productName}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatCurrency(item.unitPrice)} c/u
                    </div>
                    {/* Resumen de modificadores */}
                    {(item.frostingName || item.dryToppingName || item.extraName || item.customModifiers) && (
                      <div className="mt-1 space-y-0.5">
                        {item.frostingName && (
                          <div className="text-xs text-muted-foreground">
                            • Escarchado: {item.frostingName}
                          </div>
                        )}
                        {item.dryToppingName && (
                          <div className="text-xs text-muted-foreground">
                            • Topping: {item.dryToppingName}
                          </div>
                        )}
                        {item.extraName && (
                          <div className="text-xs text-muted-foreground">
                            • Extra: {item.extraName}
                          </div>
                        )}
                        {item.customModifiers && (() => {
                          try {
                            const modifiers = JSON.parse(item.customModifiers);
                            return Object.values(modifiers).map((mod: any, idx: number) => (
                              <div key={idx} className="text-xs text-muted-foreground">
                                • {mod.stepName}: {mod.options.map((opt: any) => opt.name).join(', ')}
                              </div>
                            ));
                          } catch (e) {
                            return null;
                          }
                        })()}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFromCart(index)}
                  >
                    <Trash className="size-4 text-destructive" />
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(index, -1)}
                      className="h-8 w-8 p-0"
                    >
                      <Minus className="size-3" />
                    </Button>
                    <span className="font-semibold w-8 text-center">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(index, 1)}
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
      ) : showingPayment ? (
        // Vista de Pago Inline
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold">Procesar Pago</h2>
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

            {/* Total de la orden */}
            <div className="bg-primary/10 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <span className="text-xl font-medium">Total a pagar:</span>
                <span className="text-4xl font-bold">{formatCurrency(cartTotal)}</span>
              </div>
              {loyaltyCard && (
                <p className="text-sm text-muted-foreground mt-3">
                  Cliente: {loyaltyCard.customerName} • Se agregará 1 sello
                </p>
              )}
            </div>

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
                    Desliza para confirmar y enviar a cocina
                  </p>
                  <SlideToConfirm onConfirm={handleConfirmOrder} disabled={confirmingOrder} />
                </div>
              </div>
            ) : !waitingForTerminal ? (
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
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-12">
                  <Spinner className="mb-4 size-16 animate-spin text-primary" />
                  <p className="text-xl font-semibold">Esperando pago en terminal...</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Presenta la tarjeta o dispositivo en la terminal Mercado Pago
                  </p>
                  <Button
                    variant="outline"
                    className="mt-6"
                    onClick={() => {
                      setWaitingForTerminal(false);
                      setProcessing(false);
                    }}
                  >
                    Cancelar
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Detalles de pago en efectivo */}
            {paymentMethod === "cash" && !waitingForTerminal && !processing && (
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
            {paymentMethod && !waitingForTerminal && !paymentCompleted && (
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
          <div className="w-54 mx-6 flex flex-col p-4 gap-3 overflow-y-auto">
            {/* Searchbar */}
            <div className="relative mb-2">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value) setSelectedCategory(null);
                }}
                className="pl-9"
              />
            </div>

            {categories.map((category) => {
              const isSelected = selectedCategory === category.id;
              const categoryColor = category.color || '#6B7280';
              
              return (
                <button
                  key={category.id}
                  onClick={() => {
                    setSelectedCategory(category.id);
                    setSearchQuery('');
                    // Resetear flow al cambiar de categoría
                    resetFlow();
                  }}
                  className={`px-5 py-8 text-center rounded-lg transition-all relative overflow-hidden ${
                    isSelected ? 'font-semibold' : 'hover:scale-105 bg-muted/30'
                  }`}
                  style={{
                    backgroundColor: isSelected ? `${categoryColor}20` : undefined,
                    borderWidth: isSelected ? '2px' : '1px',
                    borderColor: isSelected ? categoryColor : '#5153566d',
                    color: isSelected ? categoryColor : 'inherit',
                  }}
                >
                  <div>{category.name}</div>
                  {!isSelected && (
                    <div 
                      className="absolute bottom-0 left-0 right-0 h-1"
                      style={{ backgroundColor: categoryColor }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* AREA PRINCIPAL - FLUJO DINÁMICO */}
          <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header con título y botón back */}
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            {currentStepIndex === -1 && <h2 className="text-2xl font-bold">Selecciona un producto</h2>}
            {currentStepIndex >= 0 && categoryFlow && currentStepIndex === categoryFlow.steps.length && (
              <div>
                <h2 className="text-2xl font-bold">Notas (opcional)</h2>
                <p className="text-sm text-muted-foreground">{selectedProduct?.name}</p>
              </div>
            )}
            {currentStepIndex >= 0 && categoryFlow && categoryFlow.steps[currentStepIndex] && (
              <div>
                <h2 className="text-2xl font-bold">{categoryFlow.steps[currentStepIndex].stepName}</h2>
                <p className="text-sm text-muted-foreground">{selectedProduct?.name}</p>
              </div>
            )}
          </div>
          {currentStepIndex >= 0 && (
            <Button variant="outline" onClick={handleBackInFlow}>
              ← Atrás
            </Button>
          )}
        </div>

        {/* VISTA: PRODUCTOS */}
        {currentStepIndex === -1 && (
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
              <div className="grid grid-cols-2 gap-4">
                {filteredProducts.map((product) => {
                  const category = categories.find(c => c.id === product.categoryId);
                  return (
                    <button
                      key={product.id}
                      onClick={() => handleProductClick(product)}
                      className="rounded-lg overflow-hidden relative hover:scale-105 transition-transform"
                      style={{ minHeight: '150px' }}
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
                      <div className="relative z-10 p-4 flex flex-col h-full min-h-[140px]">
                        <div className="text-left">
                          <div className={`font-semibold mb-1 ${product.imageUrl ? 'text-white' : ''}`}>
                            {product.name}
                          </div>
                          
                          <div className={`text-sm ${product.imageUrl ? 'text-white/90' : 'text-muted-foreground'}`}>
                            {formatCurrency(parseFloat(product.price))}
                          </div>
                        </div>
                        
                        {/* Spacer dinámico */}
                        <div className="flex-1 min-h-[12px]" />
                        
                        <div className={`font-light text-xs pt-3 text-left ${product.imageUrl ? 'text-gray-400 border-white/20' : 'text-muted-foreground border-border'}`}>
                          {product.description ?? "N/A"}
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
            {cameraActive && (
              <div className="relative rounded-lg overflow-hidden bg-black" style={{ minHeight: '256px' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-64 object-cover"
                  style={{ minHeight: '256px' }}
                />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-0 border-2 border-primary/50 pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-primary rounded-lg" />
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
