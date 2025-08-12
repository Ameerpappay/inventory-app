import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { X } from "lucide-react";
import { apiClient, InventoryItem } from "../../lib/api";
import { useAuth } from "../../hooks/useAuth";

const schema = yup.object({
  productName: yup.string().required("Product name is required"),
  sku: yup.string().required("SKU is required"),
  category: yup.string().required("Category is required"),
  quantity: yup
    .number()
    .integer()
    .min(0, "Quantity must be 0 or greater")
    .required("Quantity is required"),
  unitPrice: yup
    .number()
    .positive("Unit price must be positive")
    .required("Unit price is required"),
  reorderLevel: yup
    .number()
    .integer()
    .min(0, "Reorder level must be 0 or greater")
    .required("Reorder level is required"),
  supplier: yup.string().required("Supplier is required"),
});

type FormData = yup.InferType<typeof schema>;

interface InventoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingItem?: InventoryItem;
}

const categories = [
  "Electronics",
  "Clothing",
  "Books",
  "Home & Garden",
  "Sports",
  "Other",
];

export function InventoryForm({
  isOpen,
  onClose,
  onSuccess,
  editingItem,
}: InventoryFormProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: editingItem
      ? {
          productName: editingItem.productName,
          sku: editingItem.sku,
          category: editingItem.category,
          quantity: editingItem.quantity,
          unitPrice: editingItem.unitPrice,
          reorderLevel: editingItem.reorderLevel,
          supplier: editingItem.supplier,
        }
      : {
          category: "Other",
          quantity: 0,
          reorderLevel: 10,
        },
  });

  const onSubmit = async (data: FormData) => {
    if (!user) return;

    setIsLoading(true);
    setError("");

    try {
      if (editingItem) {
        const response = await apiClient.updateInventoryItem(
          editingItem.id,
          data
        );
        if (!response.success) {
          throw new Error(response.error || "Failed to update item");
        }
      } else {
        const response = await apiClient.createInventoryItem(data);
        if (!response.success) {
          throw new Error(response.error || "Failed to create item");
        }
      }

      reset();
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {editingItem ? "Edit Inventory Item" : "Add Inventory Item"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Name
            </label>
            <input
              {...register("productName")}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Widget A"
            />
            {errors.productName && (
              <p className="mt-1 text-sm text-red-600">
                {errors.productName.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SKU
            </label>
            <input
              {...register("sku")}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="WID-001"
            />
            {errors.sku && (
              <p className="mt-1 text-sm text-red-600">{errors.sku.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              {...register("category")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="mt-1 text-sm text-red-600">
                {errors.category.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity
            </label>
            <input
              {...register("quantity")}
              type="number"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0"
            />
            {errors.quantity && (
              <p className="mt-1 text-sm text-red-600">
                {errors.quantity.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unit Price
            </label>
            <input
              {...register("unitPrice")}
              type="number"
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
            />
            {errors.unitPrice && (
              <p className="mt-1 text-sm text-red-600">
                {errors.unitPrice.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reorder Level
            </label>
            <input
              {...register("reorderLevel")}
              type="number"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="10"
            />
            {errors.reorderLevel && (
              <p className="mt-1 text-sm text-red-600">
                {errors.reorderLevel.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Supplier
            </label>
            <input
              {...register("supplier")}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="ABC Supplies"
            />
            {errors.supplier && (
              <p className="mt-1 text-sm text-red-600">
                {errors.supplier.message}
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Saving..." : editingItem ? "Update" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
