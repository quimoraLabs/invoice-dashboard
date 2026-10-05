import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("B2B Responsive Breakpoints Configuration", () => {
  it("should declare the standardized B2B breakpoint tokens in src/index.css @theme block", () => {
    const cssPath = path.resolve(__dirname, "index.css");
    const cssContent = fs.readFileSync(cssPath, "utf-8");

    // Assert that the explicit standardized B2B breakpoints exist
    expect(cssContent).toContain("--breakpoint-xs: 390px;");
    expect(cssContent).toContain("--breakpoint-sm: 640px;");
    expect(cssContent).toContain("--breakpoint-md: 768px;");
    expect(cssContent).toContain("--breakpoint-lg: 1024px;");
    expect(cssContent).toContain("--breakpoint-xl: 1280px;");
    expect(cssContent).toContain("--breakpoint-2xl: 1536px;");

    // Assert that legacy deprecated breakpoints are completely removed
    expect(cssContent).not.toContain("--breakpoint-xsm");
    expect(cssContent).not.toContain("--breakpoint-sm: 720px");
    expect(cssContent).not.toContain("--breakpoint-lg: 1599px");
    expect(cssContent).not.toContain("--breakpoint-xl: 1999px");
  });
});
