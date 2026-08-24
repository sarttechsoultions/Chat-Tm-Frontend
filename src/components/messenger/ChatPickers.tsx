"use client";

import { useEffect, useMemo, useState } from "react";
import FigmaIcon from "../home/FigmaIcon";
import { searchGifs, type GifItem } from "../../lib/api/chat";

export const QUICK_REACTIONS = ["❤️", "👍", "😂", "😮", "😢", "🔥", "🎉", "🙏"];

export const MORE_REACTIONS = [
  "❤️", "👍", "👎", "😂", "🤣", "😊", "😍", "😘", "😮", "😢", "😭", "😡",
  "🔥", "🎉", "👏", "🙏", "💯", "✨", "😎", "🤔", "😴", "🤗", "🤩", "😇",
  "💪", "👌", "✌️", "🤝", "👀", "💔", "💖", "⭐"
];

const EMOJI_CATEGORIES: { id: string; label: string; emojis: string[] }[] = [
  {
    id: "smileys",
    label: "😊",
    emojis: [
      "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "😉", "😊", "😇",
      "🥰", "😍", "🤩", "😘", "😗", "😚", "😋", "😛", "😜", "🤪", "😝", "🤑",
      "🤗", "🤭", "🤫", "🤔", "🤐", "🤨", "😐", "😑", "😶", "😏", "😒", "🙄",
      "😬", "😌", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤢", "🤮", "🥵",
      "🥶", "😎", "🤓", "🧐", "😕", "😟", "🙁", "😮", "😯", "😲", "😳", "🥺",
      "😦", "😧", "😨", "😰", "😥", "😢", "😭", "😱", "😖", "😣", "😞", "😓",
      "😩", "😫", "🥱", "😤", "😡", "😠", "🤬", "😈", "👿", "💀", "💩", "🤡"
    ]
  },
  {
    id: "gestures",
    label: "👍",
    emojis: [
      "👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘",
      "🤙", "👈", "👉", "👆", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛", "🤜",
      "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✍️", "💅", "🤳", "💪", "🦾", "👀"
    ]
  },
  {
    id: "hearts",
    label: "❤️",
    emojis: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❤️‍🔥", "💕",
      "💞", "💓", "💗", "💖", "💘", "💝", "💟", "💌", "💋", "💯", "💢", "💥",
      "💫", "💦", "💨", "🕊️", "⭐", "🌟", "✨", "⚡"
    ]
  },
  {
    id: "animals",
    label: "🐶",
    emojis: [
      "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮",
      "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🐤", "🦆", "🦅", "🦉", "🦇", "🐺",
      "🦄", "🐝", "🦋", "🐌", "🐞", "🐢", "🐍", "🐙"
    ]
  },
  {
    id: "food",
    label: "🍕",
    emojis: [
      "🍏", "🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🍒", "🍑",
      "🥭", "🍍", "🥥", "🥝", "🍅", "🥑", "🍔", "🍟", "🍕", "🌭", "🥪", "🌮",
      "🌯", "🥗", "🍝", "🍜", "🍣", "🍦", "🍩", "🎂", "🍪", "☕", "🍵", "🍺"
    ]
  },
  {
    id: "travel",
    label: "✈️",
    emojis: [
      "🚗", "🚕", "🚌", "🏎️", "🚓", "🚑", "🚒", "🚜", "🛵", "🚲", "✈️", "🚀",
      "🛸", "🚁", "⛵", "🏠", "🏡", "🏢", "🗽", "🗼", "🏰", "⛺", "🌅", "🌄",
      "🏖️", "🏝️", "⛰️", "🌋", "🌈", "🔥", "❄️", "🌊"
    ]
  },
  {
    id: "objects",
    label: "🎁",
    emojis: [
      "⌚", "📱", "💻", "⌨️", "🖥️", "📷", "🎥", "📞", "⏰", "💡", "🔦", "📖",
      "✏️", "📌", "📎", "🔒", "🔑", "🔨", "🧰", "🧲", "💰", "💳", "💎", "⚖️",
      "🎁", "🎈", "🎉", "🎊", "🏆", "🥇", "⚽", "🏀", "🎮", "🧩", "🧸", "🛒"
    ]
  }
];

export function EmojiPicker({
  onSelect,
  compact
}: {
  onSelect: (emoji: string) => void;
  compact?: boolean;
}) {
  const [category, setCategory] = useState(EMOJI_CATEGORIES[0].id);
  const [query, setQuery] = useState("");

  const emojis = useMemo(() => {
    const q = query.trim();
    if (q) {
      return EMOJI_CATEGORIES.flatMap((item) => item.emojis).filter((emoji) => emoji.includes(q));
    }
    return EMOJI_CATEGORIES.find((item) => item.id === category)?.emojis || EMOJI_CATEGORIES[0].emojis;
  }, [category, query]);

  return (
    <div className={`flex flex-col bg-white ${compact ? "h-[220px]" : "h-[280px]"}`}>
      <div className="px-3 pt-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search emoji"
          className="w-full rounded-full bg-[#EFF4FF] px-3 py-1.5 text-[13px] outline-none"
        />
      </div>
      {!query && (
        <div className="mt-2 flex gap-1 overflow-x-auto no-scrollbar px-2">
          {EMOJI_CATEGORIES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCategory(item.id)}
              className={`rounded-full px-2 py-1 text-[16px] transition ${
                category === item.id ? "bg-[#DCE9FF]" : "hover:bg-[#EFF4FF]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
      <div className="mt-2 grid flex-1 grid-cols-8 content-start gap-1 overflow-y-auto no-scrollbar px-2 pb-2">
        {emojis.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onSelect(emoji)}
            className="emoji-bounce flex h-9 items-center justify-center rounded-lg text-[20px] hover:bg-[#EFF4FF]"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

export function GifPicker({ onSelect }: { onSelect: (gif: GifItem) => void }) {
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState<GifItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setLoading(true);
      searchGifs(query)
        .then(setGifs)
        .catch(() => setGifs([]))
        .finally(() => setLoading(false));
    }, query ? 280 : 0);

    return () => window.clearTimeout(timeout);
  }, [query]);

  return (
    <div className="flex h-[280px] flex-col bg-white">
      <div className="px-3 pt-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search GIFs"
          className="w-full rounded-full bg-[#EFF4FF] px-3 py-1.5 text-[13px] outline-none"
        />
      </div>
      <div className="mt-2 flex-1 overflow-y-auto no-scrollbar px-2 pb-2">
        {loading ? (
          <p className="py-10 text-center text-[13px] text-[#6B7280]">Loading GIFs…</p>
        ) : gifs.length === 0 ? (
          <p className="py-10 text-center text-[13px] text-[#6B7280]">No GIFs found.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {gifs.map((gif) => (
              <button
                key={gif.id}
                type="button"
                onClick={() => onSelect(gif)}
                className="overflow-hidden rounded-xl bg-[#EFF4FF] chat-pop hover:scale-[1.02] transition"
              >
                <img src={gif.preview || gif.url} alt={gif.title} className="h-24 w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ComposerTray({
  mode,
  onClose,
  onEmoji,
  onGif
}: {
  mode: "emoji" | "gif";
  onClose: () => void;
  onEmoji: (emoji: string) => void;
  onGif: (gif: GifItem) => void;
}) {
  return (
    <div className="border-t border-[#D3E4FE] bg-white chat-slide-up">
      <div className="flex items-center justify-between px-3 py-2">
        <p className="text-[13px] font-semibold text-[#0B1C30]">
          {mode === "emoji" ? "Emojis" : "GIFs"}
        </p>
        <button type="button" onClick={onClose} className="text-[#6B7280] hover:text-[#0B1C30]" aria-label="Close picker">
          ✕
        </button>
      </div>
      {mode === "emoji" ? <EmojiPicker onSelect={onEmoji} /> : <GifPicker onSelect={onGif} />}
    </div>
  );
}

export function SeenTicks({
  seen,
  pending,
  failed,
}: {
  seen: boolean;
  pending?: boolean;
  failed?: boolean;
}) {
  if (failed || pending) return null;
  return (
    <span
      className={`ml-1 inline-flex items-center ${seen ? "text-[#7EE0E6]" : "text-white/70"}`}
      title={seen ? "Seen" : "Sent"}
      aria-label={seen ? "Seen" : "Sent"}
    >
      {seen ? (
        <svg width="16" height="10" viewBox="0 0 16 10" fill="none" aria-hidden="true">
          <path d="M1.2 5.2 3.6 7.6 8.8 1.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6.4 5.2 8.8 7.6 14.4 1.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="12" height="10" viewBox="0 0 12 10" fill="none" aria-hidden="true">
          <path d="M1.2 5.2 3.8 7.7 10.6 1.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
}

export function ReactionBar({
  isMine,
  onReact,
  onReply,
  onDelete,
  onMore
}: {
  isMine: boolean;
  onReact: (emoji: string) => void;
  onReply: () => void;
  onDelete: () => void;
  onMore: () => void;
}) {
  return (
    <div className="reaction-bar flex items-center gap-0.5 rounded-full border border-gray-100 bg-white px-1.5 py-1 shadow-sm">
      {QUICK_REACTIONS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onReact(emoji)}
          className="emoji-bounce rounded-full px-1 text-[15px] hover:bg-[#EFF4FF]"
          title={emoji}
        >
          {emoji}
        </button>
      ))}
      <button
        type="button"
        onClick={onMore}
        className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-[#EFF4FF]"
        title="More emojis"
      >
        <FigmaIcon src="/figma/icons/input-emoji.svg" alt="More emojis" width={14} height={14} />
      </button>
      <button
        type="button"
        onClick={onReply}
        className="px-1 text-[13px] font-semibold text-gray-500 hover:text-[#00696F]"
        title="Reply"
      >
        ↩
      </button>
      {isMine && (
        <button
          type="button"
          onClick={onDelete}
          className="flex h-8 w-8 items-center justify-center rounded-full text-[18px] text-[#6B7280] hover:bg-red-50 hover:text-red-600"
          title="Delete for everyone"
          aria-label="Delete message"
        >
          🗑
        </button>
      )}
    </div>
  );
}
