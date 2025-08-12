import { Download, FileText } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface CartItem {
  id: string;
  productName: string;
  sku: string;
  unitPrice: number;
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
  shippingMethod: string;
  paymentTerms: string;
}

interface InvoicePreviewProps {
  orderNumber: string;
  customerInfo: CustomerInfo;
  cart: CartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  onCreateOrder: () => void;
  loading: boolean;
}

export function InvoicePreview({
  orderNumber,
  customerInfo,
  cart,
  subtotal,
  tax,
  shipping,
  total,
  onCreateOrder,
  loading,
}: InvoicePreviewProps) {
  const downloadPDF = async () => {
    const element = document.getElementById("invoice-content");
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`invoice-${orderNumber}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Invoice Preview
          </h3>
          <button
            onClick={downloadPDF}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      <div id="invoice-content" className="p-8 bg-white">
        {/* Invoice Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">INVOICE</h1>
            <div className="text-gray-600">
              <p className="font-semibold">Your Business Name</p>
              <p>123 Business Street</p>
              <p>Business City, State 12345</p>
              <p>Phone: (555) 123-4567</p>
              <p>Email: business@example.com</p>
            </div>
          </div>
          <div className="text-right">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Invoice Number</p>
              <p className="text-xl font-bold text-blue-600">{orderNumber}</p>
              <p className="text-sm text-gray-600 mt-2">Date</p>
              <p className="font-semibold">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Customer Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Bill To:
            </h3>
            <div className="text-gray-700">
              <p className="font-semibold">{customerInfo.name}</p>
              <p>{customerInfo.email}</p>
              {customerInfo.phone && <p>{customerInfo.phone}</p>}
              <p>{customerInfo.address}</p>
              <p>
                {customerInfo.city}, {customerInfo.state} {customerInfo.zipCode}
              </p>
              {customerInfo.gstNumber && <p>GST: {customerInfo.gstNumber}</p>}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Order Details:
            </h3>
            <div className="text-gray-700">
              <p>
                <span className="font-medium">Shipping Method:</span>{" "}
                {customerInfo.shippingMethod}
              </p>
              <p>
                <span className="font-medium">Payment Terms:</span>{" "}
                {customerInfo.paymentTerms}
              </p>
              <p>
                <span className="font-medium">Due Date:</span>{" "}
                {new Date(
                  Date.now() +
                    (customerInfo.paymentTerms.includes("30") ? 30 : 15) *
                      24 *
                      60 *
                      60 *
                      1000
                ).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-900">
                  Item
                </th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-900">
                  SKU
                </th>
                <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-900">
                  Qty
                </th>
                <th className="border border-gray-300 px-4 py-3 text-right font-semibold text-gray-900">
                  Unit Price
                </th>
                <th className="border border-gray-300 px-4 py-3 text-right font-semibold text-gray-900">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item) => (
                <tr key={item.id}>
                  <td className="border border-gray-300 px-4 py-3">
                    {item.productName}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-gray-600">
                    {item.sku}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-center">
                    {item.cart_quantity}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-right">
                    ${item.unitPrice.toFixed(2)}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-right font-semibold">
                    ${(item.unitPrice * item.cart_quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-80">
            <div className="space-y-2">
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Tax (18% GST):</span>
                <span className="font-semibold">${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Shipping:</span>
                <span className="font-semibold">${shipping.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-300 pt-2">
                <div className="flex justify-between py-2">
                  <span className="text-lg font-bold text-gray-900">
                    Total:
                  </span>
                  <span className="text-xl font-bold text-blue-600">
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="text-center text-gray-600">
            <p className="font-semibold mb-2">Thank you for your business!</p>
            <p className="text-sm">
              If you have any questions about this invoice, please contact us at
              business@example.com
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-6 border-t border-gray-200 bg-gray-50">
        <div className="flex justify-end space-x-4">
          <button
            onClick={downloadPDF}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Download PDF</span>
          </button>
          <button
            onClick={onCreateOrder}
            disabled={loading}
            className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{loading ? "Creating Order..." : "Create Sales Order"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
