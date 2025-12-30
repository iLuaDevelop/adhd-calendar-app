const INVENTORY_KEY = 'adhd_inventory';

export interface InventoryItem {
  id: string;
  type: 'crate' | 'pet_food' | 'cosmetic';
  name: string;
  icon: string;
  tier?: 'bronze' | 'silver' | 'gold' | 'platinum';
  quantity: number;
  addedAt: number;
  crateData?: {
    openedAt?: number; // timestamp of when crate was opened
    rewards?: Array<{ type: string; amount: number }>;
  };
}

export interface Inventory {
  items: InventoryItem[];
}

// Get all inventory items
export const getInventory = (): Inventory => {
  try {
    const stored = localStorage.getItem(INVENTORY_KEY);
    if (!stored) {
      return { items: [] };
    }
    return JSON.parse(stored);
  } catch (err) {
    console.error('[Inventory] Error getting inventory:', err);
    return { items: [] };
  }
};

// Add item to inventory
export const addToInventory = (
  type: InventoryItem['type'],
  name: string,
  icon: string,
  tier?: 'bronze' | 'silver' | 'gold' | 'platinum',
  quantity: number = 1
): InventoryItem => {
  try {
    const inventory = getInventory();
    
    // Check if item already exists
    const existing = inventory.items.find(
      item => item.type === type && item.name === name && item.tier === tier
    );

    let item: InventoryItem;

    if (existing) {
      // Stack quantity
      existing.quantity += quantity;
      item = existing;
    } else {
      // Create new item
      item = {
        id: `${type}-${Date.now()}`,
        type,
        name,
        icon,
        tier,
        quantity,
        addedAt: Date.now(),
      };
      inventory.items.push(item);
    }

    localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
    window.dispatchEvent(new CustomEvent('inventory:update', { detail: { item } }));
    
    return item;
  } catch (err) {
    console.error('[Inventory] Error adding item:', err);
    throw err;
  }
};

// Remove item from inventory
export const removeFromInventory = (itemId: string, quantity: number = 1): boolean => {
  try {
    const inventory = getInventory();
    const itemIndex = inventory.items.findIndex(item => item.id === itemId);

    if (itemIndex === -1) {
      return false;
    }

    const item = inventory.items[itemIndex];
    item.quantity -= quantity;

    if (item.quantity <= 0) {
      inventory.items.splice(itemIndex, 1);
    }

    localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
    window.dispatchEvent(new CustomEvent('inventory:update', { detail: { itemId } }));
    
    return true;
  } catch (err) {
    console.error('[Inventory] Error removing item:', err);
    return false;
  }
};

// Get crates specifically
export const getCrates = (): InventoryItem[] => {
  const inventory = getInventory();
  return inventory.items.filter(item => item.type === 'crate');
};

// Get crate by tier
export const getCratesByTier = (tier: 'bronze' | 'silver' | 'gold' | 'platinum'): InventoryItem[] => {
  const inventory = getInventory();
  return inventory.items.filter(item => item.type === 'crate' && item.tier === tier);
};

// Get unopened crates count
export const getUnopendedCratesCount = (): number => {
  const crates = getCrates();
  return crates.reduce((sum, crate) => sum + crate.quantity, 0);
};

// Mark crate as opened
export const markCrateAsOpened = (itemId: string, rewards: Array<{ type: string; amount: number }>): void => {
  try {
    const inventory = getInventory();
    const crate = inventory.items.find(item => item.id === itemId);

    if (crate && crate.type === 'crate') {
      if (!crate.crateData) {
        crate.crateData = {};
      }
      crate.crateData.openedAt = Date.now();
      crate.crateData.rewards = rewards;
      
      localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
      window.dispatchEvent(new CustomEvent('inventory:update', { detail: { itemId } }));
    }
  } catch (err) {
    console.error('[Inventory] Error marking crate as opened:', err);
  }
};

// Clear entire inventory (for testing)
export const clearInventory = (): void => {
  try {
    localStorage.removeItem(INVENTORY_KEY);
    window.dispatchEvent(new CustomEvent('inventory:update', { detail: { cleared: true } }));
  } catch (err) {
    console.error('[Inventory] Error clearing inventory:', err);
  }
};
