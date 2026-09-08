"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BadgeCheck,
  CalendarDays,
  ChevronRight,
  FileText,
  Flag,
  Heart,
  Megaphone,
  Store,
  UserPlus,
  Users,
  UsersRound,
  AlertCircle,
  RefreshCw,
  Ban,
  Wallet,
} from "lucide-react";

import { getAdminDashboard, type AdminDashboardResponse } from "../../lib/api/admin";

function formatNumber(value: number) {
  return value.toLocaleString("en-IN");
}

function formatMoney(value: number) {
  return value.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });
}

function formatRelativeTime(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  if (Number.isNaN(diff)) return "";
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function getUserName(user: { firstName: string; lastName: string; username: string }) {
  return `${user.firstName} ${user.lastName}`.trim() || user.username;
}

function getPostTitle(body: string) {
  const title = body.trim();
  if (!title) return "Untitled post";
  return title.length > 55 ? `${title.slice(0, 55)}...` : title;
}

function formatLikes(value: number) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
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
        <h2 className="text-[14px] font-semibold leading-5 text-[#171D1C]">{title}</h2>
        {href ? (
          <Link href={href} className="text-[13px] font-medium text-[#00696F] hover:underline">
            View All
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function MiniChart({
  title,
  points,
}: {
  title: string;
  points: { date: string; count: number }[];
}) {
  const max = Math.max(1, ...points.map((point) => point.count));

  return (
    <section className="bg-white rounded-[12px] border border-[#E5E7EB] p-4">
      <h2 className="text-[14px] font-semibold text-[#171D1C]">{title}</h2>
      <p className="mt-0.5 text-[12px] text-[#6B7280]">Last 14 days</p>
      <div className="mt-4 flex items-end gap-1 h-[88px]">
        {points.map((point) => (
          <div key={point.date} className="flex-1 flex flex-col justify-end h-full">
            <div
              title={`${point.date}: ${point.count}`}
              className="w-full rounded-t bg-[#00696F]/80 min-h-[4px]"
              style={{ height: `${Math.max(8, (point.count / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-5 animate-pulse">
      <div className="h-7 w-52 rounded bg-[#E5E7EB]" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
          <div key={item} className="bg-white rounded-[12px] border border-[#E5E7EB] p-4 h-[120px]" />
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
  const [dashboard, setDashboard] = useState<AdminDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError(null);
      setDashboard(await getAdminDashboard());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load admin dashboard");
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

  if (loading) return <DashboardSkeleton />;

  if (error || !dashboard) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] bg-white rounded-[12px] border border-[#E5E7EB]">
        <span className="size-12 rounded-full bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center">
          <AlertCircle className="size-6" />
        </span>
        <h2 className="mt-4 text-[16px] font-semibold text-[#171D1C]">Unable to load dashboard</h2>
        <p className="mt-1 text-[13px] text-[#6B7280] text-center max-w-md px-4">
          {error || "Something went wrong while loading dashboard data."}
        </p>
        <button
          type="button"
          onClick={loadDashboard}
          className="mt-5 h-10 px-4 rounded-[10px] bg-[#00696F] text-white text-[13px] font-medium inline-flex items-center gap-2 hover:bg-[#00575C]"
        >
          <RefreshCw className="size-4" />
          Try Again
        </button>
      </div>
    );
  }

  const stats = [
    { label: "Total Users", value: dashboard.stats.totalUsers, href: "/admin/users", icon: Users, iconClass: "text-[#2563EB] bg-[#DBEAFE]" },
    { label: "New Users Today", value: dashboard.stats.newUsersToday, href: "/admin/users", icon: UserPlus, iconClass: "text-[#0F766E] bg-[#CCFBF1]" },
    { label: "Active Users", value: dashboard.stats.activeUsers, href: "/admin/users", icon: UsersRound, iconClass: "text-[#16A34A] bg-[#DCFCE7]" },
    { label: "Suspended", value: dashboard.stats.suspendedUsers, href: "/admin/users/suspended", icon: Ban, iconClass: "text-[#DC2626] bg-[#FEE2E2]" },
    { label: "Total Posts", value: dashboard.stats.totalPosts, href: "/admin/posts", icon: FileText, iconClass: "text-[#7C3AED] bg-[#EDE9FE]" },
    { label: "Open Reports", value: dashboard.stats.openReports, href: "/admin/reports", icon: Flag, iconClass: "text-[#EA580C] bg-[#FFEDD5]" },
    { label: "Pending KYC", value: dashboard.stats.pendingKyc, href: "/admin/users/kyc", icon: BadgeCheck, iconClass: "text-[#CA8A04] bg-[#FEF9C3]" },
    { label: "Ad Revenue", value: dashboard.stats.adRevenue, href: "/admin/ads", icon: Wallet, iconClass: "text-[#00696F] bg-[#E6F4F4]", money: true },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-semibold leading-7 text-[#171D1C]">Dashboard Overview</h1>
          <p className="mt-1 text-[14px] leading-5 text-[#4E616F]">
            Operational snapshot of users, content, safety, and revenue.
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

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href} className="bg-white rounded-[12px] border border-[#E5E7EB] p-4 hover:border-[#00696F]/40 transition-colors">
              <span className={`size-9 rounded-full flex items-center justify-center ${stat.iconClass}`}>
                <Icon className="size-4" />
              </span>
              <p className="mt-3 text-[13px] leading-5 text-[#6B7280]">{stat.label}</p>
              <p className="text-[24px] font-bold leading-8 text-[#171D1C]">
                {"money" in stat && stat.money ? formatMoney(stat.value) : formatNumber(stat.value)}
              </p>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          ["Stories", dashboard.stats.totalStories],
          ["Videos", dashboard.stats.totalVideos],
          ["Groups", dashboard.stats.totalGroups],
          ["Pages", dashboard.stats.totalPages],
          ["Active Ads", dashboard.stats.activeAds],
          ["Marketplace", dashboard.stats.marketplaceListings],
          ["Blocked Users", dashboard.stats.blockedUsers],
          ["Wallet Balance", dashboard.stats.walletBalance],
        ].map(([label, value]) => (
          <div key={String(label)} className="bg-white rounded-[12px] border border-[#E5E7EB] px-4 py-3">
            <p className="text-[12px] text-[#6B7280]">{label}</p>
            <p className="mt-1 text-[18px] font-semibold text-[#171D1C]">
              {label === "Wallet Balance" ? formatMoney(Number(value)) : formatNumber(Number(value))}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <MiniChart title="User growth" points={dashboard.charts.userGrowth} />
        <MiniChart title="Content created" points={dashboard.charts.contentCreated} />
        <MiniChart title="Reports" points={dashboard.charts.reports} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr_310px] gap-5 items-start">
        <Card title="Top Active Users" href="/admin/users">
          {dashboard.topActiveUsers.length === 0 ? (
            <EmptyState message="No active users data available." />
          ) : (
            <ul className="flex flex-col">
              {dashboard.topActiveUsers.map((user) => (
                <li key={user.id} className="flex items-center gap-3 py-2.5">
                  <Link href={`/admin/users/${user.username}`} className="relative size-10 rounded-full overflow-hidden shrink-0 bg-[#F3F4F6]">
                    {user.avatar ? (
                      <Image src={user.avatar} alt={user.name} fill sizes="40px" className="object-cover" />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center text-[13px] font-semibold text-[#00696F]">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/users/${user.username}`} className="text-[14px] font-semibold leading-5 text-[#171D1C] truncate hover:text-[#00696F]">
                      {user.name}
                    </Link>
                    <p className="text-[12px] leading-4 text-[#6B7280]">@{user.username}</p>
                  </div>
                  <span className="text-[13px] font-medium text-[#4E616F] whitespace-nowrap">
                    {formatNumber(user.postsCount)} posts
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Top Performing Posts" href="/admin/posts">
          {dashboard.topPerformingPosts.length === 0 ? (
            <EmptyState message="No posts available." />
          ) : (
            <ul className="flex flex-col">
              {dashboard.topPerformingPosts.map((post) => (
                <li key={post.id} className="flex items-center gap-3 py-2.5">
                  <span className="relative size-12 rounded-[8px] overflow-hidden shrink-0 bg-[#F3F4F6]">
                    {post.media?.url ? (
                      <Image src={post.media.url} alt="" fill sizes="48px" className="object-cover" />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <FileText className="size-5 text-[#9AA4B2]" />
                      </span>
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-semibold leading-5 text-[#171D1C] truncate">{getPostTitle(post.body)}</p>
                    <p className="text-[12px] leading-4 text-[#6B7280]">{getUserName(post.author)}</p>
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

        <div className="flex flex-col gap-5">
          <Card title="Recent Activities" href="/admin/logs">
            {dashboard.recentActivities.length === 0 ? (
              <EmptyState message="No recent activities." />
            ) : (
              <ul className="flex flex-col gap-3">
                {dashboard.recentActivities.map((item, index) => (
                  <li key={`${item.type}-${item.createdAt}-${index}`} className="flex items-start gap-3">
                    <span className="relative size-8 rounded-full overflow-hidden shrink-0 mt-0.5 bg-[#F3F4F6]">
                      {item.user?.avatar ? (
                        <Image src={item.user.avatar} alt="" fill sizes="32px" className="object-cover" />
                      ) : (
                        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-[#00696F]">
                          {item.user?.firstName?.charAt(0)?.toUpperCase() || "U"}
                        </span>
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[13px] leading-5 text-[#171D1C]">{item.message}</p>
                      <p className="text-[12px] leading-4 text-[#6B7280]">{formatRelativeTime(item.createdAt)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <section className="bg-white rounded-[12px] border border-[#E5E7EB] p-4">
            <h2 className="text-[14px] font-semibold leading-5 text-[#171D1C] mb-3">Quick Actions</h2>
            <div className="flex flex-col gap-2">
              {[
                { href: "/admin/users", label: "Manage Users", icon: UserPlus, iconClass: "text-[#2563EB] bg-[#DBEAFE]" },
                { href: "/admin/users/kyc", label: "Review KYC", icon: BadgeCheck, iconClass: "text-[#CA8A04] bg-[#FEF9C3]" },
                { href: "/admin/reports", label: "Manage Reports", icon: Flag, iconClass: "text-[#EA580C] bg-[#FFEDD5]" },
                { href: "/admin/ads", label: "Ads Manager", icon: Megaphone, iconClass: "text-[#DC2626] bg-[#FEE2E2]" },
                { href: "/admin/marketplace", label: "Marketplace", icon: Store, iconClass: "text-[#00696F] bg-[#E6F4F4]" },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="h-11 px-3 rounded-[10px] border border-[#E5E7EB] flex items-center gap-3 hover:bg-[#F5FAF9] transition-colors"
                  >
                    <span className={`size-8 rounded-full flex items-center justify-center shrink-0 ${action.iconClass}`}>
                      <Icon className="size-4" />
                    </span>
                    <span className="flex-1 text-[14px] font-medium text-[#171D1C]">{action.label}</span>
                    <ChevronRight className="size-4 text-[#9AA4B2]" />
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      {dashboard.stats.openReports > 0 || dashboard.stats.pendingKyc > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {dashboard.stats.openReports > 0 ? (
            <Link href="/admin/reports" className="bg-[#FFF7ED] border border-[#FED7AA] rounded-[12px] px-4 py-3 flex items-center gap-3 hover:bg-[#FFEDD5]">
              <span className="size-9 rounded-full bg-[#FFEDD5] text-[#EA580C] flex items-center justify-center shrink-0">
                <Flag className="size-4" />
              </span>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-[#9A3412]">
                  {formatNumber(dashboard.stats.openReports)} open reports
                </p>
                <p className="text-[12px] text-[#C2410C]">Review reported content from the moderation panel.</p>
              </div>
              <ChevronRight className="size-4 text-[#EA580C]" />
            </Link>
          ) : null}
          {dashboard.stats.pendingKyc > 0 ? (
            <Link href="/admin/users/kyc" className="bg-[#FEFCE8] border border-[#FDE68A] rounded-[12px] px-4 py-3 flex items-center gap-3 hover:bg-[#FEF9C3]">
              <span className="size-9 rounded-full bg-[#FEF9C3] text-[#CA8A04] flex items-center justify-center shrink-0">
                <BadgeCheck className="size-4" />
              </span>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-[#854D0E]">
                  {formatNumber(dashboard.stats.pendingKyc)} KYC cases pending
                </p>
                <p className="text-[12px] text-[#A16207]">Exception cases waiting for manual review.</p>
              </div>
              <ChevronRight className="size-4 text-[#CA8A04]" />
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
