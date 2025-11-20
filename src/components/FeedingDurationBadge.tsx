import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

interface FeedingDurationBadgeProps {
  days: number;
  className?: string;
}

export const FeedingDurationBadge = ({ days, className = "" }: FeedingDurationBadgeProps) => {
  if (days === 0) return null;

  let message = "";
  let variant: "default" | "secondary" = "secondary";

  if (days < 7) {
    message = `${days} ngày`;
    variant = "secondary";
  } else if (days < 30) {
    const weeks = Math.floor(days / 7);
    message = `${weeks} tuần`;
    variant = "default";
  } else if (days < 90) {
    const months = Math.floor(days / 30);
    message = `${months} tháng`;
    variant = "default";
  } else {
    message = "3+ tháng";
    variant = "default";
  }

  return (
    <Badge variant={variant} className={`gap-1 ${className}`}>
      <Clock className="h-3 w-3" />
      Dùng được {message}
    </Badge>
  );
};
