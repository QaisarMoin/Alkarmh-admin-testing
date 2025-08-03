import PageHeader from '../../components/ui/PageHeader';
import { FiTag, FiEdit2, FiEye, FiEyeOff, FiPlus } from 'react-icons/fi';
import { useState, useEffect, useRef, useMemo } from 'react';
import * as api from '../../utils/api';
import  {useAuth} from "../../contexts/AuthContext"
import EditCategoryModal from '../../components/EditCategoryModal';
import { debounce } from 'lodash';
import { CategoryEventContext } from '../../components/Sidebar';

const Categories = () => {
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(20); // You can make this adjustable if you want
  const [categoryCreatedThisSession, setCategoryCreatedThisSession] = useState(false);
  const categoryEventRef = useRef(0);
  const notifyCategoryCreated = () => {
    categoryEventRef.current++;
    setCategoryEvent(categoryEventRef.current);
    setCategoryCreatedThisSession(true);
  };
  const [categoryEvent, setCategoryEvent] = useState(0);

  const fetchCategories = async (searchValue = search, pageValue = page) => {
    setLoading(true);
    let query = `/api/categories?page=${pageValue}&limit=${limit}`;
    // Optionally add search param if backend supports it
    // if (searchValue) query += `&search=${encodeURIComponent(searchValue)}`;
    try {
      const data = await api.get(query);
      setCategories(data.data || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (error) {
      setCategories([]);
      setTotalPages(1);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line
  }, [page]);

  // Debounced search
  const debouncedSearch = debounce((value) => {
    setPage(1);
    fetchCategories(value, 1);
  }, 400);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    debouncedSearch(e.target.value);
  };

  const {user: currentUser, setUser, refreshUser} = useAuth()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', image: '', description: { en: '', ar: '' } });
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: { en: '', ar: '' },
    description: { en: '', ar: '' },
    image: '',
    shop: '',
    parentCategory: '',
    level: 0,
    sortOrder: 0,
    status: 'Active',
    seo: { metaTitle: '', metaDescription: '', keywords: '' },
    createdBy: '',
  });
  const [isAddDragOver, setIsAddDragOver] = useState(false);
  const [addUploadedImage, setAddUploadedImage] = useState(null);

  const filtered = useMemo(() => {
    if (!Array.isArray(categories)) return [];
    return categories.filter(cat => {
      const name = typeof cat.name === 'string'
        ? cat.name
        : (cat.name?.en || '');
      // Only show categories created by the current user
      const isCreatedByUser = cat.createdBy === currentUser?._id;
      return name.toLowerCase().includes(search.toLowerCase()) && isCreatedByUser;
    });
  }, [categories, search, currentUser?._id]);

  const handleToggleStatus = idx => {
    setCategories(cats =>
      cats.map((cat, i) =>
        i === idx ? { ...cat, status: cat.status === 'Active' ? 'Inactive' : 'Active' } : cat
      )
    );
  };

  const handleEdit = (category, idx) => {
    setEditingCategory({ ...category, index: idx });
    setEditForm({
      name: category.name,
      image: category.image,
      description: category.description || { en: '', ar: '' }
    });
    setUploadedImage(null);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (editingCategory && (typeof editForm.name === 'string' ? editForm.name.trim() : editForm.name?.en?.trim())) {
      setCategories(cats =>
        cats.map((cat, i) =>
          i === editingCategory.index
            ? { ...cat, name: editForm.name, image: editForm.image, description: editForm.description }
            : cat
        )
      );
      setIsEditModalOpen(false);
      setEditingCategory(null);
      setEditForm({ name: '', image: '', description: { en: '', ar: '' } });
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setUploadedImage(e.target.result);
          setEditForm({ ...editForm, image: e.target.result });
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target.result);
        setEditForm({ ...editForm, image: e.target.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddCategory = () => {
    setIsAddModalOpen(true);
    setAddForm({
      name: { en: '', ar: '' },
      description: { en: '', ar: '' },
      image: '',
      shop: currentUser?.managedShops?.[0]?._id || currentUser?.managedShops?.[0] || '',
      parentCategory: '',
      level: 0,
      sortOrder: 0,
      status: 'Active',
      seo: { metaTitle: '', metaDescription: '', keywords: '' },
      createdBy: currentUser?._id || '',
    });
    setAddUploadedImage(null);
  };

  const handleSaveAdd = async () => {
    console.log('addForm:', addForm);
    let shopId = '';
    if (currentUser?.managedShops && currentUser.managedShops.length > 0) {
      shopId = currentUser.managedShops[0]?._id || currentUser.managedShops[0];
    }
    const createdById = currentUser?._id;
    if (addForm.name.en.trim() && shopId && createdById) {
      let keywords = addForm.seo.keywords;
      if (typeof keywords === "string") {
        keywords = keywords
          .split(",")
          .map(k => k.trim())
          .filter(Boolean);
      }
      const newCategory = {
        name: { en: addForm.name.en, ar: addForm.name.ar },
        description: { en: addForm.description.en, ar: addForm.description.ar },
        image: addForm.image || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=facearea&w=256&h=256',
        shop: shopId,
        parentCategory: addForm.parentCategory || undefined,
        level: addForm.level,
        sortOrder: addForm.sortOrder,
        status: addForm.status,
        seo: {
          metaTitle: addForm.seo.metaTitle,
          metaDescription: addForm.seo.metaDescription,
          keywords: keywords,
        },
        createdBy: createdById,
      };
      
      try {
        const response = await api.post('/api/categories', newCategory);
        setCategories([...categories, response.data.data || response.data]);
        notifyCategoryCreated();
        // Update user role to shop_admin immediately after category creation
        if (currentUser?.role !== "shop_admin") {
          setUser(prev => ({
            ...prev,
            role: "shop_admin"
          }));
          localStorage.setItem('user', JSON.stringify({
            ...currentUser,
            role: "shop_admin"
          }));
          if (typeof refreshUser === 'function') {
            refreshUser();
          }
        }
        setIsAddModalOpen(false);
        setAddForm({
          name: { en: '', ar: '' },
          description: { en: '', ar: '' },
          image: '',
          shop: '',
          parentCategory: '',
          level: 0,
          sortOrder: 0,
          status: 'Active',
          seo: { metaTitle: '', metaDescription: '', keywords: '' },
          createdBy: '',
        });
        setAddUploadedImage(null);
      } catch (error) {
        alert(error.response?.data?.message || "Failed to add category. Please try again.");
      }
    } else {
      alert("Please fill in all required fields including Name (EN).");
    }
  };

  const handleAddDragOver = (e) => {
    e.preventDefault();
    setIsAddDragOver(true);
  };

  const handleAddDragLeave = (e) => {
    e.preventDefault();
    setIsAddDragOver(false);
  };

  const handleAddDrop = (e) => {
    e.preventDefault();
    setIsAddDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setAddUploadedImage(e.target.result);
          setAddForm({ ...addForm, image: e.target.result });
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleAddFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAddUploadedImage(e.target.result);
        setAddForm({ ...addForm, image: e.target.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddFormChange = (e, path = []) => {
    const { name, value } = e.target;
    if (path.length) {
      setAddForm(prev => {
        let obj = { ...prev };
        let ref = obj;
        for (let i = 0; i < path.length - 1; i++) {
          ref = ref[path[i]];
        }
        ref[path[path.length - 1]] = value;
        return obj;
      });
    } else {
      setAddForm(prev => ({ ...prev, [name]: value }));
    }
  };

  return (
    <CategoryEventContext.Provider value={{ categoryEvent, notifyCategoryCreated, categoryCreatedThisSession }}>
      <div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-2 md:gap-0">
          <h1 className="text-2xl font-bold">Category Management</h1>
          <button 
            className="btn btn-primary flex items-center w-full md:w-auto"
            onClick={handleAddCategory}
          >
            <FiPlus className="mr-2" /> Add Category
          </button>
        </div>
        <div className="card mb-4 flex flex-col md:flex-row md:items-center md:justify-between p-4 gap-2 md:gap-0">
          <input
            type="text"
            className="form-input w-full md:w-1/3"
            placeholder="Search categories..."
            value={search}
            onChange={handleSearchChange}
            disabled={loading}
          />
          {!loading && <span className="mt-2 md:mt-0 text-gray-500 text-sm md:text-base">{total} categories found</span>}
        </div>
        <div className="card min-h-[350px] shadow border border-gray-100 overflow-x-auto">
          {loading ? (
            <div className="space-y-6 p-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 rounded w-full animate-pulse" />
              ))}
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 whitespace-nowrap">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">Description (EN)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">Description (AR)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {Array.isArray(filtered) && filtered.map((cat, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 align-middle">
                      <img src={cat.image || '/default-image.png'} alt={cat.name?.en || cat.name || 'Category'} className="h-12 w-12 rounded object-cover border" />
                    </td>
                    <td className="px-6 py-4 align-middle font-bold text-gray-900 text-base">{cat.name?.en || cat.name}</td>
                    <td className="px-6 py-4 align-middle max-w-[200px] min-w-[200px] w-24">
                      <div className="relative group">
                        <span className="block truncate line-clamp-2 cursor-pointer" title={cat.description?.en || ''}>{cat.description?.en || ''}</span>
                        {cat.description?.en && (
                          <div className="absolute left-1/2 z-20 hidden group-hover:block bg-white shadow-lg rounded p-4 min-w-[250px] max-w-xs -translate-x-1/2 top-8 border">
                            <div className="text-sm text-gray-800 whitespace-pre-line">{cat.description.en}</div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 align-middle max-w-[200px] min-w-[200px] w-24">
                      <div className="relative group">
                        <span className="block truncate line-clamp-2 cursor-pointer" title={cat.description?.ar || ''}>{cat.description?.ar || ''}</span>
                        {cat.description?.ar && (
                          <div className="absolute left-1/2 z-20 hidden group-hover:block bg-white shadow-lg rounded p-4 min-w-[250px] max-w-xs -translate-x-1/2 top-8 border">
                            <div className="text-sm text-gray-800 whitespace-pre-line">{cat.description.ar}</div>
                          </div>
                        )}
                      </div>
                  </td>
                    <td className="px-6 py-4 align-middle">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${cat.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{cat.status}</span>
                  </td>
                    <td className="px-6 py-4 align-middle text-center">
                      <div className="flex flex-row items-center justify-center gap-2">
                    <button 
                          className="btn btn-secondary btn-sm inline-flex items-center shadow-sm hover:shadow-md transition"
                      onClick={() => handleEdit(cat, idx)}
                          title="Edit"
                    >
                      <FiEdit2 className="mr-1" />Edit
                    </button>
                      </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>

        {/* Edit Category Modal */}
        {isEditModalOpen && editingCategory && (
          <EditCategoryModal
            categoryId={editingCategory._id}
            onClose={() => {
                    setIsEditModalOpen(false); 
                    setEditingCategory(null); 
            }}
            onSave={(updatedCategory) => {
              setCategories((prev) =>
                prev.map((cat) =>
                  cat._id === updatedCategory._id ? updatedCategory : cat
                )
              );
                    setIsEditModalOpen(false); 
                    setEditingCategory(null); 
            }}
          />
        )}

        {/* Add Category Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-lg mx-4 p-4 sm:p-8 relative max-h-[90vh] overflow-y-auto">
              <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={() => setIsAddModalOpen(false)}>&times;</button>
              <h2 className="text-xl font-bold mb-4">Add Category</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name (EN)</label>
                  <input type="text" className="form-input w-full" value={addForm.name.en} onChange={e => handleAddFormChange(e, ['name', 'en'])} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Name (AR)</label>
                  <input type="text" className="form-input w-full" value={addForm.name.ar} onChange={e => handleAddFormChange(e, ['name', 'ar'])} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description (EN)</label>
                  <textarea className="form-input w-full" value={addForm.description.en} onChange={e => handleAddFormChange(e, ['description', 'en'])} />
              </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description (AR)</label>
                  <textarea className="form-input w-full" value={addForm.description.ar} onChange={e => handleAddFormChange(e, ['description', 'ar'])} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Image</label>
                  <input type="file" accept="image/*" onChange={handleAddFileSelect} />
                  {addUploadedImage && <img src={addUploadedImage} alt="Preview" className="h-20 mt-2 rounded" />}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Parent Category</label>
                  <select className="form-input w-full" value={addForm.parentCategory} onChange={e => handleAddFormChange(e, ['parentCategory'])}>
                    <option value="">None</option>
                    {Array.isArray(categories) && categories
                      .filter(cat => cat.shop === addForm.shop)
                      .map((cat, idx) => (
                        <option key={cat._id || idx} value={cat._id || cat.name}>{cat.name?.en || cat.name}</option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Level</label>
                  <input type="number" className="form-input w-full" value={addForm.level} onChange={e => handleAddFormChange(e, ['level'])} min={0} />
                      </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Sort Order</label>
                  <input type="number" className="form-input w-full" value={addForm.sortOrder} onChange={e => handleAddFormChange(e, ['sortOrder'])} min={0} />
                        </div>
                        <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select className="form-input w-full" value={addForm.status} onChange={e => handleAddFormChange(e, ['status'])}>
                    <option value="Active">Active</option>
                    <option value="Hidden">Hidden</option>
                  </select>
                        </div>
                <div className="md:col-span-2 border-t pt-4 mt-2">
                  <h3 className="font-semibold mb-2">SEO</h3>
                  <label className="block text-xs font-medium mb-1">Meta Title</label>
                  <input type="text" className="form-input w-full mb-2" value={addForm.seo.metaTitle} onChange={e => handleAddFormChange(e, ['seo', 'metaTitle'])} />
                  <label className="block text-xs font-medium mb-1">Meta Description</label>
                  <textarea className="form-input w-full mb-2" value={addForm.seo.metaDescription} onChange={e => handleAddFormChange(e, ['seo', 'metaDescription'])} />
                  <label className="block text-xs font-medium mb-1">Keywords (comma separated)</label>
                  <input type="text" className="form-input w-full" value={addForm.seo.keywords} onChange={e => handleAddFormChange(e, ['seo', 'keywords'])} />
                </div>
              </div>
              <div className="flex justify-end mt-6 gap-2">
                <button className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSaveAdd}>Save Category</button>
              </div>
            </div>
          </div>
        )}

        {/* Pagination Controls */}
        <div className="flex justify-between items-center mt-4">
          <button
            className="btn btn-secondary"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          <span>Page {page} of {totalPages}</span>
          <button
            className="btn btn-secondary"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </CategoryEventContext.Provider>
  );
};

export default Categories; 