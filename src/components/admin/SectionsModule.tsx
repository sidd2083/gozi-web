'use client';

import React, { useState, useEffect } from 'react';
import {
  FolderTree,
  Plus,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Edit2,
  Trash2,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Upload,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  increment
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { StoreSection, Category, Product } from '@/types';
import { uploadImageDirect } from '@/services/uploadService';
import { seedDefaultGoziCatalog } from '@/services/catalogSeeder';

interface SectionsModuleProps {
  onSelectCategory?: (category: Category) => void;
  onSelectProduct?: (product: Product) => void;
}

export const SectionsModule: React.FC<SectionsModuleProps> = () => {
  const [sections, setSections] = useState<StoreSection[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Drill-down levels: 'sections' (Level 1) | 'section_detail' (Level 2)
  const [currentLevel, setCurrentLevel] = useState<'sections' | 'section_detail'>('sections');
  const [selectedSection, setSelectedSection] = useState<StoreSection | null>(null);

  // Modals
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [editingSection, setEditingSection] = useState<StoreSection | null>(null);
  const [sectionNameInput, setSectionNameInput] = useState('');
  const [sectionShelfType, setSectionShelfType] = useState<'standard' | 'combos' | 'frozen' | 'trending'>('standard');
  const [sectionDescription, setSectionDescription] = useState('');

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryNameInput, setCategoryNameInput] = useState('');
  const [categorySectionId, setCategorySectionId] = useState('');
  const [categoryImageUrl, setCategoryImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const [isSeeding, setIsSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);

  // 1. Subscribe to Sections
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'sections'), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as StoreSection[];
      list.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
      setSections(list);
    });
    return () => unsub();
  }, []);

  // 2. Subscribe to Categories
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'categories'), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Category[];
      list.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
      setCategories(list);
    });
    return () => unsub();
  }, []);

  // Reorder Section Up/Down in No-Code Layout Editor
  const handleMoveSection = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const currentSec = sections[index];
    const targetSec = sections[targetIndex];

    const currentOrder = currentSec.displayOrder || index + 1;
    const targetOrder = targetSec.displayOrder || targetIndex + 1;

    await updateDoc(doc(db, 'sections', currentSec.id), {
      displayOrder: targetOrder,
    });
    await updateDoc(doc(db, 'sections', targetSec.id), {
      displayOrder: currentOrder,
    });

    // Bump catalogVersion
    await updateDoc(doc(db, 'settings', 'appConfig'), {
      catalogVersion: increment(1),
    });
  };

  // Toggle Section visibility
  const handleToggleSectionActive = async (sec: StoreSection) => {
    await updateDoc(doc(db, 'sections', sec.id), {
      isActive: !sec.isActive,
    });
    await updateDoc(doc(db, 'settings', 'appConfig'), {
      catalogVersion: increment(1),
    });
  };

  // Save / Update Section
  const handleSaveSection = async () => {
    if (!sectionNameInput.trim()) return;

    const slug = sectionNameInput.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
    const isCurated = sectionShelfType !== 'standard';

    if (editingSection) {
      await updateDoc(doc(db, 'sections', editingSection.id), {
        name: sectionNameInput.trim(),
        slug,
        isCuratedShelf: isCurated,
        shelfType: sectionShelfType,
        description: sectionDescription.trim(),
        updatedAt: new Date().toISOString(),
      });
    } else {
      const newRef = doc(collection(db, 'sections'));
      const newSection: StoreSection = {
        id: newRef.id,
        name: sectionNameInput.trim(),
        slug,
        displayOrder: sections.length + 1,
        isActive: true,
        isCuratedShelf: isCurated,
        shelfType: sectionShelfType,
        description: sectionDescription.trim(),
      };
      await setDoc(newRef, newSection);
    }

    await updateDoc(doc(db, 'settings', 'appConfig'), {
      catalogVersion: increment(1),
    });

    setShowSectionModal(false);
    setEditingSection(null);
  };

  // Direct Image Upload for Category (Client-side compression <150KB)
  const handleCategoryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const url = await uploadImageDirect(file, 'categories');
      setCategoryImageUrl(url);
      setUploadingImage(false);
    } catch (err) {
      console.error('Image upload failed:', err);
      setUploadingImage(false);
    }
  };

  // Save / Update Category
  const handleSaveCategory = async () => {
    if (!categoryNameInput.trim() || !categorySectionId) return;

    const parentSec = sections.find((s) => s.id === categorySectionId);
    const slug = categoryNameInput.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');

    if (editingCategory) {
      await updateDoc(doc(db, 'categories', editingCategory.id), {
        name: categoryNameInput.trim(),
        slug,
        sectionId: categorySectionId,
        sectionName: parentSec?.name || '',
        imageUrl: categoryImageUrl.trim(),
        updatedAt: new Date().toISOString(),
      });
    } else {
      const newRef = doc(collection(db, 'categories'));
      const newCat: Category = {
        id: newRef.id,
        name: categoryNameInput.trim(),
        slug,
        sectionId: categorySectionId,
        sectionName: parentSec?.name || '',
        imageUrl: categoryImageUrl.trim() || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop&q=80',
        displayOrder: categories.filter((c) => c.sectionId === categorySectionId).length + 1,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDoc(newRef, newCat);
    }

    await updateDoc(doc(db, 'settings', 'appConfig'), {
      catalogVersion: increment(1),
    });

    setShowCategoryModal(false);
    setEditingCategory(null);
  };

  // 1-Click Seed Catalog Action
  const handleTriggerSeed = async () => {
    try {
      setIsSeeding(true);
      setSeedMessage(null);
      const res = await seedDefaultGoziCatalog(false);
      setSeedMessage(res.message);
      setIsSeeding(false);
    } catch (err: any) {
      setSeedMessage(`Error: ${err?.message || 'Failed to seed'}`);
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Seed and Add Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-gray-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-gray-900">Sections & Categories</h2>
            {currentLevel === 'section_detail' && selectedSection && (
              <span className="text-xs font-bold text-gray-400 flex items-center gap-1">
                <ChevronRight size={14} />
                <span className="text-emerald-700">{selectedSection.name}</span>
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Blinkit-style storefront hierarchy & no-code layout order manager
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleTriggerSeed}
            disabled={isSeeding}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition"
          >
            <Sparkles size={14} className="text-amber-500" />
            <span>{isSeeding ? 'Seeding...' : 'Seed Default Catalog'}</span>
          </button>

          {currentLevel === 'sections' ? (
            <button
              onClick={() => {
                setEditingSection(null);
                setSectionNameInput('');
                setSectionShelfType('standard');
                setSectionDescription('');
                setShowSectionModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
            >
              <Plus size={16} />
              <span>Add New Section</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setEditingCategory(null);
                setCategoryNameInput('');
                setCategorySectionId(selectedSection?.id || '');
                setCategoryImageUrl('');
                setShowCategoryModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
            >
              <Plus size={16} />
              <span>Add Category here</span>
            </button>
          )}
        </div>
      </div>

      {seedMessage && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center justify-between">
          <span>{seedMessage}</span>
          <button onClick={() => setSeedMessage(null)} className="text-emerald-600">✕</button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* LEVEL 1: SECTIONS LIST & NO-CODE STOREFRONT ORDER MANAGER     */}
      {/* ------------------------------------------------------------- */}
      {currentLevel === 'sections' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-gray-200/80 overflow-hidden shadow-sm">
            <div className="p-4 bg-gray-50 border-b border-gray-200/80 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                Storefront Display Order ({sections.length} Sections)
              </span>
              <span className="text-[11px] text-gray-500 font-semibold">
                Top of list = Top of customer app
              </span>
            </div>

            <div className="divide-y divide-gray-100">
              {sections.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-xs">
                  No sections yet. Click &quot;Seed Default Catalog&quot; to initialize with Zepto/Blinkit structure!
                </div>
              ) : (
                sections.map((sec, idx) => {
                  const secCats = categories.filter((c) => c.sectionId === sec.id);

                  return (
                    <div
                      key={sec.id}
                      className="p-4 flex items-center justify-between gap-4 hover:bg-gray-50/70 transition"
                    >
                      {/* Left: Reorder buttons & Name */}
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => handleMoveSection(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Move Up"
                          >
                            <ArrowUp size={12} />
                          </button>
                          <button
                            onClick={() => handleMoveSection(idx, 'down')}
                            disabled={idx === sections.length - 1}
                            className="p-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Move Down"
                          >
                            <ArrowDown size={12} />
                          </button>
                        </div>

                        <span className="w-6 text-center font-black text-gray-400 text-xs">
                          #{idx + 1}
                        </span>

                        <div>
                          <div className="flex items-center gap-2">
                            <h3
                              onClick={() => {
                                setSelectedSection(sec);
                                setCurrentLevel('section_detail');
                              }}
                              className="text-sm font-black text-gray-900 cursor-pointer hover:text-emerald-700 transition"
                            >
                              {sec.name}
                            </h3>
                            {sec.isCuratedShelf && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                                Curated Shelf ({sec.shelfType})
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-500 font-medium">
                            {secCats.length} Categories inside • Slug: <code>{sec.slug}</code>
                          </p>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleToggleSectionActive(sec)}
                          className={`p-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition ${
                            sec.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-gray-100 text-gray-500 border-gray-200'
                          }`}
                          title={sec.isActive ? 'Hide Section' : 'Show Section'}
                        >
                          {sec.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                          <span className="hidden sm:inline">{sec.isActive ? 'Live' : 'Hidden'}</span>
                        </button>

                        <button
                          onClick={() => {
                            setEditingSection(sec);
                            setSectionNameInput(sec.name);
                            setSectionShelfType(sec.shelfType || 'standard');
                            setSectionDescription(sec.description || '');
                            setShowSectionModal(true);
                          }}
                          className="p-1.5 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-gray-100"
                        >
                          <Edit2 size={14} />
                        </button>

                        <button
                          onClick={() => {
                            setSelectedSection(sec);
                            setCurrentLevel('section_detail');
                          }}
                          className="flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 px-3 py-1.5 bg-emerald-50 rounded-xl"
                        >
                          <span>Open Grid</span>
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* LEVEL 2: SECTION DETAIL & BLINKIT CATEGORY GRID               */}
      {/* ------------------------------------------------------------- */}
      {currentLevel === 'section_detail' && selectedSection && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentLevel('sections')}
              className="text-xs font-bold text-gray-600 hover:text-gray-900 flex items-center gap-1 bg-white px-3 py-2 rounded-xl border border-gray-200"
            >
              ← Back to All Sections
            </button>

            <span className="text-xs font-bold text-gray-500">
              Showing categories inside: <strong className="text-gray-900">{selectedSection.name}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {categories
              .filter((c) => c.sectionId === selectedSection.id)
              .map((cat) => (
                <div
                  key={cat.id}
                  className="bg-white border border-gray-200/80 rounded-2xl p-3 shadow-sm hover:shadow-md hover:border-emerald-300 transition flex flex-col justify-between group relative"
                >
                  <div className="aspect-square w-full rounded-xl overflow-hidden bg-gray-50 relative mb-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cat.imageUrl}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-gray-900 truncate">{cat.name}</h4>
                    <span className="text-[10px] text-gray-400 font-semibold">Order: #{cat.displayOrder}</span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t mt-2">
                    <button
                      onClick={() => {
                        setEditingCategory(cat);
                        setCategoryNameInput(cat.name);
                        setCategorySectionId(cat.sectionId);
                        setCategoryImageUrl(cat.imageUrl);
                        setShowCategoryModal(true);
                      }}
                      className="text-gray-400 hover:text-gray-900 text-[11px] font-bold"
                    >
                      Edit
                    </button>

                    <button
                      onClick={async () => {
                        if (confirm(`Delete category "${cat.name}"?`)) {
                          await deleteDoc(doc(db, 'categories', cat.id));
                        }
                      }}
                      className="text-gray-300 hover:text-red-600"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
          </div>

          {categories.filter((c) => c.sectionId === selectedSection.id).length === 0 && (
            <div className="bg-white border border-gray-200 rounded-3xl p-10 text-center space-y-2">
              <p className="text-sm font-bold text-gray-700">No categories in {selectedSection.name}</p>
              <p className="text-xs text-gray-400">Click &quot;Add Category here&quot; to upload direct images.</p>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SECTION EDIT / ADD MODAL                                      */}
      {/* ------------------------------------------------------------- */}
      {showSectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-black text-gray-900">
              {editingSection ? 'Edit Section' : 'Create New Section'}
            </h3>

            <div>
              <label className="text-[11px] font-bold text-gray-600 uppercase">Section Name</label>
              <input
                type="text"
                placeholder="e.g. Grocery & Kitchen, Late Night Combos..."
                value={sectionNameInput}
                onChange={(e) => setSectionNameInput(e.target.value)}
                className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-600 uppercase">Section Shelf Layout</label>
              <select
                value={sectionShelfType}
                onChange={(e: any) => setSectionShelfType(e.target.value)}
                className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="standard">Standard (Categories Grid Layout)</option>
                <option value="combos">Late Night Combos (3-Column Product Grid)</option>
                <option value="frozen">Frozen Items (3-Column Product Grid)</option>
                <option value="trending">Trending Products (3-Column Product Grid)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-600 uppercase">Description (Optional)</label>
              <input
                type="text"
                placeholder="Short tagline for consumer app banner"
                value={sectionDescription}
                onChange={(e) => setSectionDescription(e.target.value)}
                className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setShowSectionModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSection}
                disabled={!sectionNameInput.trim()}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl disabled:opacity-50"
              >
                Save Section
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* CATEGORY DIRECT IMAGE UPLOAD MODAL                            */}
      {/* ------------------------------------------------------------- */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-black text-gray-900">
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </h3>

            <div>
              <label className="text-[11px] font-bold text-gray-600 uppercase">Category Name</label>
              <input
                type="text"
                placeholder="e.g. Atta, Rice & Dal, Chips & Namkeen..."
                value={categoryNameInput}
                onChange={(e) => setCategoryNameInput(e.target.value)}
                className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-600 uppercase">Parent Section</label>
              <select
                value={categorySectionId}
                onChange={(e) => setCategorySectionId(e.target.value)}
                className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Direct Image Upload (No URL required) */}
            <div>
              <label className="text-[11px] font-bold text-gray-600 uppercase">Category Image (Upload or URL)</label>
              <div className="mt-1 flex items-center gap-3">
                {categoryImageUrl && (
                  <div className="w-14 h-14 rounded-xl overflow-hidden border shrink-0 bg-gray-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={categoryImageUrl} alt="preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-200 hover:border-emerald-400 rounded-xl bg-gray-50 hover:bg-emerald-50/30 transition text-xs font-bold text-gray-600">
                  <Upload size={16} className="text-emerald-600" />
                  <span>{uploadingImage ? 'Compressing & Uploading...' : 'Upload Image from device'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCategoryImageUpload}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                </label>
              </div>

              <input
                type="text"
                placeholder="Or paste external image URL"
                value={categoryImageUrl}
                onChange={(e) => setCategoryImageUrl(e.target.value)}
                className="w-full mt-2 p-2 bg-gray-50 border border-gray-200 rounded-xl text-[11px] focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setShowCategoryModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCategory}
                disabled={!categoryNameInput.trim() || uploadingImage}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl disabled:opacity-50"
              >
                Save Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
