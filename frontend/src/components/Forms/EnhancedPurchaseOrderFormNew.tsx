import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  Star,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Building,
  Package,
} from "lucide-react";
import { apiClient } from "../../lib/api";
import { useAuth } from "../../hooks/useAuth";
import { formatPrice } from "../../lib/utils";

const schema = yup.object().shape({
  poNumber: yup.string().required("PO number is required"),
  supplierName: yup.string().required("Supplier name is required"),
  supplierEmail: yup
    .string()
    .email("Invalid email")
    .required("Supplier email is required"),
  orderDate: yup.string().required("Order date is required"),
  expectedDelivery: yup.string().required("Expected delivery date is required"),
  status: yup
    .string()
    .oneOf(["PENDING", "APPROVED", "RECEIVED", "CANCELLED"])
    .required("Status is required"),
});

interface FormData {
  poNumber: string;
  supplierName: string;
  supplierEmail: string;
  orderDate: string;
  expectedDelivery: string;
  status: "PENDING" | "APPROVED" | "RECEIVED" | "CANCELLED";
}

interface Product {
  id: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
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
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [frequentItems, setFrequentItems] = useState<Product[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      status: "PENDING",
    },
  });

  const supplierName = watch("supplierName");

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
      setCurrentStep(1);
      setCart([]);
      generatePoNumber();
      setDefaultDates();
      if (editingOrder) {
        reset(editingOrder);
        // Handle editing logic here
      } else {
        reset({ status: "PENDING" });
      }
    }
  }, [isOpen, editingOrder]);

  useEffect(() => {
    if (supplierName && supplierName.length > 2) {
      fetchFrequentItems(supplierName);
    }
  }, [supplierName]);

  const generatePoNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    setValue("poNumber", `PO-${timestamp}`);
  };

  const setDefaultDates = () => {
    const today = new Date().toISOString().split("T")[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    setValue("orderDate", today);
    setValue("expectedDelivery", nextWeek);
  };

  const fetchProducts = async () => {
    try {
      const response = await apiClient.getProducts();
      if (response.success && response.data) {
        setProducts(response.data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchFrequentItems = async (supplier: string) => {
    try {
      // This would be a more sophisticated recommendation system in production
      const supplierProducts = products.filter((product) =>
        product.supplier?.toLowerCase().includes(supplier.toLowerCase())
      );
      setFrequentItems(supplierProducts.slice(0, 6));
    } catch (error) {
      console.error("Error fetching frequent items:", error);
    }
  };

  const addToCart = (product: Product, quantity = 1) => {
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
            purchase_price: product.unitPrice,
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

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: FormData) => {
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
        items: cart.map((item) => ({
          productId: item.id,
          quantity: item.cart_quantity,
          unitPrice: item.purchase_price,
        })),
      };

      if (editingOrder) {
        await apiClient.updatePurchaseOrder(editingOrder.id, orderData);
      } else {
        await apiClient.createPurchaseOrder(orderData);
      }

      onSuccess();
      onClose();
      reset();
      setCart([]);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { id: 1, name: "Order Details", icon: Building },
    { id: 2, name: "Select Products", icon: Package },
    { id: 3, name: "Review & Submit", icon: CheckCircle },
  ];

  const filteredProducts = products.filter(
    (product) =>
      product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.supplier?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">
          {editingOrder ? "Edit Purchase Order" : "Create New Purchase Order"}
        </h2>
      </div>

      {/* Step Navigator */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  currentStep >= step.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                <step.icon className="h-5 w-5" />
              </div>
              <span
                className={`ml-3 text-sm font-medium ${
                  currentStep >= step.id ? "text-blue-600" : "text-gray-500"
                }`}
              >
                {step.name}
              </span>
              {index < steps.length - 1 && (
                <ChevronRight className="h-5 w-5 text-gray-400 mx-4" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 min-h-[600px]">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Step 1: Order Details */}
        {currentStep === 1 && (
          <div className="max-w-2xl mx-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-6">
              Order Information
            </h3>
            <form className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PO Number
                  </label>
                  <input
                    {...register("poNumber")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="PO-123456"
                  />
                  {errors.poNumber && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.poNumber.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    {...register("status")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="0">Pending</option>
                    <option value="1">Approved</option>
                    <option value="2">Received</option>
                    <option value="3">Cancelled</option>
                  </select>
                  {errors.status && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.status.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supplier Name
                </label>
                <input
                  {...register("supplierName")}
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

              <div className="grid grid-cols-2 gap-6">
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
          </div>
        )}

        {/* Step 2: Select Products */}
        {currentStep === 2 && (
          <div className="flex h-full gap-6">
            {/* Product Selection */}
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Select Products
              </h3>

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
                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                    <Star className="h-4 w-4 text-yellow-500 mr-1" />
                    Recommended Items
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                          <p className="text-xs text-blue-600">
                            {item.supplier}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            {formatPrice(item.unitPrice)}
                          </p>
                          <Plus className="h-4 w-4 text-blue-600 ml-auto" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* All Products */}
              <div className="overflow-y-auto max-h-96">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  All Products
                </h4>
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
                        <p className="text-xs text-blue-600">
                          {product.supplier}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="font-medium text-gray-900">
                          {formatPrice(product.unitPrice)}
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
                </div>
              </div>
            </div>

            {/* Cart */}
            <div className="w-80 bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Cart ({cart.length} items)
              </h4>

              {cart.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No items in cart
                </p>
              ) : (
                <div className="space-y-3 overflow-y-auto max-h-96">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-lg p-3 border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-gray-900 text-sm">
                          {item.productName}
                        </h5>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">
                        SKU: {item.sku}
                      </p>
                      <div className="space-y-2">
                        <div>
                          <label className="text-xs text-gray-600">
                            Quantity:
                          </label>
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
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">
                            Price:
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.purchase_price}
                            onChange={(e) =>
                              updatePurchasePrice(
                                item.id,
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          />
                        </div>
                        <div className="text-right">
                          <span className="font-semibold text-gray-900">
                            {formatPrice(
                              item.purchase_price * item.cart_quantity
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {cart.length > 0 && (
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Total:</span>
                    <span>{formatPrice(getTotalAmount())}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Review & Submit */}
        {currentStep === 3 && (
          <div className="max-w-4xl mx-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-6">
              Review Purchase Order
            </h3>

            <div className="grid grid-cols-2 gap-6">
              {/* Order Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">
                  Order Details
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">PO Number:</span>
                    <span className="font-medium">{watch("poNumber")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Supplier:</span>
                    <span className="font-medium">{watch("supplierName")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">
                      {watch("supplierEmail")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Date:</span>
                    <span className="font-medium">{watch("orderDate")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Expected Delivery:</span>
                    <span className="font-medium">
                      {watch("expectedDelivery")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-medium">{watch("status")}</span>
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">
                  Order Summary
                </h4>
                <div className="space-y-2">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>
                        {item.productName} × {item.cart_quantity}
                      </span>
                      <span className="font-medium">
                        {formatPrice(item.purchase_price * item.cart_quantity)}
                      </span>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between font-semibold">
                      <span>Total:</span>
                      <span>{formatPrice(getTotalAmount())}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
        <button
          type="button"
          onClick={currentStep === 1 ? onClose : prevStep}
          className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          {currentStep === 1 ? "Cancel" : "Previous"}
        </button>

        <div className="flex space-x-3">
          {currentStep < 3 ? (
            <button
              type="button"
              onClick={nextStep}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          ) : (
            <button
              onClick={handleSubmit(onSubmit)}
              disabled={isLoading || cart.length === 0}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading
                ? "Creating..."
                : editingOrder
                ? "Update Order"
                : "Create Order"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
