import { describe, it, expect } from "vitest";
import { round2, formatInvoiceNumber } from "../src/firebase/invoice";

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
});
