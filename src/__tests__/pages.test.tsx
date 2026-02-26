import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  FileText: (props: Record<string, unknown>) => <svg data-testid="icon-filetext" {...props} />,
  Brain: (props: Record<string, unknown>) => <svg data-testid="icon-brain" {...props} />,
  Mail: (props: Record<string, unknown>) => <svg data-testid="icon-mail" {...props} />,
  ArrowRight: (props: Record<string, unknown>) => <svg data-testid="icon-arrowright" {...props} />,
  Check: (props: Record<string, unknown>) => <svg data-testid="icon-check" {...props} />,
}));

describe("Landing Page", () => {
  it("renders without errors", async () => {
    const { default: LandingPage } = await import("@/app/page");
    render(<LandingPage />);
    const elements = screen.getAllByText("CoachCanvas");
    expect(elements.length).toBeGreaterThan(0);
  });

  it("renders hero section", async () => {
    const { default: LandingPage } = await import("@/app/page");
    render(<LandingPage />);
    expect(screen.getByText(/5分で完了/)).toBeInTheDocument();
  });

  it("renders features section", async () => {
    const { default: LandingPage } = await import("@/app/page");
    render(<LandingPage />);
    expect(screen.getByText("カルテ管理")).toBeInTheDocument();
    expect(screen.getByText("AIセッション要約")).toBeInTheDocument();
    expect(screen.getByText("フォローアップメール自動生成")).toBeInTheDocument();
  });

  it("renders pricing section", async () => {
    const { default: LandingPage } = await import("@/app/page");
    render(<LandingPage />);
    expect(screen.getByText("料金プラン")).toBeInTheDocument();
    expect(screen.getByText("Free")).toBeInTheDocument();
    expect(screen.getByText("Pro")).toBeInTheDocument();
    expect(screen.getByText("Team")).toBeInTheDocument();
  });

  it("renders CTA links", async () => {
    const { default: LandingPage } = await import("@/app/page");
    render(<LandingPage />);
    const links = screen.getAllByText("無料で始める");
    expect(links.length).toBeGreaterThan(0);
  });

  it("renders login link", async () => {
    const { default: LandingPage } = await import("@/app/page");
    render(<LandingPage />);
    expect(screen.getByText("ログイン")).toBeInTheDocument();
  });
});
