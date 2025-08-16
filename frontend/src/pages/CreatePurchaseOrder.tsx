import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Package,
  CheckCircle,
  User,
  Trash2,
  ShoppingCart,
  Plus,
  Minus,
  Search,
  UserPlus,
  X,
} from "lucide-react";
import { apiClient, InventoryItem, Supplier } from "../lib/api";
import { supplierService } from "../lib/SupplierService";
import { useAuth } from "../hooks/useAuth";

interface CartItem {
  product: InventoryItem;
  quantity: number;
  cost_per_unit: number;
  total: number;
}

interface OrderData {
  supplier_id: string;
  expected_delivery_date: string;
  notes: string;
  items: CartItem[];
}

export function CreatePurchaseOrder() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const isEditMode = Boolean(id);

  const [currentStep, setCurrentStep] = useState(1);
  const [products, setProducts] = useState<InventoryItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingOrder, setIsLoadingOrder] = useState(isEditMode);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [supplierSearchTerm, setSupplierSearchTerm] = useState("");
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [showCreateSupplierModal, setShowCreateSupplierModal] = useState(false);
  const [isCreatingSupplier, setIsCreatingSupplier] = useState(false);
  const [newSupplierForm, setNewSupplierForm] = useState({
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
  });

  const [orderData, setOrderData] = useState<OrderData>({
    supplier_id: "",
    expected_delivery_date: "",
    notes: "",
    items: [],
  });

  const [orderNumber, setOrderNumber] = useState(
    () => `PO-${Date.now().toString().slice(-6)}`
  );

  console.log("🔍 Current orderData:", orderData);
  console.log("🔍 Is edit mode:", isEditMode);
  console.log("🔍 Order ID:", id);
  console.log("🔍 Suppliers loaded:", suppliers.length);
  console.log("🔍 Is loading order:", isLoadingOrder);

  // Filter products based on search term
  const filteredProducts = products.filter(
    (product) =>
      product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (user) {
      fetchProducts();
      fetchSuppliers();
    }
  }, [user]);

  // Separate effect for fetching purchase order after suppliers are loaded
  useEffect(() => {
    if (isEditMode && id && suppliers.length > 0) {
      fetchPurchaseOrder(id);
    }
  }, [isEditMode, id, suppliers.length]);

  // Close supplier dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".supplier-dropdown-container")) {
        setShowSupplierDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchPurchaseOrder = async (orderId: string) => {
    try {
      setIsLoadingOrder(true);
      const response = await apiClient.getPurchaseOrder(orderId);
      console.log("📦 Fetched purchase order response:", response);

      if (response.success && response.data) {
        const order = response.data;
        console.log("📦 Purchase order data:", order);

        // Try to find the supplier by ID first, then by name/email
        let supplierId = "";
        if (order.supplierId) {
          supplierId = order.supplierId;
        } else if (order.supplierName) {
          // Try to find supplier by name
          const matchingSupplier = suppliers.find(
            (s) =>
              s.name === order.supplierName || s.email === order.supplierEmail
          );
          if (matchingSupplier) {
            supplierId = matchingSupplier.id;
          }
        }

        // Update order data
        setOrderData({
          supplier_id: supplierId,
          expected_delivery_date: order.expectedDelivery
            ? order.expectedDelivery.split("T")[0]
            : "", // Convert to YYYY-MM-DD
          notes: order.notes || "",
          items: [],
        });

        // Load purchase order items into cart if they exist
        if (order.items && order.items.length > 0) {
          const cartItems = order.items.map((item: any) => ({
            product: item.inventory,
            quantity: item.quantity,
            cost_per_unit: item.costPerUnit || 0,
            total: item.totalCost || 0,
          }));
          setCart(cartItems);
          console.log("📦 Loaded cart items:", cartItems);
        }

        console.log("📦 Set order data:", {
          supplier_id: supplierId,
          expected_delivery_date: order.expectedDelivery
            ? order.expectedDelivery.split("T")[0]
            : "",
          notes: order.notes || "",
        });

        // Update order number
        setOrderNumber(order.poNumber);

        // Note: Cart items would need to be loaded separately if they're stored
        // For now, we'll start with an empty cart in edit mode
      }
    } catch (error) {
      console.error("Error fetching purchase order:", error);
      setError("Failed to load purchase order data");
    } finally {
      setIsLoadingOrder(false);
    }
  };

  const fetchProducts = async () => {
    if (!user) return;

    try {
      const response = await apiClient.getInventory();
      if (response.success && response.data) {
        // Filter only products with stock for purchase orders
        const availableProducts = response.data.filter(
          (product) => product.quantity >= 0
        );
        setProducts(availableProducts);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const suppliers = await supplierService.getActive();
      setSuppliers(suppliers);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      setError("Failed to load suppliers");
    }
  };

  const handleCreateSupplier = async () => {
    if (
      !newSupplierForm.name ||
      !newSupplierForm.contactPerson ||
      !newSupplierForm.email
    ) {
      setError("Please fill in all required fields for the new supplier");
      return;
    }

    setIsCreatingSupplier(true);
    try {
      const newSupplier = await supplierService.create({
        ...newSupplierForm,
        isActive: true,
      });

      // Add the new supplier to the list
      setSuppliers((prev) => [...prev, newSupplier]);

      // Select the newly created supplier
      setOrderData({
        ...orderData,
        supplier_id: newSupplier.id,
      });

      // Close modal and reset form
      setShowCreateSupplierModal(false);
      setShowSupplierDropdown(false);
      setSupplierSearchTerm("");
      setNewSupplierForm({
        name: "",
        contactPerson: "",
        email: "",
        phone: "",
        address: "",
      });
      setError("");
    } catch (error) {
      console.error("Error creating supplier:", error);
      setError("Failed to create supplier. Please try again.");
    } finally {
      setIsCreatingSupplier(false);
    }
  };

  const handleSelectSupplier = (supplierId: string) => {
    console.log("🔄 Supplier changed to:", supplierId);
    setOrderData({
      ...orderData,
      supplier_id: supplierId,
    });
    setShowSupplierDropdown(false);
    setSupplierSearchTerm("");
  };

  const addToCart = (product: InventoryItem) => {
    const existingItem = cart.find((item) => item.product.id === product.id);

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                total: (item.quantity + 1) * item.cost_per_unit,
              }
            : item
        )
      );
    } else {
      // Add with default cost per unit from product's unitPrice
      const defaultCost = product.unitPrice || 0;
      setCart([
        ...cart,
        {
          product,
          quantity: 1,
          cost_per_unit: defaultCost,
          total: defaultCost,
        },
      ]);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(
      cart.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              quantity,
              total: quantity * item.cost_per_unit,
            }
          : item
      )
    );
  };

  const updateCartCost = (productId: string, costPerUnit: number) => {
    setCart(
      cart.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              cost_per_unit: costPerUnit,
              total: item.quantity * costPerUnit,
            }
          : item
      )
    );
  };

  const getTotalAmount = () => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return cart.length > 0;
      case 2:
        return orderData.supplier_id && orderData.expected_delivery_date;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    if (!canProceedToNext()) return;

    setIsLoading(true);
    setError("");

    try {
      // Get selected supplier details
      const selectedSupplier = suppliers.find(
        (s) => s.id === orderData.supplier_id
      );

      if (!selectedSupplier) {
        setError("Please select a supplier");
        setIsLoading(false);
        return;
      }

      // Prepare data in the format expected by the backend
      const purchaseOrderData = {
        poNumber: orderNumber,
        supplierName: selectedSupplier.name,
        supplierEmail: selectedSupplier.email || "",
        totalAmount: getTotalAmount(),
        status: "PENDING" as const,
        orderDate: new Date().toISOString().split("T")[0], // Current date in YYYY-MM-DD format
        expectedDelivery: orderData.expected_delivery_date,
        supplierId: orderData.supplier_id,
        notes: orderData.notes,
        items: cart, // Additional field for the items (might be handled separately)
      };

      console.log("📦 Submitting purchase order:", purchaseOrderData);

      let response;
      if (isEditMode && id) {
        response = await apiClient.updatePurchaseOrder(id, purchaseOrderData);
      } else {
        response = await apiClient.createPurchaseOrder(purchaseOrderData);
      }

      if (response.success) {
        navigate("/purchase-orders", {
          state: {
            message: isEditMode
              ? "Purchase order updated successfully!"
              : "Purchase order created successfully!",
          },
        });
      } else {
        setError(response.message || "Failed to create purchase order");
      }
    } catch (error) {
      setError("An error occurred while creating the purchase order");
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { id: 1, name: "Select Products", icon: Package },
    { id: 2, name: "Supplier Info", icon: User },
    { id: 3, name: "Review & Submit", icon: CheckCircle },
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="flex-1 flex">
            {/* Products Section */}
            <div className="flex-1 pr-4">
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="border border-gray-200 rounded-md p-3 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h5 className="text-sm font-medium text-gray-900">
                          {product.productName}
                        </h5>
                        <p className="text-xs text-gray-500">
                          {product.category}
                        </p>
                        <p className="text-xs text-gray-400">
                          Stock: {product.quantity}
                        </p>
                        <span className="inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 mt-1">
                          {product.category}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => addToCart(product)}
                      className="w-full bg-blue-600 text-white px-2.5 py-1.5 text-sm rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Add to Cart
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Cart Section */}
            <div className="w-80 bg-gray-50 rounded-md p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                <ShoppingCart className="h-4 w-4 mr-1.5" />
                Cart ({cart.length} items)
              </h3>

              {cart.length === 0 ? (
                <div className="text-center text-gray-500 py-6">
                  <ShoppingCart className="h-8 w-8 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">Your cart is empty</p>
                  <p className="text-xs">Add products to get started</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto mb-3">
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="bg-white rounded-md p-2.5 border border-gray-200"
                    >
                      <div className="flex justify-between items-start mb-1.5">
                        <div className="flex-1">
                          <h6 className="text-xs font-medium text-gray-900">
                            {item.product.productName}
                          </h6>
                          <p className="text-xs text-gray-500">
                            {item.product.category}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-red-500 hover:text-red-700 p-0.5"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() =>
                              updateCartQuantity(
                                item.product.id,
                                item.quantity - 1
                              )
                            }
                            className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
                          >
                            <Minus className="h-2.5 w-2.5" />
                          </button>
                          <span className="w-8 text-center text-xs font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateCartQuantity(
                                item.product.id,
                                item.quantity + 1
                              )
                            }
                            className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
                          >
                            <Plus className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      </div>

                      {/* Cost per Unit Input */}
                      <div className="mb-1.5">
                        <label className="block text-xs font-medium text-gray-700 mb-0.5">
                          Cost per Unit ($)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.cost_per_unit || ""}
                          onChange={(e) => {
                            const costPerUnit = parseFloat(e.target.value) || 0;
                            updateCartCost(item.product.id, costPerUnit);
                          }}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter cost"
                        />
                      </div>

                      {/* Total */}
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Total:</span>
                        <span className="text-xs font-semibold text-gray-900">
                          ${item.total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {cart.length > 0 && (
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-900">
                      Subtotal:
                    </span>
                    <span className="text-lg font-bold text-blue-600">
                      ${getTotalAmount().toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 2:
        // Filter suppliers based on search term
        const filteredSuppliers = suppliers.filter(
          (supplier) =>
            supplier.name
              .toLowerCase()
              .includes(supplierSearchTerm.toLowerCase()) ||
            supplier.email
              .toLowerCase()
              .includes(supplierSearchTerm.toLowerCase()) ||
            supplier.contactPerson
              .toLowerCase()
              .includes(supplierSearchTerm.toLowerCase())
        );

        // Get selected supplier for display
        const selectedSupplier = suppliers.find(
          (s) => s.id === orderData.supplier_id
        );

        return (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg p-4">
              <h3 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                <User className="h-4 w-4 mr-1.5" />
                Supplier Information
              </h3>

              <div className="space-y-4">
                {/* Supplier Search/Selection */}
                <div className="relative supplier-dropdown-container">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Select Supplier *
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowCreateSupplierModal(true)}
                      className="flex items-center text-xs text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <UserPlus className="h-3 w-3 mr-1" />
                      New Supplier
                    </button>
                  </div>

                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder={
                        selectedSupplier
                          ? selectedSupplier.name
                          : "Search suppliers by name, email, or contact person..."
                      }
                      value={supplierSearchTerm}
                      onChange={(e) => {
                        setSupplierSearchTerm(e.target.value);
                        setShowSupplierDropdown(true);
                      }}
                      onFocus={() => setShowSupplierDropdown(true)}
                      className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Supplier Dropdown */}
                  {showSupplierDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredSuppliers.length > 0 ? (
                        filteredSuppliers.map((supplier) => (
                          <button
                            key={supplier.id}
                            onClick={() => handleSelectSupplier(supplier.id)}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                          >
                            <div className="text-sm font-medium text-gray-900">
                              {supplier.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {supplier.email} • {supplier.contactPerson}
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-gray-500 text-center">
                          No suppliers found.{" "}
                          <button
                            type="button"
                            onClick={() => {
                              setShowCreateSupplierModal(true);
                              setShowSupplierDropdown(false);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Create new supplier
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Clear selection button */}
                  {selectedSupplier && (
                    <button
                      type="button"
                      onClick={() => {
                        setOrderData({ ...orderData, supplier_id: "" });
                        setSupplierSearchTerm("");
                      }}
                      className="absolute right-2 top-8 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expected Delivery Date *
                  </label>
                  <input
                    type="date"
                    value={orderData.expected_delivery_date}
                    onChange={(e) => {
                      console.log("📅 Date changed to:", e.target.value);
                      setOrderData({
                        ...orderData,
                        expected_delivery_date: e.target.value,
                      });
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={orderData.notes}
                    onChange={(e) =>
                      setOrderData({ ...orderData, notes: e.target.value })
                    }
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Add any special instructions or notes for this purchase order..."
                  />
                </div>
              </div>

              {/* Selected Supplier Details */}
              {orderData.supplier_id && selectedSupplier && (
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 mt-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">
                    Selected Supplier Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="font-medium text-gray-700">
                        Contact Person:
                      </span>
                      <span className="ml-2 text-gray-900">
                        {selectedSupplier.contactPerson}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Email:</span>
                      <span className="ml-2 text-gray-900">
                        {selectedSupplier.email}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Phone:</span>
                      <span className="ml-2 text-gray-900">
                        {selectedSupplier.phone}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">
                        Address:
                      </span>
                      <span className="ml-2 text-gray-900">
                        {selectedSupplier.address}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-md font-semibold text-gray-900 mb-3">
                Review Purchase Order
              </h2>
              <p className="text-xs text-gray-600 mb-4">
                Please review all details before submitting your purchase order.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Order Summary */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                    Order Details
                  </h3>
                  <div className="space-y-1 text-xs">
                    <div>
                      <span className="font-medium text-gray-700">
                        Order Number:
                      </span>
                      <span className="ml-2 text-gray-900">{orderNumber}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">
                        Expected Delivery:
                      </span>
                      <span className="ml-2 text-gray-900">
                        {new Date(
                          orderData.expected_delivery_date
                        ).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">
                        Total Amount:
                      </span>
                      <span className="ml-2 text-gray-900 font-semibold">
                        ${getTotalAmount().toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                    Supplier Information
                  </h3>
                  {(() => {
                    const selectedSupplier = suppliers.find(
                      (s) => s.id === orderData.supplier_id
                    );
                    if (!selectedSupplier) return null;

                    return (
                      <div className="space-y-1 text-xs">
                        <div>
                          <span className="font-medium text-gray-700">
                            Company:
                          </span>
                          <span className="ml-2 text-gray-900">
                            {selectedSupplier.name}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">
                            Contact:
                          </span>
                          <span className="ml-2 text-gray-900">
                            {selectedSupplier.contactPerson}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">
                            Email:
                          </span>
                          <span className="ml-2 text-gray-900">
                            {selectedSupplier.email}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">
                            Phone:
                          </span>
                          <span className="ml-2 text-gray-900">
                            {selectedSupplier.phone}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {orderData.notes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                    Notes
                  </h3>
                  <p className="text-xs text-gray-700 bg-gray-50 p-2 rounded-md">
                    {orderData.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Items List */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Order Items
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit Cost
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {cart.map((item) => (
                      <tr key={item.product.id}>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div>
                            <div className="text-xs font-medium text-gray-900">
                              {item.product.productName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {item.product.category}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                          {item.quantity}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                          ${item.cost_per_unit.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                          ${item.total.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-gray-200 mt-3 pt-3">
                <div className="flex justify-end">
                  <div className="text-sm font-semibold text-gray-900">
                    Total: ${getTotalAmount().toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Create Supplier Modal */}
      {showCreateSupplierModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Create New Supplier
              </h3>
              <button
                onClick={() => {
                  setShowCreateSupplierModal(false);
                  setNewSupplierForm({
                    name: "",
                    contactPerson: "",
                    email: "",
                    phone: "",
                    address: "",
                  });
                  setError("");
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={newSupplierForm.name}
                  onChange={(e) =>
                    setNewSupplierForm({
                      ...newSupplierForm,
                      name: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter company name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Person *
                </label>
                <input
                  type="text"
                  value={newSupplierForm.contactPerson}
                  onChange={(e) =>
                    setNewSupplierForm({
                      ...newSupplierForm,
                      contactPerson: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter contact person name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={newSupplierForm.email}
                  onChange={(e) =>
                    setNewSupplierForm({
                      ...newSupplierForm,
                      email: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter email address"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={newSupplierForm.phone}
                  onChange={(e) =>
                    setNewSupplierForm({
                      ...newSupplierForm,
                      phone: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  value={newSupplierForm.address}
                  onChange={(e) =>
                    setNewSupplierForm({
                      ...newSupplierForm,
                      address: e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter full address"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowCreateSupplierModal(false);
                  setNewSupplierForm({
                    name: "",
                    contactPerson: "",
                    email: "",
                    phone: "",
                    address: "",
                  });
                  setError("");
                }}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSupplier}
                disabled={
                  isCreatingSupplier ||
                  !newSupplierForm.name ||
                  !newSupplierForm.contactPerson ||
                  !newSupplierForm.email
                }
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreatingSupplier ? "Creating..." : "Create Supplier"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading state for edit mode */}
      {isLoadingOrder && (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading purchase order...</p>
          </div>
        </div>
      )}

      {!isLoadingOrder && (
        <>
          {/* Header */}
          <div className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => navigate("/purchase-orders")}
                    className="p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors rounded-md"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div>
                    <h1 className="text-lg font-semibold text-gray-900">
                      {isEditMode
                        ? "Edit Purchase Order"
                        : "Create Purchase Order"}
                    </h1>
                    <p className="text-xs text-gray-600">
                      Order #{orderNumber}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step Navigation */}
          <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <nav aria-label="Progress">
                <ol className="flex items-center justify-center space-x-6">
                  {steps.map((step, index) => (
                    <li key={step.id} className="flex items-center">
                      <div className="flex items-center space-x-2">
                        <div
                          className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                            currentStep >= step.id
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "border-gray-300 text-gray-500"
                          }`}
                        >
                          {currentStep > step.id ? (
                            <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          ) : (
                            <step.icon className="w-4 h-4" />
                          )}
                        </div>
                        <div className="text-left">
                          <p
                            className={`text-sm font-medium ${
                              currentStep >= step.id
                                ? "text-blue-600"
                                : "text-gray-500"
                            }`}
                          >
                            {step.name}
                          </p>
                        </div>
                      </div>
                      {index < steps.length - 1 && (
                        <div
                          className={`w-12 h-0.5 ml-6 ${
                            currentStep > step.id
                              ? "bg-blue-600"
                              : "bg-gray-300"
                          }`}
                        />
                      )}
                    </li>
                  ))}
                </ol>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-7xl mx-auto px-4 py-5">
            {renderStepContent()}
          </div>

          {/* Footer Navigation */}
          <div className="bg-white border-t border-gray-200 px-4 py-3 fixed bottom-0 left-0 right-0">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Previous</span>
              </button>

              <div className="text-xs text-gray-500">
                Step {currentStep} of {steps.length}
              </div>

              {currentStep < steps.length ? (
                <button
                  onClick={handleNext}
                  disabled={!canProceedToNext()}
                  className="flex items-center space-x-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Next</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!canProceedToNext() || isLoading}
                  className="flex items-center space-x-1.5 px-4 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>
                    {isLoading
                      ? isEditMode
                        ? "Updating..."
                        : "Creating..."
                      : isEditMode
                      ? "Update Purchase Order"
                      : "Create Purchase Order"}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Bottom padding to account for fixed footer */}
          <div className="h-20"></div>
        </>
      )}
    </div>
  );
}
