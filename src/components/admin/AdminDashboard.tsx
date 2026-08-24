"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CalendarDays,
  ChevronRight,
  FileText,
  Flag,
  Heart,
  Megaphone,
  MoreVertical,
  UserPlus,
  Users,
  UsersRound,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

import {
  getAdminDashboard,
  type AdminDashboardResponse,
} from "../../lib/api/admin";

function formatNumber(value: number) {
  return value.toLocaleString("en-IN");
}

function formatRelativeTime(date: string) {
  const diff = Date.now() - new Date(date).getTime();

  if (Number.isNaN(diff)) {
    return "";
  }

  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) {
    return "just now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 30) {
    return `${days}d ago`;
  }

  const months = Math.floor(days / 30);

  return `${months}mo ago`;
}

function getUserName(user: {
  firstName: string;
  lastName: string;
  username: string;
}) {
  return `${user.firstName} ${user.lastName}`.trim() || user.username;
}

function getPostTitle(body: string) {
  const title = body.trim();

  if (!title) {
    return "Untitled post";
  }

  return title.length > 55 ? `${title.slice(0, 55)}...` : title;
}

function formatLikes(value: number) {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }

  return value.toLocaleString("en-IN");
}

function Card({
  title,
  href,
  children,
}: {
  title: string;
  href?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-[12px] border border-[#E5E7EB] p-4 h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[14px] font-semibold leading-5 text-[#171D1C]">
          {title}
        </h2>

        {href ? (
          <Link
            href={href}
            className="text-[13px] font-medium text-[#00696F] hover:underline"
          >
            View All
          </Link>
        ) : null}
      </div>

      {children}
    </section>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-5 animate-pulse">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="h-7 w-52 rounded bg-[#E5E7EB]" />
          <div className="mt-2 h-5 w-80 rounded bg-[#F3F4F6]" />
        </div>

        <div className="h-9 w-36 rounded-[10px] bg-[#F3F4F6]" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="bg-white rounded-[12px] border border-[#E5E7EB] p-4 h-[145px]"
          >
            <div className="h-9 w-9 rounded-full bg-[#F3F4F6]" />
            <div className="mt-3 h-4 w-24 rounded bg-[#F3F4F6]" />
            <div className="mt-1 h-8 w-28 rounded bg-[#E5E7EB]" />
            <div className="mt-1 h-3 w-32 rounded bg-[#F3F4F6]" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr_310px] gap-5 items-start">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="bg-white rounded-[12px] border border-[#E5E7EB] p-4 h-[450px]"
          >
            <div className="h-5 w-40 rounded bg-[#F3F4F6] mb-6" />

            <div className="flex flex-col gap-5">
              {[1, 2, 3, 4, 5].map((row) => (
                <div key={row} className="flex gap-3">
                  <div className="size-10 rounded-full bg-[#F3F4F6]" />
                  <div className="flex-1">
                    <div className="h-4 w-32 rounded bg-[#F3F4F6]" />
                    <div className="mt-2 h-3 w-24 rounded bg-[#F3F4F6]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="min-h-[160px] flex items-center justify-center text-center">
      <p className="text-[13px] text-[#6B7280]">{message}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const [dashboard, setDashboard] =
    useState<AdminDashboardResponse | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError(null);

      const data = await getAdminDashboard();

      setDashboard(data);
    } catch (err) {
      console.error("Failed to load admin dashboard:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load admin dashboard",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDashboard();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error || !dashboard) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] bg-white rounded-[12px] border border-[#E5E7EB]">
        <span className="size-12 rounded-full bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center">
          <AlertCircle className="size-6" />
        </span>

        <h2 className="mt-4 text-[16px] font-semibold text-[#171D1C]">
          Unable to load dashboard
        </h2>

        <p className="mt-1 text-[13px] text-[#6B7280] text-center max-w-md px-4">
          {error || "Something went wrong while loading dashboard data."}
        </p>

        <button
          type="button"
          onClick={loadDashboard}
          className="mt-5 h-10 px-4 rounded-[10px] bg-[#00696F] text-white text-[13px] font-medium inline-flex items-center gap-2 hover:bg-[#00575C] transition-colors"
        >
          <RefreshCw className="size-4" />
          Try Again
        </button>
      </div>
    );
  }

  const stats = [
    {
      label: "Total Users",
      value: dashboard.stats.totalUsers,
      icon: Users,
      iconClass: "text-[#2563EB] bg-[#DBEAFE]",
    },
    {
      label: "Active Users",
      value: dashboard.stats.activeUsers,
      icon: UsersRound,
      iconClass: "text-[#16A34A] bg-[#DCFCE7]",
    },
    {
      label: "Total Posts",
      value: dashboard.stats.totalPosts,
      icon: FileText,
      iconClass: "text-[#7C3AED] bg-[#EDE9FE]",
    },
    {
      label: "Total Groups",
      value: dashboard.stats.totalGroups,
      icon: UsersRound,
      iconClass: "text-[#EA580C] bg-[#FFEDD5]",
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-semibold leading-7 text-[#171D1C]">
            Dashboard Overview
          </h1>

          <p className="mt-1 text-[14px] leading-5 text-[#4E616F]">
            Welcome back, Admin! Here&apos;s what&apos;s happening on your
            platform.
          </p>
        </div>

        <div className="h-9 px-3 rounded-[10px] border border-[#E5E7EB] bg-white inline-flex items-center gap-2 text-[13px] text-[#4E616F] shrink-0">
          <CalendarDays className="size-4" />

          <span>
            Today:{" "}
            {new Date().toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <article
              key={stat.label}
              className="bg-white rounded-[12px] border border-[#E5E7EB] p-4"
            >
              <div className="flex items-start justify-between">
                <span
                  className={`size-9 rounded-full flex items-center justify-center ${stat.iconClass}`}
                >
                  <Icon className="size-4" />
                </span>

                <button
                  type="button"
                  aria-label="More"
                  className="text-[#9AA4B2]"
                >
                  <MoreVertical className="size-4" />
                </button>
              </div>

              <p className="mt-3 text-[13px] leading-5 text-[#6B7280]">
                {stat.label}
              </p>

              <p className="text-[24px] font-bold leading-8 text-[#171D1C]">
                {formatNumber(stat.value)}
              </p>

              {stat.label === "Active Users" && (
                <p className="mt-1 text-[12px] font-medium text-[#16A34A]">
                  Active accounts
                </p>
              )}
            </article>
          );
        })}
      </div>

      {/* Main dashboard content */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr_310px] gap-5 items-start">
        {/* Top Active Users */}
        <Card title="Top Active Users" href="/admin/users">
          {dashboard.topActiveUsers.length === 0 ? (
            <EmptyState message="No active users data available." />
          ) : (
            <ul className="flex flex-col">
              {dashboard.topActiveUsers.map((user) => (
                <li
                  key={user.id}
                  className="flex items-center gap-3 py-2.5"
                >
                  <span className="relative size-10 rounded-full overflow-hidden shrink-0 bg-[#F3F4F6]">
                    {user.avatar ? (
                      <Image
                        src={user.avatar}
                        alt={user.name}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center text-[13px] font-semibold text-[#00696F]">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-semibold leading-5 text-[#171D1C] truncate">
                      {user.name}
                    </p>

                    <p className="text-[12px] leading-4 text-[#6B7280]">
                      @{user.username}
                    </p>
                  </div>

                  <span className="text-[13px] font-medium text-[#4E616F] whitespace-nowrap">
                    {formatNumber(user.postsCount)} posts
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Top Performing Posts */}
        <Card title="Top Performing Posts" href="/admin/posts">
          {dashboard.topPerformingPosts.length === 0 ? (
            <EmptyState message="No posts available." />
          ) : (
            <ul className="flex flex-col">
              {dashboard.topPerformingPosts.map((post) => (
                <li
                  key={post.id}
                  className="flex items-center gap-3 py-2.5"
                >
                  <span className="relative size-12 rounded-[8px] overflow-hidden shrink-0 bg-[#F3F4F6]">
                    {post.media?.url ? (
                      <Image
                        src={post.media.url}
                        alt=""
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <FileText className="size-5 text-[#9AA4B2]" />
                      </span>
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-semibold leading-5 text-[#171D1C] truncate">
                      {getPostTitle(post.body)}
                    </p>

                    <p className="text-[12px] leading-4 text-[#6B7280]">
                      {getUserName(post.author)}
                    </p>

                    <p className="mt-0.5 text-[12px] leading-4 text-[#4E616F] inline-flex items-center gap-1">
                      <Heart className="size-3 text-[#00696F]" />

                      {formatLikes(post.likesCount)} Likes

                      <span>•</span>

                      {formatNumber(post.commentsCount)} Comments
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Right column */}
        <div className="flex flex-col gap-5">
          {/* Recent Activities */}
          <Card title="Recent Activities" href="/admin/logs">
            {dashboard.recentActivities.length === 0 ? (
              <EmptyState message="No recent activities." />
            ) : (
              <ul className="flex flex-col gap-3">
                {dashboard.recentActivities.map((item, index) => (
                  <li
                    key={`${item.type}-${item.createdAt}-${index}`}
                    className="flex items-start gap-3"
                  >
                    <span className="relative size-8 rounded-full overflow-hidden shrink-0 mt-0.5 bg-[#F3F4F6]">
                      {item.user?.avatar ? (
                        <Image
                          src={item.user.avatar}
                          alt=""
                          fill
                          sizes="32px"
                          className="object-cover"
                        />
                      ) : (
                        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-[#00696F]">
                          {item.user?.firstName?.charAt(0)?.toUpperCase() ||
                            "U"}
                        </span>
                      )}
                    </span>

                    <div className="min-w-0">
                      <p className="text-[13px] leading-5 text-[#171D1C]">
                        {item.message}
                      </p>

                      <p className="text-[12px] leading-4 text-[#6B7280]">
                        {formatRelativeTime(item.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Quick Actions */}
          <section className="bg-white rounded-[12px] border border-[#E5E7EB] p-4">
            <h2 className="text-[14px] font-semibold leading-5 text-[#171D1C] mb-3">
              Quick Actions
            </h2>

            <div className="flex flex-col gap-2">
              {[
                {
                  href: "/admin/users",
                  label: "Add New User",
                  icon: UserPlus,
                  iconClass: "text-[#2563EB] bg-[#DBEAFE]",
                },
                {
                  href: "/admin/announcements",
                  label: "Create Announcement",
                  icon: Megaphone,
                  iconClass: "text-[#DC2626] bg-[#FEE2E2]",
                },
                {
                  href: "/admin/reports",
                  label: "Manage Reports",
                  icon: Flag,
                  iconClass: "text-[#EA580C] bg-[#FFEDD5]",
                },
              ].map((action) => {
                const Icon = action.icon;

                return (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="h-11 px-3 rounded-[10px] border border-[#E5E7EB] flex items-center gap-3 hover:bg-[#F5FAF9] transition-colors"
                  >
                    <span
                      className={`size-8 rounded-full flex items-center justify-center shrink-0 ${action.iconClass}`}
                    >
                      <Icon className="size-4" />
                    </span>

                    <span className="flex-1 text-[14px] font-medium text-[#171D1C]">
                      {action.label}
                    </span>

                    <ChevronRight className="size-4 text-[#9AA4B2]" />
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      {/* Open reports information */}
      {dashboard.stats.openReports > 0 && (
        <Link
          href="/admin/reports"
          className="bg-[#FFF7ED] border border-[#FED7AA] rounded-[12px] px-4 py-3 flex items-center gap-3 hover:bg-[#FFEDD5] transition-colors"
        >
          <span className="size-9 rounded-full bg-[#FFEDD5] text-[#EA580C] flex items-center justify-center shrink-0">
            <Flag className="size-4" />
          </span>

          <div className="flex-1">
            <p className="text-[13px] font-semibold text-[#9A3412]">
              {formatNumber(dashboard.stats.openReports)} open reports
            </p>

            <p className="text-[12px] text-[#C2410C]">
              Review reported content from the moderation panel.
            </p>
          </div>

          <ChevronRight className="size-4 text-[#EA580C]" />
        </Link>
      )}
    </div>
  );
}