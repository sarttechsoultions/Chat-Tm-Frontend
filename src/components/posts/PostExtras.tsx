"use client";

import { useEffect, useState } from "react";
import { UserAvatar } from "../ui/UserAvatar";
import { EmojiPicker } from "../messenger/ChatPickers";
import type { FriendUser } from "../../lib/auth";
import { searchLocations } from "../../lib/api/posts";

export const PRIVACY_OPTIONS = [
  {
    id: "PUBLIC" as const,
    label: "Public",
    hint: "Anyone on ChatTm",
    icon: "/figma/icons/privacy-globe.svg",
  },
  {
    id: "FRIENDS" as const,
    label: "Friends",
    hint: "Your friends only",
    icon: "/figma/icons/friends-lock.svg",
  },
  {
    id: "PRIVATE" as const,
    label: "Only me",
    hint: "Only you can see this",
    icon: "/figma/icons/friends-lock.svg",
  },
];

export const FEELINGS = [
  { emoji: "😊", label: "happy" },
  { emoji: "🙏", label: "blessed" },
  { emoji: "😍", label: "loved" },
  { emoji: "🤩", label: "excited" },
  { emoji: "😌", label: "grateful" },
  { emoji: "😎", label: "cool" },
  { emoji: "😢", label: "sad" },
  { emoji: "😴", label: "tired" },
  { emoji: "🍕", label: "hungry" },
  { emoji: "🎉", label: "celebrating" },
  { emoji: "✈️", label: "traveling" },
  { emoji: "💪", label: "motivated" },
] as const;

function nameOf(user: Pick<FriendUser, "firstName" | "lastName" | "username">) {
  return `${user.firstName} ${user.lastName}`.trim() || user.username;
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-[420px] rounded-[16px] bg-white p-5 shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[16px] font-bold text-[#111827]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-full text-[18px] text-[#6B7280] hover:bg-[#F3F4F6]"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function LocationPicker({
  value,
  onSelect,
  onClose,
}: {
  value: string;
  onSelect: (place: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState(value);
  const [items, setItems] = useState<{ id: string; label: string; detail: string; type: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timeout = window.setTimeout(() => {
      searchLocations(q)
        .then((places) => {
          setItems(places);
          setError("");
        })
        .catch(() => setError("Unable to search locations."))
        .finally(() => setLoading(false));
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [query]);

  return (
    <Modal title="Add location" onClose={onClose}>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search any city, village, or place"
        autoFocus
        className="mb-3 h-10 w-full rounded-[8px] border border-[#D8D2D2] px-3 text-[14px] outline-none focus:border-[#00696F]"
      />
      {value ? (
        <button
          type="button"
          onClick={() => {
            onSelect("");
            onClose();
          }}
          className="mb-3 w-full rounded-[8px] bg-[#F3F4F6] py-2 text-[13px] font-bold text-[#4B5563]"
        >
          Remove location
        </button>
      ) : null}
      <ul className="max-h-[260px] overflow-y-auto">
        {loading ? (
          <li className="px-2 py-6 text-center text-[13px] text-[#6B7280]">Searching the world…</li>
        ) : error ? (
          <li className="px-2 py-6 text-center text-[13px] text-red-600">{error}</li>
        ) : query.trim().length < 2 ? (
          <li className="px-2 py-6 text-center text-[13px] text-[#6B7280]">
            Type at least 2 letters to find cities, villages, and landmarks.
          </li>
        ) : items.length ? (
          items.map((place) => (
            <li key={place.id}>
              <button
                type="button"
                onClick={() => {
                  onSelect(place.label);
                  onClose();
                }}
                className="flex w-full items-start gap-2 rounded-[8px] px-2 py-2 text-left hover:bg-[#EFF4FF]"
              >
                <img src="/figma/icons/map-pin.svg" alt="" width={12} height={14} className="mt-1" />
                <span>
                  <span className="block text-[14px] font-medium text-[#111827]">{place.label}</span>
                  <span className="block text-[12px] text-[#6B7280]">{place.detail}</span>
                </span>
              </button>
            </li>
          ))
        ) : (
          <li className="px-2 py-6 text-center text-[13px] text-[#6B7280]">No matching places.</li>
        )}
      </ul>
    </Modal>
  );
}

export function FeelingPicker({
  onSelect,
  onClose,
}: {
  onSelect: (feeling: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal title="How are you feeling?" onClose={onClose}>
      <div className="grid grid-cols-2 gap-2">
        {FEELINGS.map((item) => {
          const value = `${item.emoji} ${item.label}`;
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                onSelect(value);
                onClose();
              }}
              className="flex items-center gap-2 rounded-[10px] bg-[#F9FAFB] px-3 py-2 text-left text-[14px] hover:bg-[#EFF4FF]"
            >
              <span className="text-[18px]">{item.emoji}</span>
              {item.label}
            </button>
          );
        })}
      </div>
    </Modal>
  );
}

export function TagFriendsPicker({
  friends,
  selected,
  onChange,
  onClose,
}: {
  friends: FriendUser[];
  selected: FriendUser[];
  onChange: (users: FriendUser[]) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const selectedIds = new Set(selected.map((user) => user.id));
  const matches = friends.filter((user) =>
    nameOf(user).toLowerCase().includes(query.toLowerCase())
  );

  function toggle(user: FriendUser) {
    if (selectedIds.has(user.id)) {
      onChange(selected.filter((item) => item.id !== user.id));
    } else {
      onChange([...selected, user]);
    }
  }

  return (
    <Modal title="Tag friends" onClose={onClose}>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search friends"
        className="mb-3 h-10 w-full rounded-[8px] border border-[#D8D2D2] px-3 text-[14px] outline-none focus:border-[#00696F]"
      />
      <ul className="max-h-[240px] overflow-y-auto">
        {matches.length ? (
          matches.map((user) => (
            <li key={user.id}>
              <button
                type="button"
                onClick={() => toggle(user)}
                className="flex w-full items-center gap-3 rounded-[8px] px-2 py-2 hover:bg-[#EFF4FF]"
              >
                <UserAvatar avatarUrl={user.avatar} name={nameOf(user)} size={36} />
                <span className="flex-1 text-left text-[14px] font-medium">{nameOf(user)}</span>
                <span
                  className={`size-5 rounded-full border ${
                    selectedIds.has(user.id)
                      ? "border-[#00696F] bg-[#00696F]"
                      : "border-[#D1D5DB]"
                  }`}
                />
              </button>
            </li>
          ))
        ) : (
          <p className="py-6 text-center text-[13px] text-[#6B7280]">No friends to tag.</p>
        )}
      </ul>
      <button
        type="button"
        onClick={onClose}
        className="mt-4 w-full rounded-[8px] bg-[#00696F] py-2 text-[14px] font-bold text-white"
      >
        Done{selected.length ? ` (${selected.length})` : ""}
      </button>
    </Modal>
  );
}

export function EmojiSheet({
  onSelect,
  onClose,
}: {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal title="Add emoji" onClose={onClose}>
      <EmojiPicker
        compact
        onSelect={(emoji) => {
          onSelect(emoji);
          onClose();
        }}
      />
    </Modal>
  );
}
