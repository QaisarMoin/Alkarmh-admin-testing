import React, { useState } from "react";
import { FaStar } from "react-icons/fa";

const reviewsData = [
  {
    user: "John Doe",
    product: "Wireless Earbuds",
    rating: 5,
    comment: "Great product!",
    date: "2024-06-01",
    status: "Rejected",
  },
  {
    user: "Jane Smith",
    product: "Smart Watch",
    rating: 4,
    comment: "Works well, battery could be better.",
    date: "2024-06-02",
    status: "Rejected",
  },
  {
    user: "Alice Brown",
    product: "Bluetooth Speaker",
    rating: 3,
    comment: "Average sound quality.",
    date: "2024-06-03",
    status: "Approved",
  },
];

const getStatusClass = (status) => {
  switch (status) {
    case "Approved":
      return "bg-green-100 text-green-700";
    case "Rejected":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const Review = () => {
  const [search, setSearch] = useState("");
  const [reviews, setReviews] = useState(reviewsData);

  const handleToggleStatus = (idx) => {
    setReviews((prev) =>
      prev.map((r, i) =>
        i === idx
          ? {
              ...r,
              status: r.status === "Approved" ? "Rejected" : "Approved",
            }
          : r
      )
    );
  };

  const filteredReviews = reviews.filter(
    (r) =>
      r.user.toLowerCase().includes(search.toLowerCase()) ||
      r.product.toLowerCase().includes(search.toLowerCase()) ||
      r.comment.toLowerCase().includes(search.toLowerCase())
  );

  const totalReviews = reviews.length;
  const averageRating = (
    reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
  ).toFixed(1);
  const fiveStarReviews = reviews.filter((r) => r.rating === 5).length;

  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-2">
        Dashboard <span className="mx-1">&gt;</span> <span className="text-gray-700 font-medium">Reviews</span>
      </nav>
      {/* Header */}
      <h1 className="text-2xl font-bold mb-1">Reviews</h1>
      <p className="text-gray-500 mb-4">Manage and monitor product reviews from customers.</p>
      {/* Stats Cards */}
      <div className="flex gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 flex-1 flex items-center">
          <div>
            <div className="text-gray-500 text-sm">Total Reviews</div>
            <div className="text-2xl font-bold">{totalReviews}</div>
          </div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 flex-1 flex items-center">
          <div>
            <div className="text-gray-500 text-sm">Average Rating</div>
            <div className="text-2xl font-bold">{averageRating}</div>
          </div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 flex-1 flex items-center">
          <div>
            <div className="text-gray-500 text-sm">5 Star Reviews</div>
            <div className="text-2xl font-bold">{fiveStarReviews}</div>
          </div>
        </div>
      </div>
      {/* Search and Filters */}
      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          placeholder="Search reviews by user, product, or comment..."
          className="border rounded px-3 py-2 flex-1"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="bg-blue-600 text-white px-4 py-2 rounded">Search</button>
        <button className="border px-4 py-2 rounded flex items-center gap-1">
          Filters
        </button>
      </div>
      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-700">
              <th className="py-3 px-4 text-left">User</th>
              <th className="py-3 px-4 text-left">Product</th>
              <th className="py-3 px-4 text-left">Rating</th>
              <th className="py-3 px-4 text-left">Comment</th>
              <th className="py-3 px-4 text-left">Date</th>
              <th className="py-3 px-4 text-left">Status</th>
              <th className="py-3 px-4 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredReviews.map((review, idx) => (
              <tr key={idx} className="border-t">
                <td className="py-3 px-4">{review.user}</td>
                <td className="py-3 px-4">{review.product}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <FaStar
                        key={i}
                        className={
                          i < review.rating ? "text-yellow-400" : "text-gray-300"
                        }
                      />
                    ))}
                  </div>
                </td>
                <td className="py-3 px-4">{review.comment}</td>
                <td className="py-3 px-4">{review.date}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusClass(review.status)}`}>
                    {review.status}
                  </span>
                </td>
                <td className="py-3 px-4 flex gap-2">
                  <button
                    className={
                      review.status === "Approved"
                        ? "bg-red-500 text-white px-3 py-1 rounded"
                        : "bg-green-500 text-white px-3 py-1 rounded"
                    }
                    onClick={() => handleToggleStatus(reviews.indexOf(review))}
                  >
                    {review.status === "Approved" ? "Reject" : "Approve"}
                  </button>
                  <button className="bg-red-600 text-white px-3 py-1 rounded">Delete</button>
                </td>
              </tr>
            ))}
            {filteredReviews.length === 0 && (
              <tr>
                <td colSpan="7" className="py-6 text-center text-gray-400">
                  No reviews found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Review; 