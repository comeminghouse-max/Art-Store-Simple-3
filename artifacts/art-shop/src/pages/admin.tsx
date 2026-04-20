import { useState, useMemo, CSSProperties, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type Artwork = {
  id: number; title: string; description: string; category: string;
  price: number; imageUrl: string; detailImages: string[]; tags: string[];
  available: boolean; year: number; dimensions: string; medium: string;
  featured: boolean; editionTotal: number; editionSold: number;
};
type Order = {
  id: number; userId: string | null; status: string; items: any[];
  total: string; customerName: string; customerEmail: string;
  shippingAddress: string; notes: string | null;
  paypalOrderId?: string | null; createdAt: string;
};
type Coupon = {
  id: number; code: string; discountType: "percent"|"fixed";
  discountValue: number; minOrderAmount: number; maxUses: number; usedCount: number;
  remaining: number; startsAt: string|null; expiresAt: string|null;
  active: boolean; createdAt: string;
};
type Frame = {
  id: number; name: string; material: string; imageUrl: string;
  priceA5: number; priceA4: number; priceA3: number; available: boolean;
  detailImages: string[];
};
type PrintPrices = { A5: number; A4: number; A3: number };

function parsePrintPrices(d: string): PrintPrices {
  try { const p=JSON.parse(d); if(p?.A5!==undefined)return p; } catch {}
  return { A5:0, A4:0, A3:0 };
}

const emptyOriginal: Omit<Artwork,"id"> = {
  title:"",description:"",category:"original",price:0,imageUrl:"",
  detailImages:[],tags:[],available:true,year:new Date().getFullYear(),
  dimensions:"",medium:"Oil on canvas",featured:false,editionTotal:1,editionSold:0,
};
const emptyPrint: Omit<Artwork,"id"> = {
  title:"",description:"",category:"print",price:0,imageUrl:"",
  detailImages:[],tags:[],available:true,year:new Date().getFullYear(),
  dimensions:JSON.stringify({A5:0,A4:0,A3:0}),medium:"Giclée on Archival Paper",
  featured:false,editionTotal:50,editionSold:0,
};
const emptyFrame: Omit<Frame,"id"> = {
  name:"", material:"", imageUrl:"", priceA5:0, priceA4:0, priceA3:0, available:true,
  detailImages: [] //
};

const LIGHT = {
  bg:"#968774", surface:"#F0EDE8", card:"#FFFFFF", cardAlt:"#FAFAF8",
  ink:"#1A1A1A", inkMid:"#555555", inkLight:"#9A9A9A", accentSoft:"#F5F2EE",
  border:"#EDEBE7", inputBg:"#FFFFFF", inputBorder:"#E2DED9",
  sidebarBg:"#000000", sidebarActive:"rgba(255,255,255,0.1)",
  green:"#E3F9E5", greenInk:"#1A6B24", red:"#FDE8E8", redInk:"#8B1F1F",
  amber:"#FEF6E0", amberInk:"#8A5200", blue:"#E6F0FD", blueInk:"#1A3A7A",
  purple:"#F0ECFE", purpleInk:"#4A1D96",
  shadow:"0 2px 20px rgba(0,0,0,0.055)", shadowHover:"0 8px 36px rgba(255, 255, 255, 0.11)",
  radius:"28px", radiusSm:"16px", radiusXs:"10px",
  font:"'DM Sans','Outfit',system-ui,sans-serif", isDark: false,
};
const DARK = {
  bg:"#0F0F0F", surface:"#1A1A1A", card:"#1E1E1E", cardAlt:"#252525",
  ink:"#F0F0F0", inkMid:"#AAAAAA", inkLight:"#666666", accentSoft:"#2A2520",
  border:"#333333", inputBg:"#252525", inputBorder:"#3A3A3A",
  sidebarBg:"#111111", sidebarActive:"rgba(255,255,255,0.08)",
  green:"#052E16", greenInk:"#4ADE80", red:"#2D0A0A", redInk:"#F87171",
  amber:"#2D1F00", amberInk:"#FCD34D", blue:"#0D1F3C", blueInk:"#60A5FA",
  purple:"#1E1040", purpleInk:"#A78BFA",
  shadow:"0 2px 16px rgba(0,0,0,0.4)", shadowHover:"0 8px 32px rgba(0,0,0,0.6)",
  radius:"24px", radiusSm:"14px", radiusXs:"10px",
  font:"'DM Sans','Outfit',system-ui,sans-serif", isDark: true,
};
type Theme = typeof LIGHT;

const bentoCard = (t: Theme): CSSProperties => ({
  background: t.card, borderRadius: t.radius, boxShadow: t.shadow, overflow: "hidden",
  transition: "box-shadow .22s, transform .22s, background .3s",
});

function makeFontStyle(t: Theme) {
  return `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');
  * { box-sizing: border-box; }
  html, body, #root { font-family: ${t.font} !important; }
  .bento-hover:hover { box-shadow: ${t.shadowHover} !important; transform: translateY(-2px) !important; }
  .row-hover:hover { background: ${t.isDark ? "#252525" : "#F5F5F3"} !important; }
  input, textarea, select { font-family: ${t.font} !important; background: ${t.inputBg} !important; color: ${t.ink} !important; }
  input:focus, textarea:focus, select:focus { border-color: ${t.isDark ? "#666" : "#1A1A1A"} !important; outline: none !important; }
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-thumb { background: ${t.isDark ? "#333" : "#D0D0D0"}; border-radius: 99px; }
`;
}

const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);
const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

function getStatusCfg(t: Theme): Record<string,{bg:string;c:string;label:string}> {
  return {
    paid:     {bg:t.green,  c:t.greenInk,  label:"✓ Đã thanh toán"},
    shipped:  {bg:t.blue,   c:t.blueInk,   label:"🚚 Đã giao"},
    pending:  {bg:t.amber,  c:t.amberInk,  label:"⏳ Chờ xử lý"},
    cart:     {bg:t.isDark?"#252525":"#F0F0F0", c:t.inkMid, label:"🛒 Giỏ hàng"},
    cancelled:{bg:t.red,    c:t.redInk,    label:"✕ Đã hủy"},
    removed:  {bg:t.purple, c:t.purpleInk, label:"🗑 Đã xóa"},
  };
}
const statusBadge = (s: string, t: Theme) => {
  const cfg = getStatusCfg(t)[s] || getStatusCfg(t)["pending"];
  return <span style={{background:cfg.bg,color:cfg.c,padding:"4px 11px",borderRadius:99,fontSize:11,fontWeight:600,whiteSpace:"nowrap" as const}}>{cfg.label}</span>;
};

const HIDDEN_STATUSES = ["removed", "pending", "cart"];
// "removed" bị ẩn hoàn toàn, không xuất hiện trong dropdown
const STATUS_CFG: Record<string,{label:string}> = {
  paid:{label:"✓ Đã thanh toán"}, shipped:{label:"🚚 Đã giao"},
  pending:{label:"⏳ Chờ xử lý"}, cart:{label:"🛒 Giỏ hàng"},
  cancelled:{label:"✕ Đã hủy"},
};

// ── Login ─────────────────────────────────────────────────────────────────────
export default function Admin() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try { return localStorage.getItem("admin-dark") === "1"; } catch { return false; }
  });
  const T = darkMode ? DARK : LIGHT;
  const toggleDark = () => setDarkMode(d => { const n=!d; try{localStorage.setItem("admin-dark",n?"1":"0");}catch{} return n; });
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(() => { try{return sessionStorage.getItem("admin-authed")==="1";}catch{return false;} });
  const login = () => { if(password==="admin123"){try{sessionStorage.setItem("admin-authed","1");}catch{}setAuthed(true);}else{alert("Sai mật khẩu!");} };
  const logout = () => { try{sessionStorage.removeItem("admin-authed");}catch{} setAuthed(false); };
  const qc = useQueryClient();
  const fontStyle = makeFontStyle(T);

  if (!authed) return (
    <div style={{position:"fixed",inset:0,zIndex:9000,background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:T.font,color:T.ink}}>
      <style>{fontStyle}</style>
      <div style={{background:T.card,borderRadius:T.radius,boxShadow:T.shadow,width:380,padding:"40px 36px"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{width:60,height:60,borderRadius:18,background:T.ink,display:"inline-flex",alignItems:"center",justifyContent:"center",marginBottom:16}}>
            <span style={{color:"#e8d5b0",fontSize:26,fontWeight:800,fontStyle:"italic"}}>n</span>
          </div>
          <h1 style={{fontSize:22,fontWeight:700,color:T.ink}}>naman.atelier</h1>
          <p style={{color:T.inkLight,fontSize:13,marginTop:4}}>Studio Admin</p>
        </div>
        <input type="password" placeholder="Mật khẩu"
          style={{width:"100%",padding:"13px 16px",borderRadius:T.radiusSm,border:`1.5px solid ${T.inputBorder}`,fontSize:14,fontFamily:T.font,marginBottom:12,display:"block",background:T.inputBg}}
          value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()} />
        <button style={{width:"100%",padding:14,borderRadius:T.radiusSm,background:T.ink,color:T.isDark?"#000":"#fff",fontWeight:600,fontSize:14,border:"none",cursor:"pointer",fontFamily:T.font}} onClick={login}>Đăng nhập →</button>
      </div>
    </div>
  );
  return <BentoDashboard key={darkMode?"dark":"light"} T={T} qc={qc} onLogout={logout} darkMode={darkMode} toggleDark={toggleDark}/>;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function BentoDashboard({T,qc,onLogout,darkMode,toggleDark}:{T:typeof LIGHT;qc:any;onLogout:()=>void;darkMode:boolean;toggleDark:()=>void}) {
  const fontStyle = makeFontStyle(T);
  const [page, setPage] = useState<"home"|"original"|"print"|"frames"|"orders"|"coupons">("home");
  const [editing, setEditing] = useState<Artwork|null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<Omit<Artwork,"id">>(emptyOriginal);
  const [orderFilter, setOrderFilter] = useState<"all"|"paid"|"pending"|"shipped"|"removed">("all");
  const [showHidden, setShowHidden] = useState(false);
  const [search, setSearch] = useState("");
  const [cleanupResult, setCleanupResult] = useState<string|null>(null);

  const API = import.meta.env.VITE_API_URL || "http://localhost:3000";
// --- THÊM: ESC KEYBOARD HANDLER ---
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setEditing(null);
        setAdding(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);
  const {data:artworks=[]} = useQuery<Artwork[]>({queryKey:["admin-artworks"],queryFn:async()=>{const r=await fetch(`${API}/api/artworks`);return r.json();}});
  const {data:rawOrders=[],isLoading:ordersLoading,error:ordersError,refetch:refetchOrders} = useQuery<Order[]>({
    queryKey:["admin-orders"],
    queryFn:async()=>{const r=await fetch(`${API}/api/orders`);if(!r.ok)throw new Error(`HTTP ${r.status}`);const d=await r.json();return d.map((o:any)=>({...o,items:Array.isArray(o.items)?o.items:[]}));},
    retry:2,refetchInterval:30000,
  });

  const originals=artworks.filter(a=>a.category!=="print");
  const prints=artworks.filter(a=>a.category==="print");
  const paidOrders=rawOrders.filter(o=>o.status==="paid").length;
  const totalRev=rawOrders.filter(o=>["paid","shipped"].includes(o.status)).reduce((s,o)=>s+Number(o.total),0);
  const trashOrders=rawOrders.filter(o=>HIDDEN_STATUSES.includes(o.status));
  const cleanOrders=rawOrders.filter(o=>!HIDDEN_STATUSES.includes(o.status));

  const filteredOrders=useMemo(()=>{
    // Luôn ẩn "removed" hoàn toàn, không bao giờ hiện dù showHidden = true
    let list=showHidden?rawOrders.filter(o=>o.status!=="removed"):[...cleanOrders];
    if(orderFilter!=="all")list=list.filter(o=>o.status===orderFilter);
    if(search.trim()){const q=search.toLowerCase();list=list.filter(o=>o.customerName?.toLowerCase().includes(q)||o.customerEmail?.toLowerCase().includes(q)||String(o.id).includes(q));}
    return list.sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime());
  },[rawOrders,cleanOrders,orderFilter,search,showHidden]);

  const cleanupMutation=useMutation({
    mutationFn:async()=>{const res=await fetch(`${API}/api/orders/cleanup?days=60`,{method:"DELETE"});if(!res.ok)throw new Error("Cleanup failed");return res.json();},
    onSuccess:(data)=>{qc.invalidateQueries({queryKey:["admin-orders"]});setCleanupResult(`🧹 Đã xóa ${data.deleted} đơn rác`);setTimeout(()=>setCleanupResult(null),5000);},
    onError:()=>setCleanupResult("❌ Dọn dẹp thất bại"),
  });
  const deleteMutation=useMutation({
    mutationFn:async(id:number)=>{await fetch(`${API}/api/artworks/${id}`,{method:"DELETE"});},
    onSuccess:()=>qc.invalidateQueries({queryKey:["admin-artworks"]}),
  });
  const saveMutation=useMutation({
    mutationFn:async(data:{id?:number;form:Omit<Artwork,"id">})=>{const url=data.id?`${API}/api/artworks/${data.id}`:`${API}/api/artworks`;await fetch(url,{method:data.id?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data.form)});},
    onSuccess:()=>{qc.invalidateQueries({queryKey:["admin-artworks"]});setEditing(null);setAdding(false);},
  });
  const updateOrder=useMutation({
    mutationFn:async({id,status}:{id:number;status:string})=>{await fetch(`${API}/api/orders/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status})});},
    onSuccess:()=>qc.invalidateQueries({queryKey:["admin-orders"]}),
  });

  const openAdd=(isPrint:boolean)=>{setForm(isPrint?emptyPrint:emptyOriginal);setAdding(true);};
  const openEdit=(a:Artwork)=>{setEditing(a);setForm({title:a.title,description:a.description,category:a.category,price:a.price,imageUrl:a.imageUrl,detailImages:a.detailImages||[],tags:a.tags||[],available:a.available,year:a.year,dimensions:a.dimensions,medium:a.medium,featured:a.featured,editionTotal:a.editionTotal??(a.category==="print"?50:1),editionSold:a.editionSold??0});};

  const navItems=[
    {key:"home"    as const, emoji:"⊞", label:"Dashboard"},
    {key:"original"as const, emoji:"✦", label:"Tranh gốc"},
    {key:"print"   as const, emoji:"▣", label:"Prints"},
    {key:"frames"  as const, emoji:"🖼", label:"Khung tranh"},
    {key:"orders"  as const, emoji:"◎", label:"Đơn hàng", badge:paidOrders},
    {key:"coupons" as const, emoji:"🏷", label:"Mã giảm giá"},
  ];

  return (
    <div data-theme={darkMode?"dark":"light"} style={{position:"fixed",inset:0,zIndex:9000,background:T.bg,fontFamily:T.font,display:"flex",overflowY:"hidden" as const,color:T.ink}}>
      <style>{fontStyle}</style>
      {/* Sidebar */}
      <aside style={{width:220,background:T.sidebarBg,display:"flex",flexDirection:"column",padding:"28px 18px",position:"fixed",top:0,left:0,bottom:0,zIndex:50}}>
        <div style={{marginBottom:32,padding:"0 6px"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:38,height:38,borderRadius:12,background:"#e8d5b0",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span style={{color:"#1A1A1A",fontWeight:800,fontSize:18,fontStyle:"italic"}}>n</span>
            </div>
            <div style={{flex:1}}>
              <p style={{color:"#fff",fontWeight:700,fontSize:13}}>naman.atelier</p>
              <p style={{color:"#555",fontSize:11,marginTop:1}}>Studio</p>
            </div>
            <button onClick={toggleDark}
              style={{width:32,height:32,borderRadius:10,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.07)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#aaa",flexShrink:0}}
              onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.15)";e.currentTarget.style.color="#fff";}}
              onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.07)";e.currentTarget.style.color="#aaa";}}>
              {darkMode?<SunIcon/>:<MoonIcon/>}
            </button>
          </div>
        </div>
        <nav style={{flex:1,display:"flex",flexDirection:"column",gap:3}}>
          {navItems.map(item=>(
            <button key={item.key} onClick={()=>setPage(item.key)}
              style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:T.radiusSm,border:"none",cursor:"pointer",fontFamily:T.font,fontSize:13,fontWeight:page===item.key?600:400,color:page===item.key?"#fff":"rgba(255,255,255,0.45)",background:page===item.key?"rgba(255,255,255,0.12)":"transparent",transition:"all .15s",textAlign:"left" as const}}>
              <span style={{fontSize:16,opacity:page===item.key?1:.6}}>{item.emoji}</span>
              <span style={{flex:1}}>{item.label}</span>
              {item.badge?<span style={{background:"#EF4444",color:"#fff",borderRadius:99,padding:"1px 7px",fontSize:10,fontWeight:700}}>{item.badge}</span>:null}
            </button>
          ))}
        </nav>
        <button onClick={onLogout}
          style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:T.radiusSm,border:"none",cursor:"pointer",fontFamily:T.font,fontSize:13,color:"#555",background:"transparent",textAlign:"left" as const}}
          onMouseEnter={e=>(e.currentTarget.style.color="#fff")} onMouseLeave={e=>(e.currentTarget.style.color="#555")}>
          ↪ Đăng xuất
        </button>
      </aside>

      {/* Main */}
      <main style={{marginLeft:220,flex:1,padding:"36px 40px",overflowX:"hidden" as const,overflowY:"auto",height:"100vh",background:T.bg,color:T.ink}}>

        {/* HOME */}
        {page==="home"&&(
          <div>
            <div style={{marginBottom:32}}>
              <p style={{fontSize:12,fontWeight:500,color:T.inkLight,letterSpacing:".08em",textTransform:"uppercase" as const,marginBottom:4}}>{new Date().toLocaleDateString("vi-VN",{weekday:"long",day:"2-digit",month:"long"})}</p>
              <h1 style={{fontSize:28,fontWeight:700,color:T.ink,letterSpacing:"-.03em"}}>Xin chào 👋</h1>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
              {([
                {emoji:"📦",label:"Tổng đơn",value:cleanOrders.length,sub:"đơn hợp lệ",accent:"#E6F0FD",accentTxt:"#1A3A7A"},
                {emoji:"🚚",label:"Cần giao",value:paidOrders,sub:"đã thanh toán",accent:"#E3F9E5",accentTxt:"#1A6B24"},
                {emoji:"💰",label:"Doanh thu",value:`$${totalRev.toLocaleString()}`,sub:"đã xác nhận",accent:"#FEF6E0",accentTxt:"#8A5200"},
                {emoji:"🖼",label:"Tổng tranh",value:artworks.length,sub:`${originals.length} gốc · ${prints.length} print`,accent:"#F0ECFE",accentTxt:"#4A1D96"},
              ] as any[]).map(s=>(
                <div key={s.label} className="bento-hover" style={{...bentoCard(T),padding:"20px",cursor:"default"}}>
                  <div style={{width:36,height:36,borderRadius:10,background:s.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,marginBottom:14}}>{s.emoji}</div>
                  <p style={{fontSize:11,fontWeight:500,color:T.inkLight,letterSpacing:".05em",textTransform:"uppercase" as const,marginBottom:6}}>{s.label}</p>
                  <p style={{fontSize:26,fontWeight:800,color:s.accentTxt,letterSpacing:"-.03em",lineHeight:1}}>{s.value}</p>
                  <p style={{fontSize:11,color:T.inkLight,marginTop:5}}>{s.sub}</p>
                </div>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 280px",gap:12}}>
              <div style={{...bentoCard(T),padding:"24px 28px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
                  <div><h2 style={{fontSize:15,fontWeight:700,color:T.ink}}>Đơn hàng gần đây</h2><p style={{fontSize:11,color:T.inkLight,marginTop:2}}>Các đơn đã thanh toán</p></div>
                  <button onClick={()=>setPage("orders")} style={{fontSize:12,color:T.inkMid,background:T.isDark?"rgba(255,255,255,0.06)":"#F7F5F2",border:"none",cursor:"pointer",fontFamily:T.font,padding:"6px 12px",borderRadius:8,fontWeight:500}}>Xem tất cả →</button>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:4}}>
                  {cleanOrders.filter(o=>["paid","shipped"].includes(o.status)).slice(0,5).map((o,idx)=>(
                    <div key={o.id} className="row-hover" style={{display:"flex",alignItems:"center",gap:12,padding:"11px 12px",borderRadius:12,transition:"background .15s"}}>
                      <div style={{width:36,height:36,borderRadius:10,background:T.isDark?"#1E3A5F":"#DBEAFE",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:T.isDark?"#60A5FA":"#1D4ED8",flexShrink:0}}>
                        {(o.customerName||"?").slice(0,2).toUpperCase()}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{fontWeight:600,color:T.ink,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{o.customerName}</p>
                        <p style={{color:T.inkLight,fontSize:11,marginTop:1}}>{new Date(o.createdAt).toLocaleDateString("vi-VN")}</p>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                        <span style={{fontWeight:700,color:T.ink,fontSize:13}}>${Number(o.total).toLocaleString()}</span>
                        {statusBadge(o.status,T)}
                      </div>
                    </div>
                  ))}
                  {cleanOrders.filter(o=>["paid","shipped"].includes(o.status)).length===0&&(
                    <div style={{padding:"32px 0",textAlign:"center" as const}}><p style={{fontSize:32,marginBottom:8}}>📭</p><p style={{color:T.inkLight,fontSize:13}}>Chưa có đơn hàng nào</p></div>
                  )}
                </div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                {([
                  {emoji:"✦",label:"Thêm tranh gốc",sub:"Upload tác phẩm mới",action:()=>{setPage("original");openAdd(false);},bg:T.surface,c:T.ink,subC:T.inkLight},
                  {emoji:"▣",label:"Thêm bản in",sub:"Fine Art Print",action:()=>{setPage("print");openAdd(true);},bg:T.surface,c:T.ink,subC:T.inkLight},
                  {emoji:"🖼",label:"Khung tranh",sub:"Thêm & quản lý khung",action:()=>setPage("frames"),bg:T.surface,c:T.ink,subC:T.inkLight},
                  {emoji:"◎",label:"Đơn hàng",sub:`${paidOrders} cần xử lý`,action:()=>setPage("orders"),bg:T.isDark?"#0D2A4A":"#DBEAFE",c:T.isDark?"#93C5FD":"#1D4ED8",subC:T.isDark?"#60A5FA":"#3B82F6"},
                ] as any[]).map((a,i)=>(
                  <button key={i} onClick={a.action} className="bento-hover"
                    style={{...bentoCard(T),flex:1,padding:"16px 18px",background:a.bg,color:a.c,border:"none",cursor:"pointer",fontFamily:T.font,textAlign:"left" as const,display:"flex",alignItems:"center",gap:12}}>
                    <span style={{fontSize:18,flexShrink:0}}>{a.emoji}</span>
                    <div><p style={{fontWeight:600,fontSize:13}}>{a.label}</p><p style={{fontSize:11,color:a.subC,marginTop:2}}>{a.sub}</p></div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ARTWORKS */}
        {(page==="original"||page==="print")&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24}}>
              <div>
                <h1 style={{fontSize:24,fontWeight:700,color:T.ink,letterSpacing:"-.04em"}}>{page==="original"?"Tranh gốc":"Fine Art Prints"}</h1>
                <p style={{color:T.inkLight,fontSize:13,marginTop:3}}>{(page==="original"?originals:prints).length} tác phẩm</p>
              </div>
              <button onClick={()=>openAdd(page==="print")} style={{background:T.ink,color:"#fff",border:"none",borderRadius:12,padding:"10px 20px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:T.font}}>+ Thêm mới</button>
            </div>
            <div style={{...bentoCard(T),overflow:"hidden"}}>
              {(page==="original"?originals:prints).length===0?(
                <div style={{padding:"48px",textAlign:"center" as const,color:T.inkLight}}>Chưa có tác phẩm nào</div>
              ):(
                <table style={{width:"100%",borderCollapse:"collapse" as const,fontSize:13}}>
                  <thead>
                    <tr style={{borderBottom:`1.5px solid ${T.isDark?"#2A2A2A":"#F0EEE9"}`}}>
                      {["Ảnh","Tên","Chất liệu / Năm",page==="print"?"Giá khổ":"Giá","Trạng thái",""].map(h=>(
                        <th key={h} style={{padding:"14px 16px",textAlign:"left" as const,fontSize:11,fontWeight:600,color:T.inkLight,letterSpacing:".05em",textTransform:"uppercase" as const}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(page==="original"?originals:prints).map(a=>(
                     <tr key={a.id} className="row-hover" style={{borderBottom:`1px solid ${T.isDark?"#2A2A2A" : "#F2F2F2"}`, cursor: "pointer"}} onClick={() => openEdit(a)}>
                        <td style={{padding:"12px 16px"}}>
                          <div style={{width:52,height:52,borderRadius:10,overflow:"hidden",background:T.surface}}>
                            {a.imageUrl?<img src={a.imageUrl} style={{width:"100%",height:"100%",objectFit:"cover" as const}}/>:<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",color:T.inkLight,fontSize:18}}>🖼</div>}
                          </div>
                        </td>
                        <td style={{padding:"12px 16px"}}><p style={{fontWeight:600,color:T.ink,marginBottom:3}}>{a.title}</p><p style={{fontSize:11,color:T.inkLight}}>{a.category}</p></td>
                        <td style={{padding:"12px 16px",color:T.inkMid}}>{a.medium}<br/><span style={{fontSize:11,color:T.inkLight}}>{a.year}</span></td>
                        <td style={{padding:"12px 16px"}}>
                          {page==="print"?(
                            <div style={{display:"flex",gap:6,flexWrap:"wrap" as const}}>
                              {(["A5","A4","A3"] as const).map(s=>{const pp=parsePrintPrices(a.dimensions);return pp[s]>0&&<span key={s} style={{background:T.surface,color:T.inkMid,padding:"2px 8px",borderRadius:6,fontSize:11,fontWeight:600}}>{s}: ${pp[s]}</span>;})}
                            </div>
                          ):<span style={{fontWeight:700,color:T.ink}}>${a.price}</span>}
                        </td>
                        <td style={{padding:"12px 16px"}}><span style={{background:a.available?(T.isDark?"#052E16":"#E3F9E5"):(T.isDark?"#2D0A0A":"#FDE8E8"),color:a.available?T.greenInk:T.redInk,padding:"3px 9px",borderRadius:99,fontSize:11,fontWeight:600}}>{a.available?"Còn hàng":"Hết hàng"}</span></td>
                        <td style={{padding:"12px 16px"}}>
                          <div style={{display:"flex",gap:6}}>
                            <button onClick={()=>openEdit(a)} style={{padding:"6px 12px",borderRadius:8,border:`1.5px solid ${T.border}`,background:"none",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:T.font,color:T.inkMid}}>✏ Sửa</button>
                            <button onClick={()=>confirm(`Xóa "${a.title}"?`)&&deleteMutation.mutate(a.id)}
                              style={{width:32,height:32,borderRadius:8,border:`1.5px solid ${T.border}`,background:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:T.inkMid}}
                              onMouseEnter={e=>{e.currentTarget.style.background="#EF4444";e.currentTarget.style.color="#fff";e.currentTarget.style.borderColor="#EF4444";}}
                              onMouseLeave={e=>{e.currentTarget.style.background="none";e.currentTarget.style.color=T.inkMid;e.currentTarget.style.borderColor=T.border;}}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* FRAMES */}
        {page==="frames"&&<FramesPanel T={T} API={API} qc={qc}/>}

        {/* ORDERS */}
        {page==="orders"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:24}}>
              <div>
                <h1 style={{fontSize:24,fontWeight:700,color:T.ink,letterSpacing:"-.04em"}}>Đơn hàng</h1>
                <p style={{color:T.inkLight,fontSize:13,marginTop:2}}>{filteredOrders.length} đơn · {paidOrders} cần giao</p>
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                {cleanupResult&&<span style={{fontSize:12,color:T.greenInk,fontWeight:500}}>{cleanupResult}</span>}
                <button onClick={()=>setShowHidden(h=>!h)} style={{padding:"8px 14px",borderRadius:T.radiusXs,border:`1.5px solid ${T.inputBorder}`,background:showHidden?T.ink:"none",color:showHidden?(T.isDark?"#000":"#fff"):T.inkMid,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:T.font}}>{showHidden?"Ẩn đơn rác":"Hiện đơn rác"}</button>
                <button onClick={()=>refetchOrders()} style={{padding:"8px 14px",borderRadius:T.radiusXs,border:`1.5px solid ${T.inputBorder}`,background:"none",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:T.font,color:T.inkMid}}>↻ Làm mới</button>
              </div>
            </div>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tìm theo tên, email, ID..."
              style={{width:"100%",padding:"11px 16px",borderRadius:T.radiusSm,border:`1.5px solid ${T.inputBorder}`,fontSize:13,fontFamily:T.font,marginBottom:14,boxSizing:"border-box" as const,background:T.inputBg}}/>
            <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap" as const}}>
              {(["all","paid","shipped","pending","cancelled","removed"] as const).map(s=>(
                <button key={s} onClick={()=>setOrderFilter(s as any)}
                  style={{padding:"7px 14px",borderRadius:T.radiusXs,border:`1.5px solid ${orderFilter===s?T.ink:T.inputBorder}`,background:orderFilter===s?T.ink:"none",color:orderFilter===s?(T.isDark?"#000":"#fff"):T.inkMid,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:T.font}}>
                  {s==="all"?"Tất cả":STATUS_CFG[s]?.label}
                </button>
              ))}
            </div>
            {ordersError&&<div style={{padding:"14px 18px",borderRadius:T.radiusSm,background:T.red,color:T.redInk,fontSize:13,marginBottom:16}}>⚠ Lỗi tải dữ liệu</div>}
            <div style={{...bentoCard(T)}}>
              <div style={{overflowX:"auto" as const}}>
                <table style={{width:"100%",borderCollapse:"collapse" as const,fontSize:13}}>
                  <thead>
                    <tr style={{borderBottom:`1.5px solid ${T.border}`}}>
                      {["#","Khách hàng","Email","Sản phẩm & Khung","Tổng","Trạng thái","Thao tác"].map(h=>(
                        <th key={h} style={{padding:"13px 16px",textAlign:"left" as const,fontSize:11,fontWeight:600,color:T.inkLight,letterSpacing:".04em",textTransform:"uppercase" as const,whiteSpace:"nowrap" as const}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map(o=>(
                      <tr key={o.id} className="row-hover" style={{borderBottom:`1px solid ${T.border}`}}>
                        <td style={{padding:"13px 16px",color:T.inkLight,fontWeight:600,fontSize:12}}>#{o.id}</td>
                        <td style={{padding:"13px 16px"}}>
                          <p style={{fontWeight:600,color:T.ink}}>{o.customerName}</p>
                          <p style={{fontSize:11,color:T.inkLight,marginTop:2}}>{new Date(o.createdAt).toLocaleDateString("vi-VN")}</p>
                        </td>
                        <td style={{padding:"13px 16px",color:T.inkMid,fontSize:12}}>{o.customerEmail}</td>
                        <td style={{padding:"13px 16px",maxWidth:240}}>
                          <div style={{display:"flex",flexDirection:"column",gap:4}}>
                            {(o.items||[]).map((item:any,i:number)=>(
                              <div key={i} style={{fontSize:11}}>
                                <span style={{display:"flex",alignItems:"center",gap:4,flexWrap:"wrap" as const}}>
                                  {item.type==="frame"
                                    ?<span style={{background:T.amber,color:T.amberInk,padding:"1px 6px",borderRadius:4,fontWeight:700,fontSize:10}}>KHUNG</span>
                                    :item.category==="print"||item.type==="print"
                                    ?<span style={{background:T.blue,color:T.blueInk,padding:"1px 6px",borderRadius:4,fontWeight:700,fontSize:10}}>PRINT</span>
                                    :<span style={{background:T.purple,color:T.purpleInk,padding:"1px 6px",borderRadius:4,fontWeight:700,fontSize:10}}>GỐC</span>
                                  }
                                  <span style={{color:T.ink,fontWeight:500}}>{item.title||item.name}</span>
                                  {item.size&&<span style={{color:T.inkLight}}>({item.size})</span>}
                                  <span style={{color:T.inkLight}}>×{item.quantity||1}</span>
                                </span>
                                {item.frameName&&(
                                  <span style={{color:T.inkLight,fontSize:10,marginLeft:4,display:"block"}}>↳ Khung: {item.frameName} {item.frameSize?`(${item.frameSize})`:""}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td style={{padding:"13px 16px",fontWeight:700,color:T.ink}}>${Number(o.total).toFixed(2)}</td>
                        <td style={{padding:"13px 16px"}}>{statusBadge(o.status,T)}</td>
                        <td style={{padding:"13px 16px"}}>
                          <select value={o.status} onChange={e=>updateOrder.mutate({id:o.id,status:e.target.value})}
                            style={{padding:"6px 10px",borderRadius:8,border:`1.5px solid ${T.inputBorder}`,fontSize:12,fontFamily:T.font,cursor:"pointer",background:T.card}}>
                            {Object.entries(STATUS_CFG).map(([v,c])=><option key={v} value={v}>{c.label}</option>)}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredOrders.length===0&&!ordersLoading&&(
                  <div style={{padding:"40px",textAlign:"center" as const,color:T.inkLight}}><p style={{fontSize:24,marginBottom:8}}>📭</p><p style={{fontSize:14}}>Không có đơn hàng nào</p></div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* COUPONS */}
        {page==="coupons"&&<CouponsPanel T={T} API={API} qc={qc}/>}

      </main>

      {/* Artwork Modal */}
      {(editing||adding)&&(
        <FormModal
          title={editing?`Sửa: ${editing.title}`:(page==="print"?"Thêm Print":"Thêm Tranh gốc")}
          form={form} setForm={setForm}
          isPrint={editing?editing.category==="print":page==="print"}
          onSave={()=>saveMutation.mutate({id:editing?.id,form})}
          onCancel={()=>{setEditing(null);setAdding(false);}}
          T={T}
        />
      )}
    </div>
  );
}

// ── Frames Panel ──────────────────────────────────────────────────────────────
function FramesPanel({T,API,qc}:{T:typeof LIGHT;API:string;qc:any}) {
  const [showForm, setShowForm] = useState(false);
  const [editingFrame, setEditingFrame] = useState<Frame|null>(null);
  const [form, setForm] = useState<Omit<Frame,"id">>(emptyFrame);
  // --- THÊM: Xử lý ESC cho Khung tranh ---
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowForm(false);
        setEditingFrame(null);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const {data:frames=[],isLoading} = useQuery<Frame[]>({
    queryKey:["admin-frames"],
    queryFn:async()=>{try{const r=await fetch(`${API}/api/frames`);if(!r.ok)return[];return r.json();}catch{return[];}},
  });

  const saveMut=useMutation({
    mutationFn:async()=>{
      const url=editingFrame?`${API}/api/frames/${editingFrame.id}`:`${API}/api/frames`;
      const r=await fetch(url,{method:editingFrame?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
      if(!r.ok)throw new Error("Lỗi lưu khung");
      return r.json();
    },
    onSuccess:()=>{qc.invalidateQueries({queryKey:["admin-frames"]});setShowForm(false);setEditingFrame(null);setForm(emptyFrame);},
  });
  const deleteMut=useMutation({
    mutationFn:async(id:number)=>{await fetch(`${API}/api/frames/${id}`,{method:"DELETE"});},
    onSuccess:()=>qc.invalidateQueries({queryKey:["admin-frames"]}),
  });
  const toggleMut=useMutation({
    mutationFn:async({id,available}:{id:number;available:boolean})=>{const r=await fetch(`${API}/api/frames/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({available})});return r.json();},
    onSuccess:()=>qc.invalidateQueries({queryKey:["admin-frames"]}),
  });

  const openEdit=(f:Frame)=>{setEditingFrame(f);setForm({name:f.name,material:f.material,imageUrl:f.imageUrl,priceA5:f.priceA5,priceA4:f.priceA4,priceA3:f.priceA3,available:f.available});setShowForm(true);};
  const openAdd=()=>{setEditingFrame(null);setForm(emptyFrame);setShowForm(true);};

  const inp=(label:string,value:any,onChange:any,opts:any={})=>(
    <div>
      <p style={{fontSize:11,fontWeight:600,color:T.inkLight,textTransform:"uppercase" as const,letterSpacing:".05em",marginBottom:6}}>{label}</p>
      <input value={value} onChange={onChange} style={{width:"100%",padding:"10px 13px",borderRadius:T.radiusXs,border:`1.5px solid ${T.inputBorder}`,fontSize:13,fontFamily:T.font,boxSizing:"border-box" as const,background:T.inputBg,...opts}}/>
    </div>
  );

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24}}>
        <div>
          <h1 style={{fontSize:24,fontWeight:700,color:T.ink,letterSpacing:"-.04em"}}>Khung tranh</h1>
          <p style={{color:T.inkLight,fontSize:13,marginTop:3}}>{frames.length} loại khung</p>
        </div>
        <button onClick={openAdd} style={{background:T.ink,color:"#fff",border:"none",borderRadius:12,padding:"10px 20px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:T.font}}>+ Thêm khung</button>
      </div>

      <div style={{...bentoCard(T),overflow:"hidden"}}>
        {isLoading?(
          <div style={{padding:40,textAlign:"center" as const,color:T.inkLight}}>Đang tải...</div>
        ):frames.length===0?(
          <div style={{padding:48,textAlign:"center" as const,color:T.inkLight}}>
            <p style={{fontSize:40,marginBottom:12}}>🖼</p>
            <p style={{fontSize:14,marginBottom:6}}>Chưa có khung nào</p>
            <p style={{fontSize:12}}>Nhấn "+ Thêm khung" để bắt đầu</p>
          </div>
        ):(
          <table style={{width:"100%",borderCollapse:"collapse" as const,fontSize:13}}>
            <thead>
              <tr style={{borderBottom:`1.5px solid ${T.isDark?"#2A2A2A":"#F0EEE9"}`}}>
                {["Ảnh","Tên & Chất liệu","Giá A5","Giá A4","Giá A3","Trạng thái",""].map(h=>(
                  <th key={h} style={{padding:"14px 16px",textAlign:"left" as const,fontSize:11,fontWeight:600,color:T.inkLight,letterSpacing:".05em",textTransform:"uppercase" as const}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {frames.map(f=>(
              <tr key={f.id} className="row-hover" style={{borderBottom:`1px solid ${T.isDark?"#2A2A2A" : "#F2F2F2"}`, cursor: "pointer"}} onClick={() => openEdit(f)}>
                  <td style={{padding:"12px 16px"}}>
                    <div style={{width:52,height:52,borderRadius:10,overflow:"hidden",background:T.surface,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      {f.imageUrl?<img src={f.imageUrl} style={{width:"100%",height:"100%",objectFit:"cover" as const}}/>:<span style={{fontSize:22}}>🖼</span>}
                    </div>
                  </td>
                  <td style={{padding:"12px 16px"}}>
                    <p style={{fontWeight:600,color:T.ink}}>{f.name}</p>
                    <p style={{fontSize:11,color:T.inkLight,marginTop:2}}>{f.material}</p>
                  </td>
                  <td style={{padding:"12px 16px",fontWeight:600,color:T.ink}}>${f.priceA5}</td>
                  <td style={{padding:"12px 16px",fontWeight:600,color:T.ink}}>${f.priceA4}</td>
                  <td style={{padding:"12px 16px",fontWeight:600,color:T.ink}}>${f.priceA3}</td>
                  <td style={{padding:"12px 16px"}}>
                    <button onClick={()=>toggleMut.mutate({id:f.id,available:!f.available})}
                      style={{background:f.available?(T.isDark?"#052E16":"#E3F9E5"):(T.isDark?"#2D0A0A":"#FDE8E8"),color:f.available?T.greenInk:T.redInk,padding:"4px 12px",borderRadius:99,border:"none",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:T.font}}>
                      {f.available?"● Còn hàng":"○ Hết hàng"}
                    </button>
                  </td>
                  <td style={{padding:"12px 16px"}}>
                    <div style={{display:"flex",gap:6}}>
                      <button onClick={()=>openEdit(f)} style={{padding:"6px 12px",borderRadius:8,border:`1.5px solid ${T.border}`,background:"none",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:T.font,color:T.inkMid}}>✏ Sửa</button>
                      <button onClick={()=>confirm(`Xóa khung "${f.name}"?`)&&deleteMut.mutate(f.id)}
                        style={{width:32,height:32,borderRadius:8,border:`1.5px solid ${T.border}`,background:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:T.inkMid}}
                        onMouseEnter={e=>{e.currentTarget.style.background="#EF4444";e.currentTarget.style.color="#fff";e.currentTarget.style.borderColor="#EF4444";}}
                        onMouseLeave={e=>{e.currentTarget.style.background="none";e.currentTarget.style.color=T.inkMid;e.currentTarget.style.borderColor=T.border;}}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm&&(
        <div style={{position:"fixed",inset:0,background:"rgba(20,20,20,0.4)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(4px)"}}>
          <div style={{background:T.card,borderRadius:T.radius,boxShadow:"0 24px 64px rgba(0,0,0,0.2)",width:"100%",maxWidth:480,padding:30,maxHeight:"90vh",overflowY:"auto" as const}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
              <h2 style={{fontSize:17,fontWeight:700,color:T.ink}}>{editingFrame?"Sửa khung":"Thêm khung mới"}</h2>
              <button onClick={()=>{setShowForm(false);setEditingFrame(null);}} style={{width:32,height:32,borderRadius:10,border:`1.5px solid ${T.inputBorder}`,background:"none",cursor:"pointer",fontSize:18,color:T.inkLight}}>×</button>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              {inp("Tên khung",form.name,e=>setForm(p=>({...p,name:e.target.value})),{placeholder:"VD: Khung gỗ sồi tự nhiên"})}
              {inp("Chất liệu",form.material,e=>setForm(p=>({...p,material:e.target.value})),{placeholder:"VD: Gỗ sồi, Nhôm anodized..."})}
              {inp("URL Ảnh",form.imageUrl,e=>setForm(p=>({...p,imageUrl:e.target.value})),{placeholder:"/images/frame-oak.jpg"})}
              {form.imageUrl&&<img src={form.imageUrl} style={{height:80,borderRadius:10,objectFit:"cover" as const}}/>}
              {/* THÊM PHẦN ẢNH CHI TIẾT VÀO MODAL KHUNG TRANH */}
<div style={{marginTop:10}}>
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
    <p style={{fontSize:11,fontWeight:600,color:T.inkLight,textTransform:"uppercase" as const,letterSpacing:".05em"}}>Album ảnh chi tiết</p>
    <button type="button" onClick={() => setForm((f:any) => ({...f, detailImages: [...(f.detailImages || []), ""]}))}
      style={{padding:"5px 12px",borderRadius:8,border:`1.5px solid ${T.inputBorder}`,background:"none",fontSize:11,fontWeight:600,cursor:"pointer",color:T.inkMid}}>+ Thêm ảnh</button>
  </div>
  <div style={{display:"flex",flexDirection:"column",gap:8}}>
    {(form.detailImages || []).map((url: string, i: number) => (
      <div key={i} style={{display:"flex",gap:8,alignItems:"center"}}>
        <input value={url} onChange={(e) => {
          const newImgs = [...(form.detailImages || [])];
          newImgs[i] = e.target.value;
          setForm((f:any) => ({...f, detailImages: newImgs}));
        }} placeholder="URL ảnh chi tiết..." style={{flex:1,padding:"10px 13px",borderRadius:T.radiusXs,border:`1.5px solid ${T.inputBorder}`,fontSize:13,background:T.inputBg}}/>
        <button type="button" onClick={() => setForm((f:any) => ({...f, detailImages: (f.detailImages || []).filter((_:any, x:number) => x !== i)}))}
          style={{background:"none",border:"none",cursor:"pointer",color:T.inkLight,fontSize:18}}>×</button>
      </div>
    ))}
  </div>
</div>
              <div>
                <p style={{fontSize:11,fontWeight:600,color:T.inkLight,textTransform:"uppercase" as const,letterSpacing:".05em",marginBottom:10}}>Giá theo khổ ($)</p>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                  {(["A5","A4","A3"] as const).map(s=>(
                    <div key={s} style={{border:`1.5px solid ${T.border}`,borderRadius:14,padding:"14px 12px",textAlign:"center" as const}}>
                      <p style={{fontWeight:700,color:T.inkMid,fontSize:12,marginBottom:8,textTransform:"uppercase" as const}}>{s}</p>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:3}}>
                        <span style={{color:T.inkLight,fontSize:13}}>$</span>
                        <input type="number" min="0"
                          value={s==="A5"?form.priceA5:s==="A4"?form.priceA4:form.priceA3}
                          onChange={e=>setForm(p=>({...p,[`price${s}`]:Number(e.target.value)}))}
                          style={{width:70,padding:"6px 8px",borderRadius:8,border:`1.5px solid ${T.inputBorder}`,fontSize:16,fontWeight:700,textAlign:"center" as const,fontFamily:T.font,background:T.inputBg}}/>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}>
                <div style={{width:20,height:20,borderRadius:6,border:`2px solid ${form.available?T.ink:"#D0D0D0"}`,background:form.available?T.ink:"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}
                  onClick={()=>setForm(p=>({...p,available:!p.available}))}>
                  {form.available&&<span style={{color:"#fff",fontSize:11,lineHeight:1}}>✓</span>}
                </div>
                <span style={{fontSize:13,color:T.inkMid,fontWeight:500}}>Còn hàng</span>
              </label>
            </div>
            <div style={{display:"flex",gap:10,marginTop:24}}>
              <button onClick={()=>saveMut.mutate()} disabled={saveMut.isPending}
                style={{flex:1,padding:13,borderRadius:T.radiusSm,background:T.ink,color:"#fff",border:"none",fontWeight:600,fontSize:14,cursor:"pointer",fontFamily:T.font,opacity:saveMut.isPending?.6:1}}>
                {saveMut.isPending?"Đang lưu...":"Lưu khung"}
              </button>
              <button onClick={()=>{setShowForm(false);setEditingFrame(null);}}
                style={{flex:1,padding:13,borderRadius:T.radiusSm,background:T.surface,color:T.inkMid,border:`1.5px solid ${T.inputBorder}`,fontWeight:600,fontSize:14,cursor:"pointer",fontFamily:T.font}}>Hủy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Coupons Panel ─────────────────────────────────────────────────────────────
function CouponsPanel({T,API,qc}:{T:typeof LIGHT;API:string;qc:any}) {
  const [showForm, setShowForm] = useState(false);
  const [newC, setNewC] = useState({code:"",discountType:"percent" as "percent"|"fixed",discountValue:10,minOrderAmount:0,maxUses:100,startsAt:"",expiresAt:""});
  const [formError, setFormError] = useState("");
  const lbl=(text:string)=><p style={{fontSize:11,fontWeight:600,color:T.inkLight,textTransform:"uppercase" as const,letterSpacing:".05em",marginBottom:6}}>{text}</p>;

  const {data:coupons=[],isLoading}=useQuery<Coupon[]>({queryKey:["admin-coupons"],queryFn:async()=>{const r=await fetch(`${API}/api/coupons`);return r.json();}});
  const createMut=useMutation({
    mutationFn:async(body:any)=>{const r=await fetch(`${API}/api/coupons`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});if(!r.ok){const e=await r.json();throw new Error(e.error||"Lỗi");}return r.json();},
    onSuccess:()=>{qc.invalidateQueries({queryKey:["admin-coupons"]});setShowForm(false);setNewC({code:"",discountType:"percent",discountValue:10,minOrderAmount:0,maxUses:100,startsAt:"",expiresAt:""});},
    onError:(e:any)=>setFormError(e.message),
  });
  const deleteMut=useMutation({mutationFn:async(id:number)=>{await fetch(`${API}/api/coupons/${id}`,{method:"DELETE"});},onSuccess:()=>qc.invalidateQueries({queryKey:["admin-coupons"]})});
  const toggleMut=useMutation({
    mutationFn:async({id,active}:{id:number;active:boolean})=>{const r=await fetch(`${API}/api/coupons/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({active})});return r.json();},
    onSuccess:()=>qc.invalidateQueries({queryKey:["admin-coupons"]}),
  });

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24}}>
        <div><h1 style={{fontSize:24,fontWeight:700,color:T.ink,letterSpacing:"-.04em"}}>Mã giảm giá</h1><p style={{color:T.inkLight,fontSize:13,marginTop:3}}>{coupons.length} mã</p></div>
        <button onClick={()=>setShowForm(true)} style={{background:T.ink,color:"#fff",border:"none",borderRadius:12,padding:"10px 20px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:T.font}}>+ Tạo mã mới</button>
      </div>
      <div style={{...bentoCard(T),overflow:"hidden"}}>
        {isLoading?<div style={{padding:40,textAlign:"center" as const,color:T.inkLight}}>Đang tải...</div>:(
          <table style={{width:"100%",borderCollapse:"collapse" as const,fontSize:13}}>
            <thead>
              <tr style={{borderBottom:`1.5px solid ${T.isDark?"#2A2A2A":"#F0EEE9"}`}}>
                {["Mã","Giá trị","Đ.tối thiểu","Lượt dùng","Hạn","Trạng thái",""].map(h=>(
                  <th key={h} style={{padding:"14px 16px",textAlign:"left" as const,fontSize:11,fontWeight:600,color:T.inkLight,letterSpacing:".05em",textTransform:"uppercase" as const}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {coupons.map(c=>{
                const pct=Math.round((c.usedCount/c.maxUses)*100);
                const expired=c.expiresAt&&new Date(c.expiresAt)<new Date();
                const exhausted=c.usedCount>=c.maxUses;
                const minAmt=Number(c.minOrderAmount||0);
                return (
                  <tr key={c.id} className="row-hover" style={{borderBottom:`1px solid ${T.isDark?"#2A2A2A":"#F2F2F2"}`}}>
                    <td style={{padding:"16px"}}><span style={{fontWeight:800,color:T.ink,letterSpacing:".06em",fontFamily:"monospace",fontSize:14}}>{c.code}</span></td>
                    <td style={{padding:"16px",fontWeight:700,color:T.ink}}>{c.discountType==="percent"?`${c.discountValue}%`:`$${c.discountValue}`}</td>
                    <td style={{padding:"16px"}}>{minAmt>0?<span style={{background:T.amber,color:T.amberInk,padding:"3px 9px",borderRadius:99,fontSize:11,fontWeight:600}}>Min ${minAmt}</span>:<span style={{color:T.inkLight,fontSize:11}}>—</span>}</td>
                    <td style={{padding:"16px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                        <div style={{width:80,height:5,background:"#EBEBEB",borderRadius:99,overflow:"hidden"}}><div style={{width:`${Math.min(100,pct)}%`,height:"100%",borderRadius:99,background:pct>=100?"#EF4444":pct>50?"#F59E0B":"#22C55E"}}/></div>
                        <span style={{fontSize:12,fontWeight:600,color:T.inkMid}}>{c.usedCount}/{c.maxUses}</span>
                      </div>
                      <p style={{fontSize:11,color:T.inkLight}}>Còn {c.remaining} lượt</p>
                    </td>
                    <td style={{padding:"16px",fontSize:11,color:expired?"#EF4444":T.inkLight}}>{c.expiresAt?new Date(c.expiresAt).toLocaleDateString("vi-VN"):"Không giới hạn"}</td>
                    <td style={{padding:"16px"}}>
                      {exhausted?<span style={{background:T.red,color:T.redInk,padding:"4px 11px",borderRadius:99,fontSize:11,fontWeight:600}}>Hết lượt</span>
                      :expired?<span style={{background:"#F0F0F0",color:T.inkMid,padding:"4px 11px",borderRadius:99,fontSize:11,fontWeight:600}}>Hết hạn</span>
                      :c.active?<span style={{background:T.green,color:T.greenInk,padding:"4px 11px",borderRadius:99,fontSize:11,fontWeight:600}}>Hoạt động</span>
                      :<span style={{background:"#F0F0F0",color:T.inkMid,padding:"4px 11px",borderRadius:99,fontSize:11,fontWeight:600}}>Tạm dừng</span>}
                    </td>
                    <td style={{padding:"16px"}}>
                      <div style={{display:"flex",gap:6}}>
                        <button onClick={()=>toggleMut.mutate({id:c.id,active:!c.active})} style={{width:32,height:32,borderRadius:T.radiusXs,border:`1.5px solid ${T.border}`,background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>{c.active?"⏸":"▶"}</button>
                        <button onClick={()=>confirm(`Xóa mã "${c.code}"?`)&&deleteMut.mutate(c.id)}
                          style={{width:32,height:32,borderRadius:T.radiusXs,border:`1.5px solid ${T.border}`,background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:T.inkMid}}
                          onMouseEnter={e=>{e.currentTarget.style.background="#EF4444";e.currentTarget.style.color="#fff";}}
                          onMouseLeave={e=>{e.currentTarget.style.background="#fff";e.currentTarget.style.color=T.inkMid;}}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!isLoading&&coupons.length===0&&<tr><td colSpan={7} style={{padding:32,textAlign:"center" as const,color:T.inkLight}}>Chưa có mã giảm giá nào</td></tr>}
            </tbody>
          </table>
        )}
      </div>
      {showForm&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.35)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(4px)"}}>
          <div style={{background:T.card,borderRadius:T.radius,boxShadow:"0 24px 64px rgba(0,0,0,0.18)",width:"100%",maxWidth:480,padding:30}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
              <h2 style={{fontSize:17,fontWeight:700,color:T.ink}}>Tạo mã giảm giá</h2>
              <button onClick={()=>setShowForm(false)} style={{width:32,height:32,borderRadius:10,border:`1.5px solid ${T.inputBorder}`,background:"none",cursor:"pointer",fontSize:18,color:T.inkLight}}>×</button>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              <div>{lbl("Mã code")}<input value={newC.code} onChange={e=>setNewC(p=>({...p,code:e.target.value.toUpperCase()}))} placeholder="VD: DEAL30" style={{width:"100%",padding:"10px 13px",borderRadius:T.radiusXs,border:`1.5px solid ${T.inputBorder}`,fontSize:16,fontWeight:700,letterSpacing:".08em",fontFamily:T.font,boxSizing:"border-box" as const,background:T.inputBg}}/></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div>{lbl("Loại giảm")}<select value={newC.discountType} onChange={e=>setNewC(p=>({...p,discountType:e.target.value as any}))} style={{width:"100%",padding:"10px 13px",borderRadius:T.radiusXs,border:`1.5px solid ${T.inputBorder}`,fontSize:13,fontFamily:T.font,background:T.card}}><option value="percent">Phần trăm (%)</option><option value="fixed">Số tiền ($)</option></select></div>
                <div>{lbl(newC.discountType==="percent"?"Mức giảm (%)":"Giảm ($)")}<input type="number" min="1" value={newC.discountValue} onChange={e=>setNewC(p=>({...p,discountValue:Number(e.target.value)}))} style={{width:"100%",padding:"10px 13px",borderRadius:T.radiusXs,border:`1.5px solid ${T.inputBorder}`,fontSize:18,fontWeight:700,textAlign:"center" as const,fontFamily:T.font,boxSizing:"border-box" as const,background:T.inputBg}}/></div>
              </div>
              <div>{lbl("Số lượt tối đa")}<input type="number" min="1" value={newC.maxUses} onChange={e=>setNewC(p=>({...p,maxUses:Number(e.target.value)}))} style={{width:"100%",padding:"10px 13px",borderRadius:T.radiusXs,border:`1.5px solid ${T.inputBorder}`,fontSize:16,fontWeight:600,textAlign:"center" as const,fontFamily:T.font,boxSizing:"border-box" as const,background:T.inputBg}}/></div>
              <div>{lbl("Đơn tối thiểu ($)")}<input type="number" min="0" value={newC.minOrderAmount} onChange={e=>setNewC(p=>({...p,minOrderAmount:Number(e.target.value)}))} placeholder="0 = không giới hạn" style={{width:"100%",padding:"10px 13px",borderRadius:T.radiusXs,border:`1.5px solid ${T.inputBorder}`,fontSize:16,fontWeight:600,textAlign:"center" as const,fontFamily:T.font,boxSizing:"border-box" as const,background:T.inputBg}}/></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div>{lbl("Ngày bắt đầu")}<input type="date" value={newC.startsAt} onChange={e=>setNewC(p=>({...p,startsAt:e.target.value}))} style={{width:"100%",padding:"10px 13px",borderRadius:T.radiusXs,border:`1.5px solid ${T.inputBorder}`,fontSize:13,fontFamily:T.font,boxSizing:"border-box" as const,background:T.inputBg}}/></div>
                <div>{lbl("Ngày hết hạn")}<input type="date" value={newC.expiresAt} onChange={e=>setNewC(p=>({...p,expiresAt:e.target.value}))} style={{width:"100%",padding:"10px 13px",borderRadius:T.radiusXs,border:`1.5px solid ${T.inputBorder}`,fontSize:13,fontFamily:T.font,boxSizing:"border-box" as const,background:T.inputBg}}/></div>
              </div>
              {formError&&<p style={{color:"#EF4444",fontSize:13}}>⚠ {formError}</p>}
            </div>
            <div style={{display:"flex",gap:10,marginTop:24}}>
              <button onClick={()=>{setFormError("");if(!newC.code){setFormError("Vui lòng nhập mã");return;}createMut.mutate(newC);}} style={{flex:1,padding:13,borderRadius:T.radiusSm,background:T.ink,color:"#fff",border:"none",fontWeight:600,fontSize:14,cursor:"pointer",fontFamily:T.font}}>Tạo mã</button>
              <button onClick={()=>setShowForm(false)} style={{flex:1,padding:13,borderRadius:T.radiusSm,background:T.surface,color:T.inkMid,border:`1.5px solid ${T.inputBorder}`,fontWeight:600,fontSize:14,cursor:"pointer",fontFamily:T.font}}>Hủy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tag Input ─────────────────────────────────────────────────────────────────
function TagInput({tags,onChange,T}:{tags:string[];onChange:(t:string[])=>void;T:typeof LIGHT}) {
  const [input,setInput]=useState("");
  const add=()=>{const t=input.trim().toLowerCase().replace(/\s+/g,"-");if(t&&!tags.includes(t))onChange([...tags,t]);setInput("");};
  return (
    <div>
      <div style={{display:"flex",gap:8}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"||e.key===","){e.preventDefault();add();}}} placeholder="Nhập tag rồi Enter..." style={{flex:1,padding:"10px 13px",borderRadius:T.radiusXs,border:`1.5px solid ${T.inputBorder}`,fontSize:13,fontFamily:T.font,background:T.inputBg}}/>
        <button type="button" onClick={add} style={{padding:"10px 14px",borderRadius:T.radiusXs,border:`1.5px solid ${T.inputBorder}`,background:T.surface,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:T.font,color:T.inkMid}}>+ Thêm</button>
      </div>
      {tags.length>0&&<div style={{display:"flex",gap:6,flexWrap:"wrap" as const,marginTop:8}}>{tags.map(t=>(<span key={t} style={{display:"inline-flex",alignItems:"center",gap:5,background:T.amber,color:T.amberInk,fontSize:12,fontWeight:500,padding:"4px 11px",borderRadius:99}}>#{t}<button type="button" onClick={()=>onChange(tags.filter(x=>x!==t))} style={{background:"none",border:"none",cursor:"pointer",color:T.amberInk,padding:0,lineHeight:1,fontSize:14}}>×</button></span>))}</div>}
    </div>
  );
}

// ── Form Modal (Artwork) ───────────────────────────────────────────────────────
function FormModal({title,form,setForm,isPrint,onSave,onCancel,T}:any) {
  const set=(f:string,v:any)=>setForm((p:any)=>({...p,[f]:v}));
  const pp=parsePrintPrices(form.dimensions);
  const setPrice=(size:string,val:number)=>{const u={...pp,[size]:val};set("dimensions",JSON.stringify(u));set("price",u.A5);};
  const et=form.editionTotal??(isPrint?50:1),es=form.editionSold??0;
  const addImg=()=>setForm((f:any)=>({...f,detailImages:[...(f.detailImages||[]),""]}));
  const updImg=(i:number,v:string)=>setForm((f:any)=>{const a=[...(f.detailImages||[])];a[i]=v;return{...f,detailImages:a};});
  const delImg=(i:number)=>setForm((f:any)=>({...f,detailImages:(f.detailImages||[]).filter((_:any,x:number)=>x!==i)}));
  const inp=(value:any,onChange:any,opts:any={})=><input value={value} onChange={onChange} style={{width:"100%",padding:"10px 13px",borderRadius:T.radiusXs,border:`1.5px solid ${T.inputBorder}`,fontSize:13,fontFamily:T.font,boxSizing:"border-box" as const,background:"#fff",...opts}}/>;
  const lbl=(text:string)=><p style={{fontSize:11,fontWeight:600,color:T.inkLight,textTransform:"uppercase" as const,letterSpacing:".05em",marginBottom:7}}>{text}</p>;
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(20,20,20,0.35)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(4px)"}}>
      <div style={{background:T.card,borderRadius:T.radius,boxShadow:"0 24px 64px rgba(0,0,0,0.18)",width:"100%",maxWidth:520,maxHeight:"90vh",overflowY:"auto" as const,padding:30}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:26}}>
          <h2 style={{fontSize:17,fontWeight:700,color:T.ink}}>{title}</h2>
          <button onClick={onCancel} style={{width:32,height:32,borderRadius:10,border:`1.5px solid ${T.inputBorder}`,background:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:T.inkLight}}>×</button>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:18}}>
          <div>{lbl("Tên")}{inp(form.title,e=>set("title",e.target.value))}</div>
          <div>{lbl("Mô tả")}<textarea value={form.description} onChange={e=>set("description",e.target.value)} rows={3} style={{width:"100%",padding:"10px 13px",borderRadius:T.radiusXs,border:`1.5px solid ${T.inputBorder}`,fontSize:13,fontFamily:T.font,resize:"vertical" as const,boxSizing:"border-box" as const,background:T.inputBg}}/></div>
          {isPrint?(
            <>
              <div>{lbl("Giá theo khổ in")}<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>{(["A5","A4","A3"] as const).map(s=>(<div key={s} style={{border:`1.5px solid ${T.border}`,borderRadius:14,padding:"14px 12px",textAlign:"center" as const}}><p style={{fontWeight:700,color:T.inkMid,fontSize:12,marginBottom:8,textTransform:"uppercase" as const}}>{s}</p><div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:3}}><span style={{color:T.inkLight,fontSize:13}}>$</span><input type="number" value={pp[s]} onChange={e=>setPrice(s,Number(e.target.value))} style={{width:70,padding:"6px 8px",borderRadius:8,border:`1.5px solid ${T.inputBorder}`,fontSize:16,fontWeight:700,textAlign:"center" as const,fontFamily:T.font,background:T.inputBg}}/></div></div>))}</div></div>
              <div>{lbl("Giới hạn phiên bản")}<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><div style={{border:`1.5px solid ${T.border}`,borderRadius:14,padding:"14px"}}><p style={{fontSize:11,fontWeight:600,color:T.inkLight,marginBottom:8,textTransform:"uppercase" as const}}>Total Edition</p><input type="number" min="1" value={et} onChange={e=>set("editionTotal",Number(e.target.value))} style={{width:"100%",padding:"8px 10px",borderRadius:8,border:`1.5px solid ${T.inputBorder}`,fontSize:22,fontWeight:800,textAlign:"center" as const,fontFamily:T.font,background:T.inputBg}}/></div><div style={{border:`1.5px solid ${T.border}`,borderRadius:14,padding:"14px"}}><p style={{fontSize:11,fontWeight:600,color:T.inkLight,marginBottom:8,textTransform:"uppercase" as const}}>Đã bán</p><input type="number" min="0" value={es} onChange={e=>set("editionSold",Number(e.target.value))} style={{width:"100%",padding:"8px 10px",borderRadius:8,border:`1.5px solid ${T.inputBorder}`,fontSize:22,fontWeight:800,textAlign:"center" as const,fontFamily:T.font,background:T.inputBg}}/><p style={{fontSize:11,fontWeight:700,textAlign:"center" as const,marginTop:8,color:et-es>0?"#16A34A":"#DC2626"}}>Còn: {et-es}</p></div></div></div>
            </>
          ):(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div>{lbl("Giá ($)")}<input type="number" value={form.price} onChange={e=>set("price",Number(e.target.value))} style={{width:"100%",padding:"10px 13px",borderRadius:T.radiusXs,border:`1.5px solid ${T.inputBorder}`,fontSize:13,fontFamily:T.font,boxSizing:"border-box" as const,background:T.inputBg}}/></div>
              <div>{lbl("Kích thước")}{inp(form.dimensions,e=>set("dimensions",e.target.value))}</div>
            </div>
          )}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div>{lbl("Chất liệu")}{inp(form.medium,e=>set("medium",e.target.value))}</div>
            <div>{lbl("Năm")}<input type="number" value={form.year} onChange={e=>set("year",Number(e.target.value))} style={{width:"100%",padding:"10px 13px",borderRadius:T.radiusXs,border:`1.5px solid ${T.inputBorder}`,fontSize:13,fontFamily:T.font,boxSizing:"border-box" as const,background:T.inputBg}}/></div>
          </div>
          {!isPrint&&<div>{lbl("Danh mục")}<select value={form.category} onChange={e=>set("category",e.target.value)} style={{width:"100%",padding:"10px 13px",borderRadius:T.radiusXs,border:`1.5px solid ${T.inputBorder}`,fontSize:13,fontFamily:T.font,background:T.card}}><option value="original">Original</option><option value="commission">Commission</option></select></div>}
          <div style={{display:"flex",gap:24}}>{[{f:"available",l:"Còn hàng"},{f:"featured",l:"Nổi bật"}].map(c=>(<label key={c.f} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}><div style={{width:20,height:20,borderRadius:6,border:`2px solid ${(form as any)[c.f]?T.ink:"#D0D0D0"}`,background:(form as any)[c.f]?T.ink:"transparent",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>set(c.f,!(form as any)[c.f])}>{(form as any)[c.f]&&<span style={{color:"#fff",fontSize:11,lineHeight:1}}>✓</span>}</div><span style={{fontSize:13,color:T.inkMid,fontWeight:500}}>{c.l}</span></label>))}</div>
          <div>{lbl("Tags")}<TagInput tags={form.tags||[]} onChange={(t:string[])=>set("tags",t)} T={T}/></div>
          <div>{lbl("Ảnh chính")}{inp(form.imageUrl,e=>set("imageUrl",e.target.value),{placeholder:"/assets/artwork.png"})}{form.imageUrl&&<img src={form.imageUrl} style={{marginTop:10,height:80,borderRadius:12,objectFit:"cover" as const}}/>}</div>
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>{lbl("Ảnh chi tiết")}<button onClick={addImg} style={{padding:"5px 12px",borderRadius:8,border:`1.5px solid ${T.inputBorder}`,background:"none",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:T.font,color:T.inkMid}}>+ Thêm</button></div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>{(form.detailImages||[]).map((url:string,i:number)=>(<div key={i} style={{display:"flex",gap:8,alignItems:"center"}}><span style={{color:T.inkLight,fontSize:12,minWidth:18}}>{i+1}.</span>{inp(url,(e:any)=>updImg(i,e.target.value),{flex:1})}{url&&<img src={url} style={{width:34,height:34,objectFit:"cover" as const,borderRadius:8}}/>}<button onClick={()=>delImg(i)} style={{background:"none",border:"none",cursor:"pointer",color:T.inkLight,fontSize:18,lineHeight:1}}>×</button></div>))}</div>
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:26}}>
          <button onClick={onSave} style={{flex:1,padding:13,borderRadius:T.radiusSm,background:T.ink,color:"#fff",border:"none",fontWeight:600,fontSize:14,cursor:"pointer",fontFamily:T.font}}>Lưu thay đổi</button>
          <button onClick={onCancel} style={{flex:1,padding:13,borderRadius:T.radiusSm,background:T.surface,color:T.inkMid,border:`1.5px solid ${T.inputBorder}`,fontWeight:600,fontSize:14,cursor:"pointer",fontFamily:T.font}}>Hủy</button>
        </div>
      </div>
    </div>
  );
}
