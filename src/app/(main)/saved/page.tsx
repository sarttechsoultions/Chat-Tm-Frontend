import { Suspense } from "react";
import PostLibraryPage from "../../../components/posts/PostLibraryPage";

export default function SavedPostsRoute() {
  return <Suspense fallback={<p className="py-10 text-center text-sm text-[#6B7280]">Loading your post library…</p>}>
    <PostLibraryPage />
  </Suspense>;
}
