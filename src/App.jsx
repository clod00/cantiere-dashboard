import { useState, useEffect } from "react";

const SUPABASE_URL = "https://augmjtoanpbvbnzliias.supabase.co";
const SUPABASE_KEY = "sb_publishable_88zcvSpnpgcZYJdAmhVeeQ_vKPZ9jfa";
const CLIENTE_ID = "fdb788c4-2a80-45af-934e-5dc6eb258f92";

async function query(table, filters = "") {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}?${filters}`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );
  return res.json();
}

const statoColore = {
  "In corso":   { bg: "#0d2b1a", text: "#4ade80", dot: "#4ade80" },
  "Completato": { bg: "#0d1e2b", text: "#60a5fa", dot: "#60a5fa" },
  "In attesa":  { bg: "#2b2510", text: "#fbbf24", dot: "#fbbf24" },
  "Accettato":  { bg: "#0d2b1a", text: "#4ade80", dot: "#4ade80" },
  "Inviato":    { bg: "#0d1e2b", text: "#60a5fa", dot: "#60a5fa" },
};

function Badge({ stato }) {
  const c = statoColore[stato] || { bg: "#1a1a1a", text: "#888", dot: "#888" };
  return (
    <span style={{
      background: c.bg, color: c.text, borderRadius: 20,
      padding: "3px 10px", fontSize: 11, fontWeight: 600,
      display: "inline-flex", alignItems: "center", gap: 5,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot }} />
      {stato}
    </span>
  );
}

function ProgressBar({ value }) {
  const color = value === 100 ? "#60a5fa" : value > 60 ? "#4ade80" : value > 30 ? "#fbbf24" : "#f87171";
  return (
    <div style={{ background: "#1a1a1a", borderRadius: 4, height: 6, width: "100%", overflow: "hidden" }}>
      <div style={{
        width: `${value}%`, height: "100%", background: color,
        borderRadius: 4, boxShadow: `0 0 8px ${color}66`, transition: "width 1s ease"
      }} />
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
      <div style={{
        width: 32, height: 32, border: "3px solid #1c1c1c",
        borderTop: "3px solid #e8c547", borderRadius: "50%",
        animation: "spin 0.8s linear infinite"
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function Dashboard() {
  const [tab, setTab] = useState("cantieri");
  const [loading, setLoading] = useState(true);
  const [cliente, setCliente] = useState(null);
  const [cantieri, setCantieri] = useState([]);
  const [preventivi, setPreventivi] = useState([]);
  const [social, setSocial] = useState(null);
  const [contenuti, setContenuti] = useState([]);
  const [recensioni, setRecensioni] = useState([]);

  useEffect(() => {
    async function carica() {
      setLoading(true);
      const [c, ca, pr, so, co, re] = await Promise.all([
        query("clienti", `id=eq.${CLIENTE_ID}&select=*`),
        query("cantieri", `cliente_id=eq.${CLIENTE_ID}&select=*&order=created_at.desc`),
        query("preventivi", `cliente_id=eq.${CLIENTE_ID}&select=*&order=data.desc`),
        query("social_stats", `cliente_id=eq.${CLIENTE_ID}&select=*`),
        query("contenuti", `cliente_id=eq.${CLIENTE_ID}&select=*&order=data_prevista.asc`),
        query("recensioni", `cliente_id=eq.${CLIENTE_ID}&select=*&order=data_recensione.desc`),
      ]);
      setCliente(c[0]);
      setCantieri(ca);
      setPreventivi(pr);
      setSocial(so[0]);
      setContenuti(co);
      setRecensioni(re);
      setLoading(false);
    }
    carica();
  }, []);

  const tabs = [
    { id: "cantieri",   label: "Cantieri",   icon: "🏗️" },
    { id: "preventivi", label: "Preventivi", icon: "📋" },
    { id: "social",     label: "Social",     icon: "📱" },
    { id: "recensioni", label: "Recensioni", icon: "⭐" },
  ];

  const cantieriAttivi = cantieri.filter(c => c.stato === "In corso").length;
  const preventiviAperti = preventivi.filter(p => p.stato === "In attesa" || p.stato === "Inviato").length;
  const mediaStelle = recensioni.length
    ? (recensioni.reduce((s, r) => s + r.stelle, 0) / recensioni.length).toFixed(1)
    : "—";

  return (
    <div style={{
      minHeight: "100vh", background: "#0a0a0a", color: "#e8e8e8",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif"
    }}>
      {/* Header */}
      <div style={{
        borderBottom: "1px solid #1c1c1c", padding: "18px 28px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "#0d0d0d", position: "sticky", top: 0, zIndex: 10
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10, background: "#e8c547",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, fontSize: 13, color: "#0a0a0a"
          }}>
            {cliente?.logo_iniziali || ".."}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>
              {cliente?.nome_impresa || "Caricamento..."}
            </div>
            <div style={{ fontSize: 11, color: "#555", marginTop: 1 }}>Area clienti riservata</div>
          </div>
        </div>
        <div style={{
          fontSize: 11, color: "#444", background: "#141414",
          border: "1px solid #1e1e1e", borderRadius: 6, padding: "5px 10px"
        }}>
          Live · {new Date().toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" })}
        </div>
      </div>

      {loading ? <Spinner /> : (
        <>
          {/* KPI strip */}
          <style>{`
            @media (max-width: 600px) { .kpi-grid { grid-template-columns: repeat(2, 1fr) !important; } }
          `}</style>
          <div className="kpi-grid" style={{
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
            gap: 1, borderBottom: "1px solid #1c1c1c", background: "#1c1c1c"
          }}>
            {[
              { label: "Cantieri attivi",    val: cantieriAttivi,               sub: `${cantieri.length} totali` },
              { label: "Preventivi aperti",  val: preventiviAperti,             sub: `${preventivi.filter(p=>p.stato==="Accettato").length} accettati` },
              { label: "Follower totali",    val: social?.follower ?? "—",      sub: social ? `+${social.follower_delta} questo mese` : "" },
              { label: "Rating Google",      val: `${mediaStelle}★`,            sub: `${recensioni.length} recensioni recenti` },
            ].map((k, i) => (
              <div key={i} style={{ background: "#0d0d0d", padding: "18px 24px" }}>
                <div style={{ fontSize: 11, color: "#555", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>{k.label}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#fff", lineHeight: 1 }}>{k.val}</div>
                <div style={{ fontSize: 11, color: "#444", marginTop: 5 }}>{k.sub}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{
            display: "flex", padding: "0 28px",
            borderBottom: "1px solid #1c1c1c", background: "#0d0d0d"
          }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                background: "none", border: "none", cursor: "pointer",
                padding: "14px 18px", fontSize: 13,
                fontWeight: tab === t.id ? 600 : 400,
                color: tab === t.id ? "#e8c547" : "#555",
                borderBottom: tab === t.id ? "2px solid #e8c547" : "2px solid transparent",
                transition: "all 0.15s", display: "flex", alignItems: "center", gap: 6
              }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ padding: "24px 28px" }}>

            {/* CANTIERI */}
            {tab === "cantieri" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {cantieri.map(c => (
                  <div key={c.id} style={{
                    background: "#0f0f0f", border: "1px solid #1c1c1c",
                    borderRadius: 12, padding: "20px 24px"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <span style={{ fontWeight: 600, fontSize: 15, color: "#fff" }}>{c.nome}</span>
                      <Badge stato={c.stato} />
                    </div>
                    <div style={{ fontSize: 12, color: "#555", marginBottom: 14, display: "flex", gap: 16, flexWrap: "wrap" }}>
                      <span>📍 {c.indirizzo}</span>
                      <span>📅 {new Date(c.data_inizio).toLocaleDateString("it-IT")} → {new Date(c.data_fine).toLocaleDateString("it-IT")}</span>
                      <span>📷 {c.num_foto} foto</span>
                    </div>
                    {c.stato !== "In attesa" && (
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <span style={{ fontSize: 11, color: "#555" }}>Avanzamento lavori</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{c.avanzamento}%</span>
                        </div>
                        <ProgressBar value={c.avanzamento} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* PREVENTIVI */}
            {tab === "preventivi" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {preventivi.map(p => (
                  <div key={p.id} style={{
                    background: "#0f0f0f", border: "1px solid #1c1c1c",
                    borderRadius: 12, padding: "16px 24px",
                    display: "flex", alignItems: "center", justifyContent: "space-between"
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "#fff", marginBottom: 4 }}>{p.oggetto}</div>
                      <div style={{ fontSize: 12, color: "#555" }}>{p.nome_cliente} · {new Date(p.data).toLocaleDateString("it-IT")}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <span style={{ fontWeight: 700, fontSize: 16, color: "#e8c547" }}>{p.importo}</span>
                      <Badge stato={p.stato} />
                    </div>
                  </div>
                ))}
                <div style={{
                  marginTop: 8, padding: "14px 24px", background: "#0f0f0f",
                  border: "1px solid #1c1c1c", borderRadius: 12,
                  display: "flex", justifyContent: "space-between", alignItems: "center"
                }}>
                  <span style={{ fontSize: 13, color: "#555" }}>Totale preventivi accettati</span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: "#4ade80" }}>
                    {preventivi
                      .filter(p => p.stato === "Accettato")
                      .reduce((sum, p) => sum + parseFloat(p.importo.replace(/[€.]/g, "").replace(",", ".")), 0)
                      .toLocaleString("it-IT")}€
                  </span>
                </div>
              </div>
            )}

            {/* SOCIAL */}
            {tab === "social" && social && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                  {[
                    { label: "Reach mensile",  val: social.reach,      icon: "👁️" },
                    { label: "Post pubblicati", val: social.post_mese,  icon: "📤" },
                    { label: "Engagement",      val: social.engagement, icon: "💬" },
                  ].map((s, i) => (
                    <div key={i} style={{
                      background: "#0f0f0f", border: "1px solid #1c1c1c",
                      borderRadius: 12, padding: "20px 24px", textAlign: "center"
                    }}>
                      <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: "#fff" }}>{s.val}</div>
                      <div style={{ fontSize: 11, color: "#555", marginTop: 4 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{
                  background: "#0f0f0f", border: "1px solid #1c1c1c",
                  borderRadius: 12, padding: "20px 24px"
                }}>
                  <div style={{ fontSize: 12, color: "#555", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Contenuti programmati
                  </div>
                  {contenuti.map((c, i) => (
                    <div key={c.id} style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "10px 0",
                      borderBottom: i < contenuti.length - 1 ? "1px solid #161616" : "none"
                    }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 8, background: "#151515",
                        border: "1px solid #222", display: "flex", alignItems: "center",
                        justifyContent: "center", fontSize: 13
                      }}>📅</div>
                      <span style={{ fontSize: 13, color: "#ccc" }}>{c.testo}</span>
                      <span style={{ marginLeft: "auto", fontSize: 11, color: "#333" }}>
                        {new Date(c.data_prevista).toLocaleDateString("it-IT")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* RECENSIONI */}
            {tab === "recensioni" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {recensioni.map((r) => (
                  <div key={r.id} style={{
                    background: "#0f0f0f", border: "1px solid #1c1c1c",
                    borderRadius: 12, padding: "18px 24px"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: "50%", background: "#1a1a1a",
                          border: "1px solid #252525", display: "flex", alignItems: "center",
                          justifyContent: "center", fontSize: 12, color: "#666", fontWeight: 700
                        }}>{r.autore?.[0]}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13, color: "#fff" }}>{r.autore}</div>
                          <div style={{ fontSize: 11, color: "#444" }}>{new Date(r.data_recensione).toLocaleDateString("it-IT")}</div>
                        </div>
                      </div>
                      <div>
                        {[1,2,3,4,5].map(s => (
                          <span key={s} style={{ color: s <= r.stelle ? "#fbbf24" : "#333", fontSize: 14 }}>★</span>
                        ))}
                      </div>
                    </div>
                    <p style={{ fontSize: 13, color: "#888", margin: "0 0 12px", lineHeight: 1.6 }}>{r.testo}</p>
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      {r.risposta_inviata
                        ? <span style={{ fontSize: 11, color: "#4ade80" }}>✓ Risposta inviata</span>
                        : <span style={{ fontSize: 11, color: "#f87171" }}>⚠ Risposta in attesa</span>
                      }
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
