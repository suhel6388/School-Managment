"use client";

import { useEffect, useState, useCallback } from "react";
import { Modal } from "@/components/Modal";
import { Icon } from "@/components/Icon";
import { useToast } from "@/components/ToastProvider";
import { generateSchoolSlug } from "@/lib/slug";
import type { SessionUser } from "@/lib/auth";

type OverviewData = {
  kpis: {
    totalSchools: number;
    activeSchools: number;
    suspendedSchools: number;
    totalUsers: number;
    totalStudents: number;
    totalStaff: number;
  };
  subscriptions: {
    free: number;
    starter: number;
    pro: number;
    enterprise: number;
  };
  recentSchools: Array<{
    id: string;
    name: string;
    slug: string;
    email: string | null;
    status: string;
    subscriptionPlan: string;
    createdAt: string;
    ownerName?: string | null;
    ownerEmail?: string | null;
  }>;
  registrationAnalytics: Array<{
    month: string;
    count: number;
  }>;
};

type SchoolItem = {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  status: string;
  subscriptionPlan: string;
  createdAt: string;
  owners: Array<{ id: string; name: string; email: string; status: string }>;
  studentCount: number;
};

type SchoolDetails = {
  school: {
    id: string;
    name: string;
    slug: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    status: string;
    subscriptionPlan: string;
    createdAt: string;
  };
  metrics: {
    studentCount: number;
    staffCount: number;
  };
  owners: Array<{
    memberId: string;
    userId: string;
    name: string;
    email: string;
    status: string;
    createdAt: string;
  }>;
  staff: Array<{
    memberId: string;
    userId: string;
    name: string;
    email: string;
    role: string;
    status: string;
    createdAt: string;
  }>;
  settings: any;
  sessions: any[];
};

export function SuperAdminView({ currentUser }: { currentUser: SessionUser }) {
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<OverviewData | null>(null);

  // Table filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [schools, setSchools] = useState<SchoolItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSchoolsCount, setTotalSchoolsCount] = useState(0);

  // Modals
  const [provisionOpen, setProvisionOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState<SchoolDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [targetSchool, setTargetSchool] = useState<SchoolItem | null>(null);
  const [newPlan, setNewPlan] = useState<"free" | "starter" | "pro" | "enterprise">("pro");
  const [expiryDate, setExpiryDate] = useState("");

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<"active" | "suspended" | "inactive">("active");
  const [statusReason, setStatusReason] = useState("");

  const [ownerEmailInput, setOwnerEmailInput] = useState("");
  const [ownerBusy, setOwnerBusy] = useState(false);

  // Provision Form state
  const [provForm, setProvForm] = useState({
    schoolName: "",
    slug: "",
    email: "",
    phone: "",
    address: "",
    ownerName: "",
    ownerEmail: "",
    ownerPassword: "",
    academicSessionName: "2026-2027",
    subscriptionPlan: "pro",
  });
  const [submittingProv, setSubmittingProv] = useState(false);

  const fetchOverview = useCallback(async () => {
    try {
      const res = await fetch("/api/super-admin/overview");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load platform overview.");
      }
      const data: OverviewData = await res.json();
      setOverview(data);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Error loading platform metrics.");
    }
  }, [toast]);

  const fetchSchools = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (planFilter !== "all") params.set("plan", planFilter);
      params.set("page", String(page));
      params.set("limit", "15");

      const res = await fetch(`/api/super-admin/schools?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load schools.");
      }
      const data = await res.json();
      setSchools(data.schools || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalSchoolsCount(data.pagination?.total || 0);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Error loading schools.");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, planFilter, page, toast]);

  useEffect(() => {
    fetchOverview();
    fetchSchools();
  }, [fetchOverview, fetchSchools]);

  async function handleOpenDetails(schoolId: string) {
    setLoadingDetails(true);
    setDetailsModalOpen(true);
    try {
      const res = await fetch(`/api/super-admin/schools/${schoolId}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to fetch school details.");
      }
      const data: SchoolDetails = await res.json();
      setSelectedDetails(data);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Error loading details.");
      setDetailsModalOpen(false);
    } finally {
      setLoadingDetails(false);
    }
  }

  async function handleAssignOwner() {
    if (!selectedDetails || !ownerEmailInput.trim()) return;
    setOwnerBusy(true);
    try {
      const res = await fetch(`/api/super-admin/schools/${selectedDetails.school.id}/owners`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assign",
          targetUserEmail: ownerEmailInput.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to assign owner.");
      toast(data.message || "Owner assigned successfully.");
      setOwnerEmailInput("");
      await handleOpenDetails(selectedDetails.school.id);
      fetchSchools();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to assign owner.");
    } finally {
      setOwnerBusy(false);
    }
  }

  async function handleRevokeOwner(ownerEmail: string) {
    if (!selectedDetails) return;
    if (!confirm(`Revoke owner status for ${ownerEmail}?`)) return;
    setOwnerBusy(true);
    try {
      const res = await fetch(`/api/super-admin/schools/${selectedDetails.school.id}/owners`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "revoke",
          targetUserEmail: ownerEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to revoke owner.");
      toast(data.message || "Owner revoked.");
      await handleOpenDetails(selectedDetails.school.id);
      fetchSchools();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to revoke owner.");
    } finally {
      setOwnerBusy(false);
    }
  }

  async function handleSaveSubscription() {
    if (!targetSchool) return;
    try {
      const res = await fetch(`/api/super-admin/schools/${targetSchool.id}/subscription`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: newPlan,
          expiresAt: expiryDate || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update subscription.");
      toast(data.message || "Subscription updated.");
      setSubscriptionModalOpen(false);
      fetchOverview();
      fetchSchools();
      if (selectedDetails?.school.id === targetSchool.id) {
        handleOpenDetails(targetSchool.id);
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to update subscription.");
    }
  }

  async function handleSaveStatus() {
    if (!targetSchool) return;
    try {
      const res = await fetch(`/api/super-admin/schools/${targetSchool.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: targetStatus,
          reason: statusReason || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status.");
      toast(data.message || "School status updated.");
      setStatusModalOpen(false);
      setStatusReason("");
      fetchOverview();
      fetchSchools();
      if (selectedDetails?.school.id === targetSchool.id) {
        handleOpenDetails(targetSchool.id);
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to update status.");
    }
  }

  async function handleProvisionSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!provForm.schoolName || !provForm.ownerName || !provForm.ownerEmail) {
      toast("Please provide School Name, Owner Name, and Owner Email.");
      return;
    }

    setSubmittingProv(true);
    try {
      const res = await fetch("/api/super-admin/schools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(provForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to provision school.");

      toast(`School "${provForm.schoolName}" successfully provisioned!`);
      setProvisionOpen(false);
      setProvForm({
        schoolName: "",
        slug: "",
        email: "",
        phone: "",
        address: "",
        ownerName: "",
        ownerEmail: "",
        ownerPassword: "",
        academicSessionName: "2026-2027",
        subscriptionPlan: "pro",
      });
      fetchOverview();
      fetchSchools();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Provisioning error.");
    } finally {
      setSubmittingProv(false);
    }
  }

  const kpis = overview?.kpis || {
    totalSchools: 0,
    activeSchools: 0,
    suspendedSchools: 0,
    totalUsers: 0,
    totalStudents: 0,
    totalStaff: 0,
  };

  const subs = overview?.subscriptions || {
    free: 0,
    starter: 0,
    pro: 0,
    enterprise: 0,
  };

  return (
    <div style={{ display: "grid", gap: 24, paddingBottom: 40 }}>
      {/* Platform Header */}
      <div
        className="card"
        style={{
          background: "linear-gradient(135deg, rgba(37,99,235,0.06), rgba(99,102,241,0.03))",
          borderColor: "rgba(37,99,235,0.2)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                background: "var(--pri, #2563eb)",
                color: "#fff",
                padding: "4px 8px",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              Super Admin
            </span>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Platform Administration</h2>
          </div>
          <p style={{ margin: "6px 0 0", color: "var(--muted, #64748b)", fontSize: 14 }}>
            Tenant isolation, platform-wide metrics, school provisioning, and subscription controls.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            className="btn"
            onClick={() => {
              fetchOverview();
              fetchSchools();
              toast("Platform metrics refreshed.");
            }}
          >
            Refresh Data
          </button>
          <button
            type="button"
            className="btn pri"
            onClick={() => setProvisionOpen(true)}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <Icon name="plus" size={16} /> Provision School
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
        }}
      >
        <div className="card" style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 13, color: "var(--muted, #64748b)", fontWeight: 600 }}>Total Schools</span>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 32, fontWeight: 800 }}>{kpis.totalSchools}</span>
            <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 700 }}>
              {kpis.activeSchools} active
            </span>
            {kpis.suspendedSchools > 0 && (
              <span style={{ fontSize: 12, color: "#dc2626", fontWeight: 700 }}>
                {kpis.suspendedSchools} suspended
              </span>
            )}
          </div>
        </div>

        <div className="card" style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 13, color: "var(--muted, #64748b)", fontWeight: 600 }}>Platform Users</span>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 32, fontWeight: 800 }}>{kpis.totalUsers}</span>
            <span style={{ fontSize: 12, color: "var(--muted, #64748b)" }}>registered accounts</span>
          </div>
        </div>

        <div className="card" style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 13, color: "var(--muted, #64748b)", fontWeight: 600 }}>Total Students</span>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 32, fontWeight: 800 }}>{kpis.totalStudents}</span>
            <span style={{ fontSize: 12, color: "var(--muted, #64748b)" }}>enrolled across tenants</span>
          </div>
        </div>

        <div className="card" style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 13, color: "var(--muted, #64748b)", fontWeight: 600 }}>Total Staff</span>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 32, fontWeight: 800 }}>{kpis.totalStaff}</span>
            <span style={{ fontSize: 12, color: "var(--muted, #64748b)" }}>teachers & admins</span>
          </div>
        </div>
      </div>

      {/* Analytics & Subscription Breakdown */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 16,
        }}
      >
        {/* Registration Analytics */}
        <div className="card" style={{ display: "grid", gap: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>New School Registrations</h3>
            <span style={{ fontSize: 12, color: "var(--muted, #64748b)" }}>Past 6 Months</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 120, paddingTop: 10 }}>
            {overview?.registrationAnalytics?.map((item) => {
              const maxCount = Math.max(...(overview?.registrationAnalytics?.map((r) => r.count) || [1]), 1);
              const heightPct = Math.max((item.count / maxCount) * 100, 10);
              return (
                <div
                  key={item.month}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                    height: "100%",
                    justifyContent: "flex-end",
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 700 }}>{item.count}</span>
                  <div
                    style={{
                      width: "100%",
                      maxWidth: 32,
                      height: `${heightPct}%`,
                      background: "var(--pri, #2563eb)",
                      borderRadius: "4px 4px 0 0",
                      transition: "height 0.3s ease",
                    }}
                  />
                  <span style={{ fontSize: 10, color: "var(--muted, #64748b)", whiteSpace: "nowrap" }}>
                    {item.month.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Subscription Distribution */}
        <div className="card" style={{ display: "grid", gap: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Active Subscriptions</h3>
            <span style={{ fontSize: 12, color: "var(--muted, #64748b)" }}>Tier Distribution</span>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 12,
            }}
          >
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                background: "rgba(100, 116, 139, 0.08)",
                border: "1px solid rgba(100, 116, 139, 0.15)",
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--muted, #64748b)" }}>Free Tier</div>
              <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>{subs.free}</div>
            </div>

            <div
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                background: "rgba(59, 130, 246, 0.08)",
                border: "1px solid rgba(59, 130, 246, 0.2)",
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 600, color: "#2563eb" }}>Starter</div>
              <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>{subs.starter}</div>
            </div>

            <div
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                background: "rgba(16, 185, 129, 0.08)",
                border: "1px solid rgba(16, 185, 129, 0.2)",
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 600, color: "#059669" }}>Pro</div>
              <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>{subs.pro}</div>
            </div>

            <div
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                background: "rgba(168, 85, 247, 0.08)",
                border: "1px solid rgba(168, 85, 247, 0.2)",
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 600, color: "#9333ea" }}>Enterprise</div>
              <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>{subs.enterprise}</div>
            </div>
          </div>
        </div>
      </div>

      {/* School Management Table */}
      <div className="card" style={{ display: "grid", gap: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Tenant Schools</h3>
            <span style={{ fontSize: 13, color: "var(--muted, #64748b)" }}>
              {totalSchoolsCount} registered schools
            </span>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <input
              type="text"
              className="sin"
              placeholder="Search name, slug, email…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              style={{ width: 220 }}
            />

            <select
              className="sin"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              style={{ width: 130 }}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="inactive">Inactive</option>
            </select>

            <select
              className="sin"
              value={planFilter}
              onChange={(e) => {
                setPlanFilter(e.target.value);
                setPage(1);
              }}
              style={{ width: 130 }}
            >
              <option value="all">All Plans</option>
              <option value="free">Free</option>
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table className="tbl" style={{ width: "100%", textAlign: "left", fontSize: 14 }}>
            <thead>
              <tr>
                <th style={{ padding: "10px 12px" }}>School Name & Slug</th>
                <th style={{ padding: "10px 12px" }}>Status</th>
                <th style={{ padding: "10px 12px" }}>Subscription</th>
                <th style={{ padding: "10px 12px" }}>School Owners</th>
                <th style={{ padding: "10px 12px" }}>Students</th>
                <th style={{ padding: "10px 12px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {schools.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 24, textAlign: "center", color: "var(--muted, #64748b)" }}>
                    {loading ? "Loading schools…" : "No schools match the filter criteria."}
                  </td>
                </tr>
              ) : (
                schools.map((school) => {
                  const isActive = school.status === "active";
                  return (
                    <tr key={school.id} style={{ borderBottom: "1px solid var(--bdr, #e2e8f0)" }}>
                      <td style={{ padding: "12px" }}>
                        <div style={{ fontWeight: 700 }}>{school.name}</div>
                        <div style={{ fontSize: 12, color: "var(--muted, #64748b)" }}>
                          slug: <code>{school.slug}</code>
                        </div>
                        {school.email && (
                          <div style={{ fontSize: 11, color: "var(--muted, #64748b)" }}>{school.email}</div>
                        )}
                      </td>

                      <td style={{ padding: "12px" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "2px 8px",
                            borderRadius: 12,
                            fontSize: 12,
                            fontWeight: 700,
                            background: isActive ? "rgba(22, 163, 74, 0.12)" : "rgba(220, 38, 38, 0.12)",
                            color: isActive ? "#15803d" : "#b91c1c",
                          }}
                        >
                          {school.status.toUpperCase()}
                        </span>
                      </td>

                      <td style={{ padding: "12px" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "2px 8px",
                            borderRadius: 12,
                            fontSize: 12,
                            fontWeight: 700,
                            background: "rgba(37, 99, 235, 0.1)",
                            color: "var(--pri, #2563eb)",
                            textTransform: "capitalize",
                          }}
                        >
                          {school.subscriptionPlan || "free"}
                        </span>
                      </td>

                      <td style={{ padding: "12px" }}>
                        {school.owners && school.owners.length > 0 ? (
                          school.owners.map((o) => (
                            <div key={o.id || o.email} style={{ fontSize: 13 }}>
                              <b>{o.name || "Owner"}</b>{" "}
                              <span style={{ fontSize: 11, color: "var(--muted, #64748b)" }}>({o.email})</span>
                            </div>
                          ))
                        ) : (
                          <span style={{ color: "var(--muted, #64748b)", fontStyle: "italic", fontSize: 12 }}>
                            No active owner
                          </span>
                        )}
                      </td>

                      <td style={{ padding: "12px" }}>
                        <b>{school.studentCount}</b>
                      </td>

                      <td style={{ padding: "12px", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            className="btn"
                            style={{ padding: "4px 8px", fontSize: 12 }}
                            onClick={() => handleOpenDetails(school.id)}
                            title="Inspect details, owners, and settings"
                          >
                            Details
                          </button>

                          <button
                            type="button"
                            className="btn"
                            style={{ padding: "4px 8px", fontSize: 12 }}
                            onClick={() => {
                              setTargetSchool(school);
                              setNewPlan(
                                (school.subscriptionPlan?.toLowerCase() as any) || "free",
                              );
                              setSubscriptionModalOpen(true);
                            }}
                            title="Manage subscription plan"
                          >
                            Plan
                          </button>

                          <button
                            type="button"
                            className="btn"
                            style={{
                              padding: "4px 8px",
                              fontSize: 12,
                              color: isActive ? "#dc2626" : "#16a34a",
                              borderColor: isActive ? "rgba(220, 38, 38, 0.3)" : "rgba(22, 163, 74, 0.3)",
                            }}
                            onClick={() => {
                              setTargetSchool(school);
                              setTargetStatus(isActive ? "suspended" : "active");
                              setStatusModalOpen(true);
                            }}
                          >
                            {isActive ? "Suspend" : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
            <span style={{ fontSize: 13, color: "var(--muted, #64748b)" }}>
              Page {page} of {totalPages}
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className="btn"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <button
                type="button"
                className="btn"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: Provision School */}
      <Modal open={provisionOpen} title="Provision New Tenant School" onClose={() => setProvisionOpen(false)} size="wide">
        <form onSubmit={handleProvisionSubmit} style={{ display: "grid", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                School Name *
              </label>
              <input
                type="text"
                className="sin"
                required
                value={provForm.schoolName}
                onChange={(e) => {
                  const val = e.target.value;
                  setProvForm((prev) => ({
                    ...prev,
                    schoolName: val,
                    slug: prev.slug ? prev.slug : generateSchoolSlug(val),
                  }));
                }}
                placeholder="e.g. St. Xavier International"
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                Slug (URL Identifier)
              </label>
              <input
                type="text"
                className="sin"
                value={provForm.slug}
                onChange={(e) => setProvForm({ ...provForm, slug: generateSchoolSlug(e.target.value) })}
                placeholder="e.g. st-xavier"
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                School Email
              </label>
              <input
                type="email"
                className="sin"
                value={provForm.email}
                onChange={(e) => setProvForm({ ...provForm, email: e.target.value })}
                placeholder="info@school.org"
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                School Phone
              </label>
              <input
                type="text"
                className="sin"
                value={provForm.phone}
                onChange={(e) => setProvForm({ ...provForm, phone: e.target.value })}
                placeholder="+1 555-0199"
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
              School Address
            </label>
            <input
              type="text"
              className="sin"
              value={provForm.address}
              onChange={(e) => setProvForm({ ...provForm, address: e.target.value })}
              placeholder="123 Education Lane, Metro City"
            />
          </div>

          <hr style={{ border: 0, borderTop: "1px solid var(--bdr, #e2e8f0)", margin: "4px 0" }} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                Owner Full Name *
              </label>
              <input
                type="text"
                className="sin"
                required
                value={provForm.ownerName}
                onChange={(e) => setProvForm({ ...provForm, ownerName: e.target.value })}
                placeholder="Principal / Founder Name"
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                Owner Email *
              </label>
              <input
                type="email"
                className="sin"
                required
                value={provForm.ownerEmail}
                onChange={(e) => setProvForm({ ...provForm, ownerEmail: e.target.value })}
                placeholder="owner@school.org"
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                Initial Password
              </label>
              <input
                type="password"
                className="sin"
                value={provForm.ownerPassword}
                onChange={(e) => setProvForm({ ...provForm, ownerPassword: e.target.value })}
                placeholder="Leave blank for random"
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                Academic Session
              </label>
              <input
                type="text"
                className="sin"
                value={provForm.academicSessionName}
                onChange={(e) => setProvForm({ ...provForm, academicSessionName: e.target.value })}
                placeholder="2026-2027"
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                Subscription Plan
              </label>
              <select
                className="sin"
                value={provForm.subscriptionPlan}
                onChange={(e) => setProvForm({ ...provForm, subscriptionPlan: e.target.value })}
              >
                <option value="free">Free</option>
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 14 }}>
            <button type="button" className="btn" onClick={() => setProvisionOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn pri" disabled={submittingProv}>
              {submittingProv ? "Provisioning…" : "Create & Provision School"}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: School Details & Owner Management */}
      <Modal
        open={detailsModalOpen}
        title={selectedDetails ? `School Details: ${selectedDetails.school.name}` : "School Details"}
        onClose={() => setDetailsModalOpen(false)}
        size="wide"
      >
        {loadingDetails ? (
          <div style={{ padding: 40, textAlign: "center" }}>Loading school details…</div>
        ) : selectedDetails ? (
          <div style={{ display: "grid", gap: 18 }}>
            {/* School Summary */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 12,
                padding: 14,
                background: "rgba(100, 116, 139, 0.05)",
                borderRadius: 8,
              }}
            >
              <div>
                <span style={{ fontSize: 11, color: "var(--muted, #64748b)" }}>ID:</span>
                <div style={{ fontSize: 12, fontFamily: "monospace" }}>{selectedDetails.school.id}</div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: "var(--muted, #64748b)" }}>Slug:</span>
                <div style={{ fontWeight: 600 }}>{selectedDetails.school.slug}</div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: "var(--muted, #64748b)" }}>Status:</span>
                <div style={{ fontWeight: 700, textTransform: "uppercase" }}>{selectedDetails.school.status}</div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: "var(--muted, #64748b)" }}>Subscription:</span>
                <div style={{ fontWeight: 700, color: "var(--pri, #2563eb)", textTransform: "capitalize" }}>
                  {selectedDetails.school.subscriptionPlan}
                </div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: "var(--muted, #64748b)" }}>Students:</span>
                <div style={{ fontWeight: 700 }}>{selectedDetails.metrics.studentCount}</div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: "var(--muted, #64748b)" }}>Staff Members:</span>
                <div style={{ fontWeight: 700 }}>{selectedDetails.metrics.staffCount}</div>
              </div>
            </div>

            {/* School Owners & Management */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>School Owners (SCHOOL_OWNER)</h4>
              </div>

              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <input
                  type="email"
                  className="sin"
                  placeholder="Assign user by email…"
                  value={ownerEmailInput}
                  onChange={(e) => setOwnerEmailInput(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="btn pri"
                  onClick={handleAssignOwner}
                  disabled={ownerBusy || !ownerEmailInput.trim()}
                >
                  {ownerBusy ? "…" : "Assign Owner"}
                </button>
              </div>

              <table className="tbl" style={{ width: "100%", fontSize: 13 }}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedDetails.owners.map((owner) => (
                    <tr key={owner.memberId || owner.email}>
                      <td><b>{owner.name}</b></td>
                      <td>{owner.email}</td>
                      <td>
                        <span style={{ fontSize: 11, fontWeight: 700, color: owner.status === "active" ? "#16a34a" : "#dc2626" }}>
                          {owner.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          className="btn"
                          style={{ padding: "2px 6px", fontSize: 11, color: "#dc2626" }}
                          onClick={() => handleRevokeOwner(owner.email)}
                          disabled={ownerBusy}
                        >
                          Revoke Owner
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Staff List */}
            <div>
              <h4 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 700 }}>Staff Members</h4>
              {selectedDetails.staff.length === 0 ? (
                <div style={{ fontSize: 13, color: "var(--muted, #64748b)" }}>No staff members added yet.</div>
              ) : (
                <table className="tbl" style={{ width: "100%", fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDetails.staff.slice(0, 8).map((st) => (
                      <tr key={st.memberId}>
                        <td>{st.name}</td>
                        <td>{st.email}</td>
                        <td><span style={{ fontWeight: 600 }}>{st.role}</span></td>
                        <td>{st.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="button" className="btn" onClick={() => setDetailsModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* MODAL 3: Update Subscription */}
      <Modal
        open={subscriptionModalOpen}
        title={targetSchool ? `Update Subscription: ${targetSchool.name}` : "Update Subscription"}
        onClose={() => setSubscriptionModalOpen(false)}
      >
        <div style={{ display: "grid", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
              Subscription Tier
            </label>
            <select
              className="sin"
              value={newPlan}
              onChange={(e) => setNewPlan(e.target.value as any)}
            >
              <option value="free">Free Tier</option>
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
              Expiry Date (Optional)
            </label>
            <input
              type="date"
              className="sin"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
            <button type="button" className="btn" onClick={() => setSubscriptionModalOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn pri" onClick={handleSaveSubscription}>
              Save Subscription
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL 4: Status Change Confirmation */}
      <Modal
        open={statusModalOpen}
        title={targetStatus === "suspended" ? "Suspend School" : "Activate School"}
        onClose={() => setStatusModalOpen(false)}
      >
        <div style={{ display: "grid", gap: 14 }}>
          <p style={{ margin: 0, fontSize: 14 }}>
            Are you sure you want to <b>{targetStatus.toUpperCase()}</b> the school{" "}
            <b>{targetSchool?.name}</b>?
          </p>

          {targetStatus === "suspended" && (
            <div style={{ padding: 12, borderRadius: 6, background: "rgba(220, 38, 38, 0.08)", color: "#b91c1c", fontSize: 13 }}>
              Suspending this school will also deactivate member access and block all school tenant operations.
            </div>
          )}

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
              Reason / Admin Note (Optional)
            </label>
            <input
              type="text"
              className="sin"
              placeholder="e.g. Non-payment, violation of terms, or account reinstated"
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
            <button type="button" className="btn" onClick={() => setStatusModalOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn"
              style={{
                background: targetStatus === "suspended" ? "#dc2626" : "#16a34a",
                color: "#fff",
                border: 0,
              }}
              onClick={handleSaveStatus}
            >
              Confirm {targetStatus === "suspended" ? "Suspension" : "Activation"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

