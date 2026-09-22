import { useEffect, useState, type FormEvent } from "react";
import { Star, Trash2, MessageSquare, AlertCircle, CheckCircle2 } from "lucide-react";
import { getProductReviews, createReview, deleteReview, type Review } from "../../api/reviews";
import { useAuthStore } from "../../store/authStore";

interface ReviewSectionProps {
  productId: string;
  rating: number;
  numReviews: number;
  onReviewSubmitted?: () => void;
}

export const ReviewSection = ({
  productId,
  rating: initialRating,
  numReviews: initialNumReviews,
  onReviewSubmitted,
}: ReviewSectionProps) => {
  const { user } = useAuthStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Review Form state
  const [userRating, setUserRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const fetchReviews = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getProductReviews(productId);
      setReviews(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load reviews.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const handleSubmitReview = async (e: FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setFormError("Please enter a review comment.");
      return;
    }

    setSubmitting(true);
    setFormError("");
    setFormSuccess("");

    try {
      const newReview = await createReview(productId, {
        rating: userRating,
        comment: comment.trim(),
      });
      setReviews((prev) => [newReview, ...prev]);
      setComment("");
      setUserRating(5);
      setFormSuccess("Thank you! Your review has been submitted.");
      if (onReviewSubmitted) onReviewSubmitted();
    } catch (err: any) {
      setFormError(err?.response?.data?.message || "Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;
    try {
      await deleteReview(reviewId);
      setReviews((prev) => prev.filter((r) => r._id !== reviewId));
      if (onReviewSubmitted) onReviewSubmitted();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to delete review.");
    }
  };

  const hasReviewed = user && reviews.some((r) => r.user?._id === user.id);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 space-y-8 shadow-xs mt-10">
      {/* Header & Rating Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-gray-100 pb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare size={22} className="text-blue-600" />
            Customer Reviews
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Ratings and feedback from verified purchasers
          </p>
        </div>

        <div className="flex items-center gap-4 bg-gray-50 px-5 py-3 rounded-xl border border-gray-100">
          <div className="text-center">
            <span className="text-2xl font-bold text-gray-900">{initialRating.toFixed(1)}</span>
            <span className="text-xs text-gray-400 block">out of 5</span>
          </div>
          <div className="space-y-1">
            <div className="flex text-amber-400">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={18}
                  fill={star <= Math.round(initialRating) ? "currentColor" : "none"}
                />
              ))}
            </div>
            <p className="text-xs text-gray-500">
              {initialNumReviews} {initialNumReviews === 1 ? "review" : "reviews"}
            </p>
          </div>
        </div>
      </div>

      {/* Review Form */}
      {user ? (
        hasReviewed ? (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-800 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-blue-600 flex-shrink-0" />
            <span>You have already submitted a review for this product. Thank you for your feedback!</span>
          </div>
        ) : (
          <form onSubmit={handleSubmitReview} className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 text-sm">Write a Review</h3>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                <AlertCircle size={16} />
                {formError}
              </div>
            )}

            {formSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 flex items-center gap-2">
                <CheckCircle2 size={16} />
                {formSuccess}
              </div>
            )}

            {/* Star Rating Selector */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Your Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setUserRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 text-amber-400 focus:outline-none transition hover:scale-110"
                  >
                    <Star
                      size={24}
                      fill={star <= (hoverRating || userRating) ? "currentColor" : "none"}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Comment Area */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Your Review</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share what you liked or disliked about this product..."
                rows={3}
                className="w-full p-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-xs font-semibold transition disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
          </form>
        )
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-center text-xs text-gray-600">
          Please <span className="font-semibold text-blue-600">log in</span> to leave a review for this product.
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : error ? (
          <p className="text-xs text-red-500 text-center">{error}</p>
        ) : reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-xs">
            No reviews yet. Be the first to review this product!
          </div>
        ) : (
          reviews.map((r) => {
            const isMyReview = user && r.user?._id === user.id;

            return (
              <div
                key={r._id}
                className="bg-white border border-gray-100 rounded-xl p-5 space-y-2 shadow-2xs relative"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-blue-100 text-blue-600 font-bold text-xs flex items-center justify-center flex-shrink-0">
                      {r.user?.avatar ? (
                        <img src={r.user.avatar} alt={r.user.name} className="w-full h-full object-cover" />
                      ) : (
                        (r.user?.name || "Customer").charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900 text-xs block">
                        {r.user?.name || "Verified Customer"}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex text-amber-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={14}
                          fill={star <= r.rating ? "currentColor" : "none"}
                        />
                      ))}
                    </div>

                    {(isMyReview || user?.role === "admin") && (
                      <button
                        onClick={() => handleDeleteReview(r._id)}
                        className="text-gray-400 hover:text-red-600 transition"
                        title="Delete Review"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-gray-700 leading-relaxed pt-1">{r.comment}</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ReviewSection;
