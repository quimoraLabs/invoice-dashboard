import { describe, it, expect } from "vitest";
import {
  numberToWordsINR,
  extractStateCode,
  getStateDisplayName,
} from "../src/utils/numberToWords";

describe("numberToWordsINR Utility", () => {
  it("handles zero correctly", () => {
    expect(numberToWordsINR(0)).toBe("Rupees Zero Only");
    expect(numberToWordsINR("0")).toBe("Rupees Zero Only");
  });

  it("handles simple amounts without paise", () => {
    expect(numberToWordsINR(1)).toBe("Rupees One Only");
    expect(numberToWordsINR(50)).toBe("Rupees Fifty Only");
    expect(numberToWordsINR(100)).toBe("Rupees One Hundred Only");
    expect(numberToWordsINR(1000)).toBe("Rupees One Thousand Only");
    expect(numberToWordsINR(10000)).toBe("Rupees Ten Thousand Only");
    expect(numberToWordsINR(11800)).toBe("Rupees Eleven Thousand Eight Hundred Only");
  });

  it("handles amounts with decimal paise", () => {
    expect(numberToWordsINR(1234.56)).toBe(
      "Rupees One Thousand Two Hundred Thirty Four and Fifty Six Paise Only"
    );
    expect(numberToWordsINR(0.5)).toBe("Fifty Paise Only");
    expect(numberToWordsINR(0.05)).toBe("Five Paise Only");
  });

  it("handles Indian numbering system (Lakhs and Crores)", () => {
    expect(numberToWordsINR(100000)).toBe("Rupees One Lakh Only");
    expect(numberToWordsINR(2500000)).toBe("Rupees Twenty Five Lakh Only");
    expect(numberToWordsINR(10000000)).toBe("Rupees One Crore Only");
    expect(numberToWordsINR(12345678.9)).toBe(
      "Rupees One Crore Twenty Three Lakh Forty Five Thousand Six Hundred Seventy Eight and Ninety Paise Only"
    );
    expect(numberToWordsINR(1250000000)).toBe(
      "Rupees One Hundred Twenty Five Crore Only"
    );
  });

  it("handles negative or invalid amounts gracefully", () => {
    expect(numberToWordsINR(-100)).toBe("Invalid Amount");
    expect(numberToWordsINR("abc")).toBe("Invalid Amount");
  });
});

describe("extractStateCode and getStateDisplayName", () => {
  it("extracts state code from 15-digit GSTIN", () => {
    expect(extractStateCode("27AAPFU0939F1ZV")).toBe("27");
    expect(extractStateCode("29BBBBB1111B1Z6")).toBe("29");
  });

  it("respects explicit stateCode override", () => {
    expect(extractStateCode("27AAPFU0939F1ZV", "07")).toBe("07");
    expect(extractStateCode(null, "24")).toBe("24");
  });

  it("returns null when GSTIN is missing or invalid", () => {
    expect(extractStateCode(null)).toBeNull();
    expect(extractStateCode("")).toBeNull();
    expect(extractStateCode("INVALID")).toBeNull();
  });

  it("resolves state name with code", () => {
    expect(getStateDisplayName("27")).toBe("Maharashtra (27)");
    expect(getStateDisplayName("29")).toBe("Karnataka (29)");
    expect(getStateDisplayName(null, "Delhi")).toBe("Delhi");
    expect(getStateDisplayName(null, null)).toBe("Not specified");
  });
});
