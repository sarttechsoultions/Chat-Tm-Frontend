import React from "react";
import CreatePostCard from "../../components/home/CreatePostCard";
import StoriesSection from "../../components/home/StoriesSection";
import PostCard from "../../components/home/PostCard";

const POST_ITEMS = [
  {
    id: 1,
    author: {
      name: "Emma Watson",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      time: "2h ago",
      isVerified: true,
      follow: true,
    },
    content: "Enjoying the beautiful nature 🌲⛰️ Sunsets always bring such peaceful vibes.",
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800",
    likes: "2.5K",
    comments: "125",
    shares: "65",
  },
  {
    id: 2,
    author: {
      name: "Rahul Sharma",
      avatar: "https://i.pravatar.cc/150?img=13",
      time: "4h ago",
      isVerified: false,
      follow: false,
    },
    content: "Just finished building a brand new full-stack dashboard layout using Next.js and Tailwind CSS! Clean UI/UX makes everything look so premium. 🚀💻\n\nWhat are you working on today?",
    image: undefined, // Bina image wala post (Text only)
    likes: "482",
    comments: "34",
    shares: "12",
  },
  {
    id: 3,
    author: {
      name: "Michael Scott",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
      time: "6h ago",
      isVerified: true,
      follow: true,
    },
    content: "Coffee and code—the best combination for a productive afternoon! ☕✨",
    image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800",
    likes: "1.2K",
    comments: "89",
    shares: "24",
  },
  {
    id: 4,
    author: {
      name: "Sophia Lee",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
      time: "1d ago",
      isVerified: false,
      follow: true,
    },
    content: "Reminder: Consistency is more important than intensity when learning new skills. Keep showing up every single day! 💪",
    image: undefined, // Ek aur text-only inspirational post
    likes: "3.4K",
    comments: "210",
    shares: "450",
  },
];

export default function HomeFeed() {
  return (
    <div className="w-full max-w-[740px] mx-auto flex flex-col gap-4 py-4">
      {/* 1. Create Post Box */}
      <CreatePostCard />

      {/* 2. Stories Carousel */}
      <StoriesSection />

      {/* 3. Post Feed Items */}
      {POST_ITEMS.map((post) => (
        <PostCard
          key={post.id}
          author={post.author}
          content={post.content}
          image={post.image}
          likes={post.likes}
          comments={post.comments}
          shares={post.shares}
        />
      ))}
    </div>
  );
}