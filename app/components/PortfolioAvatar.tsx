import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import { EditorProfile } from "../types/editorProfile";

export function PortfolioAvatar({ portfolio }: { portfolio: EditorProfile }) {
  return (
    <div>
      <Avatar className="h-24 w-24 sm:size-36 border-2 border-muted-foreground">
        <AvatarImage
          className="object-cover"
          src={portfolio.avatar_url || ""}
          alt={portfolio.display_name || "Editor Avatar"}
        />
        <AvatarFallback>
          <Image
            src={"/avif/user-profile-avatar.avif"}
            alt={portfolio.display_name || "Editor Avatar"}
            fill
            loading="lazy"
          />
        </AvatarFallback>
      </Avatar>
    </div>
  );
}
