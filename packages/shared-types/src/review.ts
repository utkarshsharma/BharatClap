export interface CreateReviewDto {
  ratingPunctuality: number;
  ratingQuality: number;
  ratingBehavior: number;
  ratingValue: number;
  comment?: string;
  photos?: string[];
}

export interface ReviewSummary {
  id: string;
  bookingId: string;
  customerId: string;
  providerId: string;
  ratingOverall: number;
  ratingPunctuality: number;
  ratingQuality: number;
  ratingBehavior: number;
  ratingValue: number;
  comment: string | null;
  photos: string[];
  createdAt: string;
}
