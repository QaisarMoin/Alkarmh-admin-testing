import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { FiSave, FiX, FiChevronLeft, FiImage, FiPlus, FiLoader, FiTrash2 } from 'react-icons/fi'
import PageHeader from '../../components/ui/PageHeader'
import { toast } from 'react-toastify'
import { useAuth } from "../../contexts/AuthContext"
import * as api from '../../utils/api' // Import the api utility

const AddProduct = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const {user: currentUser} = useAuth()

  // console.log(payload);
  const [userData ,setUserData] = useState()
  
  // console.log(JSON.parse(userData._id));
  // console.log(JSON.parse(userData?.managedShops[0]))
  // console.log(JSON.parse(userData?.managedShops[0]?._id))
  
  
  // Product state matching schema
  const [productData, setProductData] = useState({
    name: { en: '', ar: '' },
    description: { en: '', ar: '' },
    baseImage: [],
    category: '',
    shop: '',
    variants: [],
    status: 'Active',
    specifications: {
      weight: '',
      dimensions: { length: '', width: '', height: '' },
      brand: '',
      model: '',
      warranty: '',
      material: '',
      origin: '',
    },
    seo: {
      metaTitle: '',
      metaDescription: '',
      keywords: '',
      slug: ''
    },
    tags: [],
    isOnSale: false,
    featured: false,
  })
  
  // Temporary state for comma-separated image URLs
  const [imageUrls, setImageUrls] = useState('')

  // Options for categories
  const [categories, setCategories] = useState([])
  const [managedShops, setManagedShops] = useState([]);
  useEffect(() => {
    setUserData(localStorage.getItem("user"))
    api.get('/api/categories').then(data => {
      const user = JSON.parse(localStorage.getItem("user"));
      // Filter categories by createdBy matching current user ID
      const userCategories = (data.data || []).filter(category => 
        category.createdBy === user?._id
      );
      setCategories(userCategories);
      
      // Set default shop if user has managedShops
      setManagedShops(user?.managedShops || []);
      if (user?.managedShops && user.managedShops.length > 0) {
        const shop = user.managedShops[0]?._id || user.managedShops[0];
        setProductData(prev => ({
          ...prev,
          shop
        }));
      }
    }).catch(() => setCategories([]));
  }, []);

  // useEffect(()=>{},[])
  
  // Handle form input changes
  const handleChange = (e, path = []) => {
    const { name, value, type, checked } = e.target
    if (path.length) {
      setProductData(prev => {
        let obj = { ...prev }
        let ref = obj
        for (let i = 0; i < path.length - 1; i++) {
          ref = ref[path[i]]
        }
        ref[path[path.length - 1]] = type === 'checkbox' ? checked : value
        return obj
      })
    } else if (name === 'imageUrls') {
      setImageUrls(value)
    } else if (type === 'checkbox') {
      setProductData({ ...productData, [name]: checked })
    } else {
      setProductData({ ...productData, [name]: value })
    }
  }
  
  // Tags
  const [tagInput, setTagInput] = useState('')
  
  const handleTagInputChange = (e) => {
    setTagInput(e.target.value)
  }
  
  const handleTagInputKeyDown = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      if (!productData.tags.includes(tagInput.trim())) {
        setProductData({ ...productData, tags: [...productData.tags, tagInput.trim()] })
      }
      setTagInput('')
    }
  }
  
  const removeTag = (tagToRemove) => {
    setProductData({ ...productData, tags: productData.tags.filter(tag => tag !== tagToRemove) })
  }

  // Variants
  const [variantForm, setVariantForm] = useState({
    name: { en: '', ar: '' },
    description: { en: '', ar: '' },
    price: '',
    originalPrice: '',
    stock: '',
    sku: '',
    attributes: {
      size: '',
      color: '',
      weight: '',
      material: ''
    },
    images: [],
    isDefault: false,
    status: 'Active'
  })
  const addVariant = () => {
    if (!variantForm.name.en || !variantForm.price) {
      toast.error('Variant name and price required')
      return
    }
    setProductData({
      ...productData,
      variants: [
        ...productData.variants,
        {
          ...variantForm,
          price: parseFloat(variantForm.price),
          stock: parseInt(variantForm.stock || '0', 10),
          attributes: {
            ...variantForm.attributes,
            size: variantForm.attributes.size.trim(),
            color: variantForm.attributes.color.trim(),
            weight: variantForm.attributes.weight.trim(),
            material: variantForm.attributes.material.trim()
          },
          images: variantForm.images.map(url => url.trim()).filter(Boolean),
        }
      ]
    })
    setVariantForm({ name: { en: '', ar: '' }, price: '', originalPrice: '', stock: '', sku: '', attributes: { size: '', color: '', weight: '', material: '' }, images: [], isDefault: false, status: 'Active' })
  }
  const removeVariant = (idx) => {
    setProductData({
      ...productData,
      variants: productData.variants.filter((_, i) => i !== idx)
    })
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    if (!productData.shop) {
      toast.error('No shop found for this admin. Cannot add product.');
      setIsLoading(false);
      return;
    }
    // Validation for required fields
    if (!productData.name.en || !productData.description.en || !productData.baseImage.length || !productData.category || !productData.variants.length) {
      toast.error('Please fill in all required fields: English Name, English Description, at least one Image, Category, and at least one Variant.');
      setIsLoading(false);
      return;
    }
    // Prepare payload with correct types and structure
    const payload = {
      name: productData.name,
      description: productData.description,
      baseImage: productData.baseImage,
      category: productData.category,
      shop: productData.shop || undefined,
      variants: productData.variants,
      status: productData.status,
      specifications: {
        ...productData.specifications,
        dimensions: `${productData.specifications.dimensions.length}x${productData.specifications.dimensions.width}x${productData.specifications.dimensions.height}`
      },
      seo: {
        metaTitle: productData.seo.metaTitle,
        metaDescription: productData.seo.metaDescription,
        keywords: productData.seo.keywords ? productData.seo.keywords.split(',').map(k => k.trim()).filter(Boolean) : [],
        slug: productData.seo.slug
      },
      tags: productData.tags,
      isOnSale: productData.isOnSale,
      featured: productData.featured,
      createdBy: currentUser._id
    };
    
    if (!payload.shop) delete payload.shop;
    try {
      await api.post('/api/products', payload);
      toast.success('Product added successfully!');
      navigate('/products');
    } catch (error) {
      console.error('Failed to add product:', error);
      toast.error(error.response?.data?.message || 'Failed to add product. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }
  
  const fileInputRef = useRef(null)
  const [isDragOver, setIsDragOver] = useState(false)

  // Handle file selection and drag-drop
  const handleFiles = files => {
    const fileArr = Array.from(files)
    const readers = fileArr.map(file => {
      return new Promise(resolve => {
        const reader = new FileReader()
        reader.onload = e => resolve(e.target.result)
        reader.readAsDataURL(file)
      })
    })
    Promise.all(readers).then(images => {
      setProductData(prev => ({ ...prev, baseImage: [...prev.baseImage, ...images] }))
    })
  }
  const handleDrop = e => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }
  const handleDragOver = e => {
    e.preventDefault()
    setIsDragOver(true)
  }
  const handleDragLeave = e => {
    e.preventDefault()
    setIsDragOver(false)
  }
  const handleImageClick = () => {
    fileInputRef.current.click()
  }
  const handleFileChange = e => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
  }
  }
  const removeImage = idx => {
    setProductData(prev => ({ ...prev, baseImage: prev.baseImage.filter((_, i) => i !== idx) }))
  }

  // Remove the old variant image input and add drag-and-drop uploader for variant images
  // 1. Add refs and drag state for variant images
  const variantFileInputRef = useRef(null)
  const [variantIsDragOver, setVariantIsDragOver] = useState(false)

  // 2. Handle file selection and drag-drop for variant images
  const handleVariantFiles = files => {
    const fileArr = Array.from(files)
    const readers = fileArr.map(file => {
      return new Promise(resolve => {
        const reader = new FileReader()
        reader.onload = e => resolve(e.target.result)
        reader.readAsDataURL(file)
      })
    })
    Promise.all(readers).then(images => {
      setVariantForm(prev => ({ ...prev, images: [...prev.images, ...images] }))
    })
  }
  const handleVariantDrop = e => {
    e.preventDefault()
    setVariantIsDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleVariantFiles(e.dataTransfer.files)
    }
  }
  const handleVariantDragOver = e => {
    e.preventDefault()
    setVariantIsDragOver(true)
  }
  const handleVariantDragLeave = e => {
    e.preventDefault()
    setVariantIsDragOver(false)
  }
  const handleVariantImageClick = () => {
    variantFileInputRef.current.click()
  }
  const handleVariantFileChange = e => {
    if (e.target.files && e.target.files.length > 0) {
      handleVariantFiles(e.target.files)
    }
  }
  const removeVariantImage = idx => {
    setVariantForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))
  }

  return (
    <div>
      <PageHeader 
        title="Add New Product"
        breadcrumbs={[
          { text: 'Dashboard', link: '/' },
          { text: 'Products', link: '/products' },
          { text: 'Add New' }
        ]}
        actionButton={
          <Link to="/products" className="btn btn-secondary inline-flex items-center">
            <FiChevronLeft className="mr-2 h-5 w-5" />
            Back to Products
          </Link>
        }
      />
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="card">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Product Name (EN) <span className="text-error-500">*</span></label>
                  <input type="text" className="form-input" value={productData.name.en} onChange={e => handleChange(e, ['name', 'en'])} required />
                </div>
                <div>
                  <label className="form-label">Product Name (AR)</label>
                  <input type="text" className="form-input" value={productData.name.ar} onChange={e => handleChange(e, ['name', 'ar'])} />
                </div>
                <div>
                  <label className="form-label">Description (EN)</label>
                  <textarea className="form-input" value={productData.description.en} onChange={e => handleChange(e, ['description', 'en'])} />
                </div>
                <div>
                  <label className="form-label">Description (AR)</label>
                  <textarea className="form-input" value={productData.description.ar} onChange={e => handleChange(e, ['description', 'ar'])} />
                </div>
              </div>
            </div>
            
            {/* Images */}
            <div className="card">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Product Images <span className="text-error-500">*</span></h2>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${isDragOver ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-gray-400'}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleImageClick}
              >
                  <input
                  type="file"
                  accept="image/*"
                  multiple
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  />
                <div className="text-gray-400">
                  <FiImage className="mx-auto h-12 w-12" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-primary-600 hover:text-primary-500">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB each. You can select multiple images.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {productData.baseImage.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <img src={img} alt="preview" className="h-16 w-16 object-cover rounded border" />
                    <button type="button" onClick={() => removeImage(idx)} className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow text-error-500 hover:text-error-700 opacity-0 group-hover:opacity-100 transition-opacity"><FiX /></button>
                  </div>
                      ))}
                  </div>
                </div>
                
            {/* Category & Shop */}
            <div className="card">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Category <span className="text-error-500">*</span></label>
                  <select className="form-input" value={productData.category} onChange={e => handleChange(e)} name="category" required>
                    <option value="">Select Category</option>
                    {Array.isArray(categories) && categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>{cat.name?.en || cat.name}</option>
                    ))}
                  </select>
                </div>
                {/* <div>
                  <label className="form-label">Shop</label>
                  <input type="text" className="form-input" value={productData.shop} onChange={e => handleChange(e)} name="shop" placeholder="Shop ID or name" />
                </div> */}
              </div>
            </div>
            
            {/* Variants */}
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Product Variants</h2>
                <button type="button" onClick={addVariant} className="btn btn-primary text-sm inline-flex items-center">
                  <FiPlus className="h-4 w-4 mr-1" /> Add Variant
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="form-label">Variant Name (EN)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Variant Name in English" 
                    value={variantForm.name.en} 
                    onChange={e => setVariantForm(prev => ({
                      ...prev,
                      name: { ...prev.name, en: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <label className="form-label">Variant Name (AR)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Variant Name in Arabic" 
                    value={variantForm.name.ar} 
                    onChange={e => setVariantForm(prev => ({
                      ...prev,
                      name: { ...prev.name, ar: e.target.value }
                    }))}
                  />
                    </div>
                <div>
                  <label className="form-label">Price</label>
                    <input
                      type="number"
                    className="form-input" 
                    placeholder="Price" 
                    value={variantForm.price} 
                    onChange={e => setVariantForm(prev => ({ ...prev, price: e.target.value }))}
                    />
                  </div>
                <div>
                  <label className="form-label">Original Price</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="Original Price (for discounts)" 
                    value={variantForm.originalPrice} 
                    onChange={e => setVariantForm(prev => ({ ...prev, originalPrice: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="form-label">Stock</label>
                    <input
                      type="number"
                    className="form-input" 
                    placeholder="Stock Quantity" 
                    value={variantForm.stock} 
                    onChange={e => setVariantForm(prev => ({ ...prev, stock: e.target.value }))}
                    />
                  </div>
                <div>
                  <label className="form-label">SKU</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Stock Keeping Unit" 
                    value={variantForm.sku} 
                    onChange={e => setVariantForm(prev => ({ ...prev, sku: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="form-label">Size</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Size" 
                    value={variantForm.attributes.size} 
                    onChange={e => setVariantForm(prev => ({
                      ...prev,
                      attributes: { ...prev.attributes, size: e.target.value }
                    }))}
                  />
                    </div>
                <div>
                  <label className="form-label">Color</label>
                    <input
                    type="text" 
                    className="form-input" 
                    placeholder="Color" 
                    value={variantForm.attributes.color} 
                    onChange={e => setVariantForm(prev => ({
                      ...prev,
                      attributes: { ...prev.attributes, color: e.target.value }
                    }))}
                    />
                  </div>
                <div>
                  <label className="form-label">Weight</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Weight" 
                    value={variantForm.attributes.weight} 
                    onChange={e => setVariantForm(prev => ({
                      ...prev,
                      attributes: { ...prev.attributes, weight: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <label className="form-label">Material</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Material" 
                    value={variantForm.attributes.material} 
                    onChange={e => setVariantForm(prev => ({
                      ...prev,
                      attributes: { ...prev.attributes, material: e.target.value }
                    }))}
                  />
              </div>
                <div className="md:col-span-2">
                  <label className="form-label">Variant Images</label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${variantIsDragOver ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-gray-400'}`}
                    onDragOver={handleVariantDragOver}
                    onDragLeave={handleVariantDragLeave}
                    onDrop={handleVariantDrop}
                    onClick={handleVariantImageClick}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      ref={variantFileInputRef}
                      onChange={handleVariantFileChange}
                      className="hidden"
                    />
                    <div className="text-gray-400">
                      <FiImage className="mx-auto h-8 w-8" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium text-primary-600 hover:text-primary-500">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB each. You can select multiple images.</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {variantForm.images.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img src={img} alt="variant-preview" className="h-12 w-12 object-cover rounded border" />
                        <button type="button" onClick={() => removeVariantImage(idx)} className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow text-error-500 hover:text-error-700 opacity-0 group-hover:opacity-100 transition-opacity"><FiX /></button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={variantForm.isDefault} 
                      onChange={e => setVariantForm(prev => ({ ...prev, isDefault: e.target.checked }))}
                    /> 
                    Default Variant
                  </label>
                  <select
                    className="form-input"
                    value={variantForm.status} 
                    onChange={e => setVariantForm(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="Active">Active</option>
                    <option value="Out of stock">Out of stock</option>
                    <option value="Discontinued">Discontinued</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                {productData.variants.map((variant, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-md p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold">
                        {variant.name.en} ({variant.name.ar})
                        {variant.isDefault && <span className="ml-2 text-xs bg-primary-100 text-primary-800 px-2 py-0.5 rounded-full">Default</span>}
                      </div>
                      <button type="button" className="text-error-500 hover:text-error-700" onClick={() => removeVariant(idx)}><FiTrash2 /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Price: {variant.price}</div>
                      {variant.originalPrice && <div>Original: {variant.originalPrice}</div>}
                      <div>Stock: {variant.stock}</div>
                      <div>SKU: {variant.sku}</div>
                      <div>Status: {variant.status}</div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {Object.entries(variant.attributes)
                        .filter(([_, value]) => value)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(' | ')}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      <strong>Description (EN):</strong> {variant.description?.en || ''}<br />
                      <strong>Description (AR):</strong> {variant.description?.ar || ''}
                    </div>
                    <div className="flex gap-1 mt-2">
                      {variant.images?.map((img, i) => (
                        <img key={i} src={img} alt={`variant-${i}`} className="h-8 w-8 object-cover rounded" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Tags */}
            <div className="card">
              <label className="form-label">Tags</label>
              <div className="flex flex-wrap items-center border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent p-2">
                {productData.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center bg-primary-100 text-primary-800 text-xs font-medium rounded-full px-3 py-1 mr-2 mb-2">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="ml-1 text-primary-600 hover:text-primary-900"><FiX className="h-3 w-3" /></button>
                  </span>
                ))}
                <input type="text" className="flex-1 min-w-[120px] outline-none text-sm p-1" placeholder="Add tags (press Enter)" value={tagInput} onChange={handleTagInputChange} onKeyDown={handleTagInputKeyDown} />
              </div>
              <p className="text-xs text-gray-500 mt-1">Press Enter to add a tag</p>
            </div>
            
            {/* SEO */}
            <div className="card">
              <h2 className="text-lg font-medium text-gray-900 mb-4">SEO</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Meta Title</label>
                  <input type="text" className="form-input" value={productData.seo.metaTitle} onChange={e => handleChange(e, ['seo', 'metaTitle'])} />
                </div>
                <div>
                  <label className="form-label">Slug</label>
                  <input type="text" className="form-input" value={productData.seo.slug} onChange={e => handleChange(e, ['seo', 'slug'])} />
                </div>
                <div className="md:col-span-2">
                  <label className="form-label">Meta Description</label>
                  <textarea className="form-input" value={productData.seo.metaDescription} onChange={e => handleChange(e, ['seo', 'metaDescription'])} />
                </div>
                <div className="md:col-span-2">
                  <label className="form-label">Keywords (comma separated)</label>
                  <input type="text" className="form-input" value={productData.seo.keywords} onChange={e => handleChange(e, ['seo', 'keywords'])} />
                </div>
              </div>
              </div>
              
            {/* Specifications */}
            <div className="card">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Specifications</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                  <label className="form-label">Weight (kg)</label>
                  <input type="number" className="form-input" value={productData.specifications.weight} onChange={e => handleChange(e, ['specifications', 'weight'])} />
                          </div>
                <div>
                  <label className="form-label">Brand</label>
                  <input type="text" className="form-input" value={productData.specifications.brand} onChange={e => handleChange(e, ['specifications', 'brand'])} />
                        </div>
                <div>
                  <label className="form-label">Model</label>
                  <input type="text" className="form-input" value={productData.specifications.model} onChange={e => handleChange(e, ['specifications', 'model'])} />
                      </div>
                <div>
                  <label className="form-label">Warranty</label>
                  <input type="text" className="form-input" value={productData.specifications.warranty} onChange={e => handleChange(e, ['specifications', 'warranty'])} />
                    </div>
                <div>
                  <label className="form-label">Material</label>
                  <input type="text" className="form-input" value={productData.specifications.material} onChange={e => handleChange(e, ['specifications', 'material'])} />
                </div>
                <div>
                  <label className="form-label">Origin</label>
                  <input type="text" className="form-input" value={productData.specifications.origin} onChange={e => handleChange(e, ['specifications', 'origin'])} />
                    </div>
                <div className="md:col-span-2 grid grid-cols-3 gap-2">
                  <div>
                    <label className="form-label text-xs">Length (cm)</label>
                    <input type="number" className="form-input" value={productData.specifications.dimensions.length} onChange={e => handleChange(e, ['specifications', 'dimensions', 'length'])} />
                    </div>
                  <div>
                    <label className="form-label text-xs">Width (cm)</label>
                    <input type="number" className="form-input" value={productData.specifications.dimensions.width} onChange={e => handleChange(e, ['specifications', 'dimensions', 'width'])} />
                  </div>
                  <div>
                    <label className="form-label text-xs">Height (cm)</label>
                    <input type="number" className="form-input" value={productData.specifications.dimensions.height} onChange={e => handleChange(e, ['specifications', 'dimensions', 'height'])} />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Status & Flags */}
            <div className="card">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Status</label>
                  <select className="form-input" value={productData.status} onChange={e => handleChange(e)} name="status">
                    <option value="Active">Active</option>
                    <option value="Hidden">Hidden</option>
                  </select>
                </div>
                <div className="flex items-center gap-4 mt-6">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={productData.isOnSale} onChange={e => handleChange(e, ['isOnSale'])} /> On Sale
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={productData.featured} onChange={e => handleChange(e, ['featured'])} /> Featured
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            <div className="card flex flex-col items-center justify-center">
              <h2 className="text-lg font-medium text-gray-900 mb-2">Image Preview</h2>
              {productData.baseImage && productData.baseImage.length > 0 ? (
                <img
                  src={productData.baseImage[0]}
                  alt="Preview"
                  className="h-40 w-40 object-cover rounded border"
                />
              ) : (
                <div className="h-40 w-40 flex items-center justify-center bg-gray-100 text-gray-400 rounded border">
                  No Image
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2">First image will be used as the main product image.</p>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
        <div className="flex justify-end gap-4 mt-8">
          <button type="submit" className="btn btn-primary px-8 py-2" disabled={isLoading}>
                  {isLoading ? <FiLoader className="animate-spin h-5 w-5 mr-2" /> : <FiSave className="h-5 w-5 mr-2" />}
                  {isLoading ? 'Saving...' : 'Save Product'}
                </button>
          <button type="button" disabled={isLoading} onClick={() => navigate('/products')} className="btn btn-secondary px-8 py-2">Cancel</button>
        </div>
      </form>
    </div>
  )
}

export default AddProduct