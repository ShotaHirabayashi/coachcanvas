import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock all database query modules
vi.mock("@/lib/queries/users", () => ({
  getDefaultUser: vi.fn(() => ({
    id: "user-1",
    email: "coach@example.com",
    name: "テストコーチ",
    plan: "free",
    ai_usage_count: 0,
    onboarding_completed: 1,
  })),
  updateUser: vi.fn((id: string, data: Record<string, unknown>) => ({
    id,
    ...data,
  })),
}));

vi.mock("@/lib/queries/clients", () => ({
  getClients: vi.fn(() => ({ clients: [], total: 0 })),
  createClient: vi.fn((userId: string, data: Record<string, unknown>) => ({
    id: "client-1",
    user_id: userId,
    ...data,
  })),
  getActiveClientCount: vi.fn(() => 1),
}));

vi.mock("@/lib/queries/sessions", () => ({
  getSessions: vi.fn(() => ({ sessions: [], total: 0 })),
  createSession: vi.fn(
    (userId: string, data: Record<string, unknown>) => ({
      id: "session-1",
      user_id: userId,
      ...data,
    })
  ),
}));

vi.mock("@/lib/queries/templates", () => ({
  getTemplates: vi.fn(() => [
    {
      id: "tpl-1",
      name: "ライフコーチング",
      is_system: 1,
    },
  ]),
  createTemplate: vi.fn(
    (userId: string, data: Record<string, unknown>) => ({
      id: "tpl-new",
      user_id: userId,
      ...data,
    })
  ),
}));

vi.mock("@/lib/queries/dashboard", () => ({
  getDashboardData: vi.fn(() => ({
    upcoming_sessions: [],
    pending_followup_count: 0,
    recent_sessions: [],
    stats: {
      total_clients: 5,
      sessions_this_month: 10,
      ai_usage_count: 2,
      ai_usage_limit: 5,
    },
  })),
}));

vi.mock("@/lib/queries/search", () => ({
  search: vi.fn(() => ({ clients: [], sessions: [] })),
}));

function createRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"), options);
}

describe("GET /api/clients", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with clients list", async () => {
    const { GET } = await import("@/app/api/clients/route");
    const req = createRequest("/api/clients");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("clients");
    expect(data).toHaveProperty("total");
  });
});

describe("GET /api/sessions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with sessions list", async () => {
    const { GET } = await import("@/app/api/sessions/route");
    const req = createRequest("/api/sessions");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("sessions");
    expect(data).toHaveProperty("total");
  });
});

describe("GET /api/templates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with templates list", async () => {
    const { GET } = await import("@/app/api/templates/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });
});

describe("GET /api/dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with dashboard data", async () => {
    const { GET } = await import("@/app/api/dashboard/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("upcoming_sessions");
    expect(data).toHaveProperty("stats");
  });
});

describe("GET /api/search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with empty results when no query", async () => {
    const { GET } = await import("@/app/api/search/route");
    const req = createRequest("/api/search");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({ clients: [], sessions: [] });
  });

  it("returns 200 with search results", async () => {
    const { GET } = await import("@/app/api/search/route");
    const req = createRequest("/api/search?q=田中");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("clients");
    expect(data).toHaveProperty("sessions");
  });
});

describe("GET /api/users/me", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with user data", async () => {
    const { GET } = await import("@/app/api/users/me/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("id");
    expect(data).toHaveProperty("name");
  });
});

describe("POST /api/clients", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 201 for valid client", async () => {
    const { POST } = await import("@/app/api/clients/route");
    const req = createRequest("/api/clients", {
      method: "POST",
      body: JSON.stringify({ name: "新規クライアント" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it("returns 400 for invalid data", async () => {
    const { POST } = await import("@/app/api/clients/route");
    const req = createRequest("/api/clients", {
      method: "POST",
      body: JSON.stringify({ name: "" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

describe("POST /api/sessions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 201 for valid session", async () => {
    const { POST } = await import("@/app/api/sessions/route");
    const req = createRequest("/api/sessions", {
      method: "POST",
      body: JSON.stringify({
        client_id: "client-1",
        scheduled_at: "2025-01-15T10:00:00",
      }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it("returns 400 for missing client_id", async () => {
    const { POST } = await import("@/app/api/sessions/route");
    const req = createRequest("/api/sessions", {
      method: "POST",
      body: JSON.stringify({ scheduled_at: "2025-01-15T10:00:00" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

describe("POST /api/templates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 201 for valid template", async () => {
    const { POST } = await import("@/app/api/templates/route");
    const req = createRequest("/api/templates", {
      method: "POST",
      body: JSON.stringify({
        name: "テスト用テンプレート",
        content: "## テンプレート内容",
      }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });
});

describe("POST /api/onboarding/complete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 for valid onboarding", async () => {
    const { POST } = await import("@/app/api/onboarding/complete/route");
    const req = createRequest("/api/onboarding/complete", {
      method: "POST",
      body: JSON.stringify({
        name: "コーチ名",
        specialty: "life",
      }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it("returns 400 for invalid onboarding data", async () => {
    const { POST } = await import("@/app/api/onboarding/complete/route");
    const req = createRequest("/api/onboarding/complete", {
      method: "POST",
      body: JSON.stringify({
        name: "",
        specialty: "invalid",
      }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
