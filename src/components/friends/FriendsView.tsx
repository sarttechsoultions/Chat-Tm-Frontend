"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  acceptFriendRequest,
  ApiError,
  deleteFriendRequest,
  type FriendRequest,
  type FriendUser,
  listFriends,
  listFriendSuggestions,
  listReceivedFriendRequests,
  sendFriendRequest,
  unfriend,
} from "../../lib/auth";
import { useRouter } from "next/navigation";
import { UserAvatar } from "../ui/UserAvatar";
import { createDirectConversation } from "../../lib/api/chat";

type FriendTab = "all" | "online" | "requests" | "suggestions";
const tabs: { id: FriendTab; label: string; href: string }[] = [
  { id: "all", label: "All Friends", href: "/friends" },
  { id: "online", label: "Online Friends", href: "/friends/online" },
  { id: "requests", label: "Friend Requests", href: "/friends/requests" },
  { id: "suggestions", label: "Suggestions", href: "/friends/suggestions" },
];

const nameOf = (user: FriendUser) =>
  `${user.firstName} ${user.lastName}`.trim() || user.username;

function State({ loading, message }: { loading: boolean; message: string }) {
  return (
    <p className="py-10 text-center text-[14px] text-[#6B7280]">
      {loading ? "Loading…" : message}
    </p>
  );
}

export default function FriendsView({ tab }: { tab: FriendTab }) {
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [suggestions, setSuggestions] = useState<FriendUser[]>([]);
  const [sentRequests, setSentRequests] = useState<Record<string, string>>({});
  const [unfriendTarget, setUnfriendTarget] = useState<FriendUser | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [working, setWorking] = useState("");

  const router = useRouter();

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (tab === "requests")
        setRequests((await listReceivedFriendRequests()).items);
      else if (tab === "suggestions")
        setSuggestions((await listFriendSuggestions()).items);
      else setFriends((await listFriends()).items);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to load friends. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSentRequests({});
      setUnfriendTarget(null);
      void refresh();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [refresh]);

  const visibleFriends = useMemo(
    () =>
      (tab === "online" ? friends.filter((item) => item.isOnline) : friends).filter(
        (item) => nameOf(item).toLowerCase().includes(query.toLowerCase())
      ),
    [friends, query, tab]
  );

  const title =
    tab === "requests"
      ? "Friend Requests"
      : tab === "suggestions"
      ? "Suggestions"
      : "Friends";

  const subtitle =
    tab === "online"
      ? "See who's active and ready to chat."
      : tab === "requests"
      ? "Manage your pending connections."
      : tab === "suggestions"
      ? "Discover people you may know."
      : "Connect with your friends and build your network.";

  async function act(id: string, job: () => Promise<unknown>, success: string) {
    setWorking(id);
    setError("");
    try {
      await job();
      setNotice(success);
      await refresh();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Unable to complete this action."
      );
    } finally {
      setWorking("");
    }
  }

  async function handleSendRequest(user: FriendUser) {
    setWorking(user.id);
    setError("");
    try {
      const data = await sendFriendRequest(user.id);
      const requestId = data?.request?.id;
      if (requestId) {
        setSentRequests((prev) => ({ ...prev, [user.id]: requestId }));
      }
      setNotice(`Friend request sent to ${nameOf(user)}.`);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Unable to send friend request."
      );
    } finally {
      setWorking("");
    }
  }

  async function handleCancelRequest(user: FriendUser) {
    const requestId = sentRequests[user.id];
    if (!requestId) return;
    setWorking(user.id);
    setError("");
    try {
      await deleteFriendRequest(requestId);
      setSentRequests((prev) => {
        const next = { ...prev };
        delete next[user.id];
        return next;
      });
      setNotice("Friend request cancelled.");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Unable to cancel friend request."
      );
    } finally {
      setWorking("");
    }
  }

  async function confirmUnfriend() {
    if (!unfriendTarget) return;
    const user = unfriendTarget;
    setUnfriendTarget(null);
    await act(
      user.id,
      () => unfriend(user.id),
      `${nameOf(user)} was removed from your friends.`
    );
  }

  async function handleMessageClick(userId: string) {
    setWorking(userId);
    setError("");
    try {
      const chat = await createDirectConversation(userId);
      router.push(`/messenger?chatId=${chat.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to start conversation."
      );
    } finally {
      setWorking("");
    }
  }

  return (
    <section className="mx-auto w-full max-w-[906px] rounded-[12px] bg-[#F9FAFB] px-5 pb-8 pt-[10px] shadow-[0_0_4px_rgba(0,0,0,0.25)] sm:px-8">
      <header className="border-b border-[#E5E7EB]">
        <h1 className="text-[24px] font-bold leading-8 text-[#111827]">
          {title}
        </h1>
        <p className="mt-1 text-[14px] leading-5 text-[#6B7280]">{subtitle}</p>
        <nav
          aria-label="Friends sections"
          className="mt-5 flex gap-5 overflow-x-auto whitespace-nowrap sm:gap-8"
        >
          {tabs.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center gap-2 border-b-2 px-1 pb-[18px] pt-4 text-[14px] font-medium ${
                item.id === tab
                  ? "border-[#00696F] text-[#00696F]"
                  : "border-transparent text-[#6B7280] hover:text-[#00696F]"
              }`}
            >
              {item.label}
              {item.id === "online" ? (
                <span className="size-2 rounded-full bg-[#16A34A]" />
              ) : null}
              {item.id === "requests" && requests.length ? (
                <span className="rounded-full bg-[#F3F4F6] px-2 py-0.5 text-[12px] text-[#4B5563]">
                  {requests.length}
                </span>
              ) : null}
            </Link>
          ))}
        </nav>
      </header>

      {notice ? (
        <p
          role="status"
          className="mt-5 rounded-[8px] bg-[#E8F4F3] px-4 py-3 text-[14px] text-[#00696F]"
        >
          {notice}
        </p>
      ) : null}
      {error ? (
        <p
          role="alert"
          className="mt-5 rounded-[8px] bg-red-50 px-4 py-3 text-[14px] text-red-700"
        >
          {error}
        </p>
      ) : null}

      {tab === "requests" ? (
        <div className="mt-6">
          <div className="mb-4 flex justify-between">
            <h2 className="text-[18px] font-bold">Friend Requests</h2>
            <span className="rounded-full bg-[#E8F4F3] px-3 py-1 text-[12px] font-bold text-[#00696F]">
              {requests.length} New
            </span>
          </div>
          {loading ? (
            <State loading message="" />
          ) : requests.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {requests.map(({ id, user }) => (
                <article
                  key={id}
                  className="rounded-[12px] bg-white p-4 shadow-[0_0_4px_rgba(0,0,0,0.14)]"
                >
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      avatarUrl={user.avatar}
                      name={nameOf(user)}
                      size="size-16"
                      isOnline={user.isOnline}
                    />
                    <div>
                      <h3 className="font-bold">{nameOf(user)}</h3>
                      <p className="text-[12px] text-[#3C494A]">
                        {user.mutualFriends} mutual friends
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={working === id}
                      onClick={() =>
                        void act(
                          id,
                          () => acceptFriendRequest(id),
                          `${nameOf(user)} is now your friend.`
                        )
                      }
                      className="rounded-[8px] bg-[#00696F] py-2 text-[14px] font-bold text-white disabled:opacity-60"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      disabled={working === id}
                      onClick={() =>
                        void act(
                          id,
                          () => deleteFriendRequest(id),
                          "Friend request deleted."
                        )
                      }
                      className="rounded-[8px] bg-[#F3F4F6] py-2 text-[14px] font-bold text-[#4B5563] disabled:opacity-60"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <State loading={false} message="No pending friend requests." />
          )}
        </div>
      ) : null}

      {tab === "suggestions" ? (
        <div className="mt-6">
          <h2 className="mb-4 text-[18px] font-bold">People You May Know</h2>
          {loading ? (
            <State loading message="" />
          ) : suggestions.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {suggestions.map((user) => {
                const requestId = sentRequests[user.id];
                const sent = Boolean(requestId);
                return (
                  <article
                    key={user.id}
                    className="rounded-[12px] bg-white p-[17px] text-center shadow-[0_0_4px_rgba(0,0,0,0.25)]"
                  >
                    <div className="mx-auto mb-3 w-fit">
                      <UserAvatar
                        avatarUrl={user.avatar}
                        name={nameOf(user)}
                        size="size-24"
                        isOnline={user.isOnline}
                      />
                    </div>
                    <h3 className="font-bold">{nameOf(user)}</h3>
                    <p className="text-[12px] text-[#3C494A]">
                      {user.mutualFriends} mutual friends
                    </p>
                    <button
                      type="button"
                      disabled={working === user.id}
                      onClick={() =>
                        sent
                          ? void handleCancelRequest(user)
                          : void handleSendRequest(user)
                      }
                      className={`mt-4 w-full rounded-[8px] py-2 text-[14px] font-bold disabled:opacity-60 ${
                        sent
                          ? "bg-[#F3F4F6] text-[#4B5563]"
                          : "bg-[rgba(0,105,111,0.1)] text-[#00696F]"
                      }`}
                    >
                      {working === user.id
                        ? sent
                          ? "Cancelling…"
                          : "Sending…"
                        : sent
                          ? "Request Sent"
                          : "Add Friend"}
                    </button>
                  </article>
                );
              })}
            </div>
          ) : (
            <State loading={false} message="No friend suggestions right now." />
          )}
        </div>
      ) : null}

      {tab === "all" || tab === "online" ? (
        <div className="mt-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-[18px] font-bold">
              {tab === "online"
                ? `${visibleFriends.length} Online`
                : `All Friends (${friends.length})`}
            </h2>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search friends..."
              className="h-10 w-full rounded-[8px] border border-[#D8D2D2] bg-white px-3 text-[14px] outline-none focus:border-[#00696F] sm:w-[240px]"
            />
          </div>
          {loading ? (
            <State loading message="" />
          ) : visibleFriends.length ? (
            <div className="rounded-[12px] bg-white px-4 shadow-[0_0_4px_rgba(0,0,0,0.14)]">
              {visibleFriends.map((user) => (
                <article
                  key={user.id}
                  className="flex items-center gap-4 border-b border-[#F3F4F6] py-4 last:border-b-0"
                >
                  <UserAvatar
                    avatarUrl={user.avatar}
                    name={nameOf(user)}
                    size="size-16"
                    isOnline={user.isOnline}
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-bold">{nameOf(user)}</h3>
                    <p className="text-[12px] text-[#3C494A]">
                      {user.mutualFriends} mutual friends
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={working === user.id}
                    onClick={() => void handleMessageClick(user.id)}
                    className="rounded-[8px] bg-[rgba(0,105,111,0.1)] px-4 py-2 text-[14px] font-bold text-[#00696F] hover:bg-[rgba(0,105,111,0.2)] transition disabled:opacity-60"
                  >
                    {working === user.id ? "Opening..." : "Message"}
                  </button>
                  <button
                    type="button"
                    disabled={working === user.id}
                    onClick={() => setUnfriendTarget(user)}
                    className="rounded-[8px] bg-[#F3F4F6] px-3 py-2 text-[14px] font-bold text-[#4B5563] hover:bg-gray-200 transition disabled:opacity-60"
                  >
                    Unfriend
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <State
              loading={false}
              message={
                tab === "online"
                  ? "No friends are online right now."
                  : "You have no friends yet."
              }
            />
          )}
        </div>
      ) : null}

      {unfriendTarget ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="unfriend-title"
            className="w-full max-w-[380px] rounded-[16px] bg-white p-6 shadow-[0_20px_50px_rgba(0,0,0,0.2)]"
          >
            <h3 id="unfriend-title" className="text-[18px] font-bold text-[#111827]">
              Unfriend {nameOf(unfriendTarget)}?
            </h3>
            <p className="mt-2 text-[14px] leading-5 text-[#6B7280]">
              You will no longer be friends. You can send a new request later if you change your mind.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setUnfriendTarget(null)}
                className="rounded-[8px] bg-[#F3F4F6] py-2.5 text-[14px] font-bold text-[#4B5563]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmUnfriend()}
                className="rounded-[8px] bg-[#DC2626] py-2.5 text-[14px] font-bold text-white"
              >
                Unfriend
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
