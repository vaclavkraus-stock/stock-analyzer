import { useState, useEffect } from "react";
import { useAuth, useUser, UserButton } from "@clerk/clerk-react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Legend, ReferenceLine, Cell
} from "recharts";

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
};

let C = { bg:"#060d1a",card:"#0b1628",card2:"#0f1e35",border:"#1a2d4a",text:"#e2e8f0",muted:"#4e6080",blue:"#3b82f6",green:"#10b981",red:"#ef4444",yellow:"#f59e0b",purple:"#8b5cf6",cyan:"#06b6d4",orange:"#f97316" };
const CL = { bg:"#f1f5f9",card:"#ffffff",card2:"#f8fafc",border:"#e2e8f0",text:"#0f172a",muted:"#64748b",blue:"#2563eb",green:"#059669",red:"#dc2626",yellow:"#d97706",purple:"#7c3aed",cyan:"#0891b2",orange:"#ea580c" };
const fmt = (n,d=2) => typeof n==="number"?n.toLocaleString("cs-CZ",{maximumFractionDigits:d}):(n||"—");
const pct = n => typeof n==="number"?`${n>0?"+":""}${n.toFixed(2)}%`:"—";
const clr = n => (n||0)>=0?"#10b981":"#ef4444";
const vc = v => v?.includes("KOUPIT")||v?.includes("Podhodnoce")||v?.includes("Bullish")||v?.includes("BUY")?"#10b981":v?.includes("PRODAT")||v?.includes("Nadhodnoce")||v?.includes("Bearish")||v?.includes("SELL")?"#ef4444":"#f59e0b";
const sentClr = s => s==="positive"?"#10b981":s==="negative"?"#ef4444":"#06b6d4";
const RADAR_LABELS = {valuation:"Valuace",growth:"Růst",profitability:"Ziskovost",financialHealth:"Fin. zdraví",momentum:"Momentum",dividend:"Dividenda"};

const METRIC_TIPS = {
  "P/E": "Price-to-Earnings · Cena akcie ÷ roční zisk na akcii. Nižší = levnější. Průměr S&P 500 ≈ 20.",
  "EPS": "Earnings Per Share · Čistý zisk na 1 akcii za rok. Vyšší = lepší.",
  "Net Marže": "Procento tržeb co zůstane jako čistý zisk. 20%+ je silné.",
  "ROE": "Return on Equity · Zisk ÷ vlastní kapitál. 15%+ = silné.",
  "Beta": "Volatilita vs. trh. 1,0 = kopíruje trh. >1 = rizikovější. <1 = stabilnější.",
  "Div. Yield": "Roční dividenda jako % ceny. Vyšší = více příjmu.",
  "D/E": "Debt-to-Equity · Celkový dluh ÷ vlastní kapitál. Nižší = méně zadlužená.",
  "FCF": "Free Cash Flow · Hotovost po odečtení investic. Základ pro dividendy a růst.",
  "RSI": "Relative Strength Index · 0–100. Nad 70 = překoupeno (drahé). Pod 30 = přeprodáno (levné).",
  "MA 50": "Klouzavý průměr 50 dní. Cena nad MA50 = krátkodobý uptrend.",
  "MA 200": "Klouzavý průměr 200 dní. Cena nad MA200 = dlouhodobý uptrend.",
  "Support": "Cenová úroveň kde akcie historicky nacházela podporu – zde kupující vstupují.",
  "Resistance": "Cenová úroveň kde akcie narážela na odpor – zde prodejci tlačí cenu dolů.",
};

const RADAR_DESC = {
  "Valuace":"Jak levná/drahá je akcie vs. fundamenty a konkurence",
  "Růst":"Tempo růstu tržeb, zisku a EPS v posledních letech",
  "Ziskovost":"Marže, ROE, ROIC – efektivita byznysu",
  "Fin. zdraví":"Bilance, úroveň dluhu, cash flow",
  "Momentum":"Cenový trend, relativní síla vs. trh",
  "Dividenda":"Výše, stabilita a růst dividendy",
};

function buildCharts(history, targetPrice, analystLow, analystAvg, analystHigh) {
  const pts = (history||[]).filter(p=>p.price>0);
  if(!pts.length) return {priceChart:[],compChart:[]};
  const base = pts[0];
  const compChart = pts.map(p=>({ date:p.date, "Akcie":parseFloat(((p.price/base.price)*100).toFixed(1)), "S&P 500":p.sp500>0?parseFloat(((p.sp500/base.sp500)*100).toFixed(1)):null }));
  const priceChart = pts.map(p=>({date:p.date,actual:p.price,predicted:null,low:null,high:null}));
  const months=["Dub","Kvě","Čer","Čec","Srp","Zář","Říj","Lis","Pro","Led","Úno","Bře"];
  const now=new Date();
  const lastPrice=pts[pts.length-1].price;
  const tgt=targetPrice||analystAvg||lastPrice;
  for(let i=1;i<=5;i++){
    const m=new Date(now.getFullYear(),now.getMonth()+i,1);
    const ratio=i/5;
    priceChart.push({
      date:`${months[m.getMonth()]} '${String(m.getFullYear()).slice(2)}`,
      actual:null,
      predicted:parseFloat((lastPrice+(tgt-lastPrice)*ratio).toFixed(2)),
      low: analystLow?parseFloat((lastPrice+(analystLow-lastPrice)*ratio).toFixed(2)):null,
      high: analystHigh?parseFloat((lastPrice+(analystHigh-lastPrice)*ratio).toFixed(2)):null,
    });
  }
  const li=priceChart.reduce((b,p,i)=>p.actual!=null?i:b,-1);
  if(li>=0){priceChart[li].predicted=priceChart[li].actual;priceChart[li].low=priceChart[li].actual;priceChart[li].high=priceChart[li].actual;}
  return {priceChart,compChart};
}

const Tip = ({active,payload,label}) => {
  if(!active||!payload?.length) return null;
  return <div style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px",boxShadow:"0 8px 32px #00000040"}}>
    {label&&<div style={{color:C.muted,fontSize:11,marginBottom:5}}>{label}</div>}
    {payload.filter(p=>p.value!=null&&p.name!=="low"&&p.name!=="high").map((p,i)=><div key={i} style={{color:p.color||C.text,fontSize:13,fontWeight:600}}>{p.name}: {fmt(p.value)}</div>)}
  </div>;
};

const Card = ({children,style={}}) => {
  return <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:20,boxShadow:"0 2px 12px #00000018",...style}}>{children}</div>;
};

// ✅ FIX: odstraněna reference na darkMode (neexistuje mimo App)
const MCard = ({label,value,color}) => {
  const [show,setShow] = useState(false);
  const tip = METRIC_TIPS[label];
  return (
    <div style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:12,padding:"11px 13px",position:"relative"}}
      onMouseEnter={()=>tip&&setShow(true)} onMouseLeave={()=>setShow(false)}>
      <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:3}}>
        <div style={{color:C.muted,fontSize:10,textTransform:"uppercase",letterSpacing:1}}>{label}</div>
        {tip&&<div style={{color:C.blue,fontSize:9,background:C.blue+"20",borderRadius:"50%",width:13,height:13,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,cursor:"help",fontWeight:700}}>?</div>}
      </div>
      <div style={{color:color||C.text,fontSize:15,fontWeight:700}}>{value||"—"}</div>
      {show&&tip&&<div style={{position:"absolute",bottom:"calc(100% + 6px)",left:0,zIndex:999,background:C.card,border:`1px solid ${C.blue}50`,borderRadius:10,padding:"10px 13px",fontSize:11,color:C.muted,lineHeight:1.7,width:230,boxShadow:"0 8px 32px #00000080",pointerEvents:"none"}}>{tip}</div>}
    </div>
  );
};

const SectionTitle = ({icon,title,sub}) => {
  return <div style={{marginBottom:14}}>
    <h2 style={{margin:0,fontSize:15,fontWeight:800,color:C.text}}>{icon} {title}</h2>
    {sub&&<p style={{margin:"3px 0 0",color:C.muted,fontSize:11}}>{sub}</p>}
  </div>;
};

const AnalystTargetChart = ({current,low,avg,high,currency,T}) => {
  if(!low||!high||!current||low>=high) return null;
  const upside = avg&&current?((avg-current)/current*100):0;
  const chartData = [
    {name:"🐻 Pesimistický",price:low,fill:C.red},
    {name:"📍 Aktuální",price:current,fill:C.blue},
    {name:"📊 Průměr",price:avg,fill:C.yellow},
    {name:"🐂 Optimistický",price:high,fill:C.green},
  ];
  const minVal = Math.min(low,current)*0.97;
  const maxVal = Math.max(high,current)*1.03;

  const CustomTooltip = ({active,payload,label}) => {
    if(!active||!payload?.length) return null;
    const item = chartData.find(d=>d.name===label);
    const diff = item&&label!=="📍 Aktuální"?((item.price-current)/current*100):null;
    return <div style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px"}}>
      <div style={{color:C.muted,fontSize:10,marginBottom:4}}>{label}</div>
      <div style={{color:item?.fill||C.text,fontSize:14,fontWeight:800}}>{currency} {fmt(payload[0].value)}</div>
      {diff!==null&&<div style={{color:diff>=0?C.green:C.red,fontSize:11,marginTop:2}}>{diff>=0?"+":""}{diff.toFixed(1)}% vs. aktuální</div>}
    </div>;
  };

  return (
    <div style={{marginTop:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <div style={{color:C.muted,fontSize:10,textTransform:"uppercase",letterSpacing:1}}>Cenové cíle vs. aktuální cena</div>
        <div style={{color:upside>=0?C.green:C.red,fontSize:13,fontWeight:800,background:(upside>=0?C.green:C.red)+"15",border:`1px solid ${(upside>=0?C.green:C.red)}30`,borderRadius:7,padding:"2px 10px"}}>
          {upside>=0?"+":""}{upside.toFixed(1)}% potenciál
        </div>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={chartData} margin={{top:4,right:4,left:0,bottom:4}}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
          <XAxis dataKey="name" tick={{fill:C.muted,fontSize:9}} axisLine={false} tickLine={false}/>
          <YAxis domain={[minVal,maxVal]} tick={{fill:C.muted,fontSize:9}} axisLine={false} tickLine={false} width={52}/>
          <Tooltip content={<CustomTooltip/>}/>
          <Bar dataKey="price" radius={[4,4,0,0]}>
            {chartData.map((entry,i)=>(<Cell key={i} fill={entry.fill}/>))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const FearGreedMeter = ({value,label,stocks,T}) => {
  if(!value) return null;
  const color = value<=25?C.red:value<=45?C.orange:value<=55?C.yellow:value<=75?C.cyan:C.green;
  const txt = value<=25?"Extreme Fear 😱":value<=45?"Fear 😟":value<=55?"Neutral 😐":value<=75?"Greed 😏":"Extreme Greed 🤑";
  const pct = value/100;
  return (
    <div style={{background:C.card2,borderRadius:12,padding:"12px 14px"}}>
      <div style={{color:C.muted,fontSize:10,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>📊 Fear & Greed Index · Sektor</div>
      <div style={{display:"flex",alignItems:"center",gap:14}}>
        <div style={{position:"relative",width:56,height:34,flexShrink:0}}>
          <svg width="56" height="34" viewBox="0 0 56 34">
            <path d="M6 28 A22 22 0 0 1 50 28" fill="none" stroke={C.border} strokeWidth="6" strokeLinecap="round"/>
            <path d="M6 28 A22 22 0 0 1 50 28" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
              strokeDasharray={`${pct*69} 69`} strokeDashoffset="0"/>
            <circle cx={6+(50-6)*pct} cy={28-Math.sin(Math.PI*pct)*22} r="4" fill={color}/>
          </svg>
        </div>
        <div>
          <div style={{color,fontSize:14,fontWeight:800}}>{value}/100 · {txt}</div>
          {label&&<div style={{color:C.muted,fontSize:10,marginTop:2}}>{label}</div>}
        </div>
      </div>
      <div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${C.border}`}}>
        <div style={{display:"flex",gap:3,marginBottom:8,borderRadius:6,overflow:"hidden",height:6}}>
          {[[C.red,"0–25"],[C.orange,"26–45"],[C.yellow,"46–55"],[C.cyan,"56–75"],[C.green,"76–100"]].map(([c,r])=>(
            <div key={r} style={{flex:1,background:c,opacity:value&&((parseInt(r)<=value)||(parseInt(r.split("–")[1])>=value&&parseInt(r)<=value))?1:0.3}}/>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"3px 8px"}}>
          {[
            {range:"0–25",label:"Extreme Fear",color:C.red,desc:"Panika, přeprodaný trh – historicky příležitost nakupovat"},
            {range:"26–45",label:"Fear",color:C.orange,desc:"Opatrnost, nižší valuace akcií v sektoru"},
            {range:"46–55",label:"Neutral",color:C.yellow,desc:"Vyvážený sentiment, normální podmínky"},
            {range:"56–75",label:"Greed",color:C.cyan,desc:"Optimismus, vyšší valuace, investoři riskují více"},
            {range:"76–100",label:"Extreme Greed",color:C.green,desc:"Euforie, přehřátý trh – historicky čas opatrnosti"},
          ].map(({range,label,color,desc})=>(
            <div key={range} style={{display:"flex",gap:5,alignItems:"flex-start",opacity:value>=parseInt(range)&&value<=(parseInt(range.split("–")[1])||100)?1:0.45}}>
              <span style={{color,fontSize:9,fontWeight:800,minWidth:38,marginTop:1}}>{range}</span>
              <div>
                <span style={{color,fontSize:9,fontWeight:700}}>{label}</span>
                <span style={{color:C.muted,fontSize:9}}> · {desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      {stocks&&stocks.filter(s=>s).length>0&&(
        <div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${C.border}`}}>
          <div style={{color:C.muted,fontSize:9,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Hlavní hráči v sektoru</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
            {stocks.filter(s=>s).map((s,i)=>(
              <span key={i} style={{background:C.blue+"15",border:`1px solid ${C.blue}30`,borderRadius:6,padding:"2px 8px",fontSize:10,color:C.cyan,fontWeight:600}}>{s}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const ScoreLegend = ({onClose}) => {
  return <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"#00000080",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onClose}>
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:24,maxWidth:400,width:"90%",boxShadow:"0 20px 60px #000000a0"}} onClick={e=>e.stopPropagation()}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <h3 style={{margin:0,fontSize:15,fontWeight:800,color:C.text}}>🕸️ Jak číst skóre (0–10)</h3>
        <button onClick={onClose} style={{background:"none",border:"none",color:C.muted,fontSize:20,cursor:"pointer"}}>×</button>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
        {[
          {range:"1–3",label:"Slabé",color:C.red,desc:"Výrazně podprůměrné, varování"},
          {range:"4–5",label:"Podprůměrné",color:C.orange,desc:"Pod průměrem trhu"},
          {range:"6",label:"Průměrné",color:C.yellow,desc:"V souladu s průměrem trhu"},
          {range:"7–8",label:"Silné",color:C.cyan,desc:"Nadprůměrné, konkurenční výhoda"},
          {range:"9–10",label:"Výjimečné",color:C.green,desc:"Top 5–10% v celém trhu"},
        ].map(({range,label,color,desc})=>(
          <div key={range} style={{display:"flex",alignItems:"center",gap:10,background:C.card2,borderRadius:10,padding:"8px 12px"}}>
            <div style={{background:color+"25",border:`1px solid ${color}50`,borderRadius:8,padding:"3px 8px",minWidth:36,textAlign:"center"}}>
              <span style={{color,fontSize:13,fontWeight:800}}>{range}</span>
            </div>
            <div>
              <div style={{color,fontSize:12,fontWeight:700}}>{label}</div>
              <div style={{color:C.muted,fontSize:11}}>{desc}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{borderTop:`1px solid ${C.border}`,paddingTop:12}}>
        <div style={{color:C.muted,fontSize:10,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Co každá kategorie znamená</div>
        {Object.entries(RADAR_DESC).map(([k,v])=>(
          <div key={k} style={{display:"flex",gap:8,marginBottom:5}}>
            <span style={{color:C.blue,fontSize:11,fontWeight:700,minWidth:80}}>{k}:</span>
            <span style={{color:C.muted,fontSize:11}}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  </div>;
};

// ✅ FIX: odstraněna reference na darkMode
const TechCard = ({label,value,color,tip}) => {
  const [show,setShow] = useState(false);
  return <div style={{background:C.card2,borderRadius:8,padding:"7px 8px",position:"relative"}} onMouseEnter={()=>setShow(true)} onMouseLeave={()=>setShow(false)}>
    <div style={{color:C.muted,fontSize:9,textTransform:"uppercase",letterSpacing:1,marginBottom:2}}>{label}</div>
    <div style={{color:color||C.text,fontSize:12,fontWeight:700}}>{value}</div>
    {show&&tip&&<div style={{position:"absolute",bottom:"calc(100% + 4px)",left:0,zIndex:999,background:C.card,border:`1px solid ${C.blue}50`,borderRadius:8,padding:"8px 10px",fontSize:10,color:C.muted,lineHeight:1.6,width:180,boxShadow:"0 8px 24px #00000080",pointerEvents:"none"}}>{tip}</div>}
  </div>;
};

// ✅ FIX: odstraněna reference na darkMode
const DCFCard = ({label,value,big,color,tip}) => {
  const [show,setShow] = useState(false);
  return <div style={{background:C.card2,borderRadius:10,padding:"9px 11px",position:"relative"}} onMouseEnter={()=>tip&&setShow(true)} onMouseLeave={()=>setShow(false)}>
    <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:2}}>
      <div style={{color:C.muted,fontSize:9,textTransform:"uppercase",letterSpacing:1}}>{label}</div>
      {tip&&<div style={{color:C.blue,fontSize:9,background:C.blue+"20",borderRadius:"50%",width:13,height:13,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,cursor:"help",fontWeight:700}}>?</div>}
    </div>
    <div style={{color:color||C.text,fontSize:big?17:13,fontWeight:800}}>{value}</div>
    {show&&tip&&<div style={{position:"absolute",bottom:"calc(100% + 4px)",left:0,zIndex:999,background:C.card,border:`1px solid ${C.blue}50`,borderRadius:8,padding:"8px 10px",fontSize:11,color:C.muted,lineHeight:1.6,width:220,boxShadow:"0 8px 24px #00000080",pointerEvents:"none"}}>{tip}</div>}
  </div>;
};

const EXCHANGES = [
  {code:"US",      flag:"🇺🇸", label:"USA",       short:"NYSE",  hint:"NYSE / NASDAQ",         currency:"USD", example:"AAPL, NVDA, MSFT"},
  {code:"LSE",     flag:"🇬🇧", label:"Londýn",    short:"LSE",   hint:"London Stock Exchange",  currency:"GBp", example:"SHEL, HSBA, BP"},
  {code:"XETRA",   flag:"🇩🇪", label:"Frankfurt", short:"XETRA", hint:"XETRA / Frankfurt",      currency:"EUR", example:"SAP, BMW, SIE"},
  {code:"EURONEXT",flag:"🇫🇷", label:"Euronext",  short:"ENX",   hint:"Paris / Amsterdam",      currency:"EUR", example:"LVMH, ASML, TTE"},
  {code:"TSE",     flag:"🇯🇵", label:"Tokio",     short:"TSE",   hint:"Tokyo Stock Exchange",   currency:"JPY", example:"7203, 6758, 9984"},
  {code:"SSE",     flag:"🇨🇳", label:"Šanghaj",   short:"SSE",   hint:"Shanghai / Shenzhen",    currency:"CNY", example:"600519, 000858"},
  {code:"HKEX",    flag:"🇭🇰", label:"Hongkong",  short:"HKEX",  hint:"Hong Kong Exchange",     currency:"HKD", example:"700, 9988, 1299"},
  {code:"KRX",     flag:"🇰🇷", label:"Soul",      short:"KRX",   hint:"Korea Exchange",         currency:"KRW", example:"005930, 000660"},
  {code:"BSE",     flag:"🇮🇳", label:"Bombaj",    short:"NSE",   hint:"BSE / NSE India",        currency:"INR", example:"RELIANCE, TCS"},
  {code:"PSE",     flag:"🇨🇿", label:"Praha",     short:"PSE",   hint:"Prague Stock Exchange",  currency:"CZK", example:"CEZ, KOMB, MONET"},
  {code:"GPW",     flag:"🇵🇱", label:"Varšava",   short:"GPW",   hint:"Warsaw Stock Exchange",  currency:"PLN", example:"PKN, PKO, CDR"},
  {code:"TSX",     flag:"🇨🇦", label:"Toronto",   short:"TSX",   hint:"Toronto Stock Exchange", currency:"CAD", example:"SHOP, RY, TD"},
  {code:"ASX",     flag:"🇦🇺", label:"Sydney",    short:"ASX",   hint:"Australian Securities",  currency:"AUD", example:"BHP, CBA, CSL"},
  {code:"BOVESPA", flag:"🇧🇷", label:"São Paulo", short:"B3",    hint:"B3 / Bovespa",           currency:"BRL", example:"PETR4, VALE3"},
  {code:"MOEX",    flag:"🇷🇺", label:"Moskva",    short:"MOEX",  hint:"Moscow Exchange",        currency:"RUB", example:"GAZP, SBER, LKOH"},
];

const LoadingTimer = ({muted}) => {
  const [secs, setSecs] = useState(0);
  const msgs = ["Vyhledávám aktuální data...","Zpracovávám finanční výkazy...","Počítám DCF valuaci...","Analyzuji sentiment analytiků...","Připravuji výsledky..."];
  useEffect(()=>{
    const t = setInterval(()=>setSecs(s=>s+1), 1000);
    return ()=>clearInterval(t);
  },[]);
  return <p style={{color:muted,fontSize:13,textAlign:"center"}}>{msgs[Math.min(Math.floor(secs/8), msgs.length-1)]} <span style={{fontWeight:700}}>{secs}s</span></p>;
};

export default function App() {
  const [ticker,setTicker]=useState("");
  const [exchange,setExchange]=useState("US");
  const [loading,setLoading]=useState(false);
  const [data,setData]=useState(null);
  const [error,setError]=useState(null);
  const isMobile = useIsMobile();
  const { getToken } = useAuth();
  const [finTab,setFinTab]=useState("revenue");
  const [newsFilter,setNewsFilter]=useState("all");
  const [watchlist,setWatchlist]=useState([]);
  const [showScoreLegend,setShowScoreLegend]=useState(false);
  const [darkMode,setDarkMode]=useState(true);
  C = darkMode ? {bg:"#060d1a",card:"#0b1628",card2:"#0f1e35",border:"#1a2d4a",text:"#e2e8f0",muted:"#4e6080",blue:"#3b82f6",green:"#10b981",red:"#ef4444",yellow:"#f59e0b",purple:"#8b5cf6",cyan:"#06b6d4",orange:"#f97316"} : {bg:"#f1f5f9",card:"#ffffff",card2:"#f8fafc",border:"#e2e8f0",text:"#0f172a",muted:"#64748b",blue:"#2563eb",green:"#059669",red:"#dc2626",yellow:"#d97706",purple:"#7c3aed",cyan:"#0891b2",orange:"#ea580c"};
  const T = {
    back:"← Zpět", buy:"KOUPIT", sell:"PRODAT", hold:"DRŽET", analyze:"Analyzovat →",
    exchange:"Burza", ticker:"Ticker Symbol", watchlist:"Watchlist",
    news:"Nejnovější Zprávy", read:"↗ číst", all:"Vše", pos:"📈 Pozit.", neg:"📉 Negat.", neu:"📋 Neutr.",
    loading:"Analyzuji", darkMode:"Tmavý režim", lightMode:"Světlý režim",
    annualResults:"Roční Výsledky", annualSub:"přerušovaně = odhad analytiků",
    quarterlyResults:"Čtvrtletní Výsledky", revenue:"Revenue", netIncome:"Čistý zisk",
    buffett:"Buffettův Checklist", buffettSub:"8 kritérií Warrena Buffetta pro výběr kvalitních dlouhodobých investic",
    strongChoice:"Silná volba", average:"Průměrná", risky:"Rizikové",
    risks:"⚠️ Rizika", catalysts:"🚀 Katalyzátory",
    macro:"Makro Kontext", macroOutlook:"Makro výhled:", sectorIndicators:"Klíčové ukazatele pro sektor",
    sectorPlayers:"Hlavní hráči v sektoru",
    score:"Celkové Skóre", scoreSub:"Hodnocení 0–10 v klíčových kategoriích",
    scoreLegend:"? Legenda", scoreContext:["Top 20% akcií","Nadprůměrná kvalita","Průměr trhu","Podprůměrná"],
    earningsCalendar:"Earnings Calendar", earningsSub:"Výsledky hýbou cenou – průměrně ±5% v den zveřejnění.",
    nextResults:"Příští výsledky", resultsHistory:"Historie výsledků",
    estEPS:"Odhadovaný EPS", estRev:"Odh. tržby", prevSurprise:"Předchozí překvapení",
    insiders:"Insider Trading", insiderSub:"Nákupy/prodeje akcií vedením firmy – insideři znají firmu nejlépe.",
    competitors:"Srovnání s Konkurencí",
    dcf:"DCF Valuace", dcfSub:"Discounted Cash Flow – ocenění na základě budoucích peněžních toků",
    currentVsIntrinsic:"Aktuální cena vs. vnitřní hodnota", targetPrice:"Cílová cena",
    avgAnalysts:"Avg analytici", potential:"Potenciál", sensitivity:"Citlivostní analýza – Vnitřní hodnota při různém WACC",
    growth:"Růst", wacc:"WACC",
    technicals:"Technická Analýza", analysts:"Analytici", analystsSub:"Konsenzus Wall Street analytiků",
    buy2:"Koupit", hold2:"Držet", sell2:"Prodat",
    priceTarget:"Cenové cíle vs. aktuální cena",
    priceChart:"Vývoj ceny + Fair Value zóny", priceChartSub:"Historická data · predikce · pásmo analytiků",
    sp500:"Srovnání s S&P 500", sp500Sub:"Výkonnost indexovaná na 100",
    peHistory:"Historické P/E Ratio", peHistSub:"Valuace v čase",
    investmentThesis:"Investiční Teze", pros:"Proč koupit", cons:"Proč nekoupit",
    favorable:"↑ Příznivé", unfavorable:"↓ Nepříznivé", neutral2:"→ Neutrální",
    disclaimer:"Pouze informační charakter – není investiční doporučení.",
    subheadline:"Live data · DCF · Buffett checklist · Insider · Fair Value · AI analýza",
    quarter:"Kvartál", rev:"Rev (B)", profit:"Zisk (B)", yoy:"YoY",
    ticker2:"Ticker", firm:"Firma", marketCap:"Market Cap", revGrowth:"Rev. Růst", netMargin:"Net Marže",
    name2:"Jméno", role:"Funkce", type2:"Typ", shares:"Akcie", value2:"Hodnota", date2:"Datum",
    fearGreed:"Fear & Greed Index – Sektor",
    fedRate:"Fed Rate", inflation:"Inflace", sectorYtd:"Sektor YTD", sp500Ytd:"S&P 500 YTD",
  };

  useEffect(()=>{ try{ const w=localStorage.getItem("wl2"); if(w) setWatchlist(JSON.parse(w)); }catch{} },[]);

  const saveWl = (d) => {
    const next=[{ticker:d.ticker,name:d.name,verdict:d.verdict,score:d.score},...watchlist.filter(w=>w.ticker!==d.ticker)].slice(0,8);
    setWatchlist(next);
    try{ localStorage.setItem("wl2",JSON.stringify(next)); }catch{}
  };
  const removeWl = (t) => {
    const next=watchlist.filter(w=>w.ticker!==t);
    setWatchlist(next);
    try{ localStorage.setItem("wl2",JSON.stringify(next)); }catch{}
  };

  const analyze = async (override, overrideExchange) => {
    const t=(override||ticker).trim().toUpperCase();
    const exch = overrideExchange || exchange;
    const exchInfo = EXCHANGES.find(e=>e.code===exch)||EXCHANGES[0];
    if(!t) return;
    if(override) setTicker(override);
    setLoading(true); setError(null); setData(null); setFinTab("revenue"); setNewsFilter("all");
    try{
      const clerkToken = await getToken();
      const res = await fetch("/api/analyze", {
        method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${clerkToken}`},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:5000,
          tools:[{type:"web_search_20250305",name:"web_search"}],
          messages:[{role:"user",content:`Search web for "${t}" stock on ${exchInfo.label} (${exchInfo.hint}). Currency: ${exchInfo.currency}. Today: March 2026. Do 2 searches: 1) "${t} ${exchInfo.hint} stock price analyst target 2026" 2) "${t} stock news March 2026". Return ONLY raw JSON, no markdown. ALL prices in ${exchInfo.currency}. CRITICAL: radarScores must be REAL scores 1-10 based on actual fundamentals (NOT all 5). investmentThesis must be 8-10 sentences in Czech covering: business model, competitive moat, growth drivers, risks, valuation, macro context, analyst consensus, final verdict. newsSummary = 3-4 sentence Czech summary of all news sentiment and key themes.

{"name":"","ticker":"${t}","domain":"","exchange":"${exchInfo.hint}","sector":"","currency":"${exchInfo.currency}","description":"2 věty česky","price":{"current":0,"changePct":0,"marketCap":"","w52High":0,"w52Low":0,"volume":""},"metrics":{"pe":0,"eps":0,"netMargin":0,"grossMargin":0,"roe":0,"beta":0,"dividendYield":0,"debtEquity":0,"freeCashFlowB":0,"revenueGrowthPct":0},"radarScores":{"valuation":5,"growth":7,"profitability":8,"financialHealth":7,"momentum":6,"dividend":3},"annuals":[{"year":"2022","revB":0,"niB":0,"eps":0},{"year":"2023","revB":0,"niB":0,"eps":0},{"year":"2024","revB":0,"niB":0,"eps":0},{"year":"2025","revB":0,"niB":0,"eps":0},{"year":"2026E","revB":null,"niB":null,"eps":null,"estRevB":0,"estNiB":0,"estEps":0}],"quarters":[{"q":"Q3 2025","revB":0,"niB":0,"eps":0,"yoy":0},{"q":"Q4 2025","revB":0,"niB":0,"eps":0,"yoy":0},{"q":"Q1 2026","revB":0,"niB":0,"eps":0,"yoy":0}],"peHistory":[{"year":"2022","pe":0},{"year":"2023","pe":0},{"year":"2024","pe":0},{"year":"2025","pe":0}],"history":[{"date":"Kvě '24","price":0,"sp500":0},{"date":"Srp '24","price":0,"sp500":0},{"date":"Lis '24","price":0,"sp500":0},{"date":"Úno '25","price":0,"sp500":0},{"date":"Čer '25","price":0,"sp500":0},{"date":"Bře '26","price":0,"sp500":0}],"analysts":{"buy":0,"hold":0,"sell":0,"avgTarget":0,"lowTarget":0,"highTarget":0},"dcf":{"intrinsicValue":0,"upside":0,"wacc":0},"dcfSensitivity":[{"wacc":8,"growthRates":[3,5,7,9],"values":[0,0,0,0]},{"wacc":10,"growthRates":[3,5,7,9],"values":[0,0,0,0]}],"technicals":{"ma50":0,"ma200":0,"rsi":0,"support":0,"resistance":0},"earningsCalendar":{"nextDate":"","quarter":"","estimatedEPS":0,"estimatedRevB":0,"lastSurprisePct":0},"earningsHistory":[{"quarter":"Q4 2025","date":"","estimatedEPS":0,"actualEPS":0,"estimatedRevB":0,"actualRevB":0},{"quarter":"Q3 2025","date":"","estimatedEPS":0,"actualEPS":0,"estimatedRevB":0,"actualRevB":0},{"quarter":"Q2 2025","date":"","estimatedEPS":0,"actualEPS":0,"estimatedRevB":0,"actualRevB":0},{"quarter":"Q1 2025","date":"","estimatedEPS":0,"actualEPS":0,"estimatedRevB":0,"actualRevB":0}],"buffettChecklist":[{"criterion":"ROE > 15%","passed":true,"note":""},{"criterion":"Nízký dluh","passed":true,"note":""},{"criterion":"Růst zisku","passed":true,"note":""},{"criterion":"Silný FCF","passed":true,"note":""},{"criterion":"Ekonomický příkop","passed":true,"note":""},{"criterion":"Srozumitelné podnikání","passed":true,"note":""},{"criterion":"Management vlastní akcie","passed":false,"note":""},{"criterion":"P/E pod průměrem","passed":false,"note":""}],"insiders":[{"name":"","role":"","type":"buy","shares":0,"valueM":0,"date":""}],"competitors":[{"ticker":"","name":"","pe":0,"revGrowthPct":0,"netMarginPct":0,"marketCapB":0},{"ticker":"","name":"","pe":0,"revGrowthPct":0,"netMarginPct":0,"marketCapB":0}],"macro":{"fedRate":0,"inflation":0,"sectorYtdPct":0,"sp500YtdPct":0,"outlook":"","sectorFearGreed":50,"sectorFearGreedLabel":"","sectorTopStocks":["","",""],"sectorIndicators":[{"name":"","value":"","impact":"positive","comment":""},{"name":"","value":"","impact":"neutral","comment":""},{"name":"","value":"","impact":"negative","comment":""}]},"news":[{"title":"","summary":"česky","sentiment":"positive","date":"","source":"","url":""},{"title":"","summary":"česky","sentiment":"negative","date":"","source":"","url":""},{"title":"","summary":"česky","sentiment":"neutral","date":"","source":"","url":""},{"title":"","summary":"česky","sentiment":"positive","date":"","source":"","url":""},{"title":"","summary":"česky","sentiment":"neutral","date":"","source":"","url":""}],"newsSummary":"3-4 věty česky shrnutí zpráv","risks":["","",""],"catalysts":["",""],"verdict":"KOUPIT","score":7,"targetPrice":0,"investmentThesis":"8-10 vět česky","pros":["","",""],"cons":["","",""]}`}]
        })
      });
      const d=await res.json();
      const txt=d.content?.filter(b=>b.type==="text").map(b=>b.text).join("")||"";
      const si=txt.indexOf("{"),ei=txt.lastIndexOf("}");
      if(si<0) throw new Error("Nepodařilo se načíst data, zkus znovu.");
      let jsonStr=txt.substring(si,ei+1);
      const tryParse=(s)=>{
        try{return JSON.parse(s);}catch{
          let opens=0,openBrace=0;
          for(const c of s){if(c==='[')opens++;else if(c===']')opens--;if(c==='{')openBrace++;else if(c==='}')openBrace--;}
          let fixed=s.replace(/,\s*$/,'');
          for(let i=0;i<opens;i++)fixed+=']';
          for(let i=0;i<openBrace;i++)fixed+='}';
          try{return JSON.parse(fixed);}catch{return null;}
        }
      };
      const parsed=tryParse(jsonStr);
      if(!parsed) throw new Error("Nepodařilo se zpracovat data. Zkus znovu.");
      if(!parsed.price?.current||parsed.price.current===0) throw new Error(`Data se nenačetla pro "${t}". Zkontroluj ticker.`);
      const {priceChart,compChart}=buildCharts(parsed.history,parsed.targetPrice,parsed.analysts?.lowTarget,parsed.analysts?.avgTarget,parsed.analysts?.highTarget);
      parsed._priceChart=priceChart;
      parsed._compChart=compChart;
      parsed._radarData=Object.entries(parsed.radarScores||{}).map(([k,v])=>({subject:RADAR_LABELS[k]||k,score:v,fullMark:10}));
      setData(parsed);
      saveWl(parsed);
    }catch(e){setError(e.message||"Neznámá chyba.");}
    finally{setLoading(false);}
  };

  if(!loading&&!data) return (
    <div style={{minHeight:"100vh",background:darkMode?`radial-gradient(ellipse at 20% 50%, #0d1f3c 0%, ${C.bg} 60%)`:`radial-gradient(ellipse at 20% 50%, #dbeafe 0%, ${C.bg} 60%)`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"system-ui,sans-serif",padding:24}}>
      <style>{`*{box-sizing:border-box}input:focus{outline:none;border-color:${C.blue}!important}button{transition:all .18s;cursor:pointer}button:hover{opacity:.85}button:active{transform:scale(.97)}`}</style>
      <div style={{position:"fixed",top:16,right:20,zIndex:100,display:"flex",gap:8,alignItems:"center"}}>
        <button onClick={()=>setDarkMode(d=>!d)} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 10px",fontSize:14,color:C.text,cursor:"pointer"}}>{darkMode?"☀️":"🌙"}</button>
        <UserButton afterSignOutUrl="/"/>
      </div>
      <div style={{marginBottom:30,textAlign:"center"}}>
        <img src="/logo.svg" alt="Stock Analyzer Pro" style={{width:280,height:"auto",marginBottom:8}}/>
        <p style={{color:C.muted,fontSize:14,margin:0}}>{T.subheadline}</p>
      </div>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:22,padding:30,width:"100%",maxWidth:500,boxShadow:darkMode?"0 20px 60px #00000060":"0 20px 60px #0000001a"}}>
        <label style={{color:C.muted,fontSize:11,display:"block",marginBottom:8,textTransform:"uppercase",letterSpacing:1}}>{T.exchange}</label>
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:5,marginBottom:14}}>
          {EXCHANGES.map(ex=>(
            <button key={ex.code} onClick={()=>setExchange(ex.code)} title={`${ex.label} – ${ex.hint}\nPř: ${ex.example}`} style={{background:exchange===ex.code?C.blue+"30":C.card2,border:`1px solid ${exchange===ex.code?C.blue:C.border}`,borderRadius:8,padding:"5px 4px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,transition:"all .15s"}}>
              <span style={{fontSize:16}}>{ex.flag}</span>
              <span style={{color:exchange===ex.code?C.blue:C.muted,fontSize:9,fontWeight:700,letterSpacing:0.3}}>{ex.short}</span>
            </button>
          ))}
        </div>
        <div style={{color:C.muted,fontSize:10,marginBottom:12,textAlign:"center"}}>
          {EXCHANGES.find(e=>e.code===exchange)?.flag} <span style={{color:C.text,fontWeight:700}}>{EXCHANGES.find(e=>e.code===exchange)?.label}</span> – {EXCHANGES.find(e=>e.code===exchange)?.hint} · <span style={{color:C.muted}}>Př: {EXCHANGES.find(e=>e.code===exchange)?.example}</span>
        </div>
        <label style={{color:C.muted,fontSize:11,display:"block",marginBottom:8,textTransform:"uppercase",letterSpacing:1}}>{T.ticker}</label>
        <input value={ticker} onChange={e=>setTicker(e.target.value.toUpperCase())} onKeyDown={e=>e.key==="Enter"&&analyze()} placeholder={EXCHANGES.find(e=>e.code===exchange)?.example||"AAPL"} style={{width:"100%",background:C.card2,border:`2px solid ${C.border}`,borderRadius:12,color:C.text,fontSize:22,fontWeight:900,padding:"13px 16px",letterSpacing:3,marginBottom:14,transition:"border .2s"}}/>
        <button onClick={()=>analyze()} style={{width:"100%",background:`linear-gradient(135deg,${C.blue},#6366f1)`,border:"none",borderRadius:12,color:"#fff",fontSize:16,fontWeight:700,padding:"14px 0",boxShadow:`0 4px 20px ${C.blue}40`}}>
          {T.analyze}
        </button>
        {error&&<div style={{color:C.red,fontSize:12,marginTop:12,textAlign:"center",lineHeight:1.5}}>{error}</div>}
      </div>
      {watchlist.length>0&&(
        <div style={{marginTop:20,width:"100%",maxWidth:500}}>
          <div style={{color:C.muted,fontSize:11,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>⭐ Watchlist</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {watchlist.map(w=>(
              <div key={w.ticker} style={{display:"flex",alignItems:"center",gap:6,background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"5px 10px"}}>
                <button onClick={()=>analyze(w.ticker)} style={{background:"none",border:"none",color:C.text,fontWeight:800,fontSize:13,padding:0}}>{w.ticker}</button>
                <span style={{color:vc(w.verdict),fontSize:10,fontWeight:700}}>{w.verdict}</span>
                <button onClick={()=>removeWl(w.ticker)} style={{background:"none",border:"none",color:C.muted,fontSize:14,padding:0}}>×</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  if(loading) return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"system-ui,sans-serif"}}>
      <style>{`@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.6;transform:scale(.95)}}@keyframes ld{0%{transform:translateX(-100%)}100%{transform:translateX(400%)}}`}</style>
      <img src="/logo.svg" alt="Logo" style={{width:160,height:"auto",marginBottom:18,animation:"pulse 1.8s ease-in-out infinite"}}/>
      <h2 style={{color:C.text,fontSize:20,fontWeight:800,marginBottom:6}}>{T.loading} {ticker}...</h2>
      <LoadingTimer muted={C.muted}/>
      <div style={{width:240,height:3,background:C.border,borderRadius:4,overflow:"hidden",marginTop:20}}>
        <div style={{width:"40%",height:"100%",background:`linear-gradient(90deg,transparent,${C.blue},${C.purple},transparent)`,animation:"ld 1.6s ease-in-out infinite"}}/>
      </div>
    </div>
  );

  if(!data) return null;
  const {price:pr={},metrics:mx={},annuals=[],quarters=[],analysts:an={},dcf={},technicals:tc={},news=[],risks=[],catalysts=[],insiders=[],competitors=[],macro={},peHistory=[],earningsCalendar:ec={},buffettChecklist:bc=[],_priceChart=[],_compChart=[],_radarData=[]}=data;
  const totalA=(an.buy||0)+(an.hold||0)+(an.sell||0);
  const upPct=pr.current&&data.targetPrice?((data.targetPrice-pr.current)/pr.current*100):0;
  const ccy=data.currency||"USD";
  const tabSt=t=>({background:finTab===t?C.blue+"25":"transparent",border:`1px solid ${finTab===t?C.blue+"50":"transparent"}`,cursor:"pointer",padding:"6px 14px",borderRadius:8,fontSize:12,fontWeight:700,color:finTab===t?C.blue:C.muted,transition:"all .15s"});
  const filtNews=newsFilter==="all"?news.filter(n=>n.title):news.filter(n=>n.title&&n.sentiment===newsFilter);
  const buffPassed=bc.filter(b=>b.passed).length;

  return (
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"system-ui,sans-serif",color:C.text}}>
      <style>{`*{box-sizing:border-box}::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}button{cursor:pointer}a{text-decoration:none}`}</style>
      {showScoreLegend&&<ScoreLegend onClose={()=>setShowScoreLegend(false)}/>}

      <div style={{background:`${C.card}ee`,backdropFilter:"blur(12px)",borderBottom:`1px solid ${C.border}`,padding:isMobile?"8px 12px":"10px 24px",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,zIndex:100,flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:isMobile?6:10}}>
          <button onClick={()=>{setData(null);setError(null);}} style={{background:"transparent",border:`1px solid ${C.border}`,color:C.muted,borderRadius:8,padding:"5px 10px",fontSize:11}}>{T.back}</button>
          {data.domain&&<img src={`https://logo.clearbit.com/${data.domain}`} onError={e=>e.target.style.display="none"} style={{width:32,height:32,borderRadius:8,objectFit:"contain",background:"#fff",padding:3,boxShadow:"0 2px 8px #00000030"}} alt=""/>}
          <div>
            <div style={{fontWeight:900,fontSize:isMobile?15:20,lineHeight:1}}>{data.ticker}</div>
            {!isMobile&&<div style={{color:C.muted,fontSize:11,marginTop:1}}>{data.name}</div>}
          </div>
          {!isMobile&&<span style={{fontSize:10,background:C.card2,color:C.muted,padding:"2px 8px",borderRadius:5}}>{data.exchange}</span>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:isMobile?8:12}}>
          <div><span style={{fontSize:isMobile?16:20,fontWeight:900}}>{ccy} {fmt(pr.current)}</span><span style={{color:clr(pr.changePct||0),fontWeight:700,fontSize:12,marginLeft:6}}>{pct(pr.changePct)}</span></div>
          {!isMobile&&<span style={{background:vc(data.verdict)+"25",color:vc(data.verdict),border:`1px solid ${vc(data.verdict)}50`,borderRadius:9,padding:"5px 16px",fontWeight:900,fontSize:14}}>{data.verdict||"DRŽET"}</span>}
          <button onClick={()=>setDarkMode(d=>!d)} style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:8,padding:"5px 9px",fontSize:14,color:C.text}} title={darkMode?"Světlý režim":"Tmavý režim"}>{darkMode?"☀️":"🌙"}</button>
          <UserButton afterSignOutUrl="/"/>
        </div>
      </div>

      <div style={{maxWidth:1400,margin:"0 auto",padding:isMobile?"12px 10px 50px":"18px 24px 50px",display:"flex",flexDirection:"column",gap:12}}>
        <Card>
          <div style={{display:"flex",gap:20,flexWrap:"wrap",flexDirection:isMobile?"column":"row"}}>
            <div style={{flex:1,minWidth:220}}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
                {data.domain&&<img src={`https://logo.clearbit.com/${data.domain}`} onError={e=>e.target.style.display="none"} style={{width:48,height:48,borderRadius:12,objectFit:"contain",background:"#fff",padding:4,boxShadow:"0 2px 12px #00000040"}} alt=""/>}
                <div>
                  <div style={{fontWeight:900,fontSize:20,color:C.text,letterSpacing:-0.5}}>{data.name}</div>
                  <div style={{color:C.muted,fontSize:11,marginTop:2}}>{data.sector} · {data.exchange}</div>
                </div>
              </div>
              <p style={{margin:0,fontSize:13,lineHeight:1.8,color:C.muted}}>{data.description}</p>
            </div>
            <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:8,minWidth:0}}>
              <MCard label="Market Cap" value={pr.marketCap}/><MCard label="Objem" value={pr.volume}/>
              <MCard label="52T Max" value={`${fmt(pr.w52High)}`}/><MCard label="52T Min" value={`${fmt(pr.w52Low)}`}/>
            </div>
          </div>
        </Card>

        <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(4,1fr)":"repeat(8,1fr)",gap:8}}>
          {[{l:"P/E",v:fmt(mx.pe)},{l:"EPS",v:`${fmt(mx.eps)}`},{l:"Net Marže",v:pct(mx.netMargin)},{l:"ROE",v:pct(mx.roe)},{l:"Beta",v:fmt(mx.beta)},{l:"Div. Yield",v:pct(mx.dividendYield)},{l:"D/E",v:fmt(mx.debtEquity)},{l:"FCF",v:`${fmt(mx.freeCashFlowB)}B`}].map(m=><MCard key={m.l} label={m.l} value={m.v}/>)}
        </div>

        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr 1fr",gap:12}}>
          <Card>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
              <SectionTitle icon="🕸️" title={T.score} sub={T.scoreSub}/>
              <button onClick={()=>setShowScoreLegend(true)} style={{background:C.blue+"20",border:`1px solid ${C.blue}40`,borderRadius:7,padding:"3px 9px",fontSize:10,color:C.blue,fontWeight:700}}>? Legenda</button>
            </div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:20,marginBottom:8,padding:"10px 0"}}>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:64,fontWeight:900,lineHeight:1,color:vc(data.verdict),textShadow:`0 0 40px ${vc(data.verdict)}60`}}>{(data.score||5).toFixed(1)}</div>
                <div style={{color:C.muted,fontSize:11,marginTop:4}}>z 10 bodů</div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                <div style={{background:vc(data.verdict)+"20",border:`1px solid ${vc(data.verdict)}40`,borderRadius:10,padding:"6px 14px",color:vc(data.verdict),fontWeight:900,fontSize:16,textAlign:"center"}}>{data.verdict||"DRŽET"}</div>
                <div style={{color:C.muted,fontSize:11,textAlign:"center",lineHeight:1.5}}>
                  {(data.score||5)>=8?T.scoreContext[0]:((data.score||5)>=6?T.scoreContext[1]:((data.score||5)>=4?T.scoreContext[2]:T.scoreContext[3]))}
                </div>
                <div style={{display:"flex",gap:4}}>
                  {[1,2,3,4,5,6,7,8,9,10].map(n=>(
                    <div key={n} style={{flex:1,height:5,borderRadius:3,background:n<=(data.score||5)?vc(data.verdict):C.border,transition:"all .3s"}}/>
                  ))}
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <RadarChart data={_radarData} margin={{top:8,right:36,left:36,bottom:8}}>
                <PolarGrid stroke={C.border}/>
                <PolarAngleAxis dataKey="subject" tick={{fill:C.muted,fontSize:10}}/>
                <PolarRadiusAxis domain={[0,10]} tick={false} axisLine={false}/>
                <Radar name="Skóre" dataKey="score" stroke={C.blue} fill={C.blue} fillOpacity={0.25} strokeWidth={2}/>
                <Tooltip content={<Tip/>}/>
              </RadarChart>
            </ResponsiveContainer>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:5,marginTop:6}}>
              {_radarData.map(d=>(
                <div key={d.subject} style={{background:C.card2,borderRadius:8,padding:"6px 8px",textAlign:"center"}}>
                  <div style={{color:C.muted,fontSize:9,marginBottom:2}}>{d.subject}</div>
                  <div style={{color:d.score>=7?C.green:d.score>=4?C.yellow:C.red,fontWeight:800,fontSize:13}}>{d.score}<span style={{color:C.muted,fontSize:9}}>/10</span></div>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <SectionTitle icon="🌍" title={T.macro}/>
            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:8,marginBottom:10}}>
              {[
                {l:T.fedRate,v:`${fmt(macro.fedRate)}%`,tip:macro.fedRate>4?"Vysoké sazby tlačí dolů valuace růstových akcií.":macro.fedRate<2?"Nízké sazby podporují růstové akcie.":"Sazby v normálním pásmu."},
                {l:T.inflation,v:`${fmt(macro.inflation)}%`,tip:macro.inflation>4?"Vysoká inflace snižuje reálné výnosy a tlačí Fed ke zvyšování sazeb.":macro.inflation<2?"Nízká inflace – prostor pro uvolnění měnové politiky.":"Inflace blízko cíle Fedu 2%."},
                {l:T.sectorYtd,v:pct(macro.sectorYtdPct),c:clr(macro.sectorYtdPct),tip:`Výkonnost sektoru od začátku roku. ${macro.sectorYtdPct>0?"Sektor roste – příznivé prostředí.":"Sektor klesá – sleduj fundamenty firmy."}`},
                {l:T.sp500Ytd,v:pct(macro.sp500YtdPct),c:clr(macro.sp500YtdPct),tip:`Výkonnost trhu od začátku roku. ${macro.sp500YtdPct>0?"Býčí trh – risk-on sentiment.":"Medvědí trh – investoři jsou opatrní."}`}
              ].map(({l,v,c,tip})=>(
                <div key={l} style={{background:C.card2,borderRadius:10,padding:"9px 11px",position:"relative",cursor:"help"}} title={tip}>
                  <div style={{color:C.muted,fontSize:9,textTransform:"uppercase",letterSpacing:1,marginBottom:2}}>{l} ℹ️</div>
                  <div style={{color:c||C.text,fontSize:15,fontWeight:800}}>{v}</div>
                  <div style={{color:C.muted,fontSize:10,marginTop:3,lineHeight:1.4}}>{tip}</div>
                </div>
              ))}
            </div>
            {(macro.sectorIndicators||[]).length>0&&<>
              <div style={{color:C.muted,fontSize:10,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>
                📡 {T.sectorIndicators}  {data.sector}
              </div>
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:6,marginBottom:10}}>
                {(macro.sectorIndicators||[]).map((ind,i)=>(
                  <div key={i} style={{background:C.card2,borderRadius:10,padding:"9px 12px",borderLeft:`3px solid ${ind.impact==="positive"?C.green:ind.impact==="negative"?C.red:C.yellow}`}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                      <div style={{color:C.muted,fontSize:9,textTransform:"uppercase",letterSpacing:1}}>{ind.name}</div>
                      <div style={{color:ind.impact==="positive"?C.green:ind.impact==="negative"?C.red:C.yellow,fontSize:9,fontWeight:700,background:(ind.impact==="positive"?C.green:ind.impact==="negative"?C.red:C.yellow)+"15",borderRadius:4,padding:"1px 6px"}}>
                        {ind.impact==="positive"?T.favorable:ind.impact==="negative"?T.unfavorable:T.neutral2}
                      </div>
                    </div>
                    <div style={{color:C.text,fontSize:13,fontWeight:800,marginBottom:2}}>{ind.value}</div>
                    <div style={{color:C.muted,fontSize:10,lineHeight:1.4}}>{ind.comment}</div>
                  </div>
                ))}
              </div>
            </>}
            {macro.outlook&&<div style={{background:C.card2,borderRadius:10,padding:"10px 12px",marginBottom:10,fontSize:11,color:C.muted,lineHeight:1.6}}>
              📋 <span style={{color:C.text,fontWeight:700}}>{T.macroOutlook} </span>{macro.outlook}
            </div>}
            <FearGreedMeter value={macro.sectorFearGreed} label={macro.sectorFearGreedLabel} stocks={macro.sectorTopStocks}/>
          </Card>
          <Card>
            <SectionTitle icon="📅" title={T.earningsCalendar} sub={T.earningsSub}/>
            <div style={{background:`linear-gradient(135deg,${C.blue}15,${C.purple}10)`,border:`1px solid ${C.blue}30`,borderRadius:14,padding:"16px 18px",marginBottom:12,textAlign:"center"}}>
              <div style={{color:C.blue,fontSize:12,fontWeight:700,marginBottom:4,textTransform:"uppercase",letterSpacing:1}}>{T.nextResults}</div>
              <div style={{color:C.text,fontSize:20,fontWeight:900,marginBottom:2}}>{ec.nextDate||"—"}</div>
              <div style={{color:C.muted,fontSize:12}}>{ec.quarter}</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:8,marginBottom:16}}>
              {[{l:T.estEPS,v:`${ccy} ${fmt(ec.estimatedEPS)}`},{l:T.estRev,v:`${fmt(ec.estimatedRevB)}B`},{l:T.prevSurprise,v:pct(ec.lastSurprisePct),c:clr(ec.lastSurprisePct)}].map(({l,v,c})=>(
                <div key={l} style={{background:C.card2,borderRadius:9,padding:"9px 11px"}}>
                  <div style={{color:C.muted,fontSize:9,textTransform:"uppercase",letterSpacing:1,marginBottom:2}}>{l}</div>
                  <div style={{color:c||C.text,fontSize:13,fontWeight:700}}>{v}</div>
                </div>
              ))}
            </div>
            {(data.earningsHistory||[]).length>0&&<>
              <div style={{color:C.muted,fontSize:10,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>{T.resultsHistory}</div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {(data.earningsHistory||[]).map((e,i)=>{
                  const epsBeat = e.actualEPS>e.estimatedEPS;
                  const revBeat = e.actualRevB>e.estimatedRevB;
                  const epsDiff = e.estimatedEPS?(((e.actualEPS-e.estimatedEPS)/Math.abs(e.estimatedEPS))*100):0;
                  const revDiff = e.estimatedRevB?(((e.actualRevB-e.estimatedRevB)/Math.abs(e.estimatedRevB))*100):0;
                  const bothBeat = epsBeat&&revBeat;
                  const bothMiss = !epsBeat&&!revBeat;
                  const badge = bothBeat?"BEAT":bothMiss?"MISS":"MIXED";
                  const badgeColor = bothBeat?C.green:bothMiss?C.red:C.yellow;
                  return <div key={i} style={{background:C.card2,borderRadius:10,padding:"10px 14px",border:`1px solid ${badgeColor}20`}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                      <div>
                        <span style={{color:C.text,fontWeight:800,fontSize:13}}>{e.quarter}</span>
                        <span style={{color:C.muted,fontSize:11,marginLeft:8}}>{e.date}</span>
                      </div>
                      <span style={{background:badgeColor+"20",color:badgeColor,border:`1px solid ${badgeColor}40`,borderRadius:6,padding:"2px 10px",fontSize:11,fontWeight:900}}>{badge}</span>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                      <div style={{background:C.bg,borderRadius:8,padding:"7px 10px"}}>
                        <div style={{color:C.muted,fontSize:9,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>EPS</div>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          <div>
                            <div style={{color:C.muted,fontSize:10}}>Očekáváno: <span style={{color:C.text}}>{ccy} {fmt(e.estimatedEPS)}</span></div>
                            <div style={{color:C.muted,fontSize:10}}>Skutečné: <span style={{color:epsBeat?C.green:C.red,fontWeight:700}}>{ccy} {fmt(e.actualEPS)}</span></div>
                          </div>
                          <div style={{color:epsBeat?C.green:C.red,fontWeight:800,fontSize:13}}>{epsDiff>=0?"+":""}{epsDiff.toFixed(1)}%</div>
                        </div>
                      </div>
                      <div style={{background:C.bg,borderRadius:8,padding:"7px 10px"}}>
                        <div style={{color:C.muted,fontSize:9,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Tržby</div>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          <div>
                            <div style={{color:C.muted,fontSize:10}}>Očekáváno: <span style={{color:C.text}}>{fmt(e.estimatedRevB)}B</span></div>
                            <div style={{color:C.muted,fontSize:10}}>Skutečné: <span style={{color:revBeat?C.green:C.red,fontWeight:700}}>{fmt(e.actualRevB)}B</span></div>
                          </div>
                          <div style={{color:revBeat?C.green:C.red,fontWeight:800,fontSize:13}}>{revDiff>=0?"+":""}{revDiff.toFixed(1)}%</div>
                        </div>
                      </div>
                    </div>
                  </div>;
                })}
              </div>
            </>}
          </Card>
        </div>

        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14,flexWrap:"wrap",gap:8}}>
            <SectionTitle icon="📈" title={T.priceChart} sub={T.priceChartSub}/>
            <div style={{display:"flex",gap:14,fontSize:11,color:C.muted}}>
              <span><span style={{display:"inline-block",width:14,height:2,background:C.blue,verticalAlign:"middle",marginRight:4}}/>Cena</span>
              <span><span style={{display:"inline-block",width:14,borderTop:`2px dashed ${C.purple}`,verticalAlign:"middle",marginRight:4}}/>Průměrný cíl</span>
              <span><span style={{display:"inline-block",width:14,height:8,background:C.green+"40",verticalAlign:"middle",marginRight:4}}/>Pásmo cílů (Low–High)</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={_priceChart} margin={{top:4,right:8,left:0,bottom:4}}>
              <defs>
                <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.blue} stopOpacity={.35}/><stop offset="95%" stopColor={C.blue} stopOpacity={0}/></linearGradient>
                <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.purple} stopOpacity={.2}/><stop offset="95%" stopColor={C.purple} stopOpacity={0}/></linearGradient>
                <linearGradient id="fvg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.green} stopOpacity={.15}/><stop offset="100%" stopColor={C.green} stopOpacity={.05}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
              <XAxis dataKey="date" tick={{fill:C.muted,fontSize:9}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:C.muted,fontSize:9}} axisLine={false} tickLine={false} domain={["auto","auto"]} width={52}/>
              <Tooltip content={<Tip/>}/>
              <Area type="monotone" dataKey="high" name="high" stroke="transparent" fill="url(#fvg)" connectNulls/>
              <Area type="monotone" dataKey="low" name="low" stroke={C.green} strokeWidth={1} strokeDasharray="4 2" fill="transparent" connectNulls/>
              <Area type="monotone" dataKey="actual" name="Cena" stroke={C.blue} strokeWidth={2.5} fill="url(#ag)" connectNulls={false} dot={false}/>
              <Area type="monotone" dataKey="predicted" name="Průměrný cíl" stroke={C.purple} strokeWidth={2} strokeDasharray="6 3" fill="url(#pg)" connectNulls dot={{fill:C.purple,r:3}}/>
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12}}>
          <Card>
            <SectionTitle icon="📊" title={T.sp500} sub={T.sp500Sub}/>
            <ResponsiveContainer width="100%" height={185}>
              <LineChart data={_compChart} margin={{top:4,right:8,left:0,bottom:4}}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                <XAxis dataKey="date" tick={{fill:C.muted,fontSize:9}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:C.muted,fontSize:9}} axisLine={false} tickLine={false} width={36}/>
                <Tooltip content={<Tip/>}/>
                <Line type="monotone" dataKey="Akcie" stroke={C.blue} strokeWidth={2.5} dot={false} connectNulls/>
                <Line type="monotone" dataKey="S&P 500" stroke={C.muted} strokeWidth={1.5} strokeDasharray="4 2" dot={false} connectNulls/>
                <Legend wrapperStyle={{fontSize:11}}/>
              </LineChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <SectionTitle icon="📉" title={T.peHistory} sub={T.peHistSub}/>
            <ResponsiveContainer width="100%" height={185}>
              <AreaChart data={peHistory} margin={{top:4,right:8,left:0,bottom:4}}>
                <defs><linearGradient id="yg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.yellow} stopOpacity={.3}/><stop offset="95%" stopColor={C.yellow} stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                <XAxis dataKey="year" tick={{fill:C.muted,fontSize:9}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:C.muted,fontSize:9}} axisLine={false} tickLine={false} width={32}/>
                <Tooltip content={<Tip/>}/>
                <Area type="monotone" dataKey="pe" name="P/E" stroke={C.yellow} strokeWidth={2.5} fill="url(#yg)" dot={{fill:C.yellow,r:4,strokeWidth:0}}/>
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12}}>
          <Card>
            <SectionTitle icon="⚖️" title={T.dcf} sub={T.dcfSub}/>
            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:8,marginBottom:12}}>
              {[{l:"Vnitřní hodnota",v:`${ccy} ${fmt(dcf.intrinsicValue)}`,big:true,tip:"Odhadovaná férová cena akcie dle DCF modelu – součet všech budoucích cash flow diskontovaných na dnešní hodnotu."},{l:"Upside/Downside",v:pct(dcf.upside),big:true,c:clr(dcf.upside||0),tip:"Rozdíl mezi vnitřní hodnotou a aktuální cenou. Kladné = akcie je podhodnocená."},{l:"WACC",v:`${fmt(dcf.wacc)}%`,tip:"Průměrné náklady kapitálu. Čím nižší WACC, tím vyšší vnitřní hodnota – firma levněji financuje růst."},{l:"Verdict",v:dcf.upside>15?"Podhodnocená":dcf.upside<-15?"Nadhodnocená":"Férová cena",c:dcf.upside>15?C.green:dcf.upside<-15?C.red:C.yellow}].map(({l,v,big,c,tip})=>(
                <DCFCard key={l} label={l} value={v} big={big} color={c} tip={tip}/>
              ))}
            </div>
            {dcf.intrinsicValue>0&&pr.current>0&&(()=>{
              const lo = Math.min(pr.current,dcf.intrinsicValue)*0.88;
              const hi = Math.max(pr.current,dcf.intrinsicValue)*1.12;
              const range = hi-lo;
              const curPct = ((pr.current-lo)/range*100).toFixed(1);
              const intrPct = ((dcf.intrinsicValue-lo)/range*100).toFixed(1);
              const undervalued = dcf.intrinsicValue>pr.current;
              return <div style={{marginBottom:12}}>
                <div style={{color:C.muted,fontSize:10,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>{T.currentVsIntrinsic}</div>
                <div style={{position:"relative",height:8,borderRadius:4,background:C.card2,marginBottom:24}}>
                  <div style={{position:"absolute",left:`${Math.min(parseFloat(curPct),parseFloat(intrPct))}%`,width:`${Math.abs(parseFloat(intrPct)-parseFloat(curPct))}%`,height:"100%",background:undervalued?C.green+"40":C.red+"40",borderRadius:4}}/>
                  <div style={{position:"absolute",left:`${curPct}%`,top:"50%",transform:"translate(-50%,-50%)"}}>
                    <div style={{width:14,height:14,borderRadius:"50%",background:C.blue,border:"2px solid #fff",boxShadow:`0 0 8px ${C.blue}80`}}/>
                    <div style={{position:"absolute",top:16,left:"50%",transform:"translateX(-50%)",whiteSpace:"nowrap",textAlign:"center"}}>
                      <div style={{color:C.blue,fontSize:10,fontWeight:800}}>{ccy} {fmt(pr.current)}</div>
                      <div style={{color:C.muted,fontSize:9}}>Aktuální</div>
                    </div>
                  </div>
                  <div style={{position:"absolute",left:`${intrPct}%`,top:"50%",transform:"translate(-50%,-50%)"}}>
                    <div style={{width:14,height:14,borderRadius:3,background:undervalued?C.green:C.red,border:"2px solid #fff",boxShadow:`0 0 8px ${undervalued?C.green:C.red}80`}}/>
                    <div style={{position:"absolute",top:16,left:"50%",transform:"translateX(-50%)",whiteSpace:"nowrap",textAlign:"center"}}>
                      <div style={{color:undervalued?C.green:C.red,fontSize:10,fontWeight:800}}>{ccy} {fmt(dcf.intrinsicValue)}</div>
                      <div style={{color:C.muted,fontSize:9}}>Férová cena</div>
                    </div>
                  </div>
                </div>
                <div style={{background:undervalued?C.green+"12":C.red+"12",border:`1px solid ${undervalued?C.green:C.red}25`,borderRadius:10,padding:"8px 12px",fontSize:11,color:C.muted,lineHeight:1.6}}>
                  💡 {undervalued?`Akcie se obchoduje s ${Math.abs(dcf.upside||0).toFixed(0)}% slevou oproti odhadované vnitřní hodnotě – potenciálně zajímavá příležitost.`:`Akcie se obchoduje s ${Math.abs(dcf.upside||0).toFixed(0)}% prémií nad odhadovanou vnitřní hodnotou – trh oceňuje budoucí růst.`}
                </div>
              </div>;
            })()}
            <div style={{display:"flex",gap:8,marginTop:4}}>
              {[{l:T.targetPrice,v:`${ccy} ${fmt(data.targetPrice)}`},{l:T.avgAnalysts,v:`${ccy} ${fmt(an.avgTarget)}`},{l:T.potential,v:pct(upPct),c:clr(upPct)}].map(({l,v,c})=>(
                <div key={l} style={{flex:1,background:C.card2,borderRadius:9,padding:"8px 10px"}}><div style={{color:C.muted,fontSize:9,textTransform:"uppercase",letterSpacing:1,marginBottom:2}}>{l}</div><div style={{color:c||C.text,fontSize:13,fontWeight:800}}>{v}</div></div>
              ))}
            </div>
            {(data.dcfSensitivity||[]).length>0&&<>
              <div style={{color:C.muted,fontSize:10,textTransform:"uppercase",letterSpacing:1,margin:"14px 0 8px"}}>{T.sensitivity}</div>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                  <thead>
                    <tr>
                      <th style={{color:C.muted,padding:"5px 8px",textAlign:"left",borderBottom:`1px solid ${C.border}`,fontWeight:600}}>WACC</th>
                      {(data.dcfSensitivity[0]?.growthRates||[]).map(g=>(
                        <th key={g} style={{color:C.muted,padding:"5px 8px",textAlign:"center",borderBottom:`1px solid ${C.border}`,fontWeight:600}}>Růst {g}%</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.dcfSensitivity.map((row,i)=>(
                      <tr key={i} style={{background:i%2===0?C.card2:"transparent"}}>
                        <td style={{padding:"5px 8px",fontWeight:700,color:C.blue}}>{row.wacc}%</td>
                        {(row.values||[]).map((v,j)=>{
                          const diff = pr.current?((v-pr.current)/pr.current*100):0;
                          return <td key={j} style={{padding:"5px 8px",textAlign:"center",color:diff>15?C.green:diff<-15?C.red:C.text,fontWeight:Math.abs(diff)<5?900:400}}>
                            {ccy} {fmt(v)}<div style={{color:diff>0?C.green:C.red,fontSize:9}}>{diff>0?"+":""}{diff.toFixed(0)}%</div>
                          </td>;
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>}
          </Card>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <Card style={{padding:16,flex:1}}>
              <h3 style={{margin:"0 0 10px",fontSize:14,fontWeight:800}}>📐 Technická Analýza</h3>
              <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(3,1fr)",gap:6}}>
                {[{l:"RSI",v:fmt(tc.rsi),c:tc.rsi>70?C.red:tc.rsi<30?C.green:C.text,tip:"RSI 0–100. Nad 70 = překoupeno (drahé). Pod 30 = přeprodáno (levné)."},{l:"MA 50",v:fmt(tc.ma50),tip:"Klouzavý průměr 50 dní. Cena nad MA50 = krátkodobý uptrend."},{l:"MA 200",v:fmt(tc.ma200),tip:"Klouzavý průměr 200 dní. Cena nad MA200 = dlouhodobý uptrend."},{l:"Support",v:fmt(tc.support),tip:"Úroveň kde akcie nacházela podporu (kupující vstupují)."},{l:"Resistance",v:fmt(tc.resistance),tip:"Úroveň kde akcie narážela na odpor (prodejci tlačí dolů)."}].map(({l,v,c,tip})=>(
                  <TechCard key={l} label={l} value={v} color={c} tip={tip}/>
                ))}
              </div>
            </Card>
            <Card style={{padding:16}}>
              <h3 style={{margin:"0 0 6px",fontSize:14,fontWeight:800}}>{T.analysts} ({totalA})</h3>
              <div style={{color:C.muted,fontSize:10,marginBottom:8,lineHeight:1.5}}>{T.analystsSub}</div>
              {totalA>0&&<><div style={{display:"flex",borderRadius:7,overflow:"hidden",marginBottom:6,height:18}}>
                {[{k:"buy",c:C.green},{k:"hold",c:C.yellow},{k:"sell",c:C.red}].map(({k,c})=>an[k]>0&&<div key={k} style={{flex:an[k],background:c,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800,color:"#000"}}>{an[k]}</div>)}
              </div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:10}}><span style={{color:C.green}}>{T.buy2} {an.buy}</span><span style={{color:C.yellow}}>{T.hold2} {an.hold}</span><span style={{color:C.red}}>{T.sell2} {an.sell}</span></div></>}
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr 1fr",gap:6}}>
                {[{l:"Low",v:fmt(an.lowTarget)},{l:"Průměr",v:fmt(an.avgTarget)},{l:"High",v:fmt(an.highTarget)}].map(({l,v})=>(
                  <div key={l} style={{background:C.card2,borderRadius:7,padding:"7px 9px"}}><div style={{color:C.muted,fontSize:9,marginBottom:1}}>{l}</div><div style={{color:C.text,fontSize:12,fontWeight:700}}>{ccy} {v}</div></div>
                ))}
              </div>
              <AnalystTargetChart current={pr.current} low={an.lowTarget} avg={an.avgTarget} high={an.highTarget} currency={ccy}/>
            </Card>
          </div>
        </div>

        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
            <SectionTitle icon="🧙‍♂️" title={T.buffett} sub={T.buffettSub}/>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{fontWeight:800,fontSize:22,color:buffPassed>=6?C.green:buffPassed>=4?C.yellow:C.red}}>{buffPassed}/{bc.length}</div>
              <div style={{background:buffPassed>=6?C.green+"20":buffPassed>=4?C.yellow+"20":C.red+"20",border:`1px solid ${buffPassed>=6?C.green:buffPassed>=4?C.yellow:C.red}40`,borderRadius:8,padding:"4px 12px",color:buffPassed>=6?C.green:buffPassed>=4?C.yellow:C.red,fontWeight:800,fontSize:13}}>{buffPassed>=6?T.strongChoice:buffPassed>=4?T.average:T.risky}</div>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:8}}>
            {bc.map((b,i)=>(
              <div key={i} style={{background:b.passed?C.green+"10":C.red+"08",border:`1px solid ${b.passed?C.green+"30":C.red+"20"}`,borderRadius:11,padding:"10px 14px",display:"flex",gap:10,alignItems:"flex-start"}}>
                <span style={{fontSize:16,flexShrink:0,marginTop:1}}>{b.passed?"✅":"❌"}</span>
                <div><div style={{fontWeight:700,fontSize:12,marginBottom:2,color:C.text}}>{b.criterion}</div><div style={{color:C.muted,fontSize:11,lineHeight:1.5}}>{b.note}</div></div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
            <SectionTitle icon="📅" title={T.annualResults} sub={`v miliardách ${ccy} · ${T.annualSub}`}/>
            <div style={{display:"flex",gap:4}}>
              {[["revenue",T.revenue],["netIncome",T.netIncome],["eps","EPS"]].map(([t,l])=><button key={t} onClick={()=>setFinTab(t)} style={tabSt(t)}>{l}</button>)}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <ComposedChart data={annuals} margin={{top:4,right:8,left:0,bottom:4}}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
              <XAxis dataKey="year" tick={{fill:C.muted,fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:C.muted,fontSize:10}} axisLine={false} tickLine={false} width={44}/>
              <Tooltip content={<Tip/>}/>
              {finTab==="revenue"&&<Bar dataKey="revB" name="Revenue (B)" fill={C.blue} radius={[5,5,0,0]}/>}
              {finTab==="revenue"&&<Line type="monotone" dataKey="estRevB" name="Odhad (B)" stroke={C.blue} strokeWidth={2} strokeDasharray="5 3" dot={{fill:C.blue,r:4,strokeWidth:0}} connectNulls/>}
              {finTab==="netIncome"&&<Bar dataKey="niB" name="Čistý zisk (B)" fill={C.green} radius={[5,5,0,0]}/>}
              {finTab==="netIncome"&&<Line type="monotone" dataKey="estNiB" name="Odhad zisku (B)" stroke={C.green} strokeWidth={2} strokeDasharray="5 3" dot={{fill:C.green,r:4,strokeWidth:0}} connectNulls/>}
              {finTab==="eps"&&<Line type="monotone" dataKey="eps" name="EPS" stroke={C.yellow} strokeWidth={3} dot={{fill:C.yellow,r:5,strokeWidth:0}}/>}
              {finTab==="eps"&&<Line type="monotone" dataKey="estEps" name="Odhad EPS" stroke={C.yellow} strokeWidth={2} strokeDasharray="5 3" dot={{fill:C.yellow,r:4,strokeWidth:0}} connectNulls/>}
            </ComposedChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionTitle icon="📆" title={T.quarterlyResults} sub={`${T.revenue} v miliardách ${ccy}`}/>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:16,alignItems:"start"}}>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={quarters} margin={{top:4,right:8,left:0,bottom:4}}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                <XAxis dataKey="q" tick={{fill:C.muted,fontSize:9}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:C.muted,fontSize:9}} axisLine={false} tickLine={false} width={38}/>
                <Tooltip content={<Tip/>}/>
                <Bar dataKey="revB" name="Revenue (B)" fill={C.cyan} radius={[5,5,0,0]}/>
                <Bar dataKey="niB" name="Čistý zisk (B)" fill={C.green} radius={[5,5,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead><tr>{[T.quarter,T.rev,T.profit,"EPS",T.yoy].map(h=><th key={h} style={{textAlign:"left",padding:"5px 8px",color:C.muted,fontSize:9,textTransform:"uppercase",fontWeight:600,borderBottom:`1px solid ${C.border}`}}>{h}</th>)}</tr></thead>
              <tbody>{quarters.map((q,i)=>(
                <tr key={i} style={{borderBottom:`1px solid ${C.border}20`}}>
                  <td style={{padding:"7px 8px",fontWeight:700,fontSize:11,color:C.text}}>{q.q}</td>
                  <td style={{padding:"7px 8px",color:C.muted}}>{fmt(q.revB)}</td>
                  <td style={{padding:"7px 8px",color:C.muted}}>{fmt(q.niB)}</td>
                  <td style={{padding:"7px 8px",fontWeight:600,color:C.text}}>{fmt(q.eps)}</td>
                  <td style={{padding:"7px 8px",color:clr(q.yoy||0),fontWeight:700}}>{pct(q.yoy)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </Card>

        <Card>
          <SectionTitle icon="🏁" title={T.competitors}/>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead><tr>{[T.ticker2,T.firm,"Market Cap","P/E",T.revGrowth,T.netMargin].map(h=><th key={h} style={{textAlign:"left",padding:"6px 10px",color:C.muted,fontSize:10,textTransform:"uppercase",fontWeight:600,borderBottom:`1px solid ${C.border}`}}>{h}</th>)}</tr></thead>
            <tbody>
              <tr style={{background:C.blue+"12",borderBottom:`1px solid ${C.border}30`}}>
                <td style={{padding:"8px 10px",fontWeight:900,color:C.blue}}>{data.ticker} ★</td>
                <td style={{padding:"8px 10px"}}>{data.name}</td>
                <td style={{padding:"8px 10px",color:C.muted}}>{pr.marketCap}</td>
                <td style={{padding:"8px 10px",fontWeight:600}}>{fmt(mx.pe)}</td>
                <td style={{padding:"8px 10px",color:clr(mx.revenueGrowthPct||0),fontWeight:700}}>{pct(mx.revenueGrowthPct)}</td>
                <td style={{padding:"8px 10px",color:clr(mx.netMargin||0),fontWeight:700}}>{pct(mx.netMargin)}</td>
              </tr>
              {competitors.filter(c=>c.ticker).map((c,i)=>(
                <tr key={i} style={{borderBottom:`1px solid ${C.border}15`}}>
                  <td style={{padding:"8px 10px",fontWeight:700,color:C.muted}}>{c.ticker}</td>
                  <td style={{padding:"8px 10px",color:C.muted}}>{c.name}</td>
                  <td style={{padding:"8px 10px",color:C.muted}}>{fmt(c.marketCapB)}B</td>
                  <td style={{padding:"8px 10px"}}>{fmt(c.pe)}</td>
                  <td style={{padding:"8px 10px",color:clr(c.revGrowthPct||0)}}>{pct(c.revGrowthPct)}</td>
                  <td style={{padding:"8px 10px",color:clr(c.netMarginPct||0)}}>{pct(c.netMarginPct)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card>
          <SectionTitle icon="🏦" title={T.insiders} sub={T.insiderSub}/>
          {insiders.filter(ins=>ins.name).length>0?(
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead><tr>{[T.name2,T.role,T.type2,T.shares,T.value2,T.date2].map(h=><th key={h} style={{textAlign:"left",padding:"6px 10px",color:C.muted,fontSize:10,textTransform:"uppercase",fontWeight:600,borderBottom:`1px solid ${C.border}`}}>{h}</th>)}</tr></thead>
              <tbody>{insiders.filter(ins=>ins.name).map((ins,i)=>(
                <tr key={i} style={{borderBottom:`1px solid ${C.border}15`}}>
                  <td style={{padding:"8px 10px",fontWeight:700}}>{ins.name}</td>
                  <td style={{padding:"8px 10px",color:C.muted,fontSize:11}}>{ins.role}</td>
                  <td style={{padding:"8px 10px"}}><span style={{background:ins.type==="buy"?C.green+"20":C.red+"20",color:ins.type==="buy"?C.green:C.red,borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:700}}>{ins.type==="buy"?"📈 Nákup":"📉 Prodej"}</span></td>
                  <td style={{padding:"8px 10px",color:C.muted}}>{ins.shares?.toLocaleString?.()}</td>
                  <td style={{padding:"8px 10px",color:C.muted}}>{ccy} {fmt(ins.valueM)}M</td>
                  <td style={{padding:"8px 10px",color:C.muted,fontSize:11}}>{ins.date}</td>
                </tr>
              ))}</tbody>
            </table>
          ):<p style={{color:C.muted,fontSize:13,margin:0}}>Žádné nedávné insider transakce nalezeny.</p>}
        </Card>

        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
            <SectionTitle icon="📰" title="Nejnovější Zprávy"/>
            {data.newsSummary&&<div style={{background:C.card2,borderRadius:10,padding:"12px 14px",marginBottom:12,fontSize:12,color:C.muted,lineHeight:1.7,borderLeft:`3px solid ${C.blue}`}}>
              <span style={{color:C.blue,fontWeight:700,fontSize:11,textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:4}}>📋 AI Shrnutí zpráv</span>
              {data.newsSummary}
            </div>}
            <div style={{display:"flex",gap:4}}>
              {[["all",T.all],["positive",T.pos],["negative",T.neg],["neutral",T.neu]].map(([v,l])=>(
                <button key={v} onClick={()=>setNewsFilter(v)} style={{background:newsFilter===v?sentClr(v==="all"?null:v)+"25":"transparent",border:`1px solid ${newsFilter===v?sentClr(v==="all"?null:v)+"50":C.border}`,color:newsFilter===v?sentClr(v==="all"?null:v):C.muted,borderRadius:8,padding:"5px 11px",fontSize:11,fontWeight:700,transition:"all .15s"}}>{l}</button>
              ))}
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {filtNews.map((n,i)=>{
              const hasUrl = n.url&&n.url.startsWith("http")&&n.url.length>15&&!n.url.endsWith("/")&&n.url.includes(".");
              const inner = (
                <div style={{display:"flex",justifyContent:"space-between",gap:10}}>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:12,marginBottom:3,display:"flex",alignItems:"center",gap:6,color:C.text}}>
                      {n.sentiment==="positive"?"📈":n.sentiment==="negative"?"📉":"📋"} {n.title}
                      {hasUrl&&<span style={{color:C.blue,fontSize:10,background:C.blue+"15",borderRadius:5,padding:"1px 6px",flexShrink:0}}>{T.read}</span>}
                    </div>
                    {n.summary&&<div style={{color:C.muted,fontSize:11,lineHeight:1.5}}>{n.summary}</div>}
                  </div>
                  <div style={{textAlign:"right",minWidth:62,color:C.muted,fontSize:10,flexShrink:0}}><div>{n.source}</div><div style={{marginTop:2}}>{n.date}</div></div>
                </div>
              );
              return hasUrl ? (
                <a key={i} href={n.url} target="_blank" rel="noopener noreferrer"
                  style={{background:sentClr(n.sentiment)+"0d",borderRadius:11,padding:"11px 14px",borderLeft:`4px solid ${sentClr(n.sentiment)}`,display:"block",cursor:"pointer",transition:"background .15s"}}
                  onMouseEnter={e=>e.currentTarget.style.background=sentClr(n.sentiment)+"1a"}
                  onMouseLeave={e=>e.currentTarget.style.background=sentClr(n.sentiment)+"0d"}>
                  {inner}
                </a>
              ) : (
                <div key={i} style={{background:sentClr(n.sentiment)+"0d",borderRadius:11,padding:"11px 14px",borderLeft:`4px solid ${sentClr(n.sentiment)}`}}>
                  {inner}
                </div>
              );
            })}
          </div>
        </Card>

        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12}}>
          <Card>
            <h3 style={{margin:"0 0 12px",fontSize:14,fontWeight:800,color:C.green}}>{T.catalysts}</h3>
            {catalysts.filter(c=>c).map((c,i)=><div key={i} style={{display:"flex",gap:8,marginBottom:7}}><span style={{color:C.green,fontSize:8,marginTop:5,flexShrink:0}}>●</span><span style={{color:C.muted,fontSize:12,lineHeight:1.5}}>{c}</span></div>)}
          </Card>
          <Card>
            <h3 style={{margin:"0 0 12px",fontSize:14,fontWeight:800,color:C.red}}>{T.risks}</h3>
            {risks.filter(r=>r).map((r,i)=><div key={i} style={{display:"flex",gap:8,marginBottom:7}}><span style={{color:C.red,fontSize:8,marginTop:5,flexShrink:0}}>●</span><span style={{color:C.muted,fontSize:12,lineHeight:1.5}}>{r}</span></div>)}
          </Card>
        </div>

        <div style={{background:`linear-gradient(135deg,${vc(data.verdict)}12,${C.card})`,border:`1px solid ${vc(data.verdict)}40`,borderRadius:18,padding:28,boxShadow:`0 0 40px ${vc(data.verdict)}10`}}>
          <div style={{display:"flex",gap:24,alignItems:"flex-start",flexWrap:"wrap"}}>
            <div style={{textAlign:"center",minWidth:100}}>
              <div style={{width:86,height:86,borderRadius:"50%",margin:"0 auto 10px",background:vc(data.verdict)+"20",border:`3px solid ${vc(data.verdict)}`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 20px ${vc(data.verdict)}30`}}>
                <span style={{fontSize:24,fontWeight:900,color:vc(data.verdict)}}>{(data.score||5).toFixed(1)}</span>
              </div>
              <div style={{color:vc(data.verdict),fontWeight:900,fontSize:18}}>{data.verdict||"DRŽET"}</div>
              <div style={{color:C.muted,fontSize:10,marginTop:2}}>AI Skóre / 10</div>
            </div>
            <div style={{flex:1,minWidth:260}}>
              <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
                {[{l:"Cílová cena",v:`${ccy} ${fmt(data.targetPrice)}`},{l:"Potenciál",v:pct(upPct),c:clr(upPct)},{l:"Horizont",v:"12 měsíců"}].map(({l,v,c})=>(
                  <div key={l} style={{background:C.bg,borderRadius:9,padding:"8px 14px"}}><div style={{color:C.muted,fontSize:10}}>{l}</div><div style={{fontWeight:900,fontSize:15,color:c||C.text}}>{v}</div></div>
                ))}
              </div>
              <div style={{background:C.bg,borderRadius:12,padding:"14px 16px",marginBottom:14}}>
                <div style={{color:C.muted,fontSize:10,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Investiční teze</div>
                <p style={{color:C.muted,fontSize:12,margin:0,lineHeight:1.8}}>{data.investmentThesis}</p>
              </div>
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:14}}>
                <div><div style={{color:C.green,fontWeight:800,fontSize:11,marginBottom:7}}>✅ Proč koupit</div>{data.pros?.filter(p=>p).map((p,i)=><div key={i} style={{color:C.muted,fontSize:11,marginBottom:5,display:"flex",gap:5}}><span style={{color:C.green,flexShrink:0}}>+</span>{p}</div>)}</div>
                <div><div style={{color:C.red,fontWeight:800,fontSize:11,marginBottom:7}}>❌ Proč ne</div>{data.cons?.filter(c=>c).map((c,i)=><div key={i} style={{color:C.muted,fontSize:11,marginBottom:5,display:"flex",gap:5}}><span style={{color:C.red,flexShrink:0}}>−</span>{c}</div>)}</div>
              </div>
            </div>
          </div>
        </div>

        <p style={{color:C.muted,fontSize:10,textAlign:"center",lineHeight:1.6}}>📡 Data: Live web search · ⚠️ {T.disclaimer}</p>
      </div>
    </div>
  );
}