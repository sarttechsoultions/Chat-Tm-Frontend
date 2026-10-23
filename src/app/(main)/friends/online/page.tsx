import { redirect } from "next/navigation";

export default function FriendsRedirectPage() {
  redirect("/friends/requests");
}
