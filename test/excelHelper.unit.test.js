import { describe, it, expect } from "vitest";
import {
  generateUniqueCode,
  normalizeCustomerRows,
  normalizeProductRows,
  normalizeInvoiceRows,
} from "../src/utils/excelHelper";

describe("excelHelper Unit Tests", () => {
  it("generates unique codes with correct prefix", () => {
    const code1 = generateUniqueCode("CUST");
    const code2 = generateUniqueCode("PRD");

    expect(code1.startsWith("CUST-")).toBe(true);
    expect(code2.startsWith("PRD-")).toBe(true);
    expect(code1).not.toBe(code2);
  });

  it("normalizes customer rows from raw Excel data correctly", () => {
    const rawRows = [
      {
        "Full Name": "Amit Verma",
        "Phone": "9876543210",
        "Email": "amit@example.com",
        "Address": "Mumbai",
      },
      {
        "Customer": "Incomplete Client",
        "Phone": "123", // Invalid phone
      },
    ];

    const result = normalizeCustomerRows(rawRows);

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Amit Verma");
    expect(result[0].phone).toBe("9876543210");
    expect(result[0].isValid).toBe(true);
    expect(result[0].customerCode.startsWith("CUST-")).toBe(true);

    expect(result[1].name).toBe("Incomplete Client");
    expect(result[1].isValid).toBe(false);
    expect(result[1].errors).toContain("Valid 10-digit phone is required");
  });

  it("normalizes product rows and validates required price and title", () => {
    const rawRows = [
      {
        "Title": "Cotton Shirt",
        "Rate": 599,
        "Category": "Clothing",
        "GST %": 12,
      },
      {
        "Product": "Free Gift",
        "Price": 0, // Invalid: price <= 0
      },
    ];

    const result = normalizeProductRows(rawRows);

    expect(result).toHaveLength(2);
    expect(result[0].title).toBe("Cotton Shirt");
    expect(result[0].price).toBe(599);
    expect(result[0].taxRate).toBe(12);
    expect(result[0].isValid).toBe(true);
    expect(result[0].itemCode.startsWith("PRD-")).toBe(true);

    expect(result[1].isValid).toBe(false);
    expect(result[1].errors).toContain("Price must be greater than 0");
  });

  it("normalizes invoice rows and validates required fields and payment modes", () => {
    const rawRows = [
      {
        "Customer Name": "Sharma Traders",
        "Item Title": "Keyboard",
        "Quantity": 2,
        "Unit Price": 500,
        "Tax Rate %": 18,
        "Payment Status": "Paid",
        "Payment Type": "UPI",
      },
      {
        "Customer Name": "Incomplete Client",
        "Item Title": "Mouse",
        "Unit Price": 200,
        "Payment Status": "Paid", // Missing payment type for paid status
      },
    ];

    const result = normalizeInvoiceRows(rawRows);

    expect(result).toHaveLength(2);
    expect(result[0].customerName).toBe("Sharma Traders");
    expect(result[0].itemTitle).toBe("Keyboard");
    expect(result[0].quantity).toBe(2);
    expect(result[0].price).toBe(500);
    expect(result[0].isValid).toBe(true);
    expect(result[0].paymentType).toBe("UPI");

    expect(result[1].isValid).toBe(false);
    expect(result[1].errors).toContain(
      "Payment type (UPI, Card, Cash) is required for Paid status"
    );
  });
});

