import {
  DashboardDescription,
  DashboardHeader,
  DashboardLayout,
  DashboardTitle,
} from "@/components/layouts/DashboardLayout";
import { CategoryFilterCard } from "@/components/shared/category/CategoryFilterCard";
import { CreateOrderSheet } from "@/components/shared/CreateOrderSheet";
import { ProductMenuCard } from "@/components/shared/product/ProductMenuCard";
import { Input } from "@/components/ui/input";
import { Search, ShoppingCart } from "lucide-react";
import type { ReactElement } from "react";
import { useMemo, useState } from "react";
import type { NextPageWithLayout } from "../_app";
import { Button } from "@/components/ui/button";
import { api } from "@/utils/api";
import { useCartStore } from "@/store/cart";
import { toast } from "sonner";


const DashboardPage: NextPageWithLayout = () => {
  const cartStore = useCartStore()
  const [searchQuery, setSearchQuery] = useState("");
  // pake custom hook aja biar ena
  // const { inputValue: searchQuery, setInputValue: setSearchQuery } = useSearchInput({ debounceTime: 1000 })
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [orderSheetOpen, setOrderSheetOpen] = useState(false);

  const { data: products } = api.product.getProducts.useQuery({ categoryId: selectedCategory });
  const { data: categories } = api.category.getCategories.useQuery();
  const [filteredProducts, setFilteredProducts] = useState<{ id: string, name: string, price: number, imageUrl: string | null, category: { id: string, name: string }}[]>([])
  const totalQuantity = cartStore.items.reduce((a, b) => a + b.quantity, 0)

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };


  const handleAddToCart = (productId: string) => {
    const productToAdd = products?.find(product => product.id == productId)
    if (!productToAdd) {
      toast("Product not found")
      return
    }
    cartStore.addToCart({
      name: productToAdd.name,
      productId: productToAdd.id,
      imageUrl: productToAdd.imageUrl ?? "https://placehold.co/600x400/",
      price: productToAdd.price
    })
  };

  const handleDebouncedSearch = useMemo(() => {
    const filtered = products?.filter((product) => {
      const categoryMatch =
        selectedCategory === "all" || product.category.id === selectedCategory;

      const searchMatch = product.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      return categoryMatch && searchMatch;
    }) ?? [];
    
    setTimeout(() => setFilteredProducts(filtered), 700)
  }, [products, selectedCategory, searchQuery]);

  return (
    <>
      <DashboardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <DashboardTitle>Dashboard {cartStore.items.length} </DashboardTitle>
            <DashboardDescription>
              Welcome to your Simple POS system dashboard.
            </DashboardDescription>
          </div>

          {
            !!cartStore.items.length && 
            <Button
              className="animate-in slide-in-from-right"
              onClick={() => setOrderSheetOpen(true)}
            >
              <ShoppingCart /> Cart 
              {cartStore.items.length && 
                <div className='px-2 py-1 rounded-full text-xs font-medium bg-white text-green-600'>
                  { totalQuantity } 
                </div>
              }
            </Button>
          }
        </div>
      </DashboardHeader>

      <div className="space-y-6">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search products..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              handleDebouncedSearch
            }}
          />
        </div>

        <div className="flex space-x-4 overflow-x-auto pb-2">
          <CategoryFilterCard  
          name="All"
          productCount={categories?.length ?? 0}
          isSelected={false}
          onClick={() => { handleCategoryClick("all") }}
          />
          {categories?.map((category) => (
            <CategoryFilterCard
              key={category.id}
              name={category.name}
              productCount={category._count.products}
              isSelected={selectedCategory === category.id}
              onClick={() => handleCategoryClick(category.id)}
            />
          ))}
        </div>

        <div>
          {!filteredProducts || filteredProducts.length === 0 ? (
            <div className="my-8 flex flex-col items-center justify-center">
              <p className="text-muted-foreground text-center">
                No products found
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filteredProducts?.map((product) => (
                <ProductMenuCard
                  key={product.id}
                  name={product.name}
                  productId={product.id}
                  price={product.price}
                  imageUrl={product.imageUrl ?? "https://placehold.co/600x400/"}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateOrderSheet
        open={orderSheetOpen}
        onOpenChange={setOrderSheetOpen}
      />
    </>
  );
};

DashboardPage.getLayout = (page: ReactElement) => {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default DashboardPage;
