"use client";
import type { PostItem } from "../../lib/api/posts";
import PostShareSheet from "./PostShareSheet";

export default function ReelShare(props: { post: PostItem; onClose: () => void; onShared: (post: PostItem) => void }) {
  return <PostShareSheet {...props}/>;
}
