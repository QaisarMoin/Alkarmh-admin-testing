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
    name: { en: "", ar: "" },
    description: { en: "", ar: "" },
    baseImage: [],
    category: "",
    shop: "",
    variants: [
      {
        name: { en: "", ar: "" },
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

  // === Helper: calculate stock & status ===
  const calculateTotalStockAndStatus = (variants, currentStatus) => {
    const totalStock = variants.reduce(
      (sum, variant) => sum + Number(variant.stock),
      0
    );
    let newStatus;

    if (totalStock <= 100) {
      newStatus = "Low Stock";
    } else {
      newStatus =
        currentStatus === "Hidden" || currentStatus === "Draft"
          ? currentStatus
          : "Active";
    }

    return { totalStock, status: newStatus };
  };

  // === Fetch product details ===
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
            variants:
              data.data.variants?.map((v) => ({
                name: v.name || { en: "", ar: "" },
                price: v.price || 0,
                stock: v.stock || 0,
                sku: v.sku || "",
                barcode: v.barcode || "",
              })) || [
                {
                  name: { en: "", ar: "" },
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
      .catch(() => {
        setError("Failed to fetch product details.");
        setLoading(false);
      });
  }, [productId]);

  // === Handlers ===
  const handleChange = (e, section, subsection) => {
    const { name, value, type, checked } = e.target;

    if (section) {
      if (subsection) {
        setForm((prev) => ({
          ...prev,
          [section]: { ...prev[section], [subsection]: value },
        }));
      } else {
        setForm((prev) => ({
          ...prev,
          [section]: { ...prev[section], [name]: value },
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
      const updatedVariants = prev.variants.map((variant, i) => {
        if (i !== index) return variant;

        if (field.startsWith("name.")) {
          const lang = field.split(".")[1];
          return { ...variant, name: { ...variant.name, [lang]: value } };
        }

        return { ...variant, [field]: value };
      });

      if (field === "stock") {
        const { status } = calculateTotalStockAndStatus(
          updatedVariants,
          prev.status
        );
        return { ...prev, variants: updatedVariants, status };
      }

      return { ...prev, variants: updatedVariants };
    });
  };

  const addVariant = () => {
    setForm((prev) => {
      const newVariant = {
        name: { en: "", ar: "" },
        price: 0,
        stock: 0,
        sku: "",
        barcode: "",
      };
      const updatedVariants = [...prev.variants, newVariant];
      const { status } = calculateTotalStockAndStatus(
        updatedVariants,
        prev.status
      );
      return { ...prev, variants: updatedVariants, status };
    });
  };

  const removeVariant = (index) => {
    if (form.variants.length > 1) {
      setForm((prev) => {
        const updatedVariants = prev.variants.filter((_, i) => i !== index);
        const { status } = calculateTotalStockAndStatus(
          updatedVariants,
          prev.status
        );
        return { ...prev, variants: updatedVariants, status };
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
    setForm((prev) => ({ ...prev, seo: { ...prev.seo, keywords } }));
  };

  // === Submit ===
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
      } catch {
        toast.error("Image upload failed.");
        return;
      }
    }

    const { status: updatedStatus } = calculateTotalStockAndStatus(
      form.variants,
      form.status
    );

    const updatedForm = {
      ...form,
      baseImage: [...form.baseImage, ...imageUrls],
      status: updatedStatus,
    };

    try {
      const response = await api.put(`/api/products/${productId}`, updatedForm);
      if (response && response.data) {
        toast.success("Product updated successfully!");
        onSave(response.data);
        setPendingImages([]);
      } else {
        toast.error("Failed to update product. Please try again.");
      }
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Error updating product. Please try again.");
    }
  };

  // === Category helper ===
  const currentCategoryInList = categories.some(
    (cat) => cat._id === form.category
  );
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
          {/* Basic Info */}
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
          </div>

          {/* Category + Status */}
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
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="form-input w-full"
              >
                {statusOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Variants */}
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
                  placeholder="Variant Name (English)"
                  value={variant.name.en}
                  onChange={(e) =>
                    handleVariantChange(index, "name.en", e.target.value)
                  }
                  className="form-input"
                />
                <input
                  placeholder="Variant Name (Arabic)"
                  value={variant.name.ar}
                  onChange={(e) =>
                    handleVariantChange(index, "name.ar", e.target.value)
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

          {/* Specs */}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-1">Meta Title</label>
                <input
                  value={form.seo.metaTitle}
                  onChange={(e) => handleChange(e, "seo", "metaTitle")}
                  className="form-input w-full"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Meta Description</label>
                <input
                  value={form.seo.metaDescription}
                  onChange={(e) => handleChange(e, "seo", "metaDescription")}
                  className="form-input w-full"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Keywords</label>
                <input
                  value={form.seo.keywords.join(", ")}
                  onChange={handleKeywordsChange}
                  className="form-input w-full"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Slug</label>
                <input
                  value={form.seo.slug}
                  onChange={(e) => handleChange(e, "seo", "slug")}
                  className="form-input w-full"
                />
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block font-medium mb-1">Tags (comma-separated)</label>
            <input
              value={form.tags.join(", ")}
              onChange={handleTagsChange}
              className="form-input w-full"
            />
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isOnSale"
                name="isOnSale"
                checked={form.isOnSale}
                onChange={handleChange}
              />
              <label htmlFor="isOnSale">On Sale</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="featured"
                name="featured"
                checked={form.featured}
                onChange={handleChange}
              />
              <label htmlFor="featured">Featured</label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
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
