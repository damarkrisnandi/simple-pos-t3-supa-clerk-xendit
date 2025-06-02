import {
  DashboardDescription,
  DashboardHeader,
  DashboardLayout,
  DashboardTitle,
} from "@/components/layouts/DashboardLayout";
import type { NextPageWithLayout } from "../_app";
import type { ReactElement } from "react";
import { Button } from "@/components/ui/button";
import { PRODUCTS } from "@/data/mock";
import { ProductMenuCard } from "@/components/shared/product/ProductMenuCard";
import { ProductCatalogCard } from "@/components/shared/product/ProductCatalogCard";
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { api } from "@/utils/api";
import { ProductForm } from "@/components/shared/product/ProductForm";
import { useForm } from "react-hook-form";
import { productFormSchema, type ProductFormSchema } from "@/forms/product";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const ProductsPage: NextPageWithLayout = () => {
  const apiUtils = api.useUtils();
  
  const [ uploadedCreateProductImageUrl, setUploadedCreateProductImageUrl ] = useState<string | null>(null);
  const [ imageToRemove, setImageToRemove ] = useState<string | null>(null);
  const { data: products, isLoading: productsIsLoading } = api.product.getProducts.useQuery({categoryId: "all"});
  const { mutate: createProduct, isPending: isPendingCreateProduct } = api.product.createProduct.useMutation({
    onSuccess: async () => {
      await apiUtils.product.getProducts.invalidate();

      toast("Successfully created a new product");
      setCreateProductDialogOpen(false);
      createProductForm.reset();
    }
  })

  const { mutate: editProduct, isPending: isPendingEditProduct } = api.product.editProduct.useMutation({
    onSuccess: async () => {
      await apiUtils.category.getCategories.invalidate();

      toast("Successfully edited a category");
      editProductForm.reset();
      setProductToEdit(null);
      setEditProductDialogOpen(false);
    },
  });

  const { mutateAsync: removeImage } = api.product.removeImage.useMutation()
  const { mutate: deleteProductById } =
    api.product.deleteProductById.useMutation({
      onSuccess: async () => {
        await apiUtils.product.getProducts.invalidate();

        toast("Successfully deleted a product");
        setProductToDelete(null);


        if (!imageToRemove) return;
        removeImage({ imageUrl: imageToRemove })
      },
    });

  const [createProductDialogOpen, setCreateProductDialogOpen] =
  useState(false);
  const [editProductDialogOpen, setEditProductDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [productToEdit, setProductToEdit] = useState<string | null>(null);


  const createProductForm = useForm<ProductFormSchema>({
    resolver: zodResolver(productFormSchema),
  });

  const editProductForm = useForm<ProductFormSchema>({
    resolver: zodResolver(productFormSchema),
  });


  const handleSubmitCreateProduct = (data: ProductFormSchema) => {
    if (!uploadedCreateProductImageUrl) {
      toast("Please Upload image first");
      return;
    }
    createProduct({
      name: data.name,
      price: data.price,
      categoryId: data.categoryId,
      imageUrl: uploadedCreateProductImageUrl
    });
  };

  const handleSubmitEditProduct = (data: ProductFormSchema) => {
    if (!productToEdit) return;

    editProduct({
      productId: productToEdit,

      name: data.name,
      price: data.price,
      categoryId: data.categoryId
    });
  };

  const handleClickEditProduct = (product: { id: string; name: string, price: number, category: { id: string, name: string } }) => {
    setEditProductDialogOpen(true);
    setProductToEdit(product.id);

    editProductForm.reset({
      name: product.name,
      price: product.price,
      categoryId: product.category.id
    });
  };

  const handleClickDeleteProduct = (product: { id: string, imageUrl: string | null }) => {
    
    setProductToDelete(product.id);
    setImageToRemove(product.imageUrl ?? "");
  };

  const handleConfirmDeleteProduct = () => {
    if (!productToDelete) return;

    deleteProductById({
      productId: productToDelete,
    });
  };

  

  return (
    <>
      <DashboardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <DashboardTitle>Product Management</DashboardTitle>
            <DashboardDescription>
              View, add, edit, and delete products in your inventory.
            </DashboardDescription>
          </div>

        <AlertDialog
            open={createProductDialogOpen}
            onOpenChange={setCreateProductDialogOpen}
          >
            <AlertDialogTrigger asChild>
              <Button>Add New Product</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Add New Product</AlertDialogTitle>
              </AlertDialogHeader>
              <Form {...createProductForm}>
                <ProductForm
                  onSubmit={handleSubmitCreateProduct}
                  onChangeImageUrl={(imageUrl) => {
                    setUploadedCreateProductImageUrl(imageUrl)
                  }}
                />
              </Form>

              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <Button
                  disabled={isPendingCreateProduct}
                  onClick={createProductForm.handleSubmit(
                    handleSubmitCreateProduct,
                  )}
                >
                  {isPendingCreateProduct && <Loader2 className="w-3 h-3 animate-spin" />}
                  Create Product
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

      </DashboardHeader>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products?.map((product) => (
          <ProductCatalogCard
            key={product.id}
            name={product.name}
            price={product.price}
            image={product.imageUrl ?? ""}
            category={product.category.name}
            onEdit={() => handleClickEditProduct(product)}
            onDelete={() => handleClickDeleteProduct(product)}
          />
        ))}
      </div>

      <AlertDialog
        open={editProductDialogOpen}
        onOpenChange={setEditProductDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Product</AlertDialogTitle>
          </AlertDialogHeader>
          <Form {...editProductForm}>
            <ProductForm
              onSubmit={handleSubmitEditProduct}
              onChangeImageUrl={(imageUrl) => {
                setUploadedCreateProductImageUrl(imageUrl)
              }}
            />
          </Form>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              disabled={isPendingEditProduct}
              onClick={editProductForm.handleSubmit(handleSubmitEditProduct)}
            >
              {isPendingEditProduct && <Loader2 className="w-3 h-3 animate-spin" />}
              Edit Product
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    <AlertDialog
      open={!!productToDelete}
      onOpenChange={(open) => {
        if (!open) {
          setProductToDelete(null);
        }
      }}>
      <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            Are you sure you want to delete this product? This action cannot be
            undone.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={handleConfirmDeleteProduct}>
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

ProductsPage.getLayout = (page: ReactElement) => {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default ProductsPage;
