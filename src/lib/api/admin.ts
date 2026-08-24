import { apiRequest } from "../auth";

export type AdminUser = {
  id: string;
  username: string;

  firstName: string;
  lastName: string;
  name: string;

  email: string | null;
  phone: string | null;
  avatar: string;

  status: "ACTIVE" | "INACTIVE" | "BLOCKED";

  kycStatus: "VERIFIED" | "PENDING" | "UNVERIFIED";

  isVerified: boolean;
  isActive: boolean;
  isBlocked: boolean;

  verificationStatus: string;

  joinedAt: string;
  lastActiveAt: string | null;
};

export type AdminUsersResponse = {
  stats: {
    totalUsers: number;
    activeUsers: number;
    unverifiedUsers: number;
    verifiedUsers: number;
    blockedUsers: number;
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
    status: "ALL" | "ACTIVE" | "INACTIVE" | "BLOCKED";
    kyc: "ALL" | "VERIFIED" | "PENDING" | "UNVERIFIED";
  };
};

export type AdminUserFilters = {
  page?: number;
  limit?: number;
  search?: string;
  status?: "ALL" | "ACTIVE" | "INACTIVE" | "BLOCKED";
  kyc?: "ALL" | "VERIFIED" | "PENDING" | "UNVERIFIED";
};

/**
 * Get paginated admin users
 */
export function getAdminUsers(
  filters: AdminUserFilters = {},
) {
  const params = new URLSearchParams();

  if (filters.page) {
    params.set("page", String(filters.page));
  }

  if (filters.limit) {
    params.set("limit", String(filters.limit));
  }

  if (filters.search?.trim()) {
    params.set("search", filters.search.trim());
  }

  if (filters.status && filters.status !== "ALL") {
    params.set("status", filters.status);
  }

  if (filters.kyc && filters.kyc !== "ALL") {
    params.set("kyc", filters.kyc);
  }

  const query = params.toString();

  return apiRequest<AdminUsersResponse>(
    `/api/v1/admin/users${query ? `?${query}` : ""}`,
    {
      method: "GET",
    },
  );
}

/**
 * Get a single user by ID
 */
export function getAdminUser(userId: string) {
  return apiRequest<{ user: AdminUser }>(
    `/api/v1/admin/users/${encodeURIComponent(userId)}`,
    {
      method: "GET",
    },
  );
}

/**
 * Update user account status
 */
export function updateAdminUserStatus(
  userId: string,
  status: "ACTIVE" | "INACTIVE" | "BLOCKED",
) {
  return apiRequest<{ user: AdminUser }>(
    `/api/v1/admin/users/${encodeURIComponent(userId)}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    },
  );
}


export type AdminDashboardResponse = {
  stats: {
    totalUsers: number;
    activeUsers: number;
    totalPosts: number;
    totalGroups: number;
    openReports: number;
  };

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
    media: {
      url: string;
      type: string;
    } | null;
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
    group?: {
      id: string;
      name: string;
    };
    report?: {
      id: string;
      reason: string;
      status: string;
    };
  }[];
};

export function getAdminDashboard() {
  return apiRequest<AdminDashboardResponse>(
    "/api/v1/admin/dashboard",
    {
      method: "GET",
    },
  );
}