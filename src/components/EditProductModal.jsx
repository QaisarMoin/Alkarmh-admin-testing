import React, { useState, useEffect } from "react";
import * as api from "../utils/api";
import { toast } from "react-toastify";

const statusOptions = [
  { key: "Active", label: "Active" },
  { key: "Out of Stock", label: "Out of Stock" },
  { key: "Low Stock", label: "Low Stock" },
  { key: "Hidden", label: "Hidden" },
  { key: "Draft", label: "Draft" },
];

const EditProductModal = ({ productId, categories, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: {
      en: "",
      ar: "",
    },
    description: {
      en: "",
      ar: "",
    },
    baseImage: [],
    category: "",
    shop: "",
    variants: [
      {
        size: "",
        color: "",
        price: 0,
        stock: 0,
        sku: "",
        barcode: "",
      },
    ],
    status: "Active",
    specifications: {
      weight: "",
      dimensions: "",
      brand: "",
      model: "",
      warranty: "",
      material: "",
      origin: "",
    },
    seo: {
      metaTitle: "",
      metaDescription: "",
      keywords: [],
      slug: "",
    },
    tags: [],
    isOnSale: false,
    featured: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingImages, setPendingImages] = useState([]);

  // Helper function to calculate total stock and determine appropriate status
  const calculateTotalStockAndStatus = (variants, currentStatus) => {
    const totalStock = variants.reduce(
      (sum, variant) => sum + Number(variant.stock),
      0
    );
    let newStatus;

    if (totalStock <= 100) {
      newStatus = "Low Stock";
    } else {
      // If stock is > 100, set to Active (unless it's Hidden or Draft)
      newStatus =
        currentStatus === "Hidden" || currentStatus === "Draft"
          ? currentStatus
          : "Active";
    }

    return {
      totalStock,
      status: newStatus,
    };
  };

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    setError(null);
    api
      .get(`/api/products/${productId}`)
      .then((data) => {
        if (data && data.data) {
          setForm({
            name: data.data.name || { en: "", ar: "" },
            description: data.data.description || { en: "", ar: "" },
            baseImage: data.data.baseImage || [],
            category: data.data.category || "",
            shop: data.data.shop || "",
            variants: data.data.variants || [
              {
                size: "",
                color: "",
                price: 0,
                stock: 0,
                sku: "",
                barcode: "",
              },
            ],
            status: data.data.status || "Active",
            specifications: data.data.specifications || {
              weight: "",
              dimensions: "",
              brand: "",
              model: "",
              warranty: "",
              material: "",
              origin: "",
            },
            seo: data.data.seo || {
              metaTitle: "",
              metaDescription: "",
              keywords: [],
              slug: "",
            },
            tags: data.data.tags || [],
            isOnSale: data.data.isOnSale || false,
            featured: data.data.featured || false,
          });
        }
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to fetch product details.");
        setLoading(false);
      });
  }, [productId]);

  const handleChange = (e, section, subsection) => {
    const { name, value, type, checked } = e.target;

    if (section) {
      if (subsection) {
        setForm((prev) => ({
          ...prev,
          [section]: {
            ...prev[section],
            [subsection]: value,
          },
        }));
      } else {
        setForm((prev) => ({
          ...prev,
          [section]: {
            ...prev[section],
            [name]: value,
          },
        }));
      }
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleVariantChange = (index, field, value) => {
    setForm((prev) => {
      // Create updated variants array
      const updatedVariants = prev.variants.map((variant, i) =>
        i === index ? { ...variant, [field]: value } : variant
      );

      // If stock is being changed, check if we need to update status
      if (field === "stock") {
        const { status } = calculateTotalStockAndStatus(
          updatedVariants,
          prev.status
        );

        return {
          ...prev,
          variants: updatedVariants,
          status,
        };
      }

      // Return updated form without changing status
      return {
        ...prev,
        variants: updatedVariants,
      };
    });
  };

  const addVariant = () => {
    setForm((prev) => {
      // Create new variant
      const newVariant = {
        size: "",
        color: "",
        price: 0,
        stock: 0,
        sku: "",
        barcode: "",
      };

      // Create updated variants array
      const updatedVariants = [...prev.variants, newVariant];

      // Calculate status based on total stock
      const { status } = calculateTotalStockAndStatus(
        updatedVariants,
        prev.status
      );

      // Return updated form with status updated if needed
      return {
        ...prev,
        variants: updatedVariants,
        status,
      };
    });
  };

  const removeVariant = (index) => {
    if (form.variants.length > 1) {
      setForm((prev) => {
        // Create updated variants array
        const updatedVariants = prev.variants.filter((_, i) => i !== index);

        // Calculate status based on total stock
        const { status } = calculateTotalStockAndStatus(
          updatedVariants,
          prev.status
        );

        // Return updated form with status updated if needed
        return {
          ...prev,
          variants: updatedVariants,
          status,
        };
      });
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setPendingImages((prev) => [...prev, ...files]);
    toast.info("Image(s) added. They will be uploaded when you save changes.");
  };

  const handleRemoveImage = (idx) => {
    setForm((prev) => ({
      ...prev,
      baseImage: prev.baseImage.filter((_, i) => i !== idx),
    }));
    // Also remove from pendingImages if it's a pending file
    setPendingImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleTagsChange = (e) => {
    const tags = e.target.value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    setForm((prev) => ({ ...prev, tags }));
  };

  const handleKeywordsChange = (e) => {
    const keywords = e.target.value
      .split(",")
      .map((keyword) => keyword.trim())
      .filter(Boolean);
    setForm((prev) => ({
      ...prev,
      seo: { ...prev.seo, keywords },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.en.trim()) {
      toast.error("Please enter a product name in English");
      return;
    }

    if (!form.category) {
      toast.error("Please select a category");
      return;
    }

    if (form.variants.length === 0) {
      toast.error("Please add at least one variant");
      return;
    }

    let imageUrls = [];
    if (pendingImages.length > 0) {
      try {
        toast.info("Uploading images...");
        const uploadPromises = pendingImages.map((file) => {
          const formData = new FormData();
          formData.append("file", file);
          return api.post("/api/upload", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        });
        const uploadResults = await Promise.all(uploadPromises);
        imageUrls = uploadResults.map((res) => res.url).filter(Boolean);
        toast.success("All images uploaded!");
      } catch (err) {
        toast.error("Image upload failed.");
        return;
      }
    }

    // Check if status is being manually set or should be automatic
    let updatedStatus;
    let isManualUpdate = false;

    // If the status dropdown is disabled (due to stock levels), use automatic status
    const totalStock = form.variants.reduce(
      (sum, variant) => sum + Number(variant.stock),
      0
    );
    const isLowStock = totalStock <= 100;
    const isHighStock =
      totalStock > 100 &&
      !isLowStock &&
      form.status !== "Hidden" &&
      form.status !== "Draft";

    if (isLowStock || isHighStock) {
      // Use automatic status based on stock levels
      const { status } = calculateTotalStockAndStatus(
        form.variants,
        form.status
      );
      updatedStatus = status;
    } else {
      // Use manually selected status
      updatedStatus = form.status;
      isManualUpdate = true;
    }

    // Create updated form with appropriate status
    const updatedForm = {
      ...form,
      baseImage: [...form.baseImage, ...imageUrls],
      status: updatedStatus,
      manualStatusUpdate: isManualUpdate,
    };

    // If status was changed automatically, show a notification
    if (updatedStatus !== form.status) {
      if (!isManualUpdate) {
        if (updatedStatus === "Low Stock") {
          toast.info(
            'Product status automatically set to "Low Stock" because stock is below 100 units'
          );
        } else if (
          updatedStatus === "Active" &&
          (form.status === "Low Stock" || form.status === "Out of Stock")
        ) {
          toast.info(
            'Product status automatically set to "Active" because stock is above 100 units'
          );
        }
      } else {
        toast.info(`Product status manually set to "${updatedStatus}"`);
      }
    }

    try {
      const response = await api.put(`/api/products/${productId}`, updatedForm);
      if (response && response.data) {
        toast.success("Product updated successfully!");
        onSave(response.data);
        setPendingImages([]); // Clear pending images after successful update
      } else {
        toast.error("Failed to update product. Please try again.");
      }
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Error updating product. Please try again.");
    }
  };

  // Find if the current category is in the filtered categories
  const currentCategoryInList = categories.some(
    (cat) => cat._id === form.category
  );
  // Try to get the category name from the product object (form.category may be an object or an id)
  let currentCategoryName = "";
  if (typeof form.category === "object" && form.category !== null) {
    currentCategoryName =
      form.category.name?.en ||
      form.category.name ||
      form.category._id ||
      "Current Category (not in your list)";
  } else {
    currentCategoryName = "Current Category (not in your list)";
  }
  const currentCategoryOption =
    !currentCategoryInList && form.category
      ? {
          _id:
            typeof form.category === "object"
              ? form.category._id
              : form.category,
          name: { en: currentCategoryName },
        }
      : null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded shadow-lg w-full max-w-2xl flex items-center justify-center">
          <span>Loading product details...</span>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded shadow-lg w-full max-w-2xl flex items-center justify-center">
          <span className="text-error-500">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-lg w-full max-w-4xl overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Edit Product</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-2xl"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">Name (English)</label>
              <input
                value={form.name.en}
                onChange={(e) => handleChange(e, "name", "en")}
                className="form-input w-full"
                required
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Name (Arabic)</label>
              <input
                value={form.name.ar}
                onChange={(e) => handleChange(e, "name", "ar")}
                className="form-input w-full"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">
                Description (English)
              </label>
              <textarea
                value={form.description.en}
                onChange={(e) => handleChange(e, "description", "en")}
                className="form-input w-full"
                rows="3"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">
                Description (Arabic)
              </label>
              <textarea
                value={form.description.ar}
                onChange={(e) => handleChange(e, "description", "ar")}
                className="form-input w-full"
                rows="3"
              />
            </div>
          </div>

          {/* Category and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">Category</label>
              <select
                name="category"
                value={
                  currentCategoryOption
                    ? currentCategoryOption._id
                    : form.category
                }
                onChange={handleChange}
                className="form-input w-full"
                required
              >
                {currentCategoryOption ? (
                  <option value={currentCategoryOption._id} disabled>
                    {currentCategoryOption.name.en}
                  </option>
                ) : (
                  <option value="">Select a category</option>
                )}
                {categories?.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name?.en || cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">Status</label>
              {/* Calculate total stock once for efficiency */}
              {(() => {
                const totalStock = form.variants.reduce(
                  (sum, variant) => sum + Number(variant.stock),
                  0
                );
                const isLowStock = totalStock <= 100;

                return (
                  <>
                    <select
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                      className={`form-input w-full ${
                        isLowStock
                          ? "border-yellow-400 bg-yellow-50"
                          : totalStock > 100
                          ? "border-green-400 bg-green-50"
                          : ""
                      }`}
                      disabled={isLowStock || totalStock > 100}
                    >
                      {statusOptions.map((option) => (
                        <option key={option.key} value={option.key}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {isLowStock && (
                      <p className="text-xs text-yellow-600 mt-1">
                        Status automatically set to "Low Stock" because total
                        stock is below 100 units
                      </p>
                    )}
                    {totalStock > 100 &&
                      !isLowStock &&
                      form.status !== "Hidden" &&
                      form.status !== "Draft" && (
                        <p className="text-xs text-green-600 mt-1">
                          Status automatically set to "Active" because total
                          stock is above 100 units
                        </p>
                      )}
                  </>
                );
              })()}
            </div>
          </div>

          {/* Product Variants */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block font-medium">Variants</label>
              <button
                type="button"
                onClick={addVariant}
                className="btn btn-secondary btn-sm"
              >
                Add Variant
              </button>
            </div>
            {form.variants.map((variant, index) => (
              <div
                key={index}
                className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-2 p-2 border rounded"
              >
                <input
                  placeholder="Size"
                  value={variant.size}
                  onChange={(e) =>
                    handleVariantChange(index, "size", e.target.value)
                  }
                  className="form-input"
                />
                <input
                  placeholder="Color"
                  value={variant.color}
                  onChange={(e) =>
                    handleVariantChange(index, "color", e.target.value)
                  }
                  className="form-input"
                />
                <input
                  type="number"
                  placeholder="Price"
                  value={variant.price}
                  onChange={(e) =>
                    handleVariantChange(index, "price", e.target.value)
                  }
                  className="form-input"
                />
                <input
                  type="number"
                  placeholder="Stock"
                  value={variant.stock}
                  onChange={(e) =>
                    handleVariantChange(index, "stock", e.target.value)
                  }
                  className="form-input"
                />
                <input
                  placeholder="SKU"
                  value={variant.sku}
                  onChange={(e) =>
                    handleVariantChange(index, "sku", e.target.value)
                  }
                  className="form-input"
                />
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => removeVariant(index)}
                    className="text-red-500 hover:text-red-700"
                    disabled={form.variants.length === 1}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Images */}
          <div>
            <label className="block font-medium mb-1">Product Images</label>
            <div className="flex flex-wrap gap-2">
              {form.baseImage.map((img, idx) => (
                <div key={idx} className="relative">
                  <img
                    src={img}
                    alt="Product"
                    className="w-24 h-24 object-cover rounded"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-0 right-0 bg-white rounded-full p-1 text-red-500 hover:text-red-700"
                  >
                    &times;
                  </button>
                </div>
              ))}
              {pendingImages.map((file, idx) => (
                <div key={`pending-${idx}`} className="relative">
                  <img
                    src={URL.createObjectURL(file)}
                    alt="Pending"
                    className="w-24 h-24 object-cover rounded opacity-70"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setPendingImages((prev) =>
                        prev.filter((_, i) => i !== idx)
                      )
                    }
                    className="absolute top-0 right-0 bg-white rounded-full p-1 text-red-500 hover:text-red-700"
                  >
                    &times;
                  </button>
                </div>
              ))}
              <label className="w-24 h-24 flex items-center justify-center border-2 border-dashed rounded cursor-pointer hover:border-primary-500">
                <span className="text-2xl">+</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Specifications */}
          <div>
            <h3 className="font-medium mb-2">Specifications</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.keys(form.specifications).map((spec) => (
                <div key={spec}>
                  <label className="block text-sm font-medium mb-1 capitalize">
                    {spec}
                  </label>
                  <input
                    value={form.specifications[spec]}
                    onChange={(e) => handleChange(e, "specifications", spec)}
                    className="form-input w-full"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* SEO */}
          <div>
            <h3 className="font-medium mb-2">SEO</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Meta Title
                </label>
                <input
                  value={form.seo.metaTitle}
                  onChange={(e) => handleChange(e, "seo", "metaTitle")}
                  className="form-input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Meta Description
                </label>
                <textarea
                  value={form.seo.metaDescription}
                  onChange={(e) => handleChange(e, "seo", "metaDescription")}
                  className="form-input w-full"
                  rows="2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Keywords (comma-separated)
                </label>
                <input
                  value={form.seo.keywords.join(", ")}
                  onChange={handleKeywordsChange}
                  className="form-input w-full"
                  placeholder="keyword1, keyword2, keyword3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Slug</label>
                <input
                  value={form.seo.slug}
                  onChange={(e) => handleChange(e, "seo", "slug")}
                  className="form-input w-full"
                />
              </div>
            </div>
          </div>

          {/* Tags and Flags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">
                Tags (comma-separated)
              </label>
              <input
                value={form.tags.join(", ")}
                onChange={handleTagsChange}
                className="form-input w-full"
                placeholder="tag1, tag2, tag3"
              />
            </div>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isOnSale"
                  checked={form.isOnSale}
                  onChange={handleChange}
                  className="mr-2"
                />
                On Sale
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="featured"
                  checked={form.featured}
                  onChange={handleChange}
                  className="mr-2"
                />
                Featured
              </label>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProductModal;
