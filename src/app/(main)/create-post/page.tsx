import { Suspense } from "react";
import CreatePostPage from "../../../components/posts/CreatePostPage";

export default function CreatePostRoute() {
  return (
    <Suspense fallback={<p className="py-10 text-center text-[14px] text-[#6B7280]">Loading…</p>}>
      <CreatePostPage />
    </Suspense>
  );
}
