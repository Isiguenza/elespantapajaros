export interface Group {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
  active: boolean;
  createdAt: Date;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: string;
  categoryId: string | null;
  groupId: string | null;
  imageUrl: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  category?: Category | null;
  group?: Group | null;
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

export interface Frosting {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DryTopping {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Extra {
  id: string;
  name: string;
  description: string | null;
  price: string;
  sortOrder: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: string;
  orderNumber: number;
  status: "pending" | "preparing" | "ready" | "delivered" | "cancelled";
  total: string;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  paymentMethod: "cash" | "terminal_mercadopago" | "card" | "transfer" | null;
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
  payments?: OrderPayment[];
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
  frostingId: string | null;
  frostingName: string | null;
  dryToppingId: string | null;
  dryToppingName: string | null;
  extraId: string | null;
  extraName: string | null;
  frosting?: Frosting | null;
  dryTopping?: DryTopping | null;
  extra?: Extra | null;
}

export interface OrderPayment {
  id: string;
  orderId: string;
  amount: string;
  paymentMethod: "cash" | "terminal_mercadopago" | "card" | "transfer";
  status: "pending" | "completed" | "failed";
  mercadopagoPaymentIntentId: string | null;
  mercadopagoPaymentId: string | null;
  createdAt: Date;
  completedAt: Date | null;
}

export interface CartItem {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  notes: string;
  frostingId?: string | null | undefined;
  frostingName?: string | null | undefined;
  dryToppingId?: string | null | undefined;
  dryToppingName?: string | null | undefined;
  extraId?: string | null | undefined;
  extraName?: string | null | undefined;
}

export interface CashRegister {
  id: string;
  openedBy: string;
  openedAt: Date;
  closedAt: Date | null;
  closedBy: string | null;
  initialCash: string;
  finalCash: string | null;
  expectedCash: string | null;
  vouchersTotal: string | null;
  receiptsTotal: string | null;
  totalSales: string | null;
  cashSales: string | null;
  terminalSales: string | null;
  transferSales: string | null;
  withdrawals: string | null;
  deposits: string | null;
  totalOrders: number | null;
  difference: string | null;
  tolerance: string;
  notes: string | null;
  closureNotes: string | null;
  status: "open" | "closed";
  voided: boolean;
  voidedBy: string | null;
  voidedReason: string | null;
  openedByUser?: UserProfile;
  closedByUser?: UserProfile | null;
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
  employeeCode: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MercadoPagoDevice {
  id: string;
  deviceId: string;
  deviceName: string;
  posId: string | null;
  storeId: string | null;
  active: boolean;
}
