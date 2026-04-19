// ─────────────────────────────────────────────────────────────────────────────
// HƯỚNG DẪN TÍCH HỢP VÀO admin.tsx:
//
// 1. Thêm type Coupon vào đầu file admin.tsx
// 2. Thêm state coupon vào BentoDashboard
// 3. Thêm navItem "coupons"
// 4. Thêm block {page==="coupons" && <CouponTab />} vào JSX
//
// HOẶC: Copy toàn bộ file admin-with-coupons.tsx (được tạo riêng)
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type Coupon = {
  id: number; code: string; discountType: "percent"|"fixed";
  discountValue: number; maxUses: number; usedCount: number;
  remaining: number; startsAt: string|null; expiresAt: string|null;
  active: boolean; createdAt: string;
};

const T = {
  bg:"#EBEBEB",card:"#FFFFFF",surface:"#F5F5F3",ink:"#1A1A1A",
  inkMid:"#555",inkLight:"#999",radius:"24px",radiusSm:"14px",radiusXs:"10px",
  shadow:"0 2px 16px rgba(0,0,0,0.07)",shadowHover:"0 8px 32px rgba(0,0,0,0.13)",
  green:"#D1F5D3",greenInk:"#1A5C20",red:"#FDDEDE",redInk:"#7A1C1C",
  amber:"#FEF3C7",amberInk:"#7C4A00",font:"'DM Sans',system-ui,sans-serif",
};

const bentoCard: React.CSSProperties = {
  background:T.card,borderRadius:T.radius,boxShadow:T.shadow,overflow:"hidden",
};

export function CouponTab({ API }: { API: string }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    code: "", discountType: "percent" as "percent"|"fixed",
    discountValue: 10, maxUses: 10,
    startsAt: "", expiresAt: "",
  });
  const [formError, setFormError] = useState("");

  const { data: coupons=[], isLoading } = useQuery<Coupon[]>({
    queryKey: ["admin-coupons"],
    queryFn: async () => {
      const r = await fetch(`${API}/api/coupons`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof newCoupon) => {
      const res = await fetch(`${API}/api/coupons`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          code: data.code.toUpperCase().trim(),
          startsAt: data.startsAt || null,
          expiresAt: data.expiresAt || null,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed");
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-coupons"] });
      setShowForm(false);
      setNewCoupon({ code:"",discountType:"percent",discountValue:10,maxUses:10,startsAt:"",expiresAt:"" });
    },
    onError: (err: any) => setFormError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`${API}/api/coupons/${id}`, { method: "DELETE" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-coupons"] }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
      await fetch(`${API}/api/coupons/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-coupons"] }),
  });

  const inp = (value: any, onChange: any, opts: any = {}) => (
    <input value={value} onChange={onChange}
      style={{ width:"100%",padding:"10px 13px",borderRadius:T.radiusXs,border:"1.5px solid #E0E0E0",fontSize:13,fontFamily:T.font,boxSizing:"border-box" as const,...opts }} />
  );

  const lbl = (text: string) => (
    <p style={{ fontSize:11,fontWeight:600,color:T.inkLight,textTransform:"uppercase" as const,letterSpacing:".05em",marginBottom:6 }}>{text}</p>
  );

  return (
    <div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:24,fontWeight:700,color:T.ink,letterSpacing:"-.03em" }}>Mã giảm giá</h1>
          <p style={{ color:T.inkLight,fontSize:13,marginTop:3 }}>{coupons.length} mã đang có · {coupons.filter(c=>c.active).length} đang hoạt động</p>
        </div>
        <button onClick={() => { setShowForm(true); setFormError(""); }}
          style={{ background:T.ink,color:"#fff",border:"none",borderRadius:T.radiusSm,padding:"11px 20px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:T.font }}>
          + Tạo mã mới
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:20 }}>
        {[
          { label:"Tổng mã", value:coupons.length },
          { label:"Đang hoạt động", value:coupons.filter(c=>c.active).length },
          { label:"Đã dùng tổng", value:coupons.reduce((s,c)=>s+c.usedCount,0) },
        ].map(s=>(
          <div key={s.label} style={{ ...bentoCard,padding:"18px 20px" }}>
            <p style={{ fontSize:11,fontWeight:600,color:T.inkLight,textTransform:"uppercase" as const,letterSpacing:".06em",marginBottom:8 }}>{s.label}</p>
            <p style={{ fontSize:28,fontWeight:800,color:T.ink,letterSpacing:"-.02em" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Coupon list */}
      <div style={{ ...bentoCard,overflow:"hidden" }}>
        {isLoading ? (
          <p style={{ padding:"32px",textAlign:"center",color:T.inkLight }}>Đang tải...</p>
        ) : coupons.length===0 ? (
          <div style={{ padding:"48px",textAlign:"center",color:T.inkLight }}>
            <p style={{ fontSize:32,marginBottom:12 }}>🏷️</p>
            <p>Chưa có mã giảm giá nào</p>
          </div>
        ) : (
          <table style={{ width:"100%",borderCollapse:"collapse" as const,fontSize:13 }}>
            <thead>
              <tr style={{ background:T.surface }}>
                {["Mã","Giảm giá","Sử dụng","Hiệu lực","Trạng thái",""].map((h,i)=>(
                  <th key={i} style={{ padding:"14px 16px",textAlign:"left" as const,color:T.inkLight,fontWeight:600,fontSize:11,letterSpacing:".05em",textTransform:"uppercase" as const,borderBottom:"1.5px solid #ECECEC" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {coupons.map(c => {
                const pct = c.maxUses > 0 ? (c.usedCount / c.maxUses) * 100 : 0;
                const isExpired = c.expiresAt && new Date(c.expiresAt) < new Date();
                const isExhausted = c.usedCount >= c.maxUses;
                return (
                  <tr key={c.id} style={{ borderBottom:"1px solid #F2F2F2" }}>
                    <td style={{ padding:"16px" }}>
                      <div style={{ display:"inline-flex",alignItems:"center",gap:8,background:T.surface,borderRadius:8,padding:"6px 12px" }}>
                        <span style={{ fontWeight:800,color:T.ink,letterSpacing:".06em",fontFamily:"monospace",fontSize:14 }}>{c.code}</span>
                      </div>
                    </td>
                    <td style={{ padding:"16px" }}>
                      <p style={{ fontWeight:700,color:T.ink,fontSize:15 }}>
                        {c.discountType==="percent" ? `${c.discountValue}%` : `$${c.discountValue}`}
                      </p>
                      <p style={{ color:T.inkLight,fontSize:11,marginTop:2 }}>
                        {c.discountType==="percent" ? "Phần trăm" : "Số tiền cố định"}
                      </p>
                    </td>
                    <td style={{ padding:"16px" }}>
                      <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:4 }}>
                        <div style={{ width:80,height:5,background:"#EBEBEB",borderRadius:99,overflow:"hidden" }}>
                          <div style={{ width:`${Math.min(100,pct)}%`,height:"100%",borderRadius:99,background:pct>=100?"#EF4444":pct>50?"#F59E0B":"#22C55E" }} />
                        </div>
                        <span style={{ fontSize:12,fontWeight:600,color:T.inkMid }}>{c.usedCount}/{c.maxUses}</span>
                      </div>
                      <p style={{ fontSize:11,color:T.inkLight }}>Còn {c.remaining} lượt</p>
                    </td>
                    <td style={{ padding:"16px" }}>
                      {c.startsAt && <p style={{ fontSize:11,color:T.inkLight }}>Từ {new Date(c.startsAt).toLocaleDateString("vi-VN")}</p>}
                      {c.expiresAt ? (
                        <p style={{ fontSize:11,color:isExpired?"#EF4444":T.inkLight }}>
                          {isExpired ? "⚠ Hết hạn" : `Đến ${new Date(c.expiresAt).toLocaleDateString("vi-VN")}`}
                        </p>
                      ) : <p style={{ fontSize:11,color:T.inkLight }}>Không giới hạn</p>}
                    </td>
                    <td style={{ padding:"16px" }}>
                      {isExhausted ? (
                        <span style={{ background:T.red,color:T.redInk,padding:"4px 11px",borderRadius:99,fontSize:11,fontWeight:600 }}>Hết lượt</span>
                      ) : isExpired ? (
                        <span style={{ background:"#F0F0F0",color:T.inkMid,padding:"4px 11px",borderRadius:99,fontSize:11,fontWeight:600 }}>Hết hạn</span>
                      ) : c.active ? (
                        <span style={{ background:T.green,color:T.greenInk,padding:"4px 11px",borderRadius:99,fontSize:11,fontWeight:600 }}>Đang hoạt động</span>
                      ) : (
                        <span style={{ background:"#F0F0F0",color:T.inkMid,padding:"4px 11px",borderRadius:99,fontSize:11,fontWeight:600 }}>Tạm dừng</span>
                      )}
                    </td>
                    <td style={{ padding:"16px" }}>
                      <div style={{ display:"flex",gap:6 }}>
                        {/* Toggle active */}
                        <button onClick={() => toggleMutation.mutate({ id:c.id, active:!c.active })} title={c.active?"Tạm dừng":"Kích hoạt"}
                          style={{ width:32,height:32,borderRadius:T.radiusXs,border:"1.5px solid #E8E8E8",background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,transition:"all .12s" }}
                          onMouseEnter={e=>{e.currentTarget.style.background=c.active?"#FEF3C7":"#D1F5D3";}}
                          onMouseLeave={e=>{e.currentTarget.style.background="#fff";}}>
                          {c.active ? "⏸" : "▶"}
                        </button>
                        {/* Delete */}
                        <button onClick={() => confirm(`Xóa mã "${c.code}"?`) && deleteMutation.mutate(c.id)} title="Xóa"
                          style={{ width:32,height:32,borderRadius:T.radiusXs,border:"1.5px solid #E8E8E8",background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:T.inkLight,transition:"all .12s" }}
                          onMouseEnter={e=>{e.currentTarget.style.background="#EF4444";e.currentTarget.style.color="#fff";e.currentTarget.style.borderColor="#EF4444";}}
                          onMouseLeave={e=>{e.currentTarget.style.background="#fff";e.currentTarget.style.color=T.inkLight;e.currentTarget.style.borderColor="#E8E8E8";}}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Create form modal */}
      {showForm && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.35)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(4px)" }}>
          <div style={{ background:T.card,borderRadius:T.radius,boxShadow:"0 24px 64px rgba(0,0,0,0.18)",width:"100%",maxWidth:480,padding:30 }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24 }}>
              <h2 style={{ fontSize:17,fontWeight:700,color:T.ink,letterSpacing:"-.02em" }}>Tạo mã giảm giá</h2>
              <button onClick={() => setShowForm(false)} style={{ width:32,height:32,borderRadius:10,border:"1.5px solid #E0E0E0",background:"none",cursor:"pointer",fontSize:18,color:T.inkLight }}>×</button>
            </div>

            <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
              <div>
                {lbl("Mã code")}
                {inp(newCoupon.code, e=>setNewCoupon(p=>({...p,code:e.target.value.toUpperCase()})), { letterSpacing:".08em",fontWeight:700,fontSize:16,textTransform:"uppercase" as const,placeholder:"VD: DEAL30" })}
              </div>

              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
                <div>
                  {lbl("Loại giảm")}
                  <select value={newCoupon.discountType} onChange={e=>setNewCoupon(p=>({...p,discountType:e.target.value as any}))}
                    style={{ width:"100%",padding:"10px 13px",borderRadius:T.radiusXs,border:"1.5px solid #E0E0E0",fontSize:13,fontFamily:T.font,background:T.card }}>
                    <option value="percent">Phần trăm (%)</option>
                    <option value="fixed">Số tiền ($)</option>
                  </select>
                </div>
                <div>
                  {lbl(newCoupon.discountType==="percent"?"Mức giảm (%)":"Giảm ($)")}
                  <input type="number" min="1" max={newCoupon.discountType==="percent"?100:undefined}
                    value={newCoupon.discountValue} onChange={e=>setNewCoupon(p=>({...p,discountValue:Number(e.target.value)}))}
                    style={{ width:"100%",padding:"10px 13px",borderRadius:T.radiusXs,border:"1.5px solid #E0E0E0",fontSize:18,fontWeight:700,textAlign:"center" as const,fontFamily:T.font,boxSizing:"border-box" as const }} />
                </div>
              </div>

              <div>
                {lbl("Số lượt sử dụng tối đa")}
                <input type="number" min="1" value={newCoupon.maxUses}
                  onChange={e=>setNewCoupon(p=>({...p,maxUses:Number(e.target.value)}))}
                  style={{ width:"100%",padding:"10px 13px",borderRadius:T.radiusXs,border:"1.5px solid #E0E0E0",fontSize:16,fontWeight:600,textAlign:"center" as const,fontFamily:T.font,boxSizing:"border-box" as const }} />
                <p style={{ fontSize:11,color:T.inkLight,marginTop:5 }}>Mã sẽ tự động vô hiệu hóa sau {newCoupon.maxUses} lần sử dụng</p>
              </div>

              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
                <div>
                  {lbl("Ngày bắt đầu (tuỳ chọn)")}
                  <input type="date" value={newCoupon.startsAt} onChange={e=>setNewCoupon(p=>({...p,startsAt:e.target.value}))}
                    style={{ width:"100%",padding:"10px 13px",borderRadius:T.radiusXs,border:"1.5px solid #E0E0E0",fontSize:13,fontFamily:T.font,boxSizing:"border-box" as const }} />
                </div>
                <div>
                  {lbl("Ngày hết hạn (tuỳ chọn)")}
                  <input type="date" value={newCoupon.expiresAt} onChange={e=>setNewCoupon(p=>({...p,expiresAt:e.target.value}))}
                    style={{ width:"100%",padding:"10px 13px",borderRadius:T.radiusXs,border:"1.5px solid #E0E0E0",fontSize:13,fontFamily:T.font,boxSizing:"border-box" as const }} />
                </div>
              </div>

              {/* Preview */}
              {newCoupon.code && (
                <div style={{ background:T.surface,borderRadius:T.radiusSm,padding:"14px 16px",border:"1.5px dashed #E0E0E0" }}>
                  <p style={{ fontSize:12,color:T.inkLight,marginBottom:6 }}>Xem trước:</p>
                  <p style={{ fontWeight:700,color:T.ink }}>
                    Mã <span style={{ fontFamily:"monospace",letterSpacing:".06em" }}>{newCoupon.code}</span> — giảm {newCoupon.discountType==="percent"?`${newCoupon.discountValue}%`:`$${newCoupon.discountValue}`} · Tối đa {newCoupon.maxUses} lượt
                    {newCoupon.expiresAt ? ` · Hết hạn ${new Date(newCoupon.expiresAt).toLocaleDateString("vi-VN")}` : ""}
                  </p>
                </div>
              )}

              {formError && <p style={{ color:"#EF4444",fontSize:13 }}>⚠ {formError}</p>}
            </div>

            <div style={{ display:"flex",gap:10,marginTop:24 }}>
              <button onClick={() => { setFormError(""); if(!newCoupon.code){setFormError("Vui lòng nhập mã code");return;} createMutation.mutate(newCoupon); }}
                style={{ flex:1,padding:13,borderRadius:T.radiusSm,background:T.ink,color:"#fff",border:"none",fontWeight:600,fontSize:14,cursor:"pointer",fontFamily:T.font }}>
                Tạo mã
              </button>
              <button onClick={() => setShowForm(false)}
                style={{ flex:1,padding:13,borderRadius:T.radiusSm,background:T.surface,color:T.inkMid,border:"1.5px solid #E0E0E0",fontWeight:600,fontSize:14,cursor:"pointer",fontFamily:T.font }}>
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
