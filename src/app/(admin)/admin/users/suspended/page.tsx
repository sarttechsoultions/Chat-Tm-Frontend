"use client";

import { AdminUsersManager } from "../../../../../components/admin/AdminUsersManager";

export default function SuspendedUsersPage() {
  return (
    <AdminUsersManager
      title="Suspended Users"
      description="Accounts currently suspended from the platform."
      defaultStatus="SUSPENDED"
    />
  );
}
