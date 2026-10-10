import { describe, it, expect } from "vitest";
import {
  round2,
  formatInvoiceNumber,
  validateInvoiceData,
  toDateString,
} from "../src/firebase/invoice";


describe("Invoice Business Logic Unit Tests", () => {
  describe("round2 (floating point precision helper)", () => {
    it("rounds decimals correctly to 2 places", () => {
      expect(round2(10.254)).toBe(10.25);
      expect(round2(10.256)).toBe(10.26);
      expect(round2(0.1 + 0.2)).toBe(0.3);
    });

    it("handles zero, null, undefined and negative numbers safely", () => {
      expect(round2(0)).toBe(0);
      expect(round2(null)).toBe(0);
      expect(round2(undefined)).toBe(0);
      expect(round2(-5.555)).toBe(-5.56);
    });

    it("correctly rounds GST calculation (18%)", () => {
      const price = 499;
      const qty = 3;
      const subtotal = round2(price * qty); // 1497
      const taxAmount = round2((subtotal * 18) / 100); // 269.46
      const total = round2(subtotal + taxAmount); // 1766.46

      expect(subtotal).toBe(1497);
      expect(taxAmount).toBe(269.46);
      expect(total).toBe(1766.46);
    });
  });

  describe("formatInvoiceNumber", () => {
    it("formats with standard prefix and 3-digit padding", () => {
      expect(formatInvoiceNumber(1)).toBe("INV-001");
      expect(formatInvoiceNumber(25)).toBe("INV-025");
      expect(formatInvoiceNumber(999)).toBe("INV-999");
    });

    it("gracefully exceeds padding without breaking at INV-1000", () => {
      expect(formatInvoiceNumber(1000)).toBe("INV-1000");
      expect(formatInvoiceNumber(12500)).toBe("INV-12500");
    });

    it("supports custom prefix and padding", () => {
      expect(formatInvoiceNumber(7, "ACME-", 4)).toBe("ACME-0007");
    });
  });

  describe("toDateString date normalization helper", () => {
    it("converts Date, Firestore Timestamp-like and ISO string to YYYY-MM-DD", () => {
      expect(toDateString("2026-04-15T10:30:00.000Z")).toBe("2026-04-15");
      expect(toDateString(new Date("2026-05-20T00:00:00Z"))).toBe("2026-05-20");
      expect(toDateString({ toDate: () => new Date("2026-06-01T00:00:00Z") })).toBe("2026-06-01");
      expect(toDateString(null)).toBe("");
    });
  });

  describe("validateInvoiceData (GST date & business rules)", () => {

    const validClient = { name: "Acme Corporation", email: "billing@acme.com" };
    const validItems = [{ id: "p1", title: "Item 1", price: 100, quantity: 1 }];

    it("succeeds for fresh invoice created with customer, items, status, and today's date", () => {
      expect(() => {
        validateInvoiceData({
          client: validClient,
          status: "Pending",
          invoiceDate: new Date().toISOString(),
          items: validItems,
        });
      }).not.toThrow();
    });

    it("fails when customer is missing or empty", () => {
      expect(() => {
        validateInvoiceData({
          status: "Pending",
          invoiceDate: new Date().toISOString(),
          items: validItems,
        });
      }).toThrow(/Customer name is required/i);
    });

    it("fails when line items are missing product title or have invalid price/qty", () => {
      expect(() => {
        validateInvoiceData({
          client: validClient,
          status: "Pending",
          invoiceDate: new Date().toISOString(),
          items: [{ id: "p1", title: "", price: 100, quantity: 1 }],
        });
      }).toThrow(/must have a product title/i);

      expect(() => {
        validateInvoiceData({
          client: validClient,
          status: "Pending",
          invoiceDate: new Date().toISOString(),
          items: [{ id: "p1", title: "Prod", price: -10, quantity: 1 }],
        });
      }).toThrow(/cannot be negative/i);
    });

    it("fails when settlement status is missing", () => {
      expect(() => {
        validateInvoiceData({
          client: validClient,
          status: "",
          invoiceDate: new Date().toISOString(),
          items: validItems,
        });
      }).toThrow(/Payment status.*is mandatory/i);
    });

    it("fails when invoiceDate is in the future", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);
      expect(() => {
        validateInvoiceData({
          client: validClient,
          status: "Pending",
          invoiceDate: tomorrow.toISOString(),
          items: validItems,
        });
      }).toThrow(/Invoice date cannot be in the future/i);
    });

    it("fails when new invoice is backdated more than 90 days", () => {
      const past120Days = new Date();
      past120Days.setDate(past120Days.getDate() - 120);
      expect(() => {
        validateInvoiceData({
          client: validClient,
          status: "Pending",
          invoiceDate: past120Days.toISOString(),
          items: validItems,
        });
      }).toThrow(/cannot be more than 90 days in the past/i);
    });

    it("succeeds when editing a 120-day-old invoice if date is NOT changed", () => {
      const past120Days = new Date();
      past120Days.setDate(past120Days.getDate() - 120);

      expect(() => {
        validateInvoiceData(
          {
            client: validClient,
            invoiceDate: past120Days.toISOString(),
            status: "Pending",
            items: validItems,
          },
          past120Days.toISOString() // existingDate matches
        );
      }).not.toThrow();
    });

    it("fails when editing an invoice and changing its date to 120 days in the past", () => {
      const originalDate = new Date();
      originalDate.setDate(originalDate.getDate() - 30); // Originally 30 days ago

      const newDate = new Date();
      newDate.setDate(newDate.getDate() - 120); // Changed to 120 days ago

      expect(() => {
        validateInvoiceData(
          {
            client: validClient,
            status: "Pending",
            invoiceDate: newDate.toISOString(),
            items: validItems,
          },
          originalDate.toISOString()
        );
      }).toThrow(/cannot be more than 90 days in the past/i);
    });

    it("fails when editing an invoice with a future date even if date matches existing", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);

      expect(() => {
        validateInvoiceData(
          {
            client: validClient,
            status: "Pending",
            invoiceDate: futureDate.toISOString(),
            items: validItems,
          },
          futureDate.toISOString()
        );
      }).toThrow(/Invoice date cannot be in the future/i);
    });

    it("enforces paymentType when status is Paid", () => {
      expect(() => {
        validateInvoiceData({
          client: validClient,
          invoiceDate: new Date().toISOString(),
          items: validItems,
          status: "Paid",
        });
      }).toThrow(/Payment method.*is mandatory for Paid status/i);

      expect(() => {
        validateInvoiceData({
          client: validClient,
          invoiceDate: new Date().toISOString(),
          items: validItems,
          status: "Paid",
          paymentType: "UPI",
        });
      }).not.toThrow();
    });
  });
});


