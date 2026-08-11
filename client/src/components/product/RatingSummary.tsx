import { Star } from "lucide-react";

interface RatingSummaryProps {
  rating: number;
  numReviews: number;
}

const RatingSummary = ({ rating, numReviews }: RatingSummaryProps) => {
  if (numReviews === 0) {
    return <p className="text-sm text-gray-400">No reviews yet</p>;
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={16}
            className={i < Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-gray-300"}
          />
        ))}
      </div>
      <span className="text-sm text-gray-600">
        {rating.toFixed(1)} ({numReviews} {numReviews === 1 ? "review" : "reviews"})
      </span>
    </div>
  );
};

export default RatingSummary;