import {
  pgTable,
  uuid,
  text,
  varchar,
  decimal,
  integer,
  boolean,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const userRoleEnum = pgEnum("user_role", ["admin", "cashier", "bartender"]);
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "preparing",
  "ready",
  "delivered",
  "cancelled",
]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "paid",
  "failed",
  "refunded",
]);
export const paymentMethodEnum = pgEnum("payment_method", [
  "cash",
  "terminal_mercadopago",
  "card",
]);
export const cashRegisterStatusEnum = pgEnum("cash_register_status", [
  "open",
  "closed",
]);
export const transactionTypeEnum = pgEnum("transaction_type", [
  "sale",
  "refund",
  "adjustment",
  "cash_in",
  "cash_out",
]);

// User profiles (extends Neon Auth users)
export const userProfiles = pgTable("user_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  authUserId: text("auth_user_id").notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  role: userRoleEnum("role").notNull().default("cashier"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Product categories
export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 7 }),
  icon: varchar("icon", { length: 50 }),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Products
export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  categoryId: uuid("category_id").references(() => categories.id),
  imageUrl: text("image_url"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Ingredients
export const ingredients = pgTable("ingredients", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  unit: varchar("unit", { length: 50 }).notNull(),
  currentStock: decimal("current_stock", { precision: 10, scale: 2 }).notNull().default("0"),
  minStock: decimal("min_stock", { precision: 10, scale: 2 }).notNull().default("0"),
  costPerUnit: decimal("cost_per_unit", { precision: 10, scale: 2 }).notNull().default("0"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Product ingredients (recipes)
export const productIngredients = pgTable("product_ingredients", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  ingredientId: uuid("ingredient_id")
    .notNull()
    .references(() => ingredients.id, { onDelete: "cascade" }),
  quantityNeeded: decimal("quantity_needed", { precision: 10, scale: 3 }).notNull(),
});

// Orders
export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderNumber: integer("order_number").notNull(),
  status: orderStatusEnum("status").notNull().default("pending"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull().default("0"),
  paymentStatus: paymentStatusEnum("payment_status").notNull().default("pending"),
  paymentMethod: paymentMethodEnum("payment_method"),
  mercadopagoPaymentId: text("mercadopago_payment_id"),
  mercadopagoPaymentIntentId: text("mercadopago_payment_intent_id"),
  userId: uuid("user_id").references(() => userProfiles.id),
  customerName: varchar("customer_name", { length: 255 }),
  notes: text("notes"),
  loyaltyCardId: uuid("loyalty_card_id").references(() => loyaltyCards.id),
  cashRegisterId: uuid("cash_register_id").references(() => cashRegisters.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Order items
export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id),
  productName: varchar("product_name", { length: 255 }).notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
});

// Cash registers
export const cashRegisters = pgTable("cash_registers", {
  id: uuid("id").defaultRandom().primaryKey(),
  openedBy: uuid("opened_by")
    .notNull()
    .references(() => userProfiles.id),
  openedAt: timestamp("opened_at").defaultNow().notNull(),
  closedAt: timestamp("closed_at"),
  initialCash: decimal("initial_cash", { precision: 10, scale: 2 }).notNull(),
  finalCash: decimal("final_cash", { precision: 10, scale: 2 }),
  expectedCash: decimal("expected_cash", { precision: 10, scale: 2 }),
  totalSales: decimal("total_sales", { precision: 10, scale: 2 }).default("0"),
  totalOrders: integer("total_orders").default(0),
  difference: decimal("difference", { precision: 10, scale: 2 }),
  notes: text("notes"),
  status: cashRegisterStatusEnum("status").notNull().default("open"),
});

// Cash register transactions
export const cashRegisterTransactions = pgTable("cash_register_transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  registerId: uuid("register_id")
    .notNull()
    .references(() => cashRegisters.id, { onDelete: "cascade" }),
  type: transactionTypeEnum("type").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  orderId: uuid("order_id").references(() => orders.id),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Loyalty cards
export const loyaltyCards = pgTable("loyalty_cards", {
  id: uuid("id").defaultRandom().primaryKey(),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 20 }),
  customerEmail: varchar("customer_email", { length: 255 }),
  barcodeValue: varchar("barcode_value", { length: 100 }).notNull().unique(),
  pinHash: varchar("pin_hash", { length: 255 }),
  stamps: integer("stamps").notNull().default(0),
  totalStamps: integer("total_stamps").notNull().default(0),
  rewardsAvailable: integer("rewards_available").notNull().default(0),
  rewardsRedeemed: integer("rewards_redeemed").notNull().default(0),
  stampsPerReward: integer("stamps_per_reward").notNull().default(8),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Loyalty transactions
export const loyaltyTransactions = pgTable("loyalty_transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  cardId: uuid("card_id")
    .notNull()
    .references(() => loyaltyCards.id, { onDelete: "cascade" }),
  orderId: uuid("order_id").references(() => orders.id),
  stampsAdded: integer("stamps_added").notNull().default(0),
  rewardRedeemed: boolean("reward_redeemed").notNull().default(false),
  createdBy: uuid("created_by").references(() => userProfiles.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Wallet device registrations (for Apple Wallet pass updates)
export const walletDeviceRegistrations = pgTable("wallet_device_registrations", {
  id: uuid("id").defaultRandom().primaryKey(),
  deviceLibraryId: varchar("device_library_id", { length: 255 }).notNull(),
  passTypeId: varchar("pass_type_id", { length: 255 }).notNull(),
  serialNumber: uuid("serial_number")
    .notNull()
    .references(() => loyaltyCards.id, { onDelete: "cascade" }),
  pushToken: text("push_token"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Mercado Pago devices
export const mercadopagoDevices = pgTable("mercadopago_devices", {
  id: uuid("id").defaultRandom().primaryKey(),
  deviceId: text("device_id").notNull().unique(),
  deviceName: varchar("device_name", { length: 255 }).notNull(),
  posId: text("pos_id"),
  storeId: text("store_id"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  ingredients: many(productIngredients),
  orderItems: many(orderItems),
}));

export const ingredientsRelations = relations(ingredients, ({ many }) => ({
  products: many(productIngredients),
}));

export const productIngredientsRelations = relations(productIngredients, ({ one }) => ({
  product: one(products, {
    fields: [productIngredients.productId],
    references: [products.id],
  }),
  ingredient: one(ingredients, {
    fields: [productIngredients.ingredientId],
    references: [ingredients.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  items: many(orderItems),
  user: one(userProfiles, {
    fields: [orders.userId],
    references: [userProfiles.id],
  }),
  loyaltyCard: one(loyaltyCards, {
    fields: [orders.loyaltyCardId],
    references: [loyaltyCards.id],
  }),
  cashRegister: one(cashRegisters, {
    fields: [orders.cashRegisterId],
    references: [cashRegisters.id],
  }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const cashRegistersRelations = relations(cashRegisters, ({ one, many }) => ({
  openedByUser: one(userProfiles, {
    fields: [cashRegisters.openedBy],
    references: [userProfiles.id],
  }),
  transactions: many(cashRegisterTransactions),
  orders: many(orders),
}));

export const cashRegisterTransactionsRelations = relations(
  cashRegisterTransactions,
  ({ one }) => ({
    register: one(cashRegisters, {
      fields: [cashRegisterTransactions.registerId],
      references: [cashRegisters.id],
    }),
    order: one(orders, {
      fields: [cashRegisterTransactions.orderId],
      references: [orders.id],
    }),
  })
);

export const loyaltyCardsRelations = relations(loyaltyCards, ({ many }) => ({
  transactions: many(loyaltyTransactions),
  orders: many(orders),
}));

export const loyaltyTransactionsRelations = relations(loyaltyTransactions, ({ one }) => ({
  card: one(loyaltyCards, {
    fields: [loyaltyTransactions.cardId],
    references: [loyaltyCards.id],
  }),
  order: one(orders, {
    fields: [loyaltyTransactions.orderId],
    references: [orders.id],
  }),
  createdByUser: one(userProfiles, {
    fields: [loyaltyTransactions.createdBy],
    references: [userProfiles.id],
  }),
}));
