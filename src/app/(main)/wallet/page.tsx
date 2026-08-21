"use client";

import { useEffect, useState } from "react";
import WalletDashboard from "../../../components/wallet/WalletDashboard";
import WalletFlow from "../../../components/wallet/WalletFlow";
import { readCreated } from "../../../components/wallet/walletStorage";

export default function WalletPage() {
  const [created, setCreated] = useState<boolean | null>(null);

  useEffect(() => {
    setCreated(readCreated());
  }, []);

  if (created === null) return null;
  if (created) return <WalletDashboard step="dashboard" />;
  return <WalletFlow step="welcome" />;
}
