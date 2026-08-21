import React from "react";
import CreatePostCard from "../../components/home/CreatePostCard";
import StoriesSection from "../../components/home/StoriesSection";
import PostCard from "../../components/home/PostCard";

const POST_ITEMS = [
  {
    id: 1,
    author: {
      name: "Emma Watson",
      avatar: "/figma/photos/emma-watson.png",
      time: "2h ago",
      isVerified: true,
      follow: true,
    },
    content: "Enjoying the beautiful nature 🌲🏔️",
    image: "/figma/photos/nature.png",
    imageCount: "1/5",
    likes: "2.5K",
    comments: "125",
    shares: "65",
    liked: true,
    reactions: ["/figma/photos/like.png", "/figma/photos/heart.png", "/figma/photos/wow.png"],
  },
  {
    id: 2,
    author: {
      name: "John Doe",
      avatar: "/figma/photos/john-doe.png",
      time: "5h ago",
      isVerified: false,
      follow: false,
      privacyIcon: "/figma/icons/friends-lock.svg",
    },
    content:
      "Just finished reading an incredible book on system design architectures.\n\nHighly recommend taking the time to understand the fundamentals before diving into complex frameworks! 📚💻\n\n#TechLife #Learning",
    image: undefined,
    likes: "1.1K",
    comments: "42",
    shares: "12",
    reactions: ["/figma/photos/like-2.png", "/figma/photos/heart-2.png"],
  },
];

export default function HomeFeed() {
  return (
    <div className="w-full max-w-[604px] mx-auto flex flex-col gap-6">
      <CreatePostCard />
      <StoriesSection />
      {POST_ITEMS.map((post) => (
        <PostCard key={post.id} {...post} />
      ))}
    </div>
  );
}
