import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ShoppingCart,
  User,
  FileText,
  Plus,
  Minus,
  Trash2,
  Search,
  UserPlus,
  X,
} from "lucide-react";
import { apiClient, InventoryItem, SalesOrder } from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import { InvoicePreview } from "../components/Invoice/InvoicePreview";
import { customerService } from "../lib/CustomerService";

interface CartItem extends InventoryItem {
  cart_quantity: number;
}

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  gstNumber: string;
  shippingMethod: "standard" | "express" | "overnight";
  paymentTerms: string;
}

interface OrderData {
  customer_id: string;
  shippingMethod: "standard" | "express" | "overnight";
  paymentTerms: string;
  notes: string;
}

export function CreateSalesOrder() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const isEditMode = Boolean(id);
  const [currentStep, setCurrentStep] = useState(1);
  const [products, setProducts] = useState<InventoryItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingOrder, setEditingOrder] = useState<SalesOrder | null>(null);
  const [orderData, setOrderData] = useState<OrderData>({
    customer_id: "",
    shippingMethod: "standard",
    paymentTerms: "Net 30",
    notes: "",
  });

  // Customer management states
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showCreateCustomerModal, setShowCreateCustomerModal] = useState(false);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
  });

  // Helper function to safely convert price to number and format
  const formatPrice = (price: any): string => {
    const numPrice = typeof price === "number" ? price : parseFloat(price) || 0;
    return numPrice.toFixed(2);
  };

  useEffect(() => {
    if (user) {
      fetchProducts();
      fetchCustomers();
      if (isEditMode && id) {
        fetchSalesOrder(id);
      } else {
        generateOrderNumber();
      }
    }
  }, [user, id, isEditMode]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".customer-dropdown-container")) {
        setShowCustomerDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchSalesOrder = async (orderId: string) => {
    try {
      const response = await apiClient.getSalesOrder(orderId);
      if (response.success && response.data) {
        const order = response.data;
        setEditingOrder(order);
        setOrderNumber(order.orderNumber);

        // Try to find the customer by name (fallback for existing orders)
        const existingCustomer = customers.find(
          (c) => c.name === order.customerName
        );

        if (existingCustomer) {
          setOrderData((prev) => ({
            ...prev,
            customer_id: existingCustomer.id,
          }));
        }

        // Load cart items if available
        if (order.items && order.items.length > 0) {
          const cartItems: CartItem[] = order.items.map((item) => ({
            ...item.inventory,
            unitPrice:
              typeof item.inventory.unitPrice === "number"
                ? item.inventory.unitPrice
                : parseFloat(item.inventory.unitPrice) || 0,
            cart_quantity: item.quantity,
          }));
          setCart(cartItems);
          console.log("Loaded cart items for edit:", cartItems);
        } else {
          console.log("No items found in sales order");
        }
      }
    } catch (error) {
      console.error("Error fetching sales order:", error);
    }
  };

  const fetchProducts = async () => {
    if (!user) return;

    try {
      const response = await apiClient.getInventory();
      if (response.success && response.data) {
        // Filter only products with stock
        const availableProducts = response.data.filter(
          (product) => product.quantity > 0
        );
        setProducts(availableProducts);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const fetchedCustomers = await customerService.getActive();
      setCustomers(fetchedCustomers);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const handleCreateCustomer = async () => {
    if (
      !newCustomerForm.name ||
      !newCustomerForm.contactPerson ||
      !newCustomerForm.email
    ) {
      return;
    }

    setIsCreatingCustomer(true);
    try {
      const newCustomer = await customerService.create({
        ...newCustomerForm,
        isActive: true,
      });

      // Add the new customer to the list
      setCustomers((prev) => [newCustomer, ...prev]);

      // Select the newly created customer
      setOrderData({
        ...orderData,
        customer_id: newCustomer.id,
      });

      // Close modal and reset form
      setShowCreateCustomerModal(false);
      setNewCustomerForm({
        name: "",
        contactPerson: "",
        email: "",
        phone: "",
        address: "",
      });
    } catch (error) {
      console.error("Error creating customer:", error);
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  const handleSelectCustomer = (customerId: string) => {
    setOrderData({
      ...orderData,
      customer_id: customerId,
    });
    setShowCustomerDropdown(false);
    setCustomerSearchTerm("");
  };

  const generateOrderNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    setOrderNumber(`SO-${timestamp}`);
  };

  const filteredProducts = products.filter(
    (product) =>
      product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product: InventoryItem, quantity: number = 1) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id
            ? {
                ...item,
                cart_quantity: Math.min(
                  item.cart_quantity + quantity,
                  item.quantity
                ),
              }
            : item
        );
      } else {
        return [
          ...prevCart,
          { ...product, cart_quantity: Math.min(quantity, product.quantity) },
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
      prevCart.map((item) => {
        if (item.id === productId) {
          const maxQuantity = item.quantity;
          return { ...item, cart_quantity: Math.min(newQuantity, maxQuantity) };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const getSubtotal = () => {
    return cart.reduce(
      (total, item) =>
        total +
        (typeof item.unitPrice === "number"
          ? item.unitPrice
          : parseFloat(item.unitPrice) || 0) *
          item.cart_quantity,
      0
    );
  };

  const getTax = () => {
    return getSubtotal() * 0.18; // 18% GST
  };

  const getShippingCost = () => {
    switch (orderData.shippingMethod) {
      case "express":
        return 25;
      case "overnight":
        return 50;
      default:
        return 10;
    }
  };

  const getTotal = () => {
    return getSubtotal() + getTax() + getShippingCost();
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return cart.length > 0;
      case 2:
        return orderData.customer_id !== "";
      case 3:
        return true;
      default:
        return false;
    }
  };

  const handleCreateOrder = async () => {
    if (!user) return;

    // Get selected customer details
    const selectedCustomer = customers.find(
      (c) => c.id === orderData.customer_id
    );
    if (!selectedCustomer) {
      console.error("No customer selected");
      return;
    }

    setLoading(true);
    try {
      const items = cart.map((item) => ({
        inventoryId: item.id,
        quantity: item.cart_quantity,
        unitPrice:
          typeof item.unitPrice === "number"
            ? item.unitPrice
            : parseFloat(item.unitPrice) || 0,
        totalPrice:
          (typeof item.unitPrice === "number"
            ? item.unitPrice
            : parseFloat(item.unitPrice) || 0) * item.cart_quantity,
      }));

      const salesOrderData = {
        orderNumber: orderNumber,
        customerName: selectedCustomer.name,
        customerEmail: selectedCustomer.email || "",
        totalAmount: getTotal(),
        status: "PENDING" as const,
        orderDate: new Date().toISOString().split("T")[0],
        items,
      };

      if (isEditMode && id) {
        const response = await apiClient.updateSalesOrder(id, salesOrderData);
        if (response.success) {
          navigate("/sales-orders", {
            state: { message: "Sales order updated successfully!" },
          });
        }
      } else {
        const response = await apiClient.createSalesOrder(salesOrderData);
        if (response.success) {
          // Update inventory quantities for new orders
          for (const item of cart) {
            await apiClient.updateInventoryItem(item.id, {
              quantity: item.quantity - item.cart_quantity,
            });
          }

          navigate("/sales-orders", {
            state: { message: "Sales order created successfully!" },
          });
        }
      }
    } catch (error) {
      console.error("Error saving sales order:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="flex-1 flex">
            {/* Products Section */}
            <div className="flex-1 pr-4">
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h5 className="text-sm font-medium text-gray-900">
                          {product.productName}
                        </h5>
                        <p className="text-xs text-gray-500">{product.sku}</p>
                        <p className="text-xs text-gray-400">
                          Stock: {product.quantity}
                        </p>
                        <span className="inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 mt-1">
                          {product.category}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        ${formatPrice(product.unitPrice)}
                      </span>
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
                      key={item.id}
                      className="bg-white rounded-md p-2.5 border border-gray-200"
                    >
                      <div className="flex justify-between items-start mb-1.5">
                        <div className="flex-1">
                          <h6 className="text-xs font-medium text-gray-900">
                            {item.productName}
                          </h6>
                          <p className="text-xs text-gray-500">{item.sku}</p>
                          <p className="text-xs font-semibold text-gray-900">
                            ${formatPrice(item.unitPrice)} each
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:text-red-700 p-0.5"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() =>
                              updateCartQuantity(
                                item.id,
                                item.cart_quantity - 1
                              )
                            }
                            className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
                          >
                            <Minus className="h-2.5 w-2.5" />
                          </button>
                          <span className="w-8 text-center text-xs font-medium">
                            {item.cart_quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateCartQuantity(
                                item.id,
                                item.cart_quantity + 1
                              )
                            }
                            className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
                          >
                            <Plus className="h-2.5 w-2.5" />
                          </button>
                        </div>
                        <span className="text-xs font-semibold text-gray-900">
                          $
                          {formatPrice(
                            (typeof item.unitPrice === "number"
                              ? item.unitPrice
                              : parseFloat(item.unitPrice) || 0) *
                              item.cart_quantity
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {cart.length > 0 && (
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-gray-900">
                      Subtotal:
                    </span>
                    <span className="text-sm font-bold text-blue-600">
                      ${getSubtotal().toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 2:
        // Filter customers based on search term
        const filteredCustomers = customers.filter(
          (customer) =>
            customer.name
              .toLowerCase()
              .includes(customerSearchTerm.toLowerCase()) ||
            customer.email
              .toLowerCase()
              .includes(customerSearchTerm.toLowerCase()) ||
            customer.contactPerson
              .toLowerCase()
              .includes(customerSearchTerm.toLowerCase())
        );

        // Get selected customer for display
        const selectedCustomer = customers.find(
          (c) => c.id === orderData.customer_id
        );

        return (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg p-4">
              <h3 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                <User className="h-4 w-4 mr-1.5" />
                Customer Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Customer Search/Selection */}
                <div className="relative customer-dropdown-container">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Select Customer *
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowCreateCustomerModal(true)}
                      className="flex items-center text-xs text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <UserPlus className="h-3 w-3 mr-1" />
                      New Customer
                    </button>
                  </div>

                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder={
                        selectedCustomer
                          ? selectedCustomer.name
                          : "Search customers by name, email, or contact person..."
                      }
                      value={customerSearchTerm}
                      onChange={(e) => {
                        setCustomerSearchTerm(e.target.value);
                        setShowCustomerDropdown(true);
                      }}
                      onFocus={() => setShowCustomerDropdown(true)}
                      className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Customer Dropdown */}
                  {showCustomerDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredCustomers.length > 0 ? (
                        filteredCustomers.map((customer) => (
                          <button
                            key={customer.id}
                            onClick={() => handleSelectCustomer(customer.id)}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                          >
                            <div className="text-sm font-medium text-gray-900">
                              {customer.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {customer.email} • {customer.contactPerson}
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-gray-500 text-center">
                          No customers found.{" "}
                          <button
                            type="button"
                            onClick={() => {
                              setShowCreateCustomerModal(true);
                              setShowCustomerDropdown(false);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Create new customer
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Clear selection button */}
                  {selectedCustomer && (
                    <button
                      type="button"
                      onClick={() => {
                        setOrderData({ ...orderData, customer_id: "" });
                        setCustomerSearchTerm("");
                      }}
                      className="absolute right-2 top-8 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Shipping Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Shipping Method
                  </label>
                  <select
                    value={orderData.shippingMethod}
                    onChange={(e) =>
                      setOrderData({
                        ...orderData,
                        shippingMethod: e.target.value as
                          | "standard"
                          | "express"
                          | "overnight",
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="standard">Standard ($10)</option>
                    <option value="express">Express ($25)</option>
                    <option value="overnight">Overnight ($50)</option>
                  </select>
                </div>

                {/* Payment Terms */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Terms
                  </label>
                  <select
                    value={orderData.paymentTerms}
                    onChange={(e) =>
                      setOrderData({
                        ...orderData,
                        paymentTerms: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Net 30">Net 30</option>
                    <option value="Net 15">Net 15</option>
                    <option value="Due on Receipt">Due on Receipt</option>
                    <option value="Cash on Delivery">Cash on Delivery</option>
                  </select>
                </div>

                {/* Notes */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order Notes
                  </label>
                  <textarea
                    value={orderData.notes}
                    onChange={(e) =>
                      setOrderData({ ...orderData, notes: e.target.value })
                    }
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Add any special instructions or notes for this sales order..."
                  />
                </div>
              </div>

              {/* Selected Customer Details */}
              {orderData.customer_id && selectedCustomer && (
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 mt-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">
                    Selected Customer Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="font-medium text-gray-700">
                        Contact Person:
                      </span>
                      <span className="ml-2 text-gray-900">
                        {selectedCustomer.contactPerson || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Email:</span>
                      <span className="ml-2 text-gray-900">
                        {selectedCustomer.email || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Phone:</span>
                      <span className="ml-2 text-gray-900">
                        {selectedCustomer.phone || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">
                        Address:
                      </span>
                      <span className="ml-2 text-gray-900">
                        {selectedCustomer.address || "N/A"}
                      </span>
                    </div>
                    {selectedCustomer.city && (
                      <div>
                        <span className="font-medium text-gray-700">City:</span>
                        <span className="ml-2 text-gray-900">
                          {selectedCustomer.city}
                        </span>
                      </div>
                    )}
                    {selectedCustomer.state && (
                      <div>
                        <span className="font-medium text-gray-700">
                          State:
                        </span>
                        <span className="ml-2 text-gray-900">
                          {selectedCustomer.state}
                        </span>
                      </div>
                    )}
                    {selectedCustomer.zipCode && (
                      <div>
                        <span className="font-medium text-gray-700">
                          Zip Code:
                        </span>
                        <span className="ml-2 text-gray-900">
                          {selectedCustomer.zipCode}
                        </span>
                      </div>
                    )}
                    {selectedCustomer.companyType && (
                      <div>
                        <span className="font-medium text-gray-700">
                          Company Type:
                        </span>
                        <span className="ml-2 text-gray-900">
                          {selectedCustomer.companyType}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 3:
        const customerForInvoice = customers.find(
          (c) => c.id === orderData.customer_id
        );

        return (
          <div className="max-w-4xl mx-auto">
            <InvoicePreview
              orderNumber={orderNumber}
              customerInfo={{
                name: customerForInvoice?.name || "",
                email: customerForInvoice?.email || "",
                phone: customerForInvoice?.phone || "",
                address: customerForInvoice?.address || "",
                city: customerForInvoice?.city || "",
                state: customerForInvoice?.state || "",
                zipCode: customerForInvoice?.zipCode || "",
                gstNumber: "", // Add GST number to customer model if needed
                shippingMethod: orderData.shippingMethod,
                paymentTerms: orderData.paymentTerms,
              }}
              cart={cart}
              subtotal={getSubtotal()}
              tax={getTax()}
              shipping={getShippingCost()}
              total={getTotal()}
              onCreateOrder={handleCreateOrder}
              loading={loading}
            />
          </div>
        );

      default:
        return null;
    }
  };

  const steps = [
    {
      number: 1,
      title: "Cart",
      icon: ShoppingCart,
      description: "Add products to your order",
    },
    {
      number: 2,
      title: "Customer Info",
      icon: User,
      description: "Enter customer details",
    },
    {
      number: 3,
      title: "Invoice",
      icon: FileText,
      description: "Review and create order",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate("/sales-orders")}
                className="p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors rounded-md"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {isEditMode ? "Edit Sales Order" : "Create Sales Order"}
                </h1>
                <p className="text-xs text-gray-600">Order #{orderNumber}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Steps Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <nav aria-label="Progress">
            <ol className="flex items-center justify-center space-x-6">
              {steps.map((step, index) => (
                <li key={step.number} className="flex items-center">
                  <div className="flex items-center space-x-2">
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                        currentStep >= step.number
                          ? "bg-blue-600 border-blue-600 text-white"
                          : "border-gray-300 text-gray-500"
                      }`}
                    >
                      {currentStep > step.number ? (
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
                          currentStep >= step.number
                            ? "text-blue-600"
                            : "text-gray-500"
                        }`}
                      >
                        {step.title}
                      </p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-12 h-0.5 ml-6 ${
                        currentStep > step.number
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
      <div className="max-w-7xl mx-auto px-4 py-5">{renderStepContent()}</div>

      {/* Footer Navigation */}
      <div className="bg-white border-t border-gray-200 px-4 py-3 fixed bottom-0 left-0 right-0">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <button
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Previous</span>
          </button>

          <div className="text-xs text-gray-500">
            Step {currentStep} of {steps.length}
          </div>

          {currentStep < 3 ? (
            <button
              onClick={() => setCurrentStep(Math.min(3, currentStep + 1))}
              disabled={!canProceedToNextStep()}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Next</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              onClick={handleCreateOrder}
              disabled={loading || !canProceedToNextStep()}
              className="flex items-center space-x-1.5 px-4 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>
                {loading
                  ? isEditMode
                    ? "Updating..."
                    : "Creating..."
                  : isEditMode
                  ? "Update Order"
                  : "Create Order"}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Create Customer Modal */}
      {showCreateCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Create New Customer
              </h3>
              <button
                onClick={() => {
                  setShowCreateCustomerModal(false);
                  setNewCustomerForm({
                    name: "",
                    contactPerson: "",
                    email: "",
                    phone: "",
                    address: "",
                  });
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={newCustomerForm.name}
                  onChange={(e) =>
                    setNewCustomerForm({
                      ...newCustomerForm,
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
                  value={newCustomerForm.contactPerson}
                  onChange={(e) =>
                    setNewCustomerForm({
                      ...newCustomerForm,
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
                  value={newCustomerForm.email}
                  onChange={(e) =>
                    setNewCustomerForm({
                      ...newCustomerForm,
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
                  value={newCustomerForm.phone}
                  onChange={(e) =>
                    setNewCustomerForm({
                      ...newCustomerForm,
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
                  value={newCustomerForm.address}
                  onChange={(e) =>
                    setNewCustomerForm({
                      ...newCustomerForm,
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
                  setShowCreateCustomerModal(false);
                  setNewCustomerForm({
                    name: "",
                    contactPerson: "",
                    email: "",
                    phone: "",
                    address: "",
                  });
                }}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCustomer}
                disabled={
                  isCreatingCustomer ||
                  !newCustomerForm.name ||
                  !newCustomerForm.contactPerson ||
                  !newCustomerForm.email
                }
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreatingCustomer ? "Creating..." : "Create Customer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
