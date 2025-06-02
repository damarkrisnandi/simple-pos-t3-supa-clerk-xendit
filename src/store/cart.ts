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
  clearCart: () => void
  addQuantity: (item: CartItem) => void
  subsQuantity: (item: CartItem) => void // maksudnya substract / kurangin
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
  },

  clearCart: () => {
    set((currentState) => {
      return {
        ...currentState,
        items: []
      }
    })
  },
  addQuantity: (item) => {
    set((currentState) => {
      const duplicateItem = [...currentState.items];

      const existingItemIndex = duplicateItem.findIndex(
        existitem => existitem.productId == item.productId
      );

      const itemToUpdate = duplicateItem[existingItemIndex];
      if (!itemToUpdate) return { ...currentState };

      itemToUpdate.quantity += 1;
      return {
        ...currentState,
        items: duplicateItem
      }
    })
  },
  subsQuantity: (item) => {

    set((currentState) => {
      const duplicateItem = [...currentState.items];

      const existingItemIndex = duplicateItem.findIndex(
        existitem => existitem.productId == item.productId
      );

      const itemToUpdate = duplicateItem[existingItemIndex];
      if (!itemToUpdate) return { ...currentState };

      if (itemToUpdate.quantity > 1) {
        itemToUpdate.quantity -= 1;
      } else {
        duplicateItem.splice(existingItemIndex, 1)
      }
      return {
        ...currentState,
        items: duplicateItem
      }
    })
  }
}))
