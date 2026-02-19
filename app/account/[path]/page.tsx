"use client";

import React from "react";
import { NeonAuthUIProvider, AccountView } from "@neondatabase/auth/react";
import { authClient } from "@/lib/auth/client";

export default function AccountPage({
  params,
}: {
  params: Promise<{ path: string }>;
}) {
  const resolvedParams = React.use(params);

  return (
    <NeonAuthUIProvider authClient={authClient}>
      <main className="container mx-auto flex grow flex-col items-center justify-center gap-3 self-center p-4 md:p-6">
        <AccountView path={resolvedParams.path} />
      </main>
    </NeonAuthUIProvider>
  );
}
