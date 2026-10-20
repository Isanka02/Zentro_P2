import { api } from "./axios";

export interface ReviewUser {
  _id: string;
  name: string;
  avatar?: string;
}

export interface Review {
  _id: string;
  product: string;
  user: ReviewUser;
  rating: number;
  comment: string;
  verifiedPurchase: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GetProductReviewsResponse {
  reviews: Review[];
  hasReviewed: boolean;
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface CreateReviewResponse {
  message: string;
  review: Review;
}

export const getProductReviews = async (productId: string, page: number): Promise<GetProductReviewsResponse> => {
  const response = await api.get<GetProductReviewsResponse>(`/products/${productId}/reviews`, { params: { page } });
  return response.data;
};

export const createReview = async (
  productId: string,
  data: { rating: number; comment: string }
): Promise<Review> => {
  const response = await api.post<CreateReviewResponse>(`/products/${productId}/reviews`, data);
  return response.data.review;
};

export const deleteReview = async (reviewId: string): Promise<void> => {
  await api.delete(`/reviews/${reviewId}`);
};
