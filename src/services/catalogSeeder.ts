import { db } from '@/lib/firebase';
import { 
  collection, 
  getDocs, 
  writeBatch, 
  doc, 
  updateDoc, 
  increment 
} from 'firebase/firestore';
import { StoreSection, Category } from '@/types';

export interface DefaultSectionSeed {
  name: string;
  slug: string;
  displayOrder: number;
  isCuratedShelf?: boolean;
  shelfType?: 'combos' | 'frozen' | 'trending' | 'standard';
  description?: string;
  categories: {
    name: string;
    imageUrl: string;
  }[];
}

export const DEFAULT_GOZI_CATALOG: DefaultSectionSeed[] = [
  {
    name: 'Grocery & Kitchen',
    slug: 'grocery-and-kitchen',
    displayOrder: 1,
    categories: [
      { name: 'Veg & Fruits', imageUrl: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&auto=format&fit=crop&q=80' },
      { name: 'Atta, Rice & Dal', imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&auto=format&fit=crop&q=80' },
      { name: 'Oil, Ghee & Masala', imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&auto=format&fit=crop&q=80' },
      { name: 'Dairy, Bread & Eggs', imageUrl: 'https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?w=400&auto=format&fit=crop&q=80' },
      { name: 'Bakery & Biscuits', imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&auto=format&fit=crop&q=80' },
      { name: 'Dry Fruits & Cereals', imageUrl: 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=400&auto=format&fit=crop&q=80' },
      { name: 'Chicken, Meat & Fish', imageUrl: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&auto=format&fit=crop&q=80' },
      { name: 'Kitchenware & Appliances', imageUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=400&auto=format&fit=crop&q=80' },
    ],
  },
  {
    name: 'Snacks & Drinks',
    slug: 'snacks-and-drinks',
    displayOrder: 2,
    categories: [
      { name: 'Chips & Namkeen', imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&auto=format&fit=crop&q=80' },
      { name: 'Sweets & Chocolates', imageUrl: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=400&auto=format&fit=crop&q=80' },
      { name: 'Drinks & Juices', imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&auto=format&fit=crop&q=80' },
      { name: 'Tea, Coffee & Milk Drinks', imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop&q=80' },
      { name: 'Instant Food', imageUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=400&auto=format&fit=crop&q=80' },
      { name: 'Sauces & Jams', imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&auto=format&fit=crop&q=80' },
      { name: 'Ice Cream & Desserts', imageUrl: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=400&auto=format&fit=crop&q=80' },
      { name: 'Toffee & Candies', imageUrl: 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=400&auto=format&fit=crop&q=80' },
    ],
  },
  {
    name: 'Liquors & Smokes',
    slug: 'liquors-and-smokes',
    displayOrder: 3,
    categories: [
      { name: 'Smokes', imageUrl: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?w=400&auto=format&fit=crop&q=80' },
      { name: 'Liquors', imageUrl: 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=400&auto=format&fit=crop&q=80' },
    ],
  },
  {
    name: 'Beauty & Personal Care',
    slug: 'beauty-and-personal-care',
    displayOrder: 4,
    categories: [
      { name: 'Bath & Body', imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&auto=format&fit=crop&q=80' },
      { name: 'Hair', imageUrl: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400&auto=format&fit=crop&q=80' },
      { name: 'Skin & Face', imageUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&auto=format&fit=crop&q=80' },
      { name: 'Beauty & Cosmetics', imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&auto=format&fit=crop&q=80' },
      { name: 'Feminine Hygiene', imageUrl: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400&auto=format&fit=crop&q=80' },
      { name: 'Baby Care', imageUrl: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&auto=format&fit=crop&q=80' },
      { name: 'Sexual Wellness', imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&auto=format&fit=crop&q=80' },
      { name: 'Health & Pharma', imageUrl: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400&auto=format&fit=crop&q=80' },
    ],
  },
  {
    name: 'Household Essentials & Stationery',
    slug: 'household-essentials-and-stationery',
    displayOrder: 5,
    categories: [
      { name: 'Home & Lifestyle', imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&auto=format&fit=crop&q=80' },
      { name: 'Cleaners & Repellents', imageUrl: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=400&auto=format&fit=crop&q=80' },
      { name: 'Stationery Items', imageUrl: 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=400&auto=format&fit=crop&q=80' },
      { name: 'Games', imageUrl: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=400&auto=format&fit=crop&q=80' },
    ],
  },
  // Curated 3-column product shelf sections
  {
    name: 'Late Night Combos',
    slug: 'late-night-combos',
    displayOrder: 6,
    isCuratedShelf: true,
    shelfType: 'combos',
    description: 'Craving snacks & cold drinks late night in Hetauda',
    categories: [],
  },
  {
    name: 'Frozen Items',
    slug: 'frozen-items',
    displayOrder: 7,
    isCuratedShelf: true,
    shelfType: 'frozen',
    description: 'Ready-to-cook momos, frozen meats, and ice creams',
    categories: [],
  },
  {
    name: 'Trending Products',
    slug: 'trending-products',
    displayOrder: 8,
    isCuratedShelf: true,
    shelfType: 'trending',
    description: 'Most frequently ordered items across Hetauda today',
    categories: [],
  },
];

/**
 * Seeds the default Sections and Categories into Firestore if empty
 */
export async function seedDefaultGoziCatalog(force = false): Promise<{ seeded: boolean; message: string }> {
  const sectionsSnap = await getDocs(collection(db, 'sections'));
  if (!force && !sectionsSnap.empty) {
    return { seeded: false, message: 'Sections already exist in database.' };
  }

  const batch = writeBatch(db);
  const sectionIdsOrder: string[] = [];

  for (const s of DEFAULT_GOZI_CATALOG) {
    const sectionRef = doc(collection(db, 'sections'));
    const sectionData: StoreSection = {
      id: sectionRef.id,
      name: s.name,
      slug: s.slug,
      displayOrder: s.displayOrder,
      isActive: true,
      isCuratedShelf: s.isCuratedShelf || false,
      shelfType: s.shelfType || 'standard',
      description: s.description || '',
    };
    batch.set(sectionRef, sectionData);
    sectionIdsOrder.push(sectionRef.id);

    // Add categories under this section
    for (let cIdx = 0; cIdx < s.categories.length; cIdx++) {
      const c = s.categories[cIdx];
      const catRef = doc(collection(db, 'categories'));
      const catData: Category = {
        id: catRef.id,
        name: c.name,
        sectionId: sectionRef.id,
        sectionName: s.name,
        imageUrl: c.imageUrl,
        displayOrder: cIdx + 1,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      batch.set(catRef, catData);
    }
  }

  // Update appConfig sectionOrder and bump catalogVersion
  const appConfigRef = doc(db, 'settings', 'appConfig');
  batch.set(
    appConfigRef,
    {
      sectionOrder: sectionIdsOrder,
      catalogVersion: increment(1),
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );

  await batch.commit();
  return { seeded: true, message: `Successfully seeded ${DEFAULT_GOZI_CATALOG.length} sections and categories!` };
}
