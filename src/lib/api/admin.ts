import { apiRequest } from "../auth";

export type AccountStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "BLOCKED" | "DELETED";
export type KycStatus = "VERIFIED" | "PENDING" | "UNVERIFIED";
export type ReportStatus = "OPEN" | "REVIEWING" | "RESOLVED" | "DISMISSED";

export type AdminUser = {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatar: string;
  status: AccountStatus;
  kycStatus: KycStatus;
  isVerified: boolean;
  isActive: boolean;
  isBlocked: boolean;
  isSuspended: boolean;
  verificationStatus: string;
  joinedAt: string;
  lastActiveAt: string | null;
};

export type AdminUserDetails = AdminUser & {
  bio: string;
  location: string;
  website: string;
  coverPhoto: string;
  gender: string;
  referralCode: string;
  counts: {
    posts: number;
    groups: number;
    pages: number;
    stories: number;
    reports: number;
    referrals: number;
  };
  wallet: {
    balance: number;
    currency: string;
  };
  reports: {
    id: string;
    reason: string;
    status: ReportStatus;
    targetType: string;
    createdAt: string;
    reporterName: string;
  }[];
  recentPosts: {
    id: string;
    body: string;
    createdAt: string;
    likesCount: number;
    commentsCount: number;
  }[];
  moderationHistory: {
    id: string;
    action: string;
    reason: string;
    createdAt: string;
    actorName: string;
  }[];
};

export type AdminUsersResponse = {
  stats: {
    totalUsers: number;
    activeUsers: number;
    unverifiedUsers: number;
    verifiedUsers: number;
    blockedUsers: number;
    suspendedUsers: number;
  };
  users: AdminUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    search: string;
    status: "ALL" | AccountStatus;
    kyc: "ALL" | KycStatus;
  };
};

export type AdminUserFilters = {
  page?: number;
  limit?: number;
  search?: string;
  status?: "ALL" | AccountStatus;
  kyc?: "ALL" | KycStatus;
  joinedFrom?: string;
  joinedTo?: string;
};

export type AdminDashboardResponse = {
  stats: {
    totalUsers: number;
    newUsersToday: number;
    newUsers7d: number;
    activeUsers: number;
    suspendedUsers: number;
    blockedUsers: number;
    totalPosts: number;
    totalStories: number;
    totalVideos: number;
    totalGroups: number;
    totalPages: number;
    openReports: number;
    pendingKyc: number;
    activeAds: number;
    marketplaceListings: number;
    adRevenue: number;
    walletBalance: number;
  };
  charts: {
    userGrowth: { date: string; count: number }[];
    contentCreated: { date: string; count: number }[];
    reports: { date: string; count: number }[];
  };
  pendingActions: {
    openReports: number;
    pendingKyc: number;
    suspendedUsers: number;
  };
  pendingKycCases: { id: string; username: string; name: string }[];
  topActiveUsers: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    postsCount: number;
  }[];
  topPerformingPosts: {
    id: string;
    body: string;
    createdAt: string;
    media: { url: string; type: string } | null;
    author: {
      id: string;
      firstName: string;
      lastName: string;
      username: string;
      avatar: string;
    };
    likesCount: number;
    commentsCount: number;
    sharesCount: number;
    performanceScore: number;
  }[];
  recentActivities: {
    type: string;
    message: string;
    createdAt: string;
    user?: {
      id: string;
      firstName: string;
      lastName: string;
      username: string;
      avatar: string;
    };
    group?: { id: string; name: string };
    report?: { id: string; reason: string; status: string };
  }[];
};

export type AdminReport = {
  id: string;
  reason: string;
  status: ReportStatus;
  targetType: string;
  postId: string | null;
  reviewNote: string;
  resolvedAt: string | null;
  createdAt: string;
  reporter: {
    id: string;
    username: string;
    name: string;
    avatar: string;
  };
  targetUser: {
    id: string;
    username: string;
    name: string;
    avatar: string;
  } | null;
  reviewedBy: string | null;
};

export type AdminReportsResponse = {
  stats: {
    open: number;
    reviewing: number;
    resolved: number;
    dismissed: number;
    total: number;
  };
  reports: AdminReport[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type AdminAuditLog = {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  reason: string;
  metadata: unknown;
  ip: string;
  outcome: string;
  createdAt: string;
  actor: {
    id: string;
    username: string;
    name: string;
    avatar: string;
    role: string;
  };
};

function withQuery(path: string, params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value == null || value === "" || value === "ALL") return;
    search.set(key, String(value));
  });

  const query = search.toString();
  return query ? `${path}?${query}` : path;
}

export function getAdminUsers(filters: AdminUserFilters = {}) {
  return apiRequest<AdminUsersResponse>(
    withQuery("/api/v1/admin/users", {
      page: filters.page,
      limit: filters.limit,
      search: filters.search?.trim(),
      status: filters.status,
      kyc: filters.kyc,
      joinedFrom: filters.joinedFrom,
      joinedTo: filters.joinedTo,
    }),
    { method: "GET" },
  );
}

export function getAdminUser(identifier: string) {
  return apiRequest<{ user: AdminUserDetails }>(
    `/api/v1/admin/users/${encodeURIComponent(identifier)}`,
    { method: "GET" },
  );
}

export function updateAdminUserStatus(
  identifier: string,
  status: Exclude<AccountStatus, "DELETED">,
  reason = "",
) {
  return apiRequest<{ user: AdminUser }>(
    `/api/v1/admin/users/${encodeURIComponent(identifier)}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status, reason }),
    },
  );
}

export function deleteAdminUser(identifier: string, reason: string) {
  return apiRequest<{ user: AdminUser }>(
    `/api/v1/admin/users/${encodeURIComponent(identifier)}`,
    {
      method: "DELETE",
      body: JSON.stringify({ reason }),
    },
  );
}

export function getAdminDashboard() {
  return apiRequest<AdminDashboardResponse>("/api/v1/admin/dashboard", { method: "GET" });
}

export function getAdminReports(filters: {
  page?: number;
  limit?: number;
  search?: string;
  status?: "ALL" | ReportStatus;
  targetType?: string;
} = {}) {
  return apiRequest<AdminReportsResponse>(
    withQuery("/api/v1/admin/reports", {
      page: filters.page,
      limit: filters.limit,
      search: filters.search?.trim(),
      status: filters.status,
      targetType: filters.targetType,
    }),
    { method: "GET" },
  );
}

export function updateAdminReport(
  reportId: string,
  payload: {
    status: ReportStatus;
    reason?: string;
    userAction?: "WARN" | "SUSPEND" | "BLOCK" | null;
  },
) {
  return apiRequest<{ report: { id: string; status: ReportStatus } }>(
    `/api/v1/admin/reports/${encodeURIComponent(reportId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export function getAdminAuditLogs(filters: {
  page?: number;
  limit?: number;
  search?: string;
  action?: string;
  targetType?: string;
} = {}) {
  return apiRequest<{
    logs: AdminAuditLog[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>(
    withQuery("/api/v1/admin/logs", {
      page: filters.page,
      limit: filters.limit,
      search: filters.search?.trim(),
      action: filters.action,
      targetType: filters.targetType,
    }),
    { method: "GET" },
  );
}

export type KycCaseStatus =
  | "PENDING"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "RESUBMISSION_REQUIRED";

export type AdminKycCase = {
  id: string;
  status: KycCaseStatus;
  provider: string;
  providerRef: string;
  documentType: string;
  hasDocument: boolean;
  documentUrl: string;
  selfieUrl: string;
  riskScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  documentAuthentic: boolean;
  faceMatch: boolean;
  livenessPassed: boolean;
  livenessPerformed: boolean;
  autoDecision: string;
  needsManualReview: boolean;
  providerSummary: string;
  rejectionReason: string;
  requiredCorrection: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  createdAt: string;
  user: {
    id: string;
    username: string;
    name: string;
    avatar: string;
    verificationStatus: string;
  };
};

export type AdminVerificationApp = {
  id: string;
  category: string;
  statement: string;
  evidenceUrl: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "REVOKED";
  reason: string;
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  user: {
    id: string;
    username: string;
    name: string;
    avatar: string;
    isVerified: boolean;
  };
};

export type AdminModerationItem = {
  id: string;
  source: string;
  targetType: string;
  targetId: string;
  reason: string;
  riskScore: number;
  status: string;
  snippet: string;
  mediaUrl: string;
  createdAt: string;
  reviewNote: string;
  reviewedBy: string | null;
  author: { id: string; username: string; name: string; avatar: string } | null;
};

export type AdminBlockedItem = {
  id: string;
  targetType: "POST" | "COMMENT" | "STORY" | "VIDEO";
  body: string;
  state: "HIDDEN" | "REMOVED";
  reason: string;
  riskScore: number;
  createdAt: string;
  authorName: string;
  username: string;
};

export function getAdminKycCases(filters: {
  page?: number;
  search?: string;
  status?: string;
  queue?: string;
} = {}) {
  return apiRequest<{
    stats: {
      manualReview: number;
      approved: number;
      rejected: number;
      resubmissionRequired: number;
    };
    canViewDocuments: boolean;
    cases: AdminKycCase[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>(
    withQuery("/api/v1/admin/kyc", {
      page: filters.page,
      search: filters.search,
      status: filters.status,
      queue: filters.queue,
    }),
  );
}

export function reviewAdminKyc(
  id: string,
  payload: { action: "APPROVE" | "REJECT" | "RESUBMIT"; reason: string; requiredCorrection?: string },
) {
  return apiRequest<{ case: AdminKycCase }>(`/api/v1/admin/kyc/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function getAdminVerification(filters: {
  page?: number;
  search?: string;
  status?: string;
} = {}) {
  return apiRequest<{
    stats: {
      pending: number;
      approved: number;
      rejected: number;
      revoked: number;
      verifiedUsers: number;
    };
    applications: AdminVerificationApp[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>(
    withQuery("/api/v1/admin/verification", {
      page: filters.page,
      search: filters.search,
      status: filters.status,
    }),
  );
}

export function reviewAdminVerification(id: string, action: "APPROVE" | "REJECT", reason: string) {
  return apiRequest(`/api/v1/admin/verification/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ action, reason }),
  });
}

export function grantAdminVerification(username: string, reason: string, category?: string) {
  return apiRequest("/api/v1/admin/verification", {
    method: "POST",
    body: JSON.stringify({ username, reason, category }),
  });
}

export function setAdminVerificationBadge(
  username: string,
  action: "REVOKE" | "RESTORE",
  reason: string,
) {
  return apiRequest(`/api/v1/admin/verification/user/${encodeURIComponent(username)}`, {
    method: "PATCH",
    body: JSON.stringify({ action, reason }),
  });
}

export function getAdminModerationQueue(filters: {
  page?: number;
  search?: string;
  status?: string;
} = {}) {
  return apiRequest<{
    stats: { open: number; reviewing: number; resolved: number };
    items: AdminModerationItem[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>(
    withQuery("/api/v1/admin/moderation", {
      page: filters.page,
      search: filters.search,
      status: filters.status,
    }),
  );
}

export function reviewAdminModeration(
  id: string,
  action: "HIDE" | "REMOVE" | "RESTORE" | "DISMISS",
  reason: string,
) {
  return apiRequest(`/api/v1/admin/moderation/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ action, reason }),
  });
}

export function getAdminBlockedContent(filters: {
  page?: number;
  search?: string;
  type?: string;
} = {}) {
  return apiRequest<{
    stats: { total: number; hidden: number; removed: number };
    items: AdminBlockedItem[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>(
    withQuery("/api/v1/admin/moderation/blocked", {
      page: filters.page,
      search: filters.search,
      type: filters.type,
    }),
  );
}

export function restoreAdminBlockedContent(type: string, id: string, reason: string) {
  return apiRequest(
    `/api/v1/admin/moderation/blocked/${encodeURIComponent(type)}/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ reason }),
    },
  );
}
