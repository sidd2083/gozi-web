'use client';

import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  Star,
  Snowflake,
  Upload,
  X,
  ExternalLink,
  DollarSign
} from 'lucide-react';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  increment,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product, StoreSection, Category } from '@/types';
import { uploadImageDirect } from '@/services/uploadService';
import { getNextProductNumber } from '@/services/counterService';

export const ProductsModule: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [sections, setSections] = useState<StoreSection[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState('all');
  const [selectedStockFilter, setSelectedStockFilter] = useState<'all' | 'in_stock' | 'out_of_stock'>('all');
  const [tagFilter, setTagFilter] = useState<'all' | 'trending' | 'combos' | 'frozen'>('all');

  // Modals & Forms
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);

  // Form Fields
  const [nameInput, setNameInput] = useState('');
  const [descInput, setDescInput] = useState('');
  const [sectionIdInput, setSectionIdInput] = useState('');
  const [categoryIdInput, setCategoryIdInput] = useState('');
  const [unitInput, setUnitInput] = useState('');
  const [mrpInput, setMrpInput] = useState<number>(0);
  const [sellingPriceInput, setSellingPriceInput] = useState<number>(0);
  const [costPriceInput, setCostPriceInput] = useState<number>(0);
  const [stockQtyInput, setStockQtyInput] = useState<string>(''); // string for empty = unlimited
  const [isTrendingInput, setIsTrendingInput] = useState(false);
  const [isComboInput, setIsComboInput] = useState(false);
  const [isFrozenInput, setIsFrozenInput] = useState(false);
  const [feedPriorityInput, setFeedPriorityInput] = useState<number>(50); // 1 - 100
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // Fast 1-Click Starter Products Seeder (Populates Firestore directly from Admin)
  const handleSeedStarterProducts = async () => {
    try {
      setIsSeeding(true);
      const STARTERS = [
        {
          id: 'prod-salt-iodized',
          productNumber: 'P-1001',
          name: 'Aayo Noon Pure Iodized Salt',
          description: 'Refined iodized crystal salt for daily cooking and essential nutrition.',
          categoryId: 'cat-oil-ghee-masala',
          categoryName: 'Oil, Ghee & Masala',
          sectionName: 'Grocery & Kitchen',
          unit: '1 kg',
          mrp: 35,
          sellingPrice: 30,
          costPrice: 24,
          discountPercent: 14,
          images: ['https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=400&auto=format&fit=crop&q=75'],
          inStock: true,
          isHidden: false,
          isTrending: true,
          storeId: 'store-hetauda-main',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'prod-mustard-oil',
          productNumber: 'P-1002',
          name: 'Dhara Kachi Ghani Mustard Oil',
          description: 'Cold pressed aromatic pure mustard oil for authentic taste.',
          categoryId: 'cat-oil-ghee-masala',
          categoryName: 'Oil, Ghee & Masala',
          sectionName: 'Grocery & Kitchen',
          unit: '1 Ltr',
          mrp: 295,
          sellingPrice: 265,
          costPrice: 235,
          discountPercent: 10,
          images: ['https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&auto=format&fit=crop&q=75'],
          inStock: true,
          isHidden: false,
          isTrending: true,
          storeId: 'store-hetauda-main',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'prod-milk-toned',
          productNumber: 'P-1003',
          name: 'DDC Standard Fresh Milk Pouch',
          description: 'Chilled pasteurized standard cow-buffalo blended milk delivered fresh.',
          categoryId: 'cat-dairy-bread-eggs',
          categoryName: 'Dairy, Bread & Eggs',
          sectionName: 'Grocery & Kitchen',
          unit: '500 ml',
          mrp: 50,
          sellingPrice: 50,
          costPrice: 44,
          discountPercent: 0,
          images: ['https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&auto=format&fit=crop&q=75'],
          inStock: true,
          isHidden: false,
          isTrending: true,
          storeId: 'store-hetauda-main',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'prod-bread-sliced',
          productNumber: 'P-1004',
          name: 'Suprim Fresh Sliced White Bread',
          description: 'Soft bakery bread baked fresh today, perfect for toast and sandwiches.',
          categoryId: 'cat-dairy-bread-eggs',
          categoryName: 'Dairy, Bread & Eggs',
          sectionName: 'Grocery & Kitchen',
          unit: '400 g',
          mrp: 65,
          sellingPrice: 60,
          costPrice: 48,
          discountPercent: 8,
          images: ['https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&auto=format&fit=crop&q=75'],
          inStock: true,
          isHidden: false,
          isTrending: true,
          storeId: 'store-hetauda-main',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'prod-eggs-crate',
          productNumber: 'P-1005',
          name: 'Fresh Farm Brown Eggs (Crate of 6)',
          description: 'Clean farm-fresh protein-rich table eggs carefully packed in paper carton.',
          categoryId: 'cat-dairy-bread-eggs',
          categoryName: 'Dairy, Bread & Eggs',
          sectionName: 'Grocery & Kitchen',
          unit: '6 pcs',
          mrp: 120,
          sellingPrice: 105,
          costPrice: 85,
          discountPercent: 12,
          images: ['https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400&auto=format&fit=crop&q=75'],
          inStock: true,
          isHidden: false,
          isTrending: true,
          storeId: 'store-hetauda-main',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'prod-cadbury-silk',
          productNumber: 'P-1006',
          name: 'Cadbury Dairy Milk Silk Chocolate',
          description: 'Smooth, creamy chocolate bar that melts in your mouth with rich cocoa.',
          categoryId: 'cat-sweets-chocolates',
          categoryName: 'Sweets & Chocolates',
          sectionName: 'Snacks & Drinks',
          unit: '60 g',
          mrp: 140,
          sellingPrice: 125,
          costPrice: 105,
          discountPercent: 11,
          images: ['https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=400&auto=format&fit=crop&q=75'],
          inStock: true,
          isHidden: false,
          isTrending: true,
          storeId: 'store-hetauda-main',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'prod-coca-cola-can',
          productNumber: 'P-1007',
          name: 'Coca-Cola Chilled Refreshment Can',
          description: 'Ice cold carbonated cola soda can delivered chilled to your doorstep.',
          categoryId: 'cat-drinks-juices',
          categoryName: 'Drinks & Juices',
          sectionName: 'Snacks & Drinks',
          unit: '330 ml',
          mrp: 85,
          sellingPrice: 75,
          costPrice: 60,
          discountPercent: 12,
          images: ['https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&auto=format&fit=crop&q=75'],
          inStock: true,
          isHidden: false,
          isTrending: true,
          storeId: 'store-hetauda-main',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'prod-lays-magic-masala',
          productNumber: 'P-1008',
          name: "Lay's India's Magic Masala Potato Chips",
          description: 'Crispy ridged potato chips seasoned with spicy authentic blend.',
          categoryId: 'cat-chips-namkeen',
          categoryName: 'Chips & Namkeen',
          sectionName: 'Snacks & Drinks',
          unit: '50 g',
          mrp: 50,
          sellingPrice: 45,
          costPrice: 36,
          discountPercent: 10,
          images: ['https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&auto=format&fit=crop&q=75'],
          inStock: true,
          isHidden: false,
          isTrending: true,
          storeId: 'store-hetauda-main',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'prod-wai-wai-noodles',
          productNumber: 'P-1009',
          name: 'Wai Wai Ready Instant Noodles (Pack of 5)',
          description: 'Spiced pre-cooked noodles with chili oil and onion powder.',
          categoryId: 'cat-instant-food',
          categoryName: 'Instant Food',
          sectionName: 'Snacks & Drinks',
          unit: '5 x 75 g',
          mrp: 125,
          sellingPrice: 110,
          costPrice: 92,
          discountPercent: 12,
          images: ['https://images.unsplash.com/photo-1612927601601-6638404737ce?w=400&auto=format&fit=crop&q=75'],
          inStock: true,
          isHidden: false,
          isTrending: true,
          storeId: 'store-hetauda-main',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'combo-midnight-munch',
          productNumber: 'P-1010',
          name: 'Midnight Gamer Craving Combo',
          description: '1x Chilled Coke 330ml + 1x Lays Magic Masala + 1x Cadbury Silk 60g.',
          categoryId: 'cat-chips-namkeen',
          categoryName: 'Chips & Namkeen',
          sectionName: 'Late Night Combos',
          unit: 'Combo Pack (3 Items)',
          mrp: 275,
          sellingPrice: 235,
          costPrice: 195,
          discountPercent: 15,
          images: ['https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=400&auto=format&fit=crop&q=75'],
          inStock: true,
          isHidden: false,
          isTrending: true,
          isCombo: true,
          storeId: 'store-hetauda-main',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'prod-frozen-momo',
          productNumber: 'P-1011',
          name: 'Chicken Juicy Steamed Momo (Pack of 20)',
          description: 'Handcrafted frozen spiced chicken dumplings with fiery tomato timur achar.',
          categoryId: 'cat-chicken-meat-fish',
          categoryName: 'Chicken, Meat & Fish',
          sectionName: 'Frozen Items',
          unit: '20 pcs (500 g)',
          mrp: 320,
          sellingPrice: 280,
          costPrice: 220,
          discountPercent: 12,
          images: ['https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400&auto=format&fit=crop&q=75'],
          inStock: true,
          isHidden: false,
          isTrending: true,
          isFrozen: true,
          storeId: 'store-hetauda-main',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ];

      const batch = writeBatch(db);
      for (const p of STARTERS) {
        batch.set(doc(db, 'products', p.id), p, { merge: true });
      }
      await batch.commit();

      // Bump catalogVersion so mobile app cache invalidates
      await updateDoc(doc(db, 'settings', 'appConfig'), {
        catalogVersion: increment(1),
      });

      setIsSeeding(false);
    } catch (err) {
      console.error('Seeding error:', err);
      setIsSeeding(false);
    }
  };

  // 1. Subscribe to Products
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'products'), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Product[];
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setProducts(list);
    });
    return () => unsub();
  }, []);

  // 2. Subscribe to Sections & Categories
  useEffect(() => {
    const unsubSec = onSnapshot(collection(db, 'sections'), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as StoreSection[];
      list.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
      setSections(list);
      if (list.length > 0 && !sectionIdInput) {
        setSectionIdInput(list[0].id);
      }
    });

    const unsubCat = onSnapshot(collection(db, 'categories'), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Category[];
      list.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
      setCategories(list);
    });

    return () => {
      unsubSec();
      unsubCat();
    };
  }, [sectionIdInput]);

  // Fast 1-Click Stock Toggle
  const handleToggleStock = async (p: Product) => {
    const newStock = !p.inStock;
    await updateDoc(doc(db, 'products', p.id), {
      inStock: newStock,
      updatedAt: new Date().toISOString(),
    });
    // Auto-increment catalogVersion so mobile app cache updates instantly
    await updateDoc(doc(db, 'settings', 'appConfig'), {
      catalogVersion: increment(1),
    });
  };

  // Open Form to Add
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setNameInput('');
    setDescInput('');
    const firstSec = sections[0]?.id || '';
    setSectionIdInput(firstSec);
    const availableCats = categories.filter((c) => c.sectionId === firstSec);
    setCategoryIdInput(availableCats[0]?.id || '');
    setUnitInput('1 Pack');
    setMrpInput(100);
    setSellingPriceInput(90);
    setCostPriceInput(70);
    setStockQtyInput('');
    setIsTrendingInput(false);
    setIsComboInput(false);
    setIsFrozenInput(false);
    setFeedPriorityInput(50);
    setImageUrls(['https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop&q=80']);
    setShowProductModal(true);
  };

  // Open Form to Edit
  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setNameInput(p.name);
    setDescInput(p.description || '');
    setSectionIdInput(p.sectionId || sections[0]?.id || '');
    setCategoryIdInput(p.categoryId || '');
    setUnitInput(p.unit || '1 Pack');
    setMrpInput(p.mrp || 0);
    setSellingPriceInput(p.sellingPrice || 0);
    setCostPriceInput(p.costPrice || 0);
    setStockQtyInput(p.stockQuantity !== undefined && p.stockQuantity !== null ? String(p.stockQuantity) : '');
    setIsTrendingInput(!!p.isTrending);
    setIsComboInput(!!p.isCombo);
    setIsFrozenInput(!!p.isFrozen);
    setFeedPriorityInput(p.feedPriority || 50);
    setImageUrls(p.images || []);
    setShowProductModal(true);
  };

  // Direct Image Upload
  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const url = await uploadImageDirect(file, 'products');
      setImageUrls((prev) => [...prev, url]);
      setUploadingImage(false);
    } catch (err) {
      console.error('Image upload failed:', err);
      setUploadingImage(false);
    }
  };

  // Save / Update Product
  const handleSaveProduct = async () => {
    if (!nameInput.trim()) return;

    try {
      setIsSaving(true);
      const now = new Date().toISOString();
      const parentSec = sections.find((s) => s.id === sectionIdInput);
      const parentCat = categories.find((c) => c.id === categoryIdInput);

      const parsedStock = stockQtyInput.trim() !== '' ? parseInt(stockQtyInput, 10) : null;
      const inStock = parsedStock !== null ? parsedStock > 0 : true;

      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), {
          name: nameInput.trim(),
          description: descInput.trim(),
          sectionId: sectionIdInput,
          sectionName: parentSec?.name || '',
          categoryId: categoryIdInput,
          categoryName: parentCat?.name || '',
          unit: unitInput.trim(),
          mrp: Number(mrpInput),
          sellingPrice: Number(sellingPriceInput),
          costPrice: Number(costPriceInput),
          discountPercent: mrpInput > 0 ? Math.round(((mrpInput - sellingPriceInput) / mrpInput) * 100) : 0,
          stockQuantity: parsedStock,
          inStock,
          isTrending: isTrendingInput,
          isCombo: isComboInput,
          isFrozen: isFrozenInput,
          feedPriority: Number(feedPriorityInput),
          images: imageUrls.length > 0 ? imageUrls : ['https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop&q=80'],
          updatedAt: now,
        });
      } else {
        const nextPID = await getNextProductNumber();
        const newRef = doc(collection(db, 'products'));
        const newProd: Product = {
          id: newRef.id,
          productNumber: nextPID,
          name: nameInput.trim(),
          description: descInput.trim(),
          sectionId: sectionIdInput,
          sectionName: parentSec?.name || '',
          categoryId: categoryIdInput,
          categoryName: parentCat?.name || '',
          unit: unitInput.trim(),
          mrp: Number(mrpInput),
          sellingPrice: Number(sellingPriceInput),
          costPrice: Number(costPriceInput),
          discountPercent: mrpInput > 0 ? Math.round(((mrpInput - sellingPriceInput) / mrpInput) * 100) : 0,
          stockQuantity: parsedStock,
          inStock,
          isTrending: isTrendingInput,
          isCombo: isComboInput,
          isFrozen: isFrozenInput,
          feedPriority: Number(feedPriorityInput),
          images: imageUrls.length > 0 ? imageUrls : ['https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop&q=80'],
          totalSold: 0,
          totalRevenue: 0,
          createdAt: now,
          updatedAt: now,
        };
        await setDoc(newRef, newProd);
      }

      // Bump catalogVersion
      await updateDoc(doc(db, 'settings', 'appConfig'), {
        catalogVersion: increment(1),
      });

      setShowProductModal(false);
      setIsSaving(false);
    } catch (err) {
      console.error('Failed to save product:', err);
      setIsSaving(false);
    }
  };

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    if (selectedSectionFilter !== 'all' && p.sectionId !== selectedSectionFilter) return false;
    if (selectedStockFilter === 'in_stock' && !p.inStock) return false;
    if (selectedStockFilter === 'out_of_stock' && p.inStock) return false;

    if (tagFilter === 'trending' && !p.isTrending) return false;
    if (tagFilter === 'combos' && !p.isCombo) return false;
    if (tagFilter === 'frozen' && !p.isFrozen) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = p.name && p.name.toLowerCase().includes(q);
      const matchPID = p.productNumber && p.productNumber.toLowerCase().includes(q);
      const matchCat = p.categoryName && p.categoryName.toLowerCase().includes(q);
      if (!matchName && !matchPID && !matchCat) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-gray-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <span>Products & Inventory Manager</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-gray-100 text-gray-700">
              {products.length} Total
            </span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Real-time stock toggling, sequential IDs (P-1001), and shelf tagging
          </p>
        </div>

        <div className="flex items-center gap-2">
          {products.length === 0 && (
            <button
              onClick={handleSeedStarterProducts}
              disabled={isSeeding}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 active:scale-[0.98] text-xs font-bold rounded-xl transition border border-blue-200"
            >
              <Sparkles size={15} />
              <span>{isSeeding ? 'Loading Catalog...' : 'Load Starter Catalog'}</span>
            </button>
          )}
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl transition shadow-sm"
          >
            <Plus size={16} />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="bg-white p-4 rounded-3xl border border-gray-200/80 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by product name, P-1001, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Section Filter */}
          <select
            value={selectedSectionFilter}
            onChange={(e) => setSelectedSectionFilter(e.target.value)}
            className="w-full md:w-56 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="all">All Sections</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Stock Filter */}
          <select
            value={selectedStockFilter}
            onChange={(e: any) => setSelectedStockFilter(e.target.value)}
            className="w-full md:w-44 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="all">All Stock Status</option>
            <option value="in_stock">In Stock Only</option>
            <option value="out_of_stock">Out of Stock Only</option>
          </select>
        </div>

        {/* Shelf Tag Quick Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-gray-400 font-bold uppercase text-[10px] shrink-0">Tags:</span>
          <button
            onClick={() => setTagFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition ${
              tagFilter === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Items
          </button>
          <button
            onClick={() => setTagFilter('trending')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1 ${
              tagFilter === 'trending' ? 'bg-orange-500 text-white' : 'bg-orange-50 text-orange-800 hover:bg-orange-100'
            }`}
          >
            <TrendingUp size={12} />
            <span>Trending</span>
          </button>
          <button
            onClick={() => setTagFilter('combos')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1 ${
              tagFilter === 'combos' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
            }`}
          >
            <Star size={12} />
            <span>Late Night Combos</span>
          </button>
          <button
            onClick={() => setTagFilter('frozen')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1 ${
              tagFilter === 'frozen' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
            }`}
          >
            <Snowflake size={12} />
            <span>Frozen Items</span>
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-3xl border border-gray-200/80 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200/80">
              <tr>
                <th className="py-3 px-4 text-left">ID & Image</th>
                <th className="py-3 px-4 text-left">Product Details</th>
                <th className="py-3 px-4 text-left">Section & Category</th>
                <th className="py-3 px-4 text-right">Selling Price</th>
                <th className="py-3 px-4 text-right">Cost (Margin)</th>
                <th className="py-3 px-4 text-center">Fast Stock Toggle</th>
                <th className="py-3 px-4 text-center">Sold Till Now</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-gray-400 font-medium">
                    No products found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const margin = p.sellingPrice && p.costPrice ? p.sellingPrice - p.costPrice : 0;
                  const marginPercent = p.sellingPrice ? Math.round((margin / p.sellingPrice) * 100) : 0;

                  return (
                    <tr key={p.id} className="hover:bg-gray-50/70 transition">
                      {/* ID & Thumbnail */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0 border relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={p.images?.[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop&q=80'}
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <span className="font-mono text-[11px] font-black text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">
                              {p.productNumber || 'P-????'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Name & Pack Size */}
                      <td className="py-3 px-4">
                        <p
                          onClick={() => setDetailProduct(p)}
                          className="font-bold text-gray-900 cursor-pointer hover:text-emerald-700 transition"
                        >
                          {p.name}
                        </p>
                        <p className="text-[11px] text-gray-500 font-medium">{p.unit}</p>

                        <div className="flex items-center gap-1.5 mt-1">
                          {p.isTrending && (
                            <span className="px-1.5 py-0.2 bg-orange-100 text-orange-800 rounded text-[9px] font-bold">
                              Trending
                            </span>
                          )}
                          {p.isCombo && (
                            <span className="px-1.5 py-0.2 bg-purple-100 text-purple-800 rounded text-[9px] font-bold">
                              Combo
                            </span>
                          )}
                          {p.isFrozen && (
                            <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded text-[9px] font-bold">
                              Frozen
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Section & Category */}
                      <td className="py-3 px-4">
                        <p className="font-semibold text-gray-800">{p.sectionName || 'General'}</p>
                        <p className="text-[11px] text-gray-500 font-medium">{p.categoryName || '-'}</p>
                      </td>

                      {/* Selling Price */}
                      <td className="py-3 px-4 text-right">
                        <p className="font-black text-gray-900 text-sm">Rs. {p.sellingPrice}</p>
                        {p.mrp > p.sellingPrice && (
                          <p className="text-[11px] text-gray-400 line-through">Rs. {p.mrp}</p>
                        )}
                      </td>

                      {/* Cost & Margin */}
                      <td className="py-3 px-4 text-right">
                        <p className="font-bold text-gray-600">Rs. {p.costPrice || 0}</p>
                        <p className="text-[10px] text-emerald-700 font-bold">
                          +{marginPercent}% (Rs. {margin})
                        </p>
                      </td>

                      {/* Fast 1-Click Stock Toggle */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleStock(p)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition shadow-2xs"
                        >
                          {p.inStock ? (
                            <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full hover:bg-emerald-100">
                              <ToggleRight size={18} className="text-emerald-600" />
                              <span>In Stock</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full hover:bg-red-100">
                              <ToggleLeft size={18} className="text-red-500" />
                              <span>Out of Stock</span>
                            </span>
                          )}
                        </button>
                      </td>

                      {/* Performance: Units Sold */}
                      <td className="py-3 px-4 text-center">
                        <p className="font-black text-gray-900">{p.totalSold || 0} pcs</p>
                        <p className="text-[10px] text-gray-500 font-semibold">
                          Rs. {(p.totalRevenue || 0).toLocaleString()}
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition"
                            title="Edit Product"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm(`Delete product "${p.name}"?`)) {
                                await deleteDoc(doc(db, 'products', p.id));
                              }
                            }}
                            className="p-1.5 rounded-lg text-gray-300 hover:text-red-600 hover:bg-red-50 transition"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* PRODUCT DETAIL & PERFORMANCE DRAWER                           */}
      {/* ------------------------------------------------------------- */}
      {detailProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-gray-500">{detailProduct.productNumber}</span>
                <h3 className="text-lg font-black text-gray-900">{detailProduct.name}</h3>
              </div>
              <button
                onClick={() => setDetailProduct(null)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex gap-4">
              <div className="w-28 h-28 rounded-2xl overflow-hidden bg-gray-100 shrink-0 border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={detailProduct.images?.[0] || ''}
                  alt={detailProduct.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-xs space-y-1">
                <p className="text-gray-500 font-medium">{detailProduct.description || 'No description entered.'}</p>
                <p className="font-bold text-gray-900">Pack: {detailProduct.unit}</p>
                <p className="text-emerald-700 font-bold">Selling Price: Rs. {detailProduct.sellingPrice}</p>
                <p className="text-gray-600">Cost Price: Rs. {detailProduct.costPrice || 0}</p>
                <p className="text-gray-600">
                  Current Stock:{' '}
                  <strong className={detailProduct.inStock ? 'text-emerald-700' : 'text-red-600'}>
                    {detailProduct.inStock ? 'In Stock' : 'Out of Stock'}
                  </strong>
                </p>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-2xl text-center">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase">Lifetime Units Sold</span>
                <p className="text-2xl font-black text-gray-900 mt-1">{detailProduct.totalSold || 0} pcs</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase">Lifetime Gross Revenue</span>
                <p className="text-2xl font-black text-emerald-700 mt-1">
                  Rs. {(detailProduct.totalRevenue || 0).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => {
                  setDetailProduct(null);
                  handleOpenEdit(detailProduct);
                }}
                className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl"
              >
                Edit Product
              </button>
              <button
                onClick={() => setDetailProduct(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* ADD / EDIT PRODUCT MODAL (Direct Image Upload + Optional Stock) */}
      {/* ------------------------------------------------------------- */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-black text-gray-900 border-b pb-3">
              {editingProduct ? `Edit ${editingProduct.productNumber}` : 'Add New Product'}
            </h3>

            {/* Name & Pack */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-gray-600 uppercase">Product Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Wai Wai Noodles, Real Mango Juice..."
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-600 uppercase">Pack Size / Unit *</label>
                <input
                  type="text"
                  placeholder="e.g. 500g, 1L, 1 pc..."
                  value={unitInput}
                  onChange={(e) => setUnitInput(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-[11px] font-bold text-gray-600 uppercase">Description</label>
              <textarea
                rows={2}
                placeholder="Short customer description..."
                value={descInput}
                onChange={(e) => setDescInput(e.target.value)}
                className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Section & Category Cascading Select */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-gray-600 uppercase">Storefront Section *</label>
                <select
                  value={sectionIdInput}
                  onChange={(e) => {
                    const newSecId = e.target.value;
                    setSectionIdInput(newSecId);
                    const filtered = categories.filter((c) => c.sectionId === newSecId);
                    setCategoryIdInput(filtered[0]?.id || '');
                  }}
                  className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-600 uppercase">Category *</label>
                <select
                  value={categoryIdInput}
                  onChange={(e) => setCategoryIdInput(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {categories
                    .filter((c) => !sectionIdInput || c.sectionId === sectionIdInput)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Pricing Breakdown: MRP, Selling, Cost Price */}
            <div className="grid grid-cols-3 gap-3 bg-gray-50 p-3 rounded-2xl">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase">MRP (Rs.)</label>
                <input
                  type="number"
                  value={mrpInput}
                  onChange={(e) => setMrpInput(Number(e.target.value))}
                  className="w-full mt-1 p-2 bg-white border border-gray-200 rounded-xl text-xs font-black"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-emerald-800 uppercase">Selling Price (Rs.) *</label>
                <input
                  type="number"
                  value={sellingPriceInput}
                  onChange={(e) => setSellingPriceInput(Number(e.target.value))}
                  className="w-full mt-1 p-2 bg-white border border-emerald-300 rounded-xl text-xs font-black text-emerald-800"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase">Cost Price (Rs.)</label>
                <input
                  type="number"
                  value={costPriceInput}
                  onChange={(e) => setCostPriceInput(Number(e.target.value))}
                  className="w-full mt-1 p-2 bg-white border border-gray-200 rounded-xl text-xs font-black"
                  placeholder="For profit"
                />
              </div>
            </div>

            {/* Optional Stock Quantity Tracking */}
            <div>
              <label className="text-[11px] font-bold text-gray-600 uppercase">
                Stock Quantity (Leave blank for unlimited/manual toggle)
              </label>
              <input
                type="number"
                placeholder="e.g. 50 (will auto-decrement on sales)"
                value={stockQtyInput}
                onChange={(e) => setStockQtyInput(e.target.value)}
                className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Direct Image Upload (No URL required) */}
            <div>
              <label className="text-[11px] font-bold text-gray-600 uppercase">
                Product Image (Upload from phone/PC or paste URL)
              </label>

              <div className="mt-2 flex items-center gap-3">
                {imageUrls[0] && (
                  <div className="w-14 h-14 rounded-xl overflow-hidden border shrink-0 bg-gray-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageUrls[0]} alt="preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-200 hover:border-emerald-400 rounded-xl bg-gray-50 hover:bg-emerald-50/30 transition text-xs font-bold text-gray-600">
                  <Upload size={16} className="text-emerald-600" />
                  <span>{uploadingImage ? 'Uploading & Compressing...' : 'Upload Image from device'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProductImageUpload}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                </label>
              </div>

              <input
                type="text"
                placeholder="Or paste external image URL"
                value={imageUrls[0] || ''}
                onChange={(e) => setImageUrls([e.target.value])}
                className="w-full mt-2 p-2 bg-gray-50 border border-gray-200 rounded-xl text-[11px]"
              />
            </div>

            {/* Shelf Placement Flags */}
            <div className="bg-gray-50 p-3 rounded-2xl space-y-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                Storefront Shelves & Discovery Placement
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <label className="flex items-center gap-2 font-semibold text-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isTrendingInput}
                    onChange={(e) => setIsTrendingInput(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  <span>Trending Shelf</span>
                </label>

                <label className="flex items-center gap-2 font-semibold text-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isComboInput}
                    onChange={(e) => setIsComboInput(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  <span>Late Night Combo</span>
                </label>

                <label className="flex items-center gap-2 font-semibold text-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFrozenInput}
                    onChange={(e) => setIsFrozenInput(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  <span>Frozen Shelf</span>
                </label>
              </div>

              <div className="pt-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase">
                  Consumer Discovery Feed Priority (Higher = Top of Home Feed)
                </label>
                <div className="flex items-center gap-3 mt-1">
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={feedPriorityInput}
                    onChange={(e) => setFeedPriorityInput(Number(e.target.value))}
                    className="flex-1 accent-emerald-600"
                  />
                  <span className="text-xs font-bold text-gray-700 w-8 text-right">{feedPriorityInput}</span>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => setShowProductModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProduct}
                disabled={isSaving || !nameInput.trim() || uploadingImage}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
