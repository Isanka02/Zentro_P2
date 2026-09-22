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
  createdAt: string;
  updatedAt: string;
}

export interface GetProductReviewsResponse {
  reviews: Review[];
}

export interface CreateReviewResponse {
  message: string;
  review: Review;
}

export const getProductReviews = async (productId: string): Promise<Review[]> => {
  const response = await api.get<GetProductReviewsResponse>(`/products/${productId}/reviews`);
  return response.data.reviews;
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
