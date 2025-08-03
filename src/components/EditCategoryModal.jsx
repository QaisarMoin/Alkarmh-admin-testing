import React, { useState, useEffect } from 'react';
import * as api from '../utils/api';
import { toast } from 'react-toastify';

const EditCategoryModal = ({ categoryId, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: { en: '', ar: '' },
    description: { en: '', ar: '' },
    image: '',
    status: 'Active',
    seo: { metaTitle: '', metaDescription: '', keywords: '' },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingImage, setPendingImage] = useState(null);

  useEffect(() => {
    if (!categoryId) return;
    setLoading(true);
    setError(null);
    api.get(`/api/categories/${categoryId}`)
      .then((data) => {
        if (data && data.data) {
          setForm({
            name: data.data.name || { en: '', ar: '' },
            description: data.data.description || { en: '', ar: '' },
            image: data.data.image || '',
            status: data.data.status || 'Active',
            seo: data.data.seo || { metaTitle: '', metaDescription: '', keywords: '' },
          });
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch category details.');
        setLoading(false);
      });
  }, [categoryId]);

  const handleChange = (e, path = []) => {
    const { name, value } = e.target;
    if (path.length) {
      setForm(prev => {
        let obj = { ...prev };
        let ref = obj;
        for (let i = 0; i < path.length - 1; i++) {
          ref = ref[path[i]];
        }
        ref[path[path.length - 1]] = value;
        return obj;
      });
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPendingImage(file);
      toast.info('Image will be uploaded when you save changes.');
    }
  };

  const handleRemoveImage = () => {
    setForm(prev => ({ ...prev, image: '' }));
    setPendingImage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.en.trim()) {
      toast.error('Please enter a category name in English');
      return;
    }
    let imageUrl = form.image;
    if (pendingImage) {
      try {
        toast.info('Uploading image...');
        const formData = new FormData();
        formData.append('file', pendingImage);
        const response = await api.post('/api/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (response && response.url) {
          imageUrl = response.url;
          toast.success('Image uploaded!');
        } else {
          toast.error('Failed to upload image.');
          return;
        }
      } catch (err) {
        toast.error('Image upload failed.');
        return;
      }
    }
    const updatedForm = { ...form, image: imageUrl };
    try {
      const response = await api.put(`/api/categories/${categoryId}`, updatedForm);
      if (response && response.data) {
        toast.success('Category updated successfully!');
        onSave(response.data);
        setPendingImage(null);
      } else {
        toast.error('Failed to update category. Please try again.');
      }
    } catch (error) {
      toast.error('Error updating category. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded shadow-lg w-full max-w-xl flex items-center justify-center">
          <span>Loading category details...</span>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded shadow-lg w-full max-w-xl flex items-center justify-center">
          <span className="text-error-500">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded shadow-lg w-full max-w-3xl overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Edit Category</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Main Info */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-medium mb-1">Name (English)</label>
                <input type="text" className="form-input w-full" placeholder="Enter category name in English" value={form.name.en} onChange={e => handleChange(e, ['name', 'en'])} required />
              </div>
              <div>
                <label className="block font-medium mb-1">Name (Arabic)</label>
                <input type="text" className="form-input w-full" placeholder="Enter category name in Arabic" value={form.name.ar} onChange={e => handleChange(e, ['name', 'ar'])} />
              </div>
              <div>
                <label className="block font-medium mb-1">Description (English)</label>
                <textarea className="form-input w-full" placeholder="Enter description in English" value={form.description.en} onChange={e => handleChange(e, ['description', 'en'])} rows="3" />
              </div>
              <div className="flex flex-col items-start md:items-center">
                <label className="block font-medium mb-1">Description (Arabic)</label>
                <textarea className="form-input w-full max-w-xs" placeholder="Enter description in Arabic" value={form.description.ar} onChange={e => handleChange(e, ['description', 'ar'])} rows="3" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center mb-6">
              <div>
                <label className="block font-medium mb-1">Category Image</label>
                <div className="flex items-center gap-6 mt-2 min-h-[96px]">
                  {(form.image || pendingImage) && (
                    <div className="relative w-24 h-24 flex-shrink-0">
                      <img src={pendingImage ? URL.createObjectURL(pendingImage) : form.image} alt="Category" className="w-24 h-24 object-cover rounded border bg-white" />
                      <button type="button" onClick={handleRemoveImage} className="absolute -top-2 -right-2 bg-white rounded-full p-1 text-red-500 hover:text-red-700 shadow-md border">&times;</button>
                    </div>
                  )}
                  <label className="cursor-pointer flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed rounded bg-gray-50 hover:border-primary-500 hover:bg-gray-100 transition-all duration-150 flex-shrink-0">
                    <span className="text-3xl text-gray-400 flex items-center justify-center h-full">+</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
              </div>
              <div className="flex flex-col justify-center h-full">
                <label className="block font-medium mb-1">Status</label>
                <select className="form-input w-full" value={form.status} name="status" onChange={handleChange}>
                  <option value="Active">Active</option>
                  <option value="Hidden">Hidden</option>
                </select>
              </div>
            </div>
          </div>
          <hr className="my-4" />
          {/* SEO Section */}
          <div>
            <h3 className="font-semibold mb-4">SEO</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-medium mb-1">Meta Title</label>
                <input type="text" className="form-input w-full mb-2" placeholder="Meta title" value={form.seo.metaTitle} onChange={e => handleChange(e, ['seo', 'metaTitle'])} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Keywords (comma separated)</label>
                <input type="text" className="form-input w-full mb-2" placeholder="e.g. organic, healthy, food" value={form.seo.keywords} onChange={e => handleChange(e, ['seo', 'keywords'])} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium mb-1">Meta Description</label>
                <textarea className="form-input w-full mb-2" placeholder="Meta description" value={form.seo.metaDescription} onChange={e => handleChange(e, ['seo', 'metaDescription'])} />
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-8 gap-3">
            <button className="btn btn-secondary" type="button" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" type="submit">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCategoryModal; 