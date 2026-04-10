'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../../../lib/api';

interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  checked: boolean;
  recipeTitle?: string;
  category?: string;
}

interface Recipe {
  id: string;
  title: string;
  ingredients?: Array<{ name: string; quantity?: string; unit?: string }>;
}

const CATEGORIES = ['Produce', 'Meat & Seafood', 'Dairy', 'Pantry', 'Spices', 'Bakery', 'Frozen', 'Other'];

function categorize(name: string): string {
  const n = name.toLowerCase();
  if (/chicken|beef|lamb|pork|fish|prawn|shrimp|salmon|tuna|meat/.test(n)) return 'Meat & Seafood';
  if (/milk|cream|butter|cheese|yogurt|egg/.test(n)) return 'Dairy';
  if (/flour|sugar|salt|oil|vinegar|sauce|paste|stock|broth|rice|pasta|lentil|bean|chickpea/.test(n)) return 'Pantry';
  if (/cumin|coriander|turmeric|paprika|chili|pepper|garam|masala|spice|herb|bay|cardamom|cinnamon|clove|nutmeg|saffron/.test(n)) return 'Spices';
  if (/bread|roll|pita|naan|tortilla/.test(n)) return 'Bakery';
  if (/onion|garlic|ginger|tomato|potato|carrot|celery|pepper|spinach|lettuce|cucumber|zucchini|eggplant|mushroom|lemon|lime|orange|apple|banana|mango|avocado|herb|basil|mint|parsley|cilantro|coriander leaf/.test(n)) return 'Produce';
  return 'Other';
}

export default function ShoppingListPage() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [newItem, setNewItem] = useState('');
  const [newQty, setNewQty] = useState('');
  const [recipeSearch, setRecipeSearch] = useState('');
  const [recipeResults, setRecipeResults] = useState<Recipe[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [servings, setServings] = useState(2);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('cc_shopping_list');
    if (saved) setItems(JSON.parse(saved));
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('cc_shopping_list', JSON.stringify(items));
  }, [items]);

  function addItem() {
    if (!newItem.trim()) return;
    const item: ShoppingItem = {
      id: Date.now().toString(),
      name: newItem.trim(),
      quantity: newQty.trim(),
      unit: '',
      checked: false,
      category: categorize(newItem),
    };
    setItems(prev => [...prev, item]);
    setNewItem('');
    setNewQty('');
  }

  function toggleItem(id: string) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
  }

  function removeItem(id: string) {
    setItems(prev => prev.filter(i => i.id !== id));
  }

  function clearChecked() {
    setItems(prev => prev.filter(i => !i.checked));
  }

  async function searchRecipes(q: string) {
    setRecipeSearch(q);
    if (q.length < 2) { setRecipeResults([]); return; }
    setSearchLoading(true);
    try {
      const { data } = await api.get('/api/recipes', { params: { q, limit: 5 } });
      setRecipeResults(data.recipes || []);
    } catch { setRecipeResults([]); }
    finally { setSearchLoading(false); }
  }

  async function addFromRecipe(recipe: Recipe) {
    // Fetch full recipe details
    try {
      const { data } = await api.get(`/api/recipes/${recipe.id}`);
      const fullRecipe = data.recipe || data;
      const ingredients = fullRecipe.ingredients || [];
      const newItems: ShoppingItem[] = ingredients.map((ing: { name: string; quantity?: string; unit?: string }, i: number) => ({
        id: `${recipe.id}-${i}-${Date.now()}`,
        name: ing.name,
        quantity: ing.quantity ? `${Math.ceil(parseFloat(ing.quantity) * servings / 2)}` : '',
        unit: ing.unit || '',
        checked: false,
        recipeTitle: recipe.title,
        category: categorize(ing.name),
      }));
      setItems(prev => {
        const existingNames = new Set(prev.map(i => i.name.toLowerCase()));
        return [...prev, ...newItems.filter(i => !existingNames.has(i.name.toLowerCase()))];
      });
    } catch { /* ignore */ }
    setRecipeSearch('');
    setRecipeResults([]);
  }

  function printList() {
    const content = groupedItems.map(([cat, catItems]) =>
      `${cat}:\n${catItems.map(i => `  ${i.checked ? '✓' : '○'} ${i.quantity} ${i.unit} ${i.name}${i.recipeTitle ? ` (${i.recipeTitle})` : ''}`).join('\n')}`
    ).join('\n\n');
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`<pre style="font-family: sans-serif; padding: 20px;">${content}</pre>`);
      win.print();
    }
  }

  // Group by category
  const allCategories = ['All', ...CATEGORIES];
  const filteredItems = activeCategory === 'All' ? items : items.filter(i => i.category === activeCategory);
  const groupedItems: [string, ShoppingItem[]][] = activeCategory === 'All'
    ? CATEGORIES.map(cat => [cat, items.filter(i => i.category === cat)]).filter(([, items]) => (items as ShoppingItem[]).length > 0) as [string, ShoppingItem[]][]
    : [[activeCategory, filteredItems]];

  const checkedCount = items.filter(i => i.checked).length;
  const totalCount = items.length;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <span className="font-label text-primary font-bold tracking-[0.2em] text-xs uppercase">Your Kitchen</span>
          <h1 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface mt-1">Shopping List</h1>
          {totalCount > 0 && (
            <p className="text-on-surface-variant text-sm mt-1">{checkedCount}/{totalCount} items collected</p>
          )}
        </div>
        <div className="flex gap-2">
          {checkedCount > 0 && (
            <button onClick={clearChecked} className="px-4 py-2 bg-surface-container hover:bg-surface-container-high rounded-full font-label text-xs font-bold uppercase tracking-widest transition-colors text-on-surface-variant">
              Clear Done
            </button>
          )}
          {totalCount > 0 && (
            <button onClick={printList} className="px-4 py-2 bg-surface-container hover:bg-surface-container-high rounded-full font-label text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">print</span>
              Print
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="mb-6">
          <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-tertiary rounded-full transition-all duration-500" style={{ width: `${(checkedCount / totalCount) * 100}%` }} />
          </div>
        </div>
      )}

      {/* Add from recipe */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline/10 shadow-sm mb-6">
        <h3 className="font-headline font-bold text-on-surface mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-sm">restaurant_menu</span>
          Add Ingredients from a Recipe
        </h3>

        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-2 bg-surface-container-low rounded-xl px-3 py-2 border border-outline/20">
            <span className="text-xs text-on-surface-variant font-label">Servings:</span>
            <button onClick={() => setServings(s => Math.max(1, s - 1))} className="w-6 h-6 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high">−</button>
            <span className="font-headline font-bold text-on-surface w-6 text-center">{servings}</span>
            <button onClick={() => setServings(s => s + 1)} className="w-6 h-6 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high">+</button>
          </div>
        </div>

        <div className="relative">
          <div className="flex items-center gap-2 bg-surface-container-low border border-outline/20 rounded-xl px-4 py-3">
            <span className="material-symbols-outlined text-on-surface-variant text-sm">search</span>
            <input
              value={recipeSearch}
              onChange={e => searchRecipes(e.target.value)}
              placeholder="Search for a recipe..."
              className="flex-1 bg-transparent border-none focus:outline-none text-sm font-body"
            />
            {searchLoading && <div className="w-4 h-4 border border-primary border-t-transparent rounded-full animate-spin" />}
          </div>
          {recipeResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-surface-container-lowest border border-outline/20 rounded-xl shadow-xl z-10 overflow-hidden">
              {recipeResults.map(r => (
                <button key={r.id} onClick={() => addFromRecipe(r)} className="w-full text-left px-4 py-3 text-sm hover:bg-surface-container transition-colors flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-sm">add_shopping_cart</span>
                  <span className="font-medium text-on-surface">{r.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add manual item */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline/10 shadow-sm mb-6">
        <h3 className="font-headline font-bold text-on-surface mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary text-sm">add_circle</span>
          Add Item Manually
        </h3>
        <div className="flex gap-2">
          <input
            value={newQty}
            onChange={e => setNewQty(e.target.value)}
            placeholder="Qty"
            className="w-20 bg-surface-container-low border border-outline/20 rounded-xl px-3 py-3 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <input
            value={newItem}
            onChange={e => setNewItem(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addItem()}
            placeholder="Ingredient name..."
            className="flex-1 bg-surface-container-low border border-outline/20 rounded-xl px-4 py-3 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button onClick={addItem} className="px-5 py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-xl font-label font-bold text-sm uppercase tracking-widest hover:shadow-lg transition-all active:scale-95">
            Add
          </button>
        </div>
      </div>

      {/* Category filter */}
      {totalCount > 0 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 pb-1">
          {allCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full font-label text-xs font-bold tracking-widest whitespace-nowrap transition-all ${
                activeCategory === cat ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Shopping list */}
      {totalCount === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🛒</div>
          <h3 className="font-headline text-xl font-bold text-on-surface">Your list is empty</h3>
          <p className="text-on-surface-variant text-sm mt-2">Search for a recipe above to add its ingredients, or add items manually.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedItems.map(([category, catItems]) => (
            <div key={category}>
              <h3 className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-3 flex items-center gap-2">
                <div className="h-px flex-1 bg-outline-variant/30" />
                {category}
                <div className="h-px flex-1 bg-outline-variant/30" />
              </h3>
              <div className="space-y-2">
                {(catItems as ShoppingItem[]).map(item => (
                  <div key={item.id} className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${item.checked ? 'bg-surface-container/50 border-outline/5 opacity-60' : 'bg-surface-container-lowest border-outline/10 shadow-sm'}`}>
                    <button onClick={() => toggleItem(item.id)} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${item.checked ? 'bg-primary border-primary' : 'border-outline hover:border-primary'}`}>
                      {item.checked && <span className="material-symbols-outlined text-white text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`font-body font-medium text-sm ${item.checked ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>
                        {item.quantity && <span className="text-primary font-bold mr-1">{item.quantity}{item.unit && ` ${item.unit}`}</span>}
                        {item.name}
                      </p>
                      {item.recipeTitle && (
                        <p className="text-xs text-on-surface-variant mt-0.5">from {item.recipeTitle}</p>
                      )}
                    </div>
                    <button onClick={() => removeItem(item.id)} className="text-on-surface-variant hover:text-error transition-colors flex-shrink-0">
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Find in Marketplace */}
      {totalCount > 0 && (
        <div className="mt-8 p-6 bg-tertiary-fixed rounded-2xl flex items-center gap-4">
          <span className="material-symbols-outlined text-on-tertiary-fixed text-3xl">storefront</span>
          <div className="flex-1">
            <h4 className="font-headline font-bold text-on-tertiary-fixed">Can&apos;t find an ingredient?</h4>
            <p className="text-xs text-on-tertiary-fixed-variant mt-0.5">Source authentic regional ingredients from our marketplace</p>
          </div>
          <Link href="/marketplace" className="px-4 py-2 bg-on-tertiary-fixed text-tertiary-fixed rounded-full font-label font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-opacity">
            Shop Now
          </Link>
        </div>
      )}
    </div>
  );
}
