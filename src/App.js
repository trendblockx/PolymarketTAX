import React, { useState } from "react";

const DEMO_POSITIONS = [
  { title: "Will Trump win 2024 US Presidential Election?", outcome: "YES", cashInvested: 120.00, currentValue: 240.00, gainLoss: 120.00, closed: true },
  { title: "Will Fed cut rates in March 2025?", outcome: "NO", cashInvested: 80.00, currentValue: 0.00, gainLoss: -80.00, closed: true },
  { title: "Will Bitcoin hit $100k before 2025?", outcome: "YES", cashInvested: 200.00, currentValue: 200.00, gainLoss: 0.00, closed: true },
  { title: "Will Elon Musk remain Twitter CEO in 2025?", outcome: "YES", cashInvested: 60.00, currentValue: 108.00, gainLoss: 48.00, closed: true },
  { title: "Will GPT-5 launch before July 2025?", outcome: "NO", cashInvested: 45.00, currentValue: 72.00, gainLoss: 27.00, closed: true },
  { title: "Will ETH hit $5000 in 2025?", outcome: "YES", cashInvested: 90.00, currentValue: 18.00, gainLoss: -72.00, closed: false },
  { title: "Will Apple release AR glasses in 2025?", outcome: "NO", cashInvested: 35.00, currentValue: 56.00, gainLoss: 21.00, closed: false },
  { title: "Will India win 2025 Cricket World Cup?", outcome: "YES", cashInvested: 110.00, currentValue: 55.00, gainLoss: -55.00, closed: false },
];

function downloadCSV(positions) {
  const header = ["Market","Side","Invested (USD)","Current Value (USD)","Gain/Loss (USD)","Status"];
  const rows = positions.map((p) => [
    `"${p.title.replace(/"/g,"'")}"`, p.outcome,
    p.cashInvested.toFixed(2), p.currentValue.toFixed(2), p.gainLoss.toFixed(2),
    p.closed ? "Closed" : "Open",
  ]);
  const csv = [header,...rows].map((r)=>r.join(",")).join("\n");
  const blob = new Blob([csv],{type:"text/csv"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href=url; a.download="polytax_export.csv"; a.click();
  URL.revokeObjectURL(url);
}

async function fetchPositions(address) {
  // Call our own Netlify backend function — no CORS issues
  const res = await fetch(`/.netlify/functions/positions?address=${address}`);
  if (!res.ok) throw new Error("Failed to fetch from Polymarket");
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  if (!Array.isArray(data) || data.length === 0) throw new Error("No positions found for this wallet");
  return data;
}

function processRaw(raw) {
  return raw.map((p) => {
    const invested = parseFloat(p.cashInvested || p.initialValue || 0);
    const current = parseFloat(p.currentValue || p.value || 0);
    const redeemable = parseFloat(p.redeemable || 0);
    const finalValue = redeemable > 0 ? redeemable : current;
    return {
      title: p.title || p.market || p.marketSlug || "Unknown Market",
      outcome: p.outcome || "YES",
      cashInvested: invested,
      currentValue: finalValue,
      gainLoss: finalValue - invested,
      closed: p.closed || p.resolved || false,
    };
  });
}

export default function PolyTax() {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [positions, setPositions] = useState(null);
  const [isDemo, setIsDemo] = useState(false);

  async function handleCalculate() {
    const addr = address.trim();
    if (!addr) { setError("Please enter a wallet address."); return; }
    setError(""); setLoading(true); setPositions(null); setIsDemo(false);
    try {
      const raw = await fetchPositions(addr);
      setPositions(processRaw(raw));
    } catch (e) {
      setError(e.message || "Failed to load data. Check the wallet address and try again.");
    }
    setLoading(false);
  }

  function loadDemo() {
    setPositions(DEMO_POSITIONS);
    setIsDemo(true);
    setError("");
  }

  const totalInvested = positions ? positions.reduce((s,p)=>s+p.cashInvested,0) : 0;
  const totalValue = positions ? positions.reduce((s,p)=>s+p.currentValue,0) : 0;
  const totalPnL = totalValue - totalInvested;
  const winners = positions ? positions.filter((p)=>p.gainLoss>0).length : 0;
  const losers = positions ? positions.filter((p)=>p.gainLoss<0).length : 0;

  return (
    <div style={{minHeight:"100vh",background:"#0a0a0f",color:"#e8e8f0",fontFamily:"'DM Mono','Courier New',monospace"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::placeholder{color:#444;}
        ::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-track{background:#111;}::-webkit-scrollbar-thumb{background:#333;border-radius:2px;}
        .fade-in{animation:fadeIn 0.4s ease forwards;}
        @keyframes fadeIn{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
        .rh:hover{background:#111118!important;}
        .bm:hover{background:#c8ff00!important;color:#0a0a0f!important;}
        .bd:hover{background:#1a1a2a!important;}
        .bl:hover{border-color:#c8ff00!important;color:#c8ff00!important;}
        input:focus{outline:none;border-color:#c8ff00!important;}
      `}</style>

      <div style={{padding:"28px 32px 20px",borderBottom:"1px solid #1a1a2a",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <div style={{fontFamily:"'Syne',sans-serif",fontSize:26,fontWeight:800,letterSpacing:-1,color:"#fff"}}>
            Poly<span style={{color:"#c8ff00"}}>Tax</span>
          </div>
          <div style={{fontSize:10,color:"#555",marginTop:2,letterSpacing:2,textTransform:"uppercase"}}>Polymarket P&L Calculator</div>
        </div>
        <div style={{fontSize:10,color:"#333",letterSpacing:1}}>NOT TAX ADVICE</div>
      </div>

      <div style={{maxWidth:860,margin:"0 auto",padding:"40px 20px"}}>
        <div style={{marginBottom:32}}>
          <div style={{fontSize:11,color:"#666",marginBottom:10,letterSpacing:2,textTransform:"uppercase"}}>Your Polygon Wallet Address</div>
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            <input value={address} onChange={(e)=>setAddress(e.target.value)} onKeyDown={(e)=>e.key==="Enter"&&handleCalculate()} placeholder="0x..."
              style={{flex:1,minWidth:180,background:"#111118",border:"1px solid #222",borderRadius:8,padding:"13px 16px",color:"#e8e8f0",fontSize:13,fontFamily:"inherit",transition:"border-color 0.2s"}}/>
            <button className="bm" onClick={handleCalculate} disabled={loading}
              style={{background:loading?"#1a1a2a":"#e8e8f0",color:"#0a0a0f",border:"none",borderRadius:8,padding:"13px 20px",fontSize:12,fontWeight:500,cursor:loading?"not-allowed":"pointer",letterSpacing:1,textTransform:"uppercase",transition:"all 0.2s",whiteSpace:"nowrap"}}>
              {loading?"Loading...":"Calculate →"}
            </button>
            <button className="bd" onClick={loadDemo}
              style={{background:"#111118",color:"#888",border:"1px solid #222",borderRadius:8,padding:"13px 16px",fontSize:12,cursor:"pointer",letterSpacing:1,textTransform:"uppercase",transition:"all 0.2s",whiteSpace:"nowrap"}}>
              Try Demo
            </button>
          </div>
          {error&&<div style={{marginTop:12,color:"#ff9f6b",fontSize:12,padding:"12px 16px",background:"#1a0f0a",borderRadius:6,border:"1px solid #3a2010",lineHeight:1.6}}>⚠ {error}</div>}
          {isDemo&&<div style={{marginTop:12,fontSize:11,padding:"10px 14px",background:"#0d1a0a",borderRadius:6,border:"1px solid #1a3010",color:"#6bbb50",letterSpacing:0.5}}>✓ Demo mode — showing sample data.</div>}
        </div>

        {positions&&(
          <div className="fade-in">
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12,marginBottom:32}}>
              {[
                {label:"Total P&L",value:`${totalPnL>=0?"+":""}$${Math.abs(totalPnL).toFixed(2)}`,accent:totalPnL>=0?"#c8ff00":"#ff6b6b"},
                {label:"Total Invested",value:`$${totalInvested.toFixed(2)}`,accent:"#e8e8f0"},
                {label:"Positions",value:positions.length,accent:"#e8e8f0"},
                {label:"Win / Loss",value:`${winners}W  /  ${losers}L`,accent:"#888"},
              ].map((s,i)=>(
                <div key={i} style={{background:"#111118",border:"1px solid #1a1a2a",borderRadius:10,padding:"18px 20px"}}>
                  <div style={{fontSize:10,color:"#555",letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>{s.label}</div>
                  <div style={{fontSize:20,fontWeight:500,color:s.accent,fontFamily:"'Syne',sans-serif"}}>{s.value}</div>
                </div>
              ))}
            </div>

            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={{fontSize:11,color:"#555",letterSpacing:2,textTransform:"uppercase"}}>{positions.length} Positions</div>
              <button className="bl" onClick={()=>downloadCSV(positions)}
                style={{background:"transparent",border:"1px solid #2a2a3a",borderRadius:6,padding:"7px 14px",color:"#666",fontSize:11,cursor:"pointer",letterSpacing:1,textTransform:"uppercase",transition:"all 0.2s"}}>
                Download CSV ↓
              </button>
            </div>

            <div style={{border:"1px solid #1a1a2a",borderRadius:10,overflow:"hidden"}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 60px 90px 90px 90px",padding:"10px 16px",background:"#0d0d14",borderBottom:"1px solid #1a1a2a"}}>
                {["Market","Side","Invested","Value","P&L"].map((h)=>(
                  <div key={h} style={{fontSize:9,color:"#444",letterSpacing:2,textTransform:"uppercase"}}>{h}</div>
                ))}
              </div>
              <div style={{maxHeight:360,overflowY:"auto"}}>
                {positions.map((p,i)=>(
                  <div key={i} className="rh" style={{display:"grid",gridTemplateColumns:"1fr 60px 90px 90px 90px",padding:"13px 16px",borderBottom:"1px solid #111118",transition:"background 0.15s"}}>
                    <div style={{fontSize:12,color:"#ccc",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",paddingRight:10}} title={p.title}>{p.title}</div>
                    <div style={{fontSize:11,color:p.outcome?.toUpperCase()==="YES"?"#c8ff00":"#ff8c69"}}>{(p.outcome||"YES").toUpperCase()}</div>
                    <div style={{fontSize:12,color:"#777"}}>${p.cashInvested.toFixed(2)}</div>
                    <div style={{fontSize:12,color:"#777"}}>${p.currentValue.toFixed(2)}</div>
                    <div style={{fontSize:12,fontWeight:500,color:p.gainLoss>=0?"#c8ff00":"#ff6b6b"}}>
                      {p.gainLoss>=0?"+":""}${p.gainLoss.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{marginTop:24,padding:"14px 18px",background:"#0d0d14",border:"1px solid #1a1a2a",borderRadius:8,fontSize:10,color:"#3a3a4a",lineHeight:1.7}}>
              ⚠ DISCLAIMER — PolyTax is a third-party informational tool. Data pulled from public Polymarket APIs. Not financial or tax advice. Consult a qualified tax professional. PolyTax is not affiliated with Polymarket.
            </div>
          </div>
        )}

        {!positions&&!loading&&!error&&(
          <div style={{textAlign:"center",padding:"60px 20px",color:"#2a2a3a"}}>
            <div style={{fontSize:40,marginBottom:12}}>◎</div>
            <div style={{fontSize:13,letterSpacing:1}}>Enter a wallet address or click Try Demo</div>
          </div>
        )}
      </div>
    </div>
  );
}
