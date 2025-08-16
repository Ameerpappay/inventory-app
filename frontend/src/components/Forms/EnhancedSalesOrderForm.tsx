import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { X, Plus, Search, Trash2, Star } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { apiClient, SalesOrder, SalesOrderItem } from "../../lib/api";

const schema = yup.object({
  orderNumber: yup.string().required("Order number is required"),
  customerName: yup.string().required("Customer name is required"),
  customerEmail: yup
    .string()
    .email("Invalid email")
    .required("Customer email is required"),
  status: yup
    .string()
    .oneOf(["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"])
    .required(),
  orderDate: yup.string().required("Order date is required"),
});

type FormData = yup.InferType<typeof schema>;

interface Product {
  id: string;
  productName: string;
  sku: string;
  unitPrice: number;
  quantity: number;
}

interface CartItem extends Product {
  cart_quantity: number;
  sale_price: number;
}

interface EnhancedSalesOrderFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingOrder?: SalesOrder;
}

export function EnhancedSalesOrderForm({
  isOpen,
  onClose,
  onSuccess,
  editingOrder,
}: EnhancedSalesOrderFormProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [frequentItems, setFrequentItems] = useState<Product[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      status: "PENDING",
    },
  });

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
      fetchFrequentItems();

      if (editingOrder) {
        setValue("orderNumber", editingOrder.orderNumber);
        setValue("customerName", editingOrder.customerName);
        setValue("customerEmail", editingOrder.customerEmail);
        setValue("status", editingOrder.status);

        // Format date for input field
        const orderDate = new Date(editingOrder.orderDate);
        const formattedDate = orderDate.toISOString().split("T")[0];
        setValue("orderDate", formattedDate);

        // Load existing items into cart if available
        if (editingOrder.items && editingOrder.items.length > 0) {
          const cartItems: CartItem[] = editingOrder.items.map(
            (item: SalesOrderItem) => ({
              id: item.inventory.id,
              productName: item.inventory.productName,
              sku: item.inventory.sku,
              unitPrice: item.inventory.unitPrice,
              quantity: item.inventory.quantity, // Available stock
              cart_quantity: item.quantity, // Ordered quantity
              sale_price: item.unitPrice, // Sale price used in order
            })
          );
          setCart(cartItems);
        } else {
          setCart([]);
        }
      } else {
        reset();
        setCart([]);
        generateOrderNumber();
      }
    }
  }, [isOpen, editingOrder]);

  const generateOrderNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    setValue("orderNumber", `SO-${timestamp}`);
  };

  const fetchProducts = async () => {
    if (!user) return;

    try {
      const response = await apiClient.getInventory();
      // Filter products with quantity > 0
      const availableProducts = (response.data || []).filter(
        (product) => product.quantity > 0
      );
      setProducts(availableProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchFrequentItems = async () => {
    if (!user) return;

    try {
      const response = await apiClient.getInventory();
      // Get first 5 products with quantity > 0
      const availableProducts = (response.data || [])
        .filter((product) => product.quantity > 0)
        .slice(0, 5);
      setFrequentItems(availableProducts);
    } catch (error) {
      console.error("Error fetching frequent items:", error);
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.id === product.id);

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.id === product.id
            ? { ...item, cart_quantity: item.cart_quantity + 1 }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          ...product,
          cart_quantity: 1,
          sale_price: product.unitPrice,
        },
      ]);
    }
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(
      cart.map((item) =>
        item.id === productId ? { ...item, cart_quantity: quantity } : item
      )
    );
  };

  const updateSalePrice = (productId: string, price: number) => {
    setCart(
      cart.map((item) =>
        item.id === productId ? { ...item, sale_price: price } : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.id !== productId));
  };

  const calculateTotal = () => {
    return cart.reduce(
      (total, item) => total + item.sale_price * item.cart_quantity,
      0
    );
  };

  const onSubmit = async (data: FormData) => {
    if (!user) return;
    if (cart.length === 0) {
      setError("Please add at least one item to the order");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const items = cart.map((item) => ({
        inventoryId: item.id,
        quantity: item.cart_quantity,
        unitPrice: item.sale_price,
        totalPrice: item.sale_price * item.cart_quantity,
      }));

      const orderData = {
        ...data,
        totalAmount: calculateTotal(),
        items,
      };

      if (editingOrder) {
        await apiClient.updateSalesOrder(editingOrder.id, orderData);
      } else {
        await apiClient.createSalesOrder(orderData);

        // Update inventory quantities
        for (const item of cart) {
          await apiClient.updateInventoryItem(item.id, {
            quantity: item.quantity - item.cart_quantity,
          });
        }
      }

      reset();
      setCart([]);
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving sales order:", error);
      setError("Failed to save sales order. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingOrder ? "Edit Sales Order" : "Create New Sales Order"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div
          className="flex overflow-hidden"
          style={{ height: "calc(90vh - 80px)" }}
        >
          {/* Left Panel - Order Form */}
          <div className="w-1/2 p-6 overflow-y-auto border-r border-gray-200">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order Number
                  </label>
                  <input
                    {...register("orderNumber")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="SO-123456"
                  />
                  {errors.orderNumber && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.orderNumber.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    {...register("status")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                  {errors.status && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.status.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name
                </label>
                <input
                  {...register("customerName")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John Doe"
                />
                {errors.customerName && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.customerName.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Email
                </label>
                <input
                  {...register("customerEmail")}
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="john@example.com"
                />
                {errors.customerEmail && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.customerEmail.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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

              {/* Cart Summary */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Order Summary
                </h3>

                {cart.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No items added to order
                  </p>
                ) : (
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {item.productName}
                          </h4>
                          <p className="text-sm text-gray-500">
                            SKU: {item.sku}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <input
                            type="number"
                            min="1"
                            value={item.cart_quantity}
                            onChange={(e) =>
                              updateCartQuantity(
                                item.id,
                                parseInt(e.target.value) || 1
                              )
                            }
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                          />
                          <span className="text-sm text-gray-500">×</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.sale_price}
                            onChange={(e) =>
                              updateSalePrice(
                                item.id,
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                          />
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    <div className="border-t border-gray-200 pt-3">
                      <div className="flex justify-between items-center text-lg font-semibold">
                        <span>Total:</span>
                        <span>${calculateTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || cart.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading
                    ? "Saving..."
                    : editingOrder
                    ? "Update Order"
                    : "Create Order"}
                </button>
              </div>
            </form>
          </div>

          {/* Right Panel - Product Selection */}
          <div className="w-1/2 p-6 overflow-y-auto">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Frequent Items */}
            {frequentItems.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <Star className="h-4 w-4 text-yellow-500 mr-1" />
                  Quick Add Items
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {frequentItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => addToCart(item)}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left"
                    >
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {item.productName}
                        </h4>
                        <p className="text-sm text-gray-500">
                          SKU: {item.sku} • Stock: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          ${item.unitPrice.toFixed(2)}
                        </p>
                        <Plus className="h-4 w-4 text-blue-600 ml-auto" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Product List */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                All Products
              </h3>
              <div className="space-y-2">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {product.productName}
                      </h4>
                      <p className="text-sm text-gray-500">
                        SKU: {product.sku} • Stock: {product.quantity}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="font-medium text-gray-900">
                        ${product.unitPrice.toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => addToCart(product)}
                        className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {filteredProducts.length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    {searchTerm
                      ? "No products found matching your search"
                      : "No products available"}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
