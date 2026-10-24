import ProfileView from "../../../../components/profile/ProfileView";
import { redirect } from "next/navigation";

export default async function UserProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ postId?: string | string[] }>;
}) {
  const { postId } = await searchParams;
  if (typeof postId === "string" && postId) redirect(`/posts/${encodeURIComponent(postId)}`);
  const { username } = await params;
  return <ProfileView username={username} />;
}
