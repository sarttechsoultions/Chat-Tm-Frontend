"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { AppNotification, fetchNotifications, markAllNotificationsRead, markNotificationRead } from "../../../lib/api/notifications";
import { useSocket } from "../../../components/hooks/useSocket";

export default function NotificationsPage() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const socket = useSocket();
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { const data = await fetchNotifications(); setItems(data.items || []); setUnreadCount(data.unreadCount || 0); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not load notifications"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!socket) return;
    const onNew = (item: AppNotification) => { setItems(current => [item, ...current.filter(row => row.id !== item.id)].slice(0, 30)); setUnreadCount(count => count + 1); };
    socket.on("notification_new", onNew);
    return () => { socket.off("notification_new", onNew); };
  }, [socket]);
  const markAll = async () => {
    setItems(current => current.map(item => ({ ...item, isRead: true }))); setUnreadCount(0);
    try { await markAllNotificationsRead(); } catch { void load(); }
  };
  const markRead = async (item: AppNotification) => {
    if (item.isRead) return;
    setItems(current => current.map(row => row.id === item.id ? { ...row, isRead: true } : row)); setUnreadCount(count => Math.max(0, count - 1));
    try { await markNotificationRead(item.id); } catch { void load(); }
  };

  return <main className="mx-auto min-h-[calc(100dvh-56px)] w-full max-w-3xl px-4 py-6 sm:px-6">
    <section className="overflow-hidden rounded-2xl border border-[#E5EAEC] bg-white shadow-sm">
      <header className="flex items-center justify-between border-b border-[#EDF1F2] px-5 py-5 sm:px-6"><div><h1 className="text-xl font-bold text-[#14232D]">Notifications</h1><p className="mt-1 text-sm text-[#6A7880]">Updates about your friends and posts.</p></div>{unreadCount > 0 && <button onClick={() => void markAll()} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-[#00696F] hover:bg-[#EAF5F5]"><CheckCheck size={16}/> Mark all read</button>}</header>
      {loading ? <p className="p-10 text-center text-sm text-gray-500">Loading notifications…</p> : error ? <p role="alert" className="p-8 text-center text-sm text-red-600">{error}</p> : !items.length ? <div className="px-6 py-16 text-center"><Bell className="mx-auto mb-3 text-[#93A4AA]" size={30}/><p className="font-semibold text-[#273740]">No notifications yet</p><p className="mt-1 text-sm text-[#76838A]">Friend requests and post activity will appear here.</p></div> : <div className="divide-y divide-[#EDF1F2]">{items.map(item => <Link key={item.id} href={item.data?.path?.startsWith("/") ? item.data.path : "/"} onClick={() => void markRead(item)} className={`flex items-start gap-3 px-5 py-4 transition hover:bg-[#F5F9F9] sm:px-6 ${item.isRead ? "bg-white" : "bg-[#F1F8F8]"}`}><span className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full ${item.isRead ? "bg-[#EEF2F3] text-[#69777F]" : "bg-[#DCEFEF] text-[#00696F]"}`}><Bell size={18}/></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-[#18262F]">{item.title}</span><span className="mt-1 block text-sm text-[#596870]">{item.body}</span><time className="mt-1.5 block text-xs text-[#829097]">{new Date(item.createdAt).toLocaleString()}</time></span>{!item.isRead && <span className="mt-3 size-2 shrink-0 rounded-full bg-[#00777C]"/>}</Link>)}</div>}
    </section>
  </main>;
}
