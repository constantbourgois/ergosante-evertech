"use client";

import { useEffect, useState } from "react";

interface AdminUser {
  id: string;
  email: string;
  companyName: string | null;
  phone: string | null;
  role: string;
  emailVerifiedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  createdAt: string;
  discountRateId: string | null;
  discountRate: { id: string; name: string } | null;
}

interface Discount {
  id: string;
  name: string;
}

const STATUS_OPTIONS = [
  { value: "pending", label: "En attente" },
  { value: "approved", label: "Approuvés" },
  { value: "rejected", label: "Refusés" },
];

export default function ComptesPage() {
  const [status, setStatus] = useState("pending");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    const [usersRes, discountsRes] = await Promise.all([
      fetch(`/api/admin/users?status=${status}`),
      fetch("/api/admin/discounts"),
    ]);
    const usersBody = await usersRes.json();
    const discountsBody = await discountsRes.json();
    setUsers(usersBody.users ?? []);
    setDiscounts(discountsBody.discounts ?? []);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- rechargement volontaire au changement de filtre
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function act(id: string, action: "approve" | "reject") {
    await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action }),
    });
    refresh();
  }

  async function setDiscount(id: string, discountRateId: string | null) {
    await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "set-discount", discountRateId }),
    });
    refresh();
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
      <h1 className="text-2xl font-semibold">Comptes</h1>
      <div className="flex gap-2">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setStatus(opt.value)}
            className={`rounded-full border px-4 py-1.5 text-sm ${
              status === opt.value
                ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                : "border-zinc-300 dark:border-zinc-700"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p>Chargement…</p>
      ) : users.length === 0 ? (
        <p className="text-zinc-500">Aucun compte dans cette catégorie.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800">
              <th className="py-2">E-mail</th>
              <th className="py-2">Société</th>
              <th className="py-2">Remise</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-zinc-100 dark:border-zinc-900">
                <td className="py-2">{user.email}</td>
                <td className="py-2">{user.companyName ?? "—"}</td>
                <td className="py-2">
                  <select
                    value={user.discountRateId ?? ""}
                    onChange={(e) => setDiscount(user.id, e.target.value || null)}
                    className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
                  >
                    <option value="">Aucune</option>
                    {discounts.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="flex gap-2 py-2 text-right">
                  {status === "pending" ? (
                    <>
                      <button
                        onClick={() => act(user.id, "approve")}
                        className="rounded bg-black px-3 py-1 text-white dark:bg-white dark:text-black"
                      >
                        Approuver
                      </button>
                      <button
                        onClick={() => act(user.id, "reject")}
                        className="rounded border border-red-600 px-3 py-1 text-red-600"
                      >
                        Refuser
                      </button>
                    </>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
