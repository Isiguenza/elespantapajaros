import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Despacho - POS Espantapájaros",
  description: "Vista de despacho para monitor dedicado",
};

export default function DispatchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
