import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  X,
  Plus,
  Minus,
  Search,
  ShoppingCart,
  Trash2,
  Star,
} from "lucide-react";
import { apiClient } from "../../lib/api";
import { useAuth } from "../../hooks/useAuth";

const schema = yup.object({
  poNumber: yup.string().required("PO number is required"),
  supplierName: yup.string().required("Supplier name is required"),
  supplierEmail: yup
    .string()
    .email("Invalid email")
    .required("Supplier email is required"),
  status: yup
    .string()
    .oneOf(["PENDING", "APPROVED", "RECEIVED", "CANCELLED"])
    .required(),
  orderDate: yup.string().required("Order date is required"),
  expectedDelivery: yup.string().required("Expected delivery date is required"),
});

type FormData = yup.InferType<typeof schema>;

interface Product {
  id: string;
  productName: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  supplier: string;
}

interface CartItem extends Product {
  cart_quantity: number;
  purchase_price: number;
}

interface EnhancedPurchaseOrderFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingOrder?: any;
}

export function EnhancedPurchaseOrderForm({
  isOpen,
  onClose,
  onSuccess,
  editingOrder,
}: EnhancedPurchaseOrderFormProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [frequentItems, setFrequentItems] = useState<Product[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: editingOrder
      ? {
          poNumber: editingOrder.poNumber,
          supplierName: editingOrder.supplierName,
          supplierEmail: editingOrder.supplierEmail,
          status: editingOrder.status,
          orderDate: editingOrder.orderDate,
          expectedDelivery: editingOrder.expectedDelivery,
        }
      : {
          status: "PENDING",
          orderDate: new Date().toISOString().split("T")[0],
          expectedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
        },
  });

  const supplierName = watch("supplierName");

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (supplierName && supplierName.length > 2) {
      fetchFrequentItems(supplierName);
      setSelectedSupplier(supplierName);
    }
  }, [supplierName]);

  const fetchProducts = async () => {
    if (!user) return;

    try {
      const response = await apiClient.getInventory();
      setProducts(response.data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchFrequentItems = async (supplier: string) => {
    if (!user) return;

    try {
      // Filter products by supplier from already fetched products
      const filteredItems = products
        .filter((product) =>
          product.supplier.toLowerCase().includes(supplier.toLowerCase())
        )
        .slice(0, 5);

      setFrequentItems(filteredItems);
    } catch (error) {
      console.error("Error fetching frequent items:", error);
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.supplier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product: Product, quantity: number = 1) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, cart_quantity: item.cart_quantity + quantity }
            : item
        );
      } else {
        return [
          ...prevCart,
          {
            ...product,
            cart_quantity: quantity,
            purchase_price: product.unitPrice, // Default to current unit price
          },
        ];
      }
    });
  };

  const updateCartQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId ? { ...item, cart_quantity: newQuantity } : item
      )
    );
  };

  const updatePurchasePrice = (productId: string, newPrice: number) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId ? { ...item, purchase_price: newPrice } : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const getTotalAmount = () => {
    return cart.reduce(
      (total, item) => total + item.purchase_price * item.cart_quantity,
      0
    );
  };

  const onSubmit = async (data: FormData) => {
    if (!user) return;
    if (cart.length === 0) {
      setError("Please add at least one product to the order");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const orderData = {
        ...data,
        totalAmount: getTotalAmount(),
      };

      if (editingOrder) {
        await apiClient.updatePurchaseOrder(editingOrder.id, orderData);
      } else {
        await apiClient.createPurchaseOrder(orderData);
      }

      reset();
      setCart([]);
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
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex">
        {/* Left Side - Product Selection */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingOrder ? "Edit Purchase Order" : "Create Purchase Order"}
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

          <div className="p-6 flex-1 overflow-y-auto">
            {/* Order Details Form */}
            <form className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PO Number
                  </label>
                  <input
                    {...register("poNumber")}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="PO-001"
                  />
                  {errors.poNumber && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.poNumber.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order Date
                  </label>
                  <input
                    {...register("orderDate")}
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.orderDate && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.orderDate.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supplier Name
                  </label>
                  <input
                    {...register("supplierName")}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="ABC Supplies"
                  />
                  {errors.supplierName && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.supplierName.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supplier Email
                  </label>
                  <input
                    {...register("supplierEmail")}
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="supplier@example.com"
                  />
                  {errors.supplierEmail && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.supplierEmail.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    {...register("status")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="RECEIVED">Received</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                  {errors.status && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.status.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expected Delivery
                  </label>
                  <input
                    {...register("expectedDelivery")}
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.expectedDelivery && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.expectedDelivery.message}
                    </p>
                  )}
                </div>
              </div>
            </form>

            {/* Frequent Items */}
            {frequentItems.length > 0 && selectedSupplier && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <Star className="h-4 w-4 text-yellow-500 mr-2" />
                  Products from {selectedSupplier}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {frequentItems.map((product) => (
                    <div
                      key={product.id}
                      className="bg-green-50 border border-green-200 rounded-lg p-3"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h5 className="font-medium text-gray-900 text-sm">
                            {product.productName}
                          </h5>
                          <p className="text-xs text-gray-500">{product.sku}</p>
                          <p className="text-xs text-gray-400">
                            Current: {product.quantity}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
                          ${product.unitPrice.toFixed(2)}
                        </span>
                      </div>
                      <button
                        onClick={() => addToCart(product)}
                        className="w-full bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                      >
                        Quick Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Product Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search products or suppliers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h5 className="font-medium text-gray-900">
                        {product.productName}
                      </h5>
                      <p className="text-sm text-gray-500">{product.sku}</p>
                      <p className="text-xs text-gray-400">
                        Current Stock: {product.quantity}
                      </p>
                      <p className="text-xs text-blue-600">
                        Supplier: {product.supplier}
                      </p>
                    </div>
                    <span className="text-lg font-semibold text-gray-900">
                      ${product.unitPrice.toFixed(2)}
                    </span>
                  </div>
                  <button
                    onClick={() => addToCart(product)}
                    className="w-full bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add to Order
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Cart */}
        <div className="w-96 bg-gray-50 border-l border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h4 className="font-semibold text-gray-900 flex items-center">
              <ShoppingCart className="h-5 w-5 mr-2" />
              Purchase Items ({cart.length})
            </h4>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No items in cart</p>
                <p className="text-sm">
                  Add products to create a purchase order
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-lg p-3 border border-gray-200"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h6 className="font-medium text-gray-900 text-sm">
                          {item.productName}
                        </h6>
                        <p className="text-xs text-gray-500">{item.sku}</p>
                        <p className="text-xs text-blue-600">
                          From: {item.supplier}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Purchase Price Input */}
                    <div className="mb-2">
                      <label className="text-xs text-gray-600">
                        Purchase Price:
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.purchase_price}
                        onChange={(e) =>
                          updatePurchasePrice(
                            item.id,
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() =>
                            updateCartQuantity(item.id, item.cart_quantity - 1)
                          }
                          className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-12 text-center font-medium">
                          {item.cart_quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateCartQuantity(item.id, item.cart_quantity + 1)
                          }
                          className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="font-semibold text-gray-900">
                        ${(item.purchase_price * item.cart_quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Summary */}
          <div className="border-t border-gray-200 p-4 bg-white">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold text-gray-900">
                Total:
              </span>
              <span className="text-xl font-bold text-blue-600">
                ${getTotalAmount().toFixed(2)}
              </span>
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit(onSubmit)}
                disabled={isLoading || cart.length === 0}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading
                  ? "Creating..."
                  : editingOrder
                  ? "Update Order"
                  : "Create Order"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
