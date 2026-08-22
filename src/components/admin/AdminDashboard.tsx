import React from "react";
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
} from "lucide-react";

const STATS = [
  {
    label: "Total Users",
    value: "24,568",
    delta: "+12.5% vs yesterday",
    icon: Users,
    iconClass: "text-[#2563EB] bg-[#DBEAFE]",
  },
  {
    label: "Active Users",
    value: "8,472",
    delta: "+8.3% vs yesterday",
    icon: UsersRound,
    iconClass: "text-[#16A34A] bg-[#DCFCE7]",
  },
  {
    label: "Total Posts",
    value: "15,236",
    delta: "+15.7% vs yesterday",
    icon: FileText,
    iconClass: "text-[#7C3AED] bg-[#EDE9FE]",
  },
  {
    label: "Total Groups",
    value: "1,235",
    delta: "+6.2% vs yesterday",
    icon: UsersRound,
    iconClass: "text-[#EA580C] bg-[#FFEDD5]",
  },
];

const TOP_USERS = [
  {
    name: "Emma Watson",
    handle: "@emmawatson",
    posts: "1,245 posts",
    avatar: "/figma/photos/emma-watson.png",
  },
  {
    name: "John Doe",
    handle: "@johndoe",
    posts: "980 posts",
    avatar: "/figma/photos/john-doe.png",
  },
  {
    name: "Michael Scott",
    handle: "@michaelscott",
    posts: "842 posts",
    avatar: "/figma/photos/michael.png",
  },
];

const TOP_POSTS = [
  {
    title: "Beautiful nature",
    author: "Emma Watson",
    likes: "2.5K Likes",
    comments: "125 Comments",
    image: "/figma/photos/nature.png",
  },
  {
    title: "Team workflow tips",
    author: "John Doe",
    likes: "1.1K Likes",
    comments: "42 Comments",
    image: "/figma/photos/john-story.png",
  },
  {
    title: "Weekend recap",
    author: "Sophia Lee",
    likes: "864 Likes",
    comments: "31 Comments",
    image: "/figma/photos/sophia-story.png",
  },
];

const ACTIVITIES = [
  {
    text: "Emma Watson created a new post",
    time: "2m ago",
    avatar: "/figma/photos/emma-watson.png",
  },
  {
    text: "John Doe joined the platform",
    time: "10m ago",
    avatar: "/figma/photos/john-doe.png",
  },
  {
    text: "Design Lovers new group created",
    time: "15m ago",
    avatar: "/figma/photos/michael.png",
  },
  {
    text: "Sophia Lee reported a post",
    time: "25m ago",
    avatar: "/figma/photos/sophia.png",
  },
];

const ACTIONS = [
  { href: "/admin/users", label: "Add New User", icon: UserPlus, iconClass: "text-[#2563EB] bg-[#DBEAFE]" },
  {
    href: "/admin/announcements",
    label: "Create Announcement",
    icon: Megaphone,
    iconClass: "text-[#DC2626] bg-[#FEE2E2]",
  },
  { href: "/admin/reports", label: "Manage Reports", icon: Flag, iconClass: "text-[#EA580C] bg-[#FFEDD5]" },
];

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

export default function AdminDashboard() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-semibold leading-7 text-[#171D1C]">Dashboard Overview</h1>
          <p className="mt-1 text-[14px] leading-5 text-[#4E616F]">
            Welcome back, Rahul Admin! Here&apos;s what&apos;s happening on your platform.
          </p>
        </div>
        <div className="h-9 px-3 rounded-[10px] border border-[#E5E7EB] bg-white inline-flex items-center gap-2 text-[13px] text-[#4E616F] shrink-0">
          <CalendarDays className="size-4" />
          Today: May 25, 2025
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <article
              key={stat.label}
              className="bg-white rounded-[12px] border border-[#E5E7EB] p-4"
            >
              <div className="flex items-start justify-between">
                <span className={`size-9 rounded-full flex items-center justify-center ${stat.iconClass}`}>
                  <Icon className="size-4" />
                </span>
                <button type="button" aria-label="More" className="text-[#9AA4B2]">
                  <MoreVertical className="size-4" />
                </button>
              </div>
              <p className="mt-3 text-[13px] leading-5 text-[#6B7280]">{stat.label}</p>
              <p className="text-[24px] font-bold leading-8 text-[#171D1C]">{stat.value}</p>
              <p className="mt-1 text-[12px] font-medium text-[#16A34A]">{stat.delta}</p>
            </article>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr_310px] gap-5 items-start">
        <Card title="Top Active Users" href="/admin/users">
          <ul className="flex flex-col">
            {TOP_USERS.map((user) => (
              <li key={user.handle} className="flex items-center gap-3 py-2.5">
                <span className="relative size-10 rounded-full overflow-hidden shrink-0">
                  <Image src={user.avatar} alt="" fill sizes="40px" className="object-cover" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold leading-5 text-[#171D1C] truncate">
                    {user.name}
                  </p>
                  <p className="text-[12px] leading-4 text-[#6B7280]">{user.handle}</p>
                </div>
                <span className="text-[13px] font-medium text-[#4E616F]">{user.posts}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Top Performing Posts" href="/admin/posts">
          <ul className="flex flex-col">
            {TOP_POSTS.map((post) => (
              <li key={post.title} className="flex items-center gap-3 py-2.5">
                <span className="relative size-12 rounded-[8px] overflow-hidden shrink-0 bg-[#F3F4F6]">
                  <Image src={post.image} alt="" fill sizes="48px" className="object-cover" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold leading-5 text-[#171D1C] truncate">
                    {post.title}
                  </p>
                  <p className="text-[12px] leading-4 text-[#6B7280]">{post.author}</p>
                  <p className="mt-0.5 text-[12px] leading-4 text-[#4E616F] inline-flex items-center gap-1">
                    <Heart className="size-3 text-[#00696F]" />
                    {post.likes} • {post.comments}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <div className="flex flex-col gap-5">
          <Card title="Recent Activities" href="/admin/logs">
            <ul className="flex flex-col gap-3">
              {ACTIVITIES.map((item) => (
                <li key={item.text} className="flex items-start gap-3">
                  <span className="relative size-8 rounded-full overflow-hidden shrink-0 mt-0.5">
                    <Image src={item.avatar} alt="" fill sizes="32px" className="object-cover" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] leading-5 text-[#171D1C]">{item.text}</p>
                    <p className="text-[12px] leading-4 text-[#6B7280]">{item.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <section className="bg-white rounded-[12px] border border-[#E5E7EB] p-4">
            <h2 className="text-[14px] font-semibold leading-5 text-[#171D1C] mb-3">Quick Actions</h2>
            <div className="flex flex-col gap-2">
              {ACTIONS.map((action) => {
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
    </div>
  );
}
