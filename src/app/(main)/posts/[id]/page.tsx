import PostDetailPage from "../../../../components/posts/PostDetailPage";

export default async function PostRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PostDetailPage postId={id} />;
}
