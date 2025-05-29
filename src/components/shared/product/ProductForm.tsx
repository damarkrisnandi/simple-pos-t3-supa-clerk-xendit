import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectTrigger,
  SelectValue,
  SelectItem
} from "@/components/ui/select";
import { type ProductFormSchema } from "@/forms/product";
import { api } from "@/utils/api";
import { useFormContext } from "react-hook-form";

interface ProductFormProps {
  onSubmit: (data: ProductFormSchema) => void;
  submitText: string;
}

export const ProductForm = ({ onSubmit, submitText }: ProductFormProps) => {
  const form = useFormContext<ProductFormSchema>();
  const { data: categories } = api.category.getCategories.useQuery();

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Product Name</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="price"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Price</FormLabel>
            <FormControl>
              <Input type="number" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="categoryId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Category</FormLabel>
            <FormControl>
              <Select
                defaultValue={''}
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                    {categories?.map((category) => {
                        return (
                        <SelectItem key={category.id} value={category.id}>
                            {category.name}
                        </SelectItem>
                        );
                    })}
                    </SelectGroup>
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="space-y">
        <Label>Product Image</Label>
        <Input type="file" accept="image/*" />
      </div>
    </form>
  );
};
