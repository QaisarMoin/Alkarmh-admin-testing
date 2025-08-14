import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiShoppingBag,
  FiAlertCircle,
} from "react-icons/fi";
import PageHeader from "../../components/ui/PageHeader";
import SearchFilter from "../../components/ui/SearchFilter";
import EmptyState from "../../components/ui/EmptyState";
import { toast } from "react-toastify";
import * as api from "../../utils/api";
import EditProductModal from "../../components/EditProductModal";
import { useAuth } from "../../contexts/AuthContext";

const ProductList = () => {
  const { user: currentUser } = useAuth();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    category: "",
    price: "",
    status: "Active",
  });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  });
  const [currentPage, setCurrentPage] = useState(1);
  const PRODUCTS_PER_PAGE = 10;

  // Check if user is a worker (read-only access)
  const isWorker = currentUser?.role === "worker";

  // Function to handle status change from dropdown
  const handleStatusChange = async (product, newStatus) => {
    try {
      // Call API to update product status with a flag to indicate manual update
      const response = await api.put(
        `/api/products/${product._id || product.id}`,
        {
          status: newStatus,
          manualStatusUpdate: true, // Flag to prevent automatic status override
        }
      );

      // Check if response is successful - note that the API might return different success indicators
      if (response && (response.success || response.data)) {
        // Create updated product with new status
        const updatedProduct = { ...product, status: newStatus };

        // Update local state
        setProducts((prevProducts) =>
          prevProducts.map((p) =>
            p._id === product._id ||
            p.id === product._id ||
            p._id === product.id ||
            p.id === product.id
              ? updatedProduct
              : p
          )
        );

        setFilteredProducts((prevProducts) =>
          prevProducts.map((p) =>
            p._id === product._id ||
            p.id === product._id ||
            p._id === product.id ||
            p.id === product.id
              ? updatedProduct
              : p
          )
        );

        // Force re-render by updating a state variable
        setCurrentPage(currentPage);

        toast.success(`Product status updated to ${newStatus}`);
      } else {
        toast.error("Failed to update product status");
      }
    } catch (error) {
      console.error("Error updating product status:", error);
      toast.error("Error updating product status");
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get("/api/products");

        if (response && response.success && Array.isArray(response.data)) {
          let filteredProducts = [];

          if (isWorker) {
            // For workers, show products from their assigned shop
            const shopId =
              currentUser?.assignedShop?._id || currentUser?.assignedShop;
            if (shopId) {
              filteredProducts = response.data.filter((product) => {
                return product.shop === shopId || product.shop?._id === shopId;
              });
            }
          } else {
            // For shop admins, show products they created
            const adminId = user?._id || user?.id;
            if (adminId) {
              filteredProducts = response.data.filter((product) => {
                if (!product.createdBy) return false;
                if (typeof product.createdBy === "string") {
                  return product.createdBy === adminId;
                }
                if (
                  typeof product.createdBy === "object" &&
                  product.createdBy._id
                ) {
                  return product.createdBy._id === adminId;
                }
                return false;
              });
            }
          }

          setProducts(filteredProducts);
          setFilteredProducts(filteredProducts);
        } else {
          setProducts([]);
          setFilteredProducts([]);
        }
      } catch (err) {
        console.error("Error fetching products:", err);
        setProducts([]);
        setFilteredProducts([]);
        setError(err);
        toast.error("Failed to fetch products.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, [currentUser, isWorker, user]);

  useEffect(() => {
    if (editingProduct) {
      setEditForm({
        name: editingProduct.name?.en || "",
        category: editingProduct.category || "",
        price: editingProduct.price || "",
        status: editingProduct.status || "Active",
      });
    }
  }, [editingProduct]);

  useEffect(() => {
    // Fetch categories for dropdowns
    api
      .get("/api/categories")
      .then((data) => {
        if (data && data.data) setCategories(data.data);
      })
      .catch(() => setCategories([]));
  }, []);

  // Handle search and filter - Unchanged
  const handleSearch = (query, filters) => {
    let results = [...products];

    // Search by name (product.name.en)
    if (query) {
      const lowerQuery = query.toLowerCase();
      results = results.filter(
        (product) =>
          product.name?.en && product.name.en.toLowerCase().includes(lowerQuery)
      );
    }

    // Apply filters
    if (filters.category) {
      results = results.filter((product) => {
        if (typeof product.category === "object" && product.category !== null) {
          return product.category._id === filters.category;
        }
        return product.category === filters.category;
      });
    }

    if (filters.status) {
      results = results.filter(
        (product) =>
          product.status &&
          product.status.toLowerCase() === filters.status.toLowerCase()
      );
    }

    if (filters.minPrice) {
      results = results.filter((product) => {
        const price =
          product.variants &&
          product.variants[0] &&
          typeof product.variants[0].price !== "undefined"
            ? product.variants[0].price
            : product.price;
        return price >= parseFloat(filters.minPrice);
      });
    }

    if (filters.maxPrice) {
      results = results.filter((product) => {
        const price =
          product.variants &&
          product.variants[0] &&
          typeof product.variants[0].price !== "undefined"
            ? product.variants[0].price
            : product.price;
        return price <= parseFloat(filters.maxPrice);
      });
    }

    setFilteredProducts(results);
  };

  // Handle product deletion
  const handleDeleteProduct = async (productId) => {
    try {
      setIsLoading(true); // Optional: set loading state for individual delete
      await api.del(`/api/products/${productId}`);
      setProducts(products.filter((product) => product.id !== productId));
      setFilteredProducts(
        filteredProducts.filter((product) => product.id !== productId)
      );
      toast.success("Product deleted successfully");
    } catch (err) {
      console.error("Failed to delete product:", err);
      toast.error("Failed to delete product.");
    } finally {
      setIsLoading(false); // Optional: unset loading state
    }
  };

  // Filter configurations
  const filterOptions = [
    {
      name: "category",
      label: "Category",
      type: "select",
      options: categories
        .filter(
          (c) =>
            c.shop === (user?.managedShops?.[0]?._id || user?.managedShops?.[0])
        )
        .map((c) => ({
          value: c._id,
          label: c.name?.en || c.name || c._id || "N/A",
        })),
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "Active", label: "Active" },
        { value: "Out of Stock", label: "Out of Stock" },
        { value: "Low Stock", label: "Low Stock" },
        { value: "Hidden", label: "Hidden" },
        { value: "Draft", label: "Draft" },
      ],
    },
    {
      name: "minPrice",
      label: "Min Price",
      type: "number",
      placeholder: "0.00",
    },
    {
      name: "maxPrice",
      label: "Max Price",
      type: "number",
      placeholder: "1000.00",
    },
  ];

  const handleSaveEdit = (updatedProduct) => {
    // Find the full category object for this product
    const categoryObj = categories.find(
      (cat) =>
        cat._id === updatedProduct.category ||
        cat._id === updatedProduct.category?._id
    );
    // Replace the category field with the full object if found
    const productWithCategory = categoryObj
      ? { ...updatedProduct, category: categoryObj }
      : updatedProduct;
    try {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === updatedProduct.id ||
          p._id === updatedProduct._id ||
          p.id === updatedProduct._id ||
          p._id === updatedProduct.id
            ? productWithCategory
            : p
        )
      );
      setFilteredProducts((prev) =>
        prev.map((p) =>
          p.id === updatedProduct.id ||
          p._id === updatedProduct._id ||
          p.id === updatedProduct._id ||
          p._id === updatedProduct.id
            ? productWithCategory
            : p
        )
      );
      setIsEditModalOpen(false);
      setEditingProduct(null);
    } catch (error) {
      console.error("Error saving product edit:", error);
      alert("Error saving product. Please try again.");
    }
  };

  const handleClearFilters = () => {
    setFilteredProducts(products); // Show all products
    // Optionally, reset any local filter/search state if you have it
  };

  // Calculate paginated products
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  // Reset to first page when filters/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredProducts]);

  return (
    <div>
      <PageHeader
        title="All Products"
        subtitle="Manage your product inventory"
        breadcrumbs={[{ text: "Dashboard", link: "/" }, { text: "Products" }]}
        actionButton={
          !isWorker && (
            <Link
              to="/products/add"
              className="btn btn-primary inline-flex items-center"
            >
              <FiPlus className="mr-2 h-5 w-5" />
              Add Product
            </Link>
          )
        }
      />

      {/* Filters and Search */}
      <div className="card mb-6">
        <SearchFilter
          onSearch={handleSearch}
          onClear={handleClearFilters}
          placeholder="Search products by name..."
          filters={filterOptions}
        />
      </div>

      {/* Products List */}
      <div className="card">
        {isLoading ? (
          // Loading State
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded mb-4"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded mb-2"></div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          // Empty State
          <EmptyState
            title="No products found"
            description="No products found. They will appear here once you add products."
            icon={<FiShoppingBag className="h-8 w-8 text-gray-300" />}
            actionLink="/products/add"
            actionText="Add New Product"
          />
        ) : (
          // Products Table
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">Product</th>
                  {/* <th className="px-4 py-3 text-left">SKU</th> */}
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-right">Price (QAR)</th>
                  <th className="px-4 py-3 text-center">Stock</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  {!isWorker && (
                    <th className="px-4 py-3 text-center">Toggle Stock</th>
                  )}
                  {!isWorker && (
                    <th className="px-4 py-3 text-right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedProducts.map((product) => (
                  <tr
                    key={product.id || product._id}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-md bg-gray-200 flex items-center justify-center text-gray-500">
                          {/* <FiShoppingBag className="h-5 w-5" /> */}
                          {product.baseImage && product.baseImage.length > 0 ? (
                            <img
                              src={product.baseImage[0]}
                              alt={
                                typeof product.name === "object"
                                  ? product.name?.en ||
                                    product.name?.ar ||
                                    "Product"
                                  : product.name || "Product"
                              }
                              className="h-10 w-10 rounded-md object-cover"
                            />
                          ) : (
                            <FiShoppingBag className="h-5 w-5" />
                          )}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            {typeof product.name === "object"
                              ? product.name?.en || product.name?.ar || "N/A"
                              : product.name || "N/A"}
                          </p>
                        </div>
                      </div>
                    </td>
                    {/* <td className="px-4 py-4 text-sm text-gray-500">{product.sku}</td> */}
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {typeof product.category === "object"
                        ? product.category?.name?.en ||
                          product.category?.name ||
                          product.category._id ||
                          "N/A"
                        : product.category || "N/A"}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 text-right font-medium">
                      {product.variants &&
                      product.variants[0] &&
                      typeof product.variants[0].price !== "undefined"
                        ? `${product.variants[0].price}`
                        : "N/A"}
                    </td>
                    <td className="px-4 py-4 text-sm text-center">
                      {product.variants &&
                      product.variants[0] &&
                      typeof product.variants[0].stock === "number" ? (
                        product.variants[0].stock === 0 ? (
                          <span className="text-error-500 flex items-center justify-center">
                            <FiAlertCircle className="h-4 w-4 mr-1" />
                            Out
                          </span>
                        ) : product.variants[0].stock <= 5 ? (
                          <span className="text-orange-500">
                            {product.variants[0].stock}
                          </span>
                        ) : (
                          <span className="text-gray-700">
                            {product.variants[0].stock}
                          </span>
                        )
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <span
                        className={`badge ${
                          product.status === "Active"
                            ? "badge-success"
                            : product.status === "Out of Stock"
                            ? "badge-error"
                            : product.status === "Low Stock"
                            ? "badge-warning"
                            : product.status === "Hidden"
                            ? "badge-info"
                            : product.status === "Draft"
                            ? "badge-info"
                            : // fallback to stock-based logic if status is not set
                            !product.status &&
                              product.variants &&
                              product.variants[0] &&
                              typeof product.variants[0].stock === "number" &&
                              product.variants[0].stock === 0
                            ? "badge-error"
                            : !product.status &&
                              product.variants &&
                              product.variants[0] &&
                              typeof product.variants[0].stock === "number" &&
                              product.variants[0].stock <= 10
                            ? "badge-warning"
                            : !product.status
                            ? "badge-success"
                            : "badge-info"
                        }`}
                      >
                        {product.status
                          ? product.status
                          : product.variants &&
                            product.variants[0] &&
                            typeof product.variants[0].stock === "number" &&
                            product.variants[0].stock === 0
                          ? "Out of Stock"
                          : product.variants &&
                            product.variants[0] &&
                            typeof product.variants[0].stock === "number" &&
                            product.variants[0].stock <= 10
                          ? "Low Stock"
                          : "Active"}
                      </span>
                    </td>
                    {!isWorker && (
                      <td className="px-4 py-4 text-center text-sm font-medium">
                        <select
                          value={`Mark ${product.status || "Active"}`}
                          onChange={(e) =>
                            handleStatusChange(
                              product,
                              e.target.value.replace("Mark ", "")
                            )
                          }
                          className={`form-select py-1 px-2 text-sm rounded border ${
                            product.status === "Active"
                              ? "border-green-300 bg-green-50"
                              : product.status === "Low Stock"
                              ? "border-yellow-300 bg-yellow-50"
                              : product.status === "Out of Stock"
                              ? "border-red-300 bg-red-50"
                              : "border-gray-300 bg-gray-50"
                          } focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500`}
                        >
                          <option value="Mark Active">Mark Active</option>
                          <option value="Mark Low Stock">Mark Low Stock</option>
                          <option value="Mark Out of Stock">
                            Mark Out of Stock
                          </option>
                          <option value="Mark Hidden">Mark Hidden</option>
                          <option value="Mark Draft">Mark Draft</option>
                        </select>
                      </td>
                    )}
                    {!isWorker && (
                      <td className="px-4 py-4 text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => {
                              setEditingProduct(product);
                              setIsEditModalOpen(true);
                            }}
                            className="text-gray-600 hover:text-primary-600 p-1"
                          >
                            <FiEdit2 className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => {
                              setDeletingProduct(product);
                              setIsDeleteModalOpen(true);
                            }}
                            className="text-gray-600 hover:text-error-500 p-1"
                          >
                            <FiTrash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="py-3 px-4 flex items-center justify-between border-t border-gray-200">
              <div className="flex items-center">
                <p className="text-sm text-gray-700">
                  Showing{" "}
                  <span className="font-medium">
                    {filteredProducts.length === 0
                      ? 0
                      : (currentPage - 1) * PRODUCTS_PER_PAGE + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium">
                    {Math.min(
                      currentPage * PRODUCTS_PER_PAGE,
                      filteredProducts.length
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium">{filteredProducts.length}</span>{" "}
                  results
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  className="btn btn-secondary py-1"
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                >
                  Previous
                </button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages || 1}
                </span>
                <button
                  className="btn btn-secondary py-1"
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Render a placeholder modal for editing - Only for non-workers */}
      {!isWorker && isEditModalOpen && editingProduct && (
        <EditProductModal
          productId={editingProduct._id || editingProduct.id}
          categories={categories.filter((cat) => cat.createdBy === user?._id)}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingProduct(null);
          }}
          onSave={handleSaveEdit}
        />
      )}

      {/* Delete Confirmation Modal - Only for non-workers */}
      {!isWorker && isDeleteModalOpen && deletingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <FiAlertCircle className="h-6 w-6 text-error-500" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">
                  Delete Product
                </h3>
              </div>
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-500">
                Are you sure you want to delete{" "}
                <span className="font-medium text-gray-900">
                  {deletingProduct.name?.en || "this product"}
                </span>
                ? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeletingProduct(null);
                }}
                className="btn btn-secondary"
              >
                No, Cancel
              </button>
              <button
                onClick={() => {
                  handleDeleteProduct(deletingProduct._id);
                  setIsDeleteModalOpen(false);
                  setDeletingProduct(null);
                }}
                className="btn btn-danger"
              >
                Yes, Delete it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;
