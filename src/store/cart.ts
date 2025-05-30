import { create } from 'zustand'

type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
};

type AddToCartItem = Omit<CartItem, "quantity">;

interface CartState {
  items: CartItem[]
  addToCart: (newItem: AddToCartItem) => void
}

export const useCartStore = create<CartState>()((set) => ({
  items: [],
  addToCart: (newItem) => {
    set((currentState) => {
      const duplicateItem = [...currentState.items];

      const existingItemIndex = duplicateItem.findIndex(
        item => item.productId == newItem.productId
      );

      if (existingItemIndex === -1) {
        duplicateItem.push({
          productId: newItem.productId,
          name: newItem.name,
          imageUrl: newItem.imageUrl,
          price: newItem.price,
          quantity: 1
        })

      } else {
        const itemToUpdate = duplicateItem[existingItemIndex];
        if (!itemToUpdate) return { ...currentState };

        itemToUpdate.quantity += 1;
      }
      return {
        ...currentState,
        items: duplicateItem
      }
    })
  }
}))
