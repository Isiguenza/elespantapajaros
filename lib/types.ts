export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: string;
  categoryId: string | null;
  imageUrl: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  category?: Category | null;
  ingredients?: ProductIngredient[];
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  sortOrder: number;
  active: boolean;
}

export interface Ingredient {
  id: string;
  name: string;
  unit: string;
  currentStock: string;
  minStock: string;
  costPerUnit: string;
  active: boolean;
}

export interface ProductIngredient {
  id: string;
  productId: string;
  ingredientId: string;
  quantityNeeded: string;
  ingredient?: Ingredient;
}

export interface Order {
  id: string;
  orderNumber: number;
  status: "pending" | "preparing" | "ready" | "delivered" | "cancelled";
  total: string;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  paymentMethod: "cash" | "terminal_mercadopago" | "card" | null;
  mercadopagoPaymentId: string | null;
  mercadopagoPaymentIntentId: string | null;
  userId: string | null;
  customerName: string | null;
  notes: string | null;
  loyaltyCardId: string | null;
  cashRegisterId: string | null;
  createdAt: Date;
  updatedAt: Date;
  items?: OrderItem[];
  user?: UserProfile | null;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: string;
  subtotal: string;
  notes: string | null;
}

export interface CartItem {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  notes: string;
}

export interface CashRegister {
  id: string;
  openedBy: string;
  openedAt: Date;
  closedAt: Date | null;
  initialCash: string;
  finalCash: string | null;
  expectedCash: string | null;
  totalSales: string | null;
  totalOrders: number | null;
  difference: string | null;
  notes: string | null;
  status: "open" | "closed";
  openedByUser?: UserProfile;
}

export interface LoyaltyCard {
  id: string;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  barcodeValue: string;
  stamps: number;
  totalStamps: number;
  rewardsAvailable: number;
  rewardsRedeemed: number;
  stampsPerReward: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  authUserId: string;
  name: string;
  email: string;
  role: "admin" | "cashier" | "bartender";
  active: boolean;
}

export interface MercadoPagoDevice {
  id: string;
  deviceId: string;
  deviceName: string;
  posId: string | null;
  storeId: string | null;
  active: boolean;
}
