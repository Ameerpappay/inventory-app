import React, { useEffect, useState } from "react";
import { supplierService } from "../lib/SupplierService";
import { Supplier } from "../lib/api";

const SupplierTest: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const data = await supplierService.getAll();
      setSuppliers(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  };

  const createTestSupplier = async () => {
    try {
      await supplierService.create({
        name: `Test Supplier ${Date.now()}`,
        email: "test@example.com",
        phone: "+1-555-0123",
        address: "123 Test St",
        city: "Test City",
        state: "TS",
        zipCode: "12345",
        contactPerson: "Test Person",
        isActive: true,
      });
      loadSuppliers(); // Reload suppliers
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create supplier"
      );
    }
  };

  if (loading) return <div>Loading suppliers...</div>;
  if (error) return <div className="text-red-600">Error: {error}</div>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Supplier Service Test</h2>

      <button
        onClick={createTestSupplier}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Create Test Supplier
      </button>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">
          Suppliers ({suppliers.length}):
        </h3>
        {suppliers.length === 0 ? (
          <p>No suppliers found</p>
        ) : (
          suppliers.map((supplier) => (
            <div key={supplier.id} className="border p-3 rounded">
              <h4 className="font-medium">{supplier.name}</h4>
              <p className="text-sm text-gray-600">
                Contact: {supplier.contactPerson} | Email: {supplier.email}
              </p>
              <p className="text-sm text-gray-600">
                Status: {supplier.isActive ? "Active" : "Inactive"}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SupplierTest;
