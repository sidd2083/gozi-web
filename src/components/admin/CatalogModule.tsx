'use client';

import React, { useState, useEffect } from 'react';
import {
  Grid3X3,
  Package,
  Plus,
  Edit2,
  Search,
  X,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  Star,
} from 'lucide-react';
import {
  collection,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  increment,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Category, Product, DepartmentName } from '@/types';

const DEPARTMENTS: DepartmentName[] = [
  'Grocery & Kitchen',
  'Snacks & Drinks',
  'Beverages & Smokes',
  'Late Night Craving Combo',
  'Beauty & Personal Care',
];

/* ------------------------------------------------------------------ */
/*  Category Form Modal                                                */
/* ------------------------------------------------------------------ */

interface CategoryFormData {
  name: string;
  imageUrl: string;
  department: DepartmentName;
  priorityOrder: number;
  isActive: boolean;
}

interface CategoryModalProps {
  category?: Category | null;
  onClose: () => void;
}

const CategoryModal: React.FC<CategoryModalProps> = ({ category, onClose }) => {
  const isEdit = !!category;
  const [form, setForm] = useState<CategoryFormData>(
    category
      ? {
          name: category.name,
          imageUrl: category.imageUrl,
          department: category.department,
          priorityOrder: category.priorityOrder,
          isActive: category.isActive,
        }
      : {
          name: '',
          imageUrl: '',
          department: 'Grocery & Kitchen',
          priorityOrder: 0,
          isActive: true,
        }
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const now = new Date().toISOString();
    try {
      if (isEdit && category) {
        await updateDoc(doc(db, 'categories', category.id), {
          name: form.name.trim(),
          imageUrl: form.imageUrl.trim(),
          department: form.department,
          priorityOrder: Number(form.priorityOrder),
          isActive: form.isActive,
        });
      } else {
        await addDoc(collection(db, 'categories'), {
          name: form.name.trim(),
          imageUrl: form.imageUrl.trim(),
          department: form.department,
          priorityOrder: Number(form.priorityOrder),
          isActive: form.isActive,
        });
      }
      // Bump catalog version
      await updateDoc(doc(db, 'settings', 'appConfig'), {
        catalogVersion: increment(1),
      });
      onClose();
    } catch (e) {
      console.error('Error saving category:', e);
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">
            {isEdit ? 'Edit Category' : 'Add Category'}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition">
            <X size={18} className="text-gray-500" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Category Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              placeholder="e.g. Rice, Daal, Tea & Coffee"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Image URL</label>
            <input
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Department</label>
            <select
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value as DepartmentName })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Sort Order</label>
              <input
                type="number"
                value={form.priorityOrder}
                onChange={(e) => setForm({ ...form, priorityOrder: Number(e.target.value) })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                Active
              </label>
            </div>
          </div>
        </div>
        <div className="p-5 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.name.trim()}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : isEdit ? 'Update' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Product Form Modal                                                 */
/* ------------------------------------------------------------------ */

interface ProductFormData {
  name: string;
  description: string;
  categoryId: string;
  department: DepartmentName;
  unit: string;
  mrp: number;
  sellingPrice: number;
  discountPercent: number;
  images: string;
  inStock: boolean;
  isHidden: boolean;
  isTrending: boolean;
  isCombo: boolean;
}

interface ProductModalProps {
  product?: Product | null;
  categories: Category[];
  onClose: () => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ product, categories, onClose }) => {
  const isEdit = !!product;
  const [form, setForm] = useState<ProductFormData>(
    product
      ? {
          name: product.name,
          description: product.description,
          categoryId: product.categoryId,
          department: product.department,
          unit: product.unit,
          mrp: product.mrp,
          sellingPrice: product.sellingPrice,
          discountPercent: product.discountPercent,
          images: product.images.join(', '),
          inStock: product.inStock,
          isHidden: product.isHidden,
          isTrending: product.isTrending,
          isCombo: product.isCombo || false,
        }
      : {
          name: '',
          description: '',
          categoryId: categories[0]?.id || '',
          department: categories[0]?.department || 'Grocery & Kitchen',
          unit: '1 kg',
          mrp: 0,
          sellingPrice: 0,
          discountPercent: 0,
          images: '',
          inStock: true,
          isHidden: false,
          isTrending: false,
          isCombo: false,
        }
  );
  const [saving, setSaving] = useState(false);

  // Auto-set department when category changes
  const handleCategoryChange = (catId: string) => {
    const cat = categories.find((c) => c.id === catId);
    setForm({
      ...form,
      categoryId: catId,
      department: cat?.department || form.department,
    });
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.categoryId) return;
    setSaving(true);
    const now = new Date().toISOString();
    const imagesList = form.images
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      if (isEdit && product) {
        await updateDoc(doc(db, 'products', product.id), {
          name: form.name.trim(),
          description: form.description.trim(),
          categoryId: form.categoryId,
          department: form.department,
          unit: form.unit.trim(),
          mrp: Number(form.mrp),
          sellingPrice: Number(form.sellingPrice),
          discountPercent: Number(form.discountPercent),
          images: imagesList,
          inStock: form.inStock,
          isHidden: form.isHidden,
          isTrending: form.isTrending,
          isCombo: form.isCombo,
          updatedAt: now,
        });
      } else {
        await addDoc(collection(db, 'products'), {
          name: form.name.trim(),
          description: form.description.trim(),
          categoryId: form.categoryId,
          department: form.department,
          unit: form.unit.trim(),
          mrp: Number(form.mrp),
          sellingPrice: Number(form.sellingPrice),
          discountPercent: Number(form.discountPercent),
          images: imagesList,
          inStock: form.inStock,
          isHidden: form.isHidden,
          isTrending: form.isTrending,
          isCombo: form.isCombo,
          createdAt: now,
          updatedAt: now,
        });
      }
      await updateDoc(doc(db, 'settings', 'appConfig'), {
        catalogVersion: increment(1),
      });
      onClose();
    } catch (e) {
      console.error('Error saving product:', e);
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h3 className="text-base font-bold text-gray-900">
            {isEdit ? 'Edit Product' : 'Add Product'}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition">
            <X size={18} className="text-gray-500" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Product Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none h-20"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Category</label>
              <select
                value={form.categoryId}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.department})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Unit</label>
              <input
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                placeholder="1 kg, 500 ml, 1 pc"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">MRP (Rs)</label>
              <input
                type="number"
                value={form.mrp}
                onChange={(e) => setForm({ ...form, mrp: Number(e.target.value) })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Selling (Rs)</label>
              <input
                type="number"
                value={form.sellingPrice}
                onChange={(e) => setForm({ ...form, sellingPrice: Number(e.target.value) })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Discount %</label>
              <input
                type="number"
                value={form.discountPercent}
                onChange={(e) => setForm({ ...form, discountPercent: Number(e.target.value) })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">
              Image URLs (comma-separated)
            </label>
            <input
              value={form.images}
              onChange={(e) => setForm({ ...form, images: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              placeholder="https://img1.jpg, https://img2.jpg"
            />
          </div>
          <div className="flex flex-wrap gap-4">
            {[
              { key: 'inStock', label: 'In Stock' },
              { key: 'isTrending', label: 'Trending' },
              { key: 'isCombo', label: 'Combo' },
              { key: 'isHidden', label: 'Hidden' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(form as any)[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                {label}
              </label>
            ))}
          </div>
        </div>
        <div className="p-5 border-t border-gray-100 flex gap-3 sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.name.trim()}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : isEdit ? 'Update' : 'Add Product'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Catalog Module (Tabs: Categories | Products)                       */
/* ------------------------------------------------------------------ */

export const CatalogModule: React.FC = () => {
  const [tab, setTab] = useState<'categories' | 'products'>('categories');
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState<DepartmentName | 'all'>('all');
  const [filterStock, setFilterStock] = useState<'all' | 'in' | 'out'>('all');

  // Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  // Live listeners
  useEffect(() => {
    const unsubCat = onSnapshot(collection(db, 'categories'), (snap) => {
      const cats = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Category[];
      cats.sort((a, b) => (a.priorityOrder || 0) - (b.priorityOrder || 0));
      setCategories(cats);
    });
    const unsubProd = onSnapshot(collection(db, 'products'), (snap) => {
      const prods = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Product[];
      prods.sort((a, b) => a.name.localeCompare(b.name));
      setProducts(prods);
    });
    return () => {
      unsubCat();
      unsubProd();
    };
  }, []);

  // Toggle product stock quickly
  const toggleStock = async (product: Product) => {
    await updateDoc(doc(db, 'products', product.id), {
      inStock: !product.inStock,
      updatedAt: new Date().toISOString(),
    });
    await updateDoc(doc(db, 'settings', 'appConfig'), {
      catalogVersion: increment(1),
    });
  };

  // Filtered products
  const filteredProducts = products.filter((p) => {
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterDept !== 'all' && p.department !== filterDept) return false;
    if (filterStock === 'in' && !p.inStock) return false;
    if (filterStock === 'out' && p.inStock) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Catalog Manager</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setTab('categories')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              tab === 'categories'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Grid3X3 size={14} className="inline mr-1" />
            Categories
          </button>
          <button
            onClick={() => setTab('products')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              tab === 'products'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Package size={14} className="inline mr-1" />
            Products ({products.length})
          </button>
        </div>
      </div>

      {/* ==================== CATEGORIES TAB ==================== */}
      {tab === 'categories' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setEditCategory(null);
                setShowCategoryModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition"
            >
              <Plus size={14} /> Add Category
            </button>
          </div>

          {DEPARTMENTS.map((dept) => {
            const deptCats = categories.filter((c) => c.department === dept);
            if (deptCats.length === 0) return null;
            return (
              <div key={dept} className="space-y-2">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">{dept}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  {deptCats.map((cat) => (
                    <div
                      key={cat.id}
                      className={`border rounded-xl p-3 flex items-center gap-3 transition cursor-pointer hover:border-emerald-300 ${
                        cat.isActive ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-50'
                      }`}
                      onClick={() => {
                        setEditCategory(cat);
                        setShowCategoryModal(true);
                      }}
                    >
                      {cat.imageUrl && (
                        <img
                          src={cat.imageUrl}
                          alt={cat.name}
                          className="w-10 h-10 rounded-lg object-cover shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-900 truncate">{cat.name}</p>
                        <p className="text-[10px] text-gray-400">#{cat.priorityOrder}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {categories.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Grid3X3 size={36} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">No categories yet</p>
            </div>
          )}
        </div>
      )}

      {/* ==================== PRODUCTS TAB ==================== */}
      {tab === 'products' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value as DepartmentName | 'all')}
              className="px-3 py-2.5 border border-gray-200 rounded-xl text-xs font-medium bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="all">All Departments</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <select
              value={filterStock}
              onChange={(e) => setFilterStock(e.target.value as 'all' | 'in' | 'out')}
              className="px-3 py-2.5 border border-gray-200 rounded-xl text-xs font-medium bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="all">All Stock</option>
              <option value="in">In Stock</option>
              <option value="out">Out of Stock</option>
            </select>
            <button
              onClick={() => {
                setEditProduct(null);
                setShowProductModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition"
            >
              <Plus size={14} /> Add Product
            </button>
          </div>

          {/* Product Table */}
          <div className="border border-gray-200 rounded-2xl overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Product</th>
                  <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">Category</th>
                  <th className="text-right px-4 py-3 font-semibold">Price</th>
                  <th className="text-center px-4 py-3 font-semibold">Stock</th>
                  <th className="text-center px-4 py-3 font-semibold">Flags</th>
                  <th className="text-center px-4 py-3 font-semibold w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredProducts.map((p) => {
                  const cat = categories.find((c) => c.id === p.categoryId);
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {p.images[0] && (
                            <img
                              src={p.images[0]}
                              alt={p.name}
                              className="w-8 h-8 rounded-lg object-cover shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{p.name}</p>
                            <p className="text-gray-400 truncate">{p.unit}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{cat?.name || '-'}</td>
                      <td className="px-4 py-3 text-right">
                        {p.mrp > p.sellingPrice ? (
                          <div>
                            <span className="text-gray-400 line-through">Rs.{p.mrp}</span>{' '}
                            <span className="font-bold text-gray-900">Rs.{p.sellingPrice}</span>
                          </div>
                        ) : (
                          <span className="font-bold text-gray-900">Rs.{p.sellingPrice}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleStock(p)}
                          className="transition"
                          title={p.inStock ? 'Mark Out of Stock' : 'Mark In Stock'}
                        >
                          {p.inStock ? (
                            <ToggleRight size={22} className="text-emerald-500" />
                          ) : (
                            <ToggleLeft size={22} className="text-gray-300" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {p.isTrending && <TrendingUp size={12} className="text-orange-500" />}
                          {p.isCombo && <Star size={12} className="text-purple-500" />}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => {
                            setEditProduct(p);
                            setShowProductModal(true);
                          }}
                          className="p-1.5 rounded-lg hover:bg-gray-100 transition"
                        >
                          <Edit2 size={14} className="text-gray-400" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                      No products found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {showCategoryModal && (
        <CategoryModal
          category={editCategory}
          onClose={() => setShowCategoryModal(false)}
        />
      )}
      {showProductModal && (
        <ProductModal
          product={editProduct}
          categories={categories}
          onClose={() => setShowProductModal(false)}
        />
      )}
    </div>
  );
};
