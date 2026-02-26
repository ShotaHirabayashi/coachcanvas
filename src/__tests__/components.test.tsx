import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";

describe("Badge component", () => {
  it("renders children text", () => {
    render(<Badge>テスト</Badge>);
    expect(screen.getByText("テスト")).toBeInTheDocument();
  });

  it("applies variant classes", () => {
    render(<Badge variant="success">成功</Badge>);
    const badge = screen.getByText("成功");
    expect(badge.className).toContain("green");
  });
});

describe("StatusBadge component", () => {
  it("renders active status", () => {
    render(<StatusBadge status="active" />);
    expect(screen.getByText("アクティブ")).toBeInTheDocument();
  });

  it("renders completed status", () => {
    render(<StatusBadge status="completed" />);
    expect(screen.getByText("完了")).toBeInTheDocument();
  });

  it("renders scheduled status", () => {
    render(<StatusBadge status="scheduled" />);
    expect(screen.getByText("予定")).toBeInTheDocument();
  });

  it("renders cancelled status", () => {
    render(<StatusBadge status="cancelled" />);
    expect(screen.getByText("キャンセル")).toBeInTheDocument();
  });

  it("renders unknown status as-is", () => {
    render(<StatusBadge status="unknown" />);
    expect(screen.getByText("unknown")).toBeInTheDocument();
  });
});

describe("Card components", () => {
  it("renders Card with children", () => {
    render(<Card data-testid="card">カード内容</Card>);
    expect(screen.getByTestId("card")).toBeInTheDocument();
    expect(screen.getByText("カード内容")).toBeInTheDocument();
  });

  it("renders CardHeader", () => {
    render(<CardHeader data-testid="header">ヘッダー</CardHeader>);
    expect(screen.getByTestId("header")).toBeInTheDocument();
  });

  it("renders CardContent", () => {
    render(<CardContent data-testid="content">コンテンツ</CardContent>);
    expect(screen.getByTestId("content")).toBeInTheDocument();
  });

  it("renders CardFooter", () => {
    render(<CardFooter data-testid="footer">フッター</CardFooter>);
    expect(screen.getByTestId("footer")).toBeInTheDocument();
  });
});

describe("Button component", () => {
  it("renders with text", () => {
    render(<Button>クリック</Button>);
    expect(screen.getByText("クリック")).toBeInTheDocument();
  });

  it("renders as disabled when loading", () => {
    render(<Button loading>送信中</Button>);
    expect(screen.getByText("送信中").closest("button")).toBeDisabled();
  });

  it("renders as disabled", () => {
    render(<Button disabled>無効</Button>);
    expect(screen.getByText("無効").closest("button")).toBeDisabled();
  });

  it("renders different sizes", () => {
    const { container } = render(<Button size="lg">大きい</Button>);
    const button = container.querySelector("button");
    expect(button?.className).toContain("px-6");
  });
});

describe("Input component", () => {
  it("renders with label", () => {
    render(<Input label="名前" id="name" />);
    expect(screen.getByLabelText("名前")).toBeInTheDocument();
  });

  it("renders with error message", () => {
    render(<Input error="必須項目です" />);
    expect(screen.getByText("必須項目です")).toBeInTheDocument();
  });

  it("renders with placeholder", () => {
    render(<Input placeholder="入力してください" />);
    expect(screen.getByPlaceholderText("入力してください")).toBeInTheDocument();
  });
});

describe("Textarea component", () => {
  it("renders with label", () => {
    render(<Textarea label="メモ" id="notes" />);
    expect(screen.getByLabelText("メモ")).toBeInTheDocument();
  });

  it("renders with error message", () => {
    render(<Textarea error="入力エラー" />);
    expect(screen.getByText("入力エラー")).toBeInTheDocument();
  });
});
