import { Star, StarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function StarRating({ value = 0, onChange, disabled }: StarRatingProps) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((rating) => (
        <button
          key={rating}
          type="button"
          disabled={disabled}
          onClick={() => onChange(rating)}
          className={cn(
            "hover:text-yellow-400 transition-colors",
            rating <= value ? "text-yellow-400" : "text-gray-300"
          )}
        >
          {rating <= value ? (
            <StarIcon className="w-6 h-6 fill-current" />
          ) : (
            <Star className="w-6 h-6" />
          )}
        </button>
      ))}
    </div>
  );
}
