"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Star,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Review {
  id: string;
  score: number;
  comment?: string;
  user?: {
    firstName: string | null;
    lastName: string | null;
  };
  createdAt: string;
  project?: {
    id: string;
    title: string;
  };
}

interface RatingCardProps {
  averageRating: number | null;
  reviewCount: number;
  reviews?: Review[];
}

export default function RatingCard({
  averageRating,
  reviewCount,
  reviews = [],
}: RatingCardProps) {
  const [showReviews, setShowReviews] = useState(false);

  // Ensure averageRating is a valid number before using toFixed
  const formattedRating =
    averageRating !== null && !isNaN(averageRating)
      ? Number(averageRating).toFixed(1)
      : null;

  // Filter reviews that have comments
  const reviewsWithComments = reviews.filter(
    (review) => review.comment && review.comment.trim() !== ""
  );
  const hasComments = reviewsWithComments.length > 0;

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>User Rating</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center mb-4">
          {formattedRating !== null ? (
            <div className="flex items-center">
              <Star className="h-5 w-5 text-yellow-500 mr-1" />
              <span className="text-2xl font-semibold">{formattedRating}</span>
              <span className="text-muted-foreground ml-2">
                ({reviewCount} reviews)
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground">No ratings yet</span>
          )}
        </div>

        {hasComments && (
          <div className="mt-2">
            <Button
              variant="outline"
              onClick={() => setShowReviews(!showReviews)}
              className="w-full flex items-center justify-center"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              {showReviews ? "Hide Comments" : "Show Comments"}
              {showReviews ? (
                <ChevronUp className="h-4 w-4 ml-2" />
              ) : (
                <ChevronDown className="h-4 w-4 ml-2" />
              )}
            </Button>

            {showReviews && (
              <div className="mt-4 space-y-4 max-h-80 overflow-y-auto">
                {reviewsWithComments.map((review) => (
                  <div
                    key={review.id}
                    className="border rounded-md p-3 bg-muted/30"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-500 mr-1" />
                        <span className="font-medium">{review.score}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {review.user?.firstName} {review.user?.lastName}
                      </div>
                    </div>

                    {review.project && (
                      <div className="mb-2 text-sm">
                        <span className="text-muted-foreground">Pentru: </span>
                        <Link
                          href={`/project/${review.project.id}`}
                          className="text-purple-600 hover:underline items-center gap-1 inline-flex"
                        >
                          {review.project.title}
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                    )}

                    <p className="text-sm">{review.comment}</p>
                    {review.createdAt && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
