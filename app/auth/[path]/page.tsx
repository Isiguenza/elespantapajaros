"use client";

import React from "react";
import { NeonAuthUIProvider, AuthView } from "@neondatabase/auth/react";
import { authClient } from "@/lib/auth/client";

export default function AuthPage({
  params,
}: {
  params: Promise<{ path: string }>;
}) {
  const resolvedParams = React.use(params);

  return (
    <NeonAuthUIProvider authClient={authClient}>
      <main className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight">Espantapájaros</h1>
            <p className="mt-2 text-muted-foreground">Sistema Punto de Venta</p>
          </div>
          <AuthView path={resolvedParams.path} />
        </div>
      </main>
    </NeonAuthUIProvider>
  );
}
