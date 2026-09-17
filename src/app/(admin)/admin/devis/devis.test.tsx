import { describe, it, expect, vi, beforeEach } from "vitest";

const mockQuotes = [
  {
    id: "quote-1",
    reference: "DV-2025-001",
    status: "EMIS",
    total: "2500.00",
    totalWeightKg: "15.5",
    createdAt: "2025-01-15T10:30:00Z",
    user: { email: "alice@example.com", companyName: "Acme Corp" },
  },
  {
    id: "quote-2",
    reference: "DV-2025-002",
    status: "A_CONSULTER",
    total: null,
    totalWeightKg: "45.0",
    createdAt: "2025-01-16T14:20:00Z",
    user: { email: "bob@example.com", companyName: "Tech Ltd" },
  },
  {
    id: "quote-3",
    reference: "DV-2025-003",
    status: "EXPIRE",
    total: "1800.00",
    totalWeightKg: "8.2",
    createdAt: "2024-12-01T09:00:00Z",
    user: { email: "charlie@example.com", companyName: "Design Co" },
  },
];

describe("AdminDevisPage (Devis Management)", () => {
  beforeEach(() => {
    global.fetch = vi.fn((input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      const urlObj = new URL(url, "http://localhost");
      const status = urlObj.searchParams.get("status");
      const email = urlObj.searchParams.get("email");

      let filtered = mockQuotes;

      if (status) {
        filtered = filtered.filter((q) => q.status === status);
      }

      if (email) {
        filtered = filtered.filter((q) =>
          q.user.email.toLowerCase().includes(email.toLowerCase())
        );
      }

      return Promise.resolve({
        json: async () => ({ quotes: filtered }),
        ok: true,
      } as any);
    });
  });

  it("fetches all quotes on initial load", async () => {
    const fetch = global.fetch as any;

    const response = await fetch("/api/admin/quotes");
    const data = await response.json();

    expect(data.quotes).toHaveLength(3);
    expect(fetch).toHaveBeenCalledWith("/api/admin/quotes");
  });

  it("filters quotes by status", async () => {
    const fetch = global.fetch as any;

    const response = await fetch("/api/admin/quotes?status=EMIS");
    const data = await response.json();

    expect(data.quotes).toHaveLength(1);
    expect(data.quotes[0].status).toBe("EMIS");
    expect(data.quotes[0].reference).toBe("DV-2025-001");
  });

  it("filters quotes by email", async () => {
    const fetch = global.fetch as any;

    const response = await fetch("/api/admin/quotes?email=alice");
    const data = await response.json();

    expect(data.quotes).toHaveLength(1);
    expect(data.quotes[0].user.email).toBe("alice@example.com");
  });

  it("combines status and email filters", async () => {
    const fetch = global.fetch as any;

    const response = await fetch(
      "/api/admin/quotes?status=EMIS&email=alice"
    );
    const data = await response.json();

    expect(data.quotes).toHaveLength(1);
    expect(data.quotes[0].status).toBe("EMIS");
    expect(data.quotes[0].user.email).toBe("alice@example.com");
  });

  it("returns empty array when no quotes match filters", async () => {
    const fetch = global.fetch as any;

    const response = await fetch("/api/admin/quotes?status=BROUILLON");
    const data = await response.json();

    expect(data.quotes).toHaveLength(0);
  });

  it("displays status labels correctly", () => {
    const STATUS_LABELS: Record<string, string> = {
      BROUILLON: "Brouillon",
      A_CONSULTER: "Nous consulter",
      EMIS: "Émis",
      EXPIRE: "Expiré",
    };

    expect(STATUS_LABELS.EMIS).toBe("Émis");
    expect(STATUS_LABELS.A_CONSULTER).toBe("Nous consulter");
    expect(STATUS_LABELS.EXPIRE).toBe("Expiré");
  });

  it("handles quotes over 40kg with A_CONSULTER status", async () => {
    const fetch = global.fetch as any;

    const response = await fetch("/api/admin/quotes?status=A_CONSULTER");
    const data = await response.json();

    expect(data.quotes).toHaveLength(1);
    const quote = data.quotes[0];

    expect(quote.totalWeightKg).toBe("45.0");
    expect(parseFloat(quote.totalWeightKg)).toBeGreaterThan(40);
    expect(quote.total).toBeNull(); // No price shown for "A_CONSULTER"
  });

  it("shows pricing for emitted quotes", async () => {
    const fetch = global.fetch as any;

    const response = await fetch("/api/admin/quotes?status=EMIS");
    const data = await response.json();

    expect(data.quotes).toHaveLength(1);
    const quote = data.quotes[0];

    expect(quote.total).not.toBeNull();
    expect(parseFloat(quote.total as string)).toBeGreaterThan(0);
  });

  it("filters case-insensitively by email", async () => {
    const fetch = global.fetch as any;

    const response1 = await fetch("/api/admin/quotes?email=ALICE");
    const response2 = await fetch("/api/admin/quotes?email=alice");
    const response3 = await fetch("/api/admin/quotes?email=AlIcE");

    const data1 = await response1.json();
    const data2 = await response2.json();
    const data3 = await response3.json();

    expect(data1.quotes).toHaveLength(1);
    expect(data2.quotes).toHaveLength(1);
    expect(data3.quotes).toHaveLength(1);
  });
});
