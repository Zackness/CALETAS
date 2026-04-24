"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, UserMinus, UserPlus } from "lucide-react";

export function UserFollowButton({
  userId,
  initialFollowing,
}: {
  userId: string;
  initialFollowing: boolean;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    try {
      if (following) {
        const res = await fetch(`/api/users/${encodeURIComponent(userId)}/follow`, { method: "DELETE" });
        if (res.ok) setFollowing(false);
      } else {
        const res = await fetch(`/api/users/${encodeURIComponent(userId)}/follow`, { method: "POST" });
        if (res.ok) setFollowing(true);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      disabled={loading}
      onClick={() => void toggle()}
      className="border-[color-mix(in_oklab,var(--accent-hex)_45%,transparent)] bg-[#1C2D20] text-[var(--accent-hex)] hover:bg-white/10"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : following ? (
        <>
          <UserMinus className="mr-2 h-4 w-4" />
          Dejar de seguir
        </>
      ) : (
        <>
          <UserPlus className="mr-2 h-4 w-4" />
          Seguir
        </>
      )}
    </Button>
  );
}
