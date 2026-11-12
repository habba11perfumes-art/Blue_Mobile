import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Activity, ArrowDownToLine, Banknote, Check, ChevronLeft, CircleHelp, Clipboard,
  FileText, History, LayoutDashboard, LogOut, Menu, MessageCircle, Plus, Printer,
  Search, ShieldCheck, Smartphone, Ticket, TrendingUp, Wallet, X
} from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;
const NETWORKS = ["ليبيانا", "المدار", "LTT"];
const VALUES = [5, 10, 20, 30, 50];

function Brand({small=false}) {
  return <div className={`brand ${small ? "brand-small" : ""}`}><div className="brand-mark"><Smartphone size={22}/></div><div><b>Blue Mobile</b><span>إدارة مبيعات الرصيد</span></div></div>;
}
function money(n) { return `${Number(n || 0).toLocaleString("ar-LY")} د.ل`; }
function Receipt({sale, onClose}) {
  if (!sale) return null;
  const share = () => {
    const msg = `Blue Mobile\\nوصل بيع كرت رصيد\\nالشبكة: ${sale.network}\\nالقيمة: ${sale.denomination} د.ل\\nرقم الكرت: ${sale.card_number}${sale.card_pin ? `\\nالرقم السري: ${sale.card_pin}` : ""}\\nرقم العملية: ${sale.receipt_number}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };
  return <div className="modal-backdrop" onMouseDown={onClose}>
    <div className="receipt-wrap" onMouseDown={e=>e.stopPropagation()}>
      <div className="receipt-actions no-print">
        <button className="btn btn-light" onClick={()=>window.print()}><Printer size={16}/> طباعة</button>
        <button className="btn btn-light" onClick={share}><MessageCircle size={16}/> واتساب</button>
        <button className="icon-btn" onClick={onClose}><X size={18}/></button>
      </div>
      <article className="receipt" id="receipt">
        <div className="receipt-logo"><div className="brand-mark"><Smartphone size={22}/></div><h2>Blue Mobile</h2><p>وصل بيع كرت رصيد</p></div>
        <div className="receipt-line"></div>
        <div className="receipt-row"><span>الشبكة</span><b>{sale.network}</b></div>
        <div className="receipt-row"><span>قيمة الكرت</span><b>{money(sale.denomination)}</b></div>
        <div className="receipt-row vertical"><span>رقم الكرت</span><strong className="card-number" dir="ltr">{sale.card_number}</strong></div>
        {sale.card_pin && <div className="receipt-row vertical"><span>الرقم السري</span><strong className="card-number" dir="ltr">{sale.card_pin}</strong></div>}
        <div className="receipt-line"></div>
        <div className="receipt-row"><span>رقم العملية</span><b dir="ltr">{sale.receipt_number}</b></div>
        <p className="receipt-thanks">شكراً لتعاملكم معنا 💙</p>
      </article>
    </div>
  </div>;
}
function Login({onLogin}) {
  const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [busy,setBusy]=useState(false); const [error,setError]=useState("");
  async function submit(e) {
    e.preventDefault(); setBusy(true); setError("");
    const {data,error}=await supabase.auth.signInWithPassword({email,password});
    if(error) setError(error.message);
    else if(data.user?.app_metadata?.role !== "admin") { await supabase.auth.signOut(); setError("هذا الحساب غير مصرح له بالدخول كمدير."); }
    else onLogin(data.session);
    setBusy(false);
  }
  return <div className="login-screen"><div className="login-card"><Brand/><div className="login-title"><h1>مرحباً بعودتك</h1><p>سجّل الدخول لإدارة مبيعات Blue Mobile</p></div>
    <form onSubmit={submit}><label>البريد الإلكتروني</label><input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@example.com"/><label>كلمة المرور</label><input type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"/>{error&&<div className="error">{error}</div>}<button className="btn btn-primary full" disabled={busy}>{busy?"جارٍ تسجيل الدخول...":"تسجيل الدخول"}</button></form>
    <div className="secure-note"><ShieldCheck size={16}/> الدخول مخصص لحساب المدير فقط</div>
  </div></div>;
}
export default function App() {
  const [session,setSession]=useState(null), [ready,setReady]=useState(false), [page,setPage]=useState("dashboard");
  const [sales,setSales]=useState([]), [loading,setLoading]=useState(false), [query,setQuery]=useState("");
  const [network,setNetwork]=useState(NETWORKS[0]), [denomination,setDenomination]=useState(10), [cardNumber,setCardNumber]=useState(""), [cardPin,setCardPin]=useState("");
  const [notice,setNotice]=useState(""), [receipt,setReceipt]=useState(null), [saving,setSaving]=useState(false), [mobileNav,setMobileNav]=useState(false);
  useEffect(()=>{
    if(!supabase){setReady(true);return;}
    supabase.auth.getSession().then(({data})=>{setSession(data.session);setReady(true);});
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,s)=>setSession(s));
    return ()=>subscription.unsubscribe();
  },[]);
  async function loadSales() {
    if(!supabase||!session)return; setLoading(true);
    const {data,error}=await supabase.from("sales").select("*").order("id",{ascending:false}).limit(1000);
    if(error) setNotice("تعذر تحميل سجل المبيعات: "+error.message); else setSales(data||[]);
    setLoading(false);
  }
  useEffect(()=>{if(session)loadSales();},[session]);
  const total=sales.reduce((a,s)=>a+Number(s.denomination),0);
  const filtered=useMemo(()=>sales.filter(s=>[s.network,s.card_number,s.receipt_number,String(s.denomination)].join(" ").toLowerCase().includes(query.toLowerCase())),[sales,query]);
  async function createSale(e) {
    e.preventDefault(); if(!cardNumber.trim()){setNotice("يرجى إدخال رقم الكرت.");return;}
    setSaving(true);setNotice("");
    const {data,error}=await supabase.from("sales").insert({network,denomination,card_number:cardNumber.trim(),card_pin:cardPin.trim()||null}).select().single();
    if(error) setNotice("لم يتم حفظ العملية: "+error.message);
    else {setSales(prev=>[data,...prev]);setReceipt(data);setCardNumber("");setCardPin("");setDenomination(10);setPage("dashboard");}
    setSaving(false);
  }
  async function exportCsv() {
    const rows=[["رقم العملية","الشبكة","القيمة","رقم الكرت","الرقم السري"],...filtered.map(s=>[s.receipt_number,s.network,s.denomination,s.card_number,s.card_pin||""])];
    const csv="\\uFEFF"+rows.map(r=>r.map(v=>`"${String(v??"").replaceAll('"','""')}"`).join(",")).join("\\n");
    const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"})); const a=document.createElement("a");a.href=url;a.download="blue-mobile-sales-backup.csv";a.click();URL.revokeObjectURL(url);
  }
  async function logout(){await supabase.auth.signOut();setSales([]);setPage("dashboard");}
  if(!ready)return <div className="loading-screen">جارٍ تجهيز Blue Mobile...</div>;
  if(!supabase)return <div className="setup-screen"><Brand/><h2>يلزم إعداد الاتصال بقاعدة البيانات</h2><p>انسخ ملف .env.example إلى .env وأدخل مفتاح Supabase Publishable ثم أعد تشغيل المشروع.</p></div>;
  if(!session)return <Login onLogin={setSession}/>;
  if(session.user?.app_metadata?.role!=="admin")return <div className="setup-screen"><ShieldCheck/><h2>الحساب غير مصرح</h2><p>يجب منح الحساب دور admin من Supabase Auth قبل استخدام لوحة التحكم.</p><button className="btn btn-light" onClick={logout}>تسجيل الخروج</button></div>;
  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav?"open":""}`}><Brand/><div className="nav-label">القائمة الرئيسية</div>
      <button className={`nav-item ${page==="dashboard"?"active":""}`} onClick={()=>{setPage("dashboard");setMobileNav(false)}}><LayoutDashboard size={18}/> لوحة التحكم</button>
      <button className={`nav-item ${page==="new"?"active":""}`} onClick={()=>{setPage("new");setMobileNav(false)}}><Plus size={18}/> بيع كرت جديد</button>
      <button className={`nav-item ${page==="history"?"active":""}`} onClick={()=>{setPage("history");setMobileNav(false)}}><History size={18}/> سجل المبيعات</button>
      <div className="sidebar-bottom"><div className="admin-chip"><div className="avatar">م</div><div><b>المدير</b><span>{session.user.email}</span></div></div><button className="nav-item logout" onClick={logout}><LogOut size={18}/> تسجيل الخروج</button></div>
    </aside>
    <main className="main-area">
      <header className="topbar"><button className="icon-btn mobile-only" onClick={()=>setMobileNav(!mobileNav)}><Menu/></button><div><div className="crumb">Blue Mobile <ChevronLeft size={14}/> {page==="dashboard"?"لوحة التحكم":page==="new"?"بيع كرت جديد":"سجل المبيعات"}</div><h1>{page==="dashboard"?"نظرة عامة":page==="new"?"إصدار وصل بيع":"سجل المبيعات"}</h1></div><div className="top-status"><span className="status-dot"></span> النظام متصل</div></header>
      {notice&&<div className="notice"><span>{notice}</span><button onClick={()=>setNotice("")}><X size={16}/></button></div>}
      {page==="dashboard"&&<section className="page-content">
        <div className="welcome"><div><h2>أهلاً بك في Blue Mobile 👋</h2><p>إليك ملخص حركة المبيعات الخاصة بك.</p></div><button className="btn btn-primary" onClick={()=>setPage("new")}><Plus size={17}/> بيع كرت جديد</button></div>
        <div className="stats-grid">
          <div className="stat-card"><div className="stat-icon blue"><Ticket/></div><span>عدد عمليات البيع</span><strong>{sales.length.toLocaleString("ar-LY")}</strong><small>إجمالي العمليات المسجلة</small></div>
          <div className="stat-card"><div className="stat-icon cyan"><Wallet/></div><span>إجمالي المبيعات</span><strong>{money(total)}</strong><small>مجموع قيم الكروت المباعة</small></div>
          <div className="stat-card"><div className="stat-icon violet"><Activity/></div><span>متوسط قيمة العملية</span><strong>{money(sales.length?total/sales.length:0)}</strong><small>متوسط قيمة الكرت الواحد</small></div>
        </div>
        <div className="section-card"><div className="section-head"><div><h3>أحدث عمليات البيع</h3><p>آخر الكروت التي تم إصدارها</p></div><button className="text-btn" onClick={()=>setPage("history")}>عرض السجل <ChevronLeft size={15}/></button></div>
          <SalesTable rows={sales.slice(0,6)} onReceipt={setReceipt}/></div>
      </section>}
      {page==="new"&&<section className="page-content form-layout"><div className="form-card"><div className="form-heading"><div className="form-icon"><Ticket/></div><div><h2>بيع كرت رصيد جديد</h2><p>أدخل بيانات الكرت لإصدار وصل إلكتروني</p></div></div>
        <form onSubmit={createSale}>
          <label>شركة الاتصالات</label><div className="network-grid">{NETWORKS.map(n=><button type="button" key={n} className={`network-option ${network===n?"selected":""}`} onClick={()=>setNetwork(n)}><span className="network-symbol">{n==="ليبيانا"?"L":n==="المدار"?"M":"T"}</span><b>{n}</b>{network===n&&<Check className="chosen" size={17}/>}</button>)}</div>
          <label>قيمة الكرت</label><div className="value-grid">{VALUES.map(v=><button type="button" key={v} className={`value-option ${denomination===v?"selected":""}`} onClick={()=>setDenomination(v)}><b>{v}</b><span>دينار</span></button>)}</div>
          <label htmlFor="card-number">رقم الكرت <em>*</em></label><input id="card-number" className="large-input" required value={cardNumber} onChange={e=>setCardNumber(e.target.value)} placeholder="أدخل رقم الكرت كاملاً" dir="ltr"/>
          <label htmlFor="card-pin">الرقم السري <span className="optional">اختياري</span></label><input id="card-pin" className="large-input" value={cardPin} onChange={e=>setCardPin(e.target.value)} placeholder="أدخل الرقم السري إذا توفر" dir="ltr"/>
          <div className="form-summary"><span>قيمة الوصل</span><b>{money(denomination)}</b></div>
          <button className="btn btn-primary full submit-sale" disabled={saving}><FileText size={18}/>{saving?"جارٍ حفظ العملية...":"حفظ وإصدار الوصل"}</button>
        </form>
      </div><div className="side-hint"><div className="hint-icon"><ShieldCheck/></div><h3>بيع آمن ومنظم</h3><p>يتم حفظ كل عملية في قاعدة البيانات لتتمكن من الرجوع إليها وإعادة طباعة الوصل في أي وقت.</p><div className="hint-row"><Check/> رقم عملية تلقائي وفريد</div><div className="hint-row"><Check/> سجل مبيعات قابل للبحث</div><div className="hint-row"><Check/> وصل مناسب للطباعة</div></div></section>}
      {page==="history"&&<section className="page-content"><div className="history-toolbar"><div className="search-box"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="ابحث برقم الكرت أو العملية أو الشبكة..."/></div><button className="btn btn-light" onClick={exportCsv}><ArrowDownToLine size={17}/> تصدير نسخة CSV</button></div><div className="section-card"><div className="section-head"><div><h3>جميع عمليات البيع</h3><p>{filtered.length} عملية</p></div></div><SalesTable rows={filtered} onReceipt={setReceipt} loading={loading}/></div></section>}
      <footer>© {new Date().getFullYear()} Blue Mobile · جميع الحقوق محفوظة</footer>
    </main>
    {receipt&&<Receipt sale={receipt} onClose={()=>setReceipt(null)}/>}
  </div>;
}
function SalesTable({rows,onReceipt,loading=false}) {
  if(loading)return <div className="empty-state">جارٍ تحميل البيانات...</div>;
  if(!rows.length)return <div className="empty-state"><div className="empty-icon"><Clipboard/></div><b>لا توجد عمليات حتى الآن</b><span>ستظهر عمليات البيع هنا بعد إصدار أول وصل.</span></div>;
  return <div className="table-wrap"><table><thead><tr><th>رقم العملية</th><th>الشبكة</th><th>القيمة</th><th>رقم الكرت</th><th>الإجراء</th></tr></thead><tbody>{rows.map(s=><tr key={s.id}><td><b className="receipt-id">{s.receipt_number}</b></td><td><span className="network-pill">{s.network}</span></td><td><b>{money(s.denomination)}</b></td><td><span className="ltr-number">{s.card_number}</span></td><td><button className="table-action" onClick={()=>onReceipt(s)}><Printer size={15}/> الوصل</button></td></tr>)}</tbody></table></div>;
}
