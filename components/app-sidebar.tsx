"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChartBar,
  ClipboardText,
  CookingPot,
  CurrencyDollar,
  Package,
  ShoppingCart,
  Layout,
  Users,
  TrendUp,
  Gear,
  CreditCard,
  Archive,
  ChefHat,
  CashRegister,
  GearSix,
  Snowflake,
  UserCircle,
  SignOut,
  PlusCircle,
  ClockCounterClockwise,
  Storefront,
  Tag,
  Percent,
} from "@phosphor-icons/react";
import { BrumaLogo } from "@/components/bruma-logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { toast } from "sonner";

const mainNavItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: ChartBar,
  },
  {
    title: "Nueva Orden",
    url: "/orders/new",
    icon: PlusCircle,
  },
  {
    title: "Despacho",
    url: "/orders/dispatch",
    icon: CookingPot,
  },
  {
    title: "Historial Órdenes",
    url: "/orders/history",
    icon: ClipboardText,
  },
];

const inventoryNavItems = [
  {
    title: "Productos",
    url: "/inventory/products",
    icon: Package,
  },
  {
    title: "Categorías",
    url: "/inventory/categories",
    icon: Archive,
  },
  {
    title: "Mesas",
    url: "/tables",
    icon: Storefront,
  },
  {
    title: "Ingredientes",
    url: "/inventory/ingredients",
    icon: ChefHat,
  },
];

const financeNavItems = [
  {
    title: "Caja",
    url: "/cash-register",
    icon: CurrencyDollar,
  },
  {
    title: "Historial Cortes",
    url: "/cash-register/history",
    icon: ClockCounterClockwise,
  },
];

const loyaltyNavItems = [
  {
    title: "Clientes Frecuentes",
    url: "/loyalty",
    icon: CreditCard,
  },
];

const marketingNavItems = [
  {
    title: "Promociones",
    url: "/promotions",
    icon: Tag,
  },
  {
    title: "Descuentos",
    url: "/discounts",
    icon: Percent,
  },
];

const settingsNavItems = [
  {
    title: "Empleados",
    url: "/settings/employees",
    icon: UserCircle,
  },
  {
    title: "Mercado Pago",
    url: "/settings/mercadopago",
    icon: GearSix,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      toast.success('Sesión cerrada');
      router.push('/login');
      router.refresh();
    } catch (error) {
      toast.error('Error al cerrar sesión');
    }
  }

  const isActive = (url: string) => {
    if (url === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(url);
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-4">
        <Link href="/dashboard">
          <BrumaLogo size="sm" />
        </Link>
        <span className="text-xs text-muted-foreground">
          Marisquería
        </span>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link href={item.url}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Inventario</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {inventoryNavItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link href={item.url}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Finanzas</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {financeNavItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link href={item.url}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Lealtad</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {loyaltyNavItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link href={item.url}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Marketing</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {marketingNavItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link href={item.url}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Configuración</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsNavItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link href={item.url}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/account")}>
              <Link href="/account/settings">
                <GearSix className="size-4" />
                <span>Configuración</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout}>
              <SignOut className="size-4" />
              <span>Cerrar sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
