import { describe, it, expect } from "vitest";
import {
  cn,
  formatDate,
  formatDateTime,
  formatFullDate,
  formatTime,
  formatCurrency,
  stripMarkdown,
} from "@/lib/utils";

describe("cn (className merge)", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("resolves tailwind conflicts", () => {
    const result = cn("px-4", "px-6");
    expect(result).toBe("px-6");
  });
});

describe("formatDate", () => {
  it("formats a date string in Japanese format", () => {
    const result = formatDate("2025-01-15");
    expect(result).toMatch(/1月15日/);
  });
});

describe("formatDateTime", () => {
  it("formats date and time", () => {
    const result = formatDateTime("2025-03-20T14:30:00");
    expect(result).toMatch(/3月20日/);
    expect(result).toMatch(/14:30/);
  });
});

describe("formatFullDate", () => {
  it("includes year in format", () => {
    const result = formatFullDate("2025-06-01");
    expect(result).toMatch(/2025年6月1日/);
  });
});

describe("formatTime", () => {
  it("formats time portion", () => {
    expect(formatTime("2025-01-01T09:05:00")).toBe("09:05");
  });
});

describe("formatCurrency", () => {
  it("formats JPY currency", () => {
    const result = formatCurrency(4980);
    expect(result).toContain("4,980");
  });

  it("formats zero", () => {
    const result = formatCurrency(0);
    expect(result).toContain("0");
  });
});

describe("stripMarkdown", () => {
  it("strips headings", () => {
    expect(stripMarkdown("## Hello")).toBe("Hello");
  });

  it("strips bold", () => {
    expect(stripMarkdown("**bold text**")).toBe("bold text");
  });

  it("strips italic", () => {
    expect(stripMarkdown("*italic text*")).toBe("italic text");
  });

  it("strips list markers", () => {
    expect(stripMarkdown("- item one")).toBe("item one");
  });

  it("collapses multiple newlines", () => {
    expect(stripMarkdown("line1\n\n\nline2")).toBe("line1\nline2");
  });

  it("trims whitespace", () => {
    expect(stripMarkdown("  hello  ")).toBe("hello");
  });
});
