"use client";

import { AdminUsersManager } from "../../../../components/admin/AdminUsersManager";

export default function AdminUsersPage() {
  return (
    <AdminUsersManager
      title="All Users"
      description="Search, filter, and manage platform accounts. Username is the public identifier."
    />
  );
}
