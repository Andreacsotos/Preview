import { useState, useRef, useEffect } from "react";
import { askOpenAI } from "../lib/openai";
import { storeBanner, registerBannerSW } from "../lib/bannerSW";
import { Sidebar } from "./Sidebar";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutGrid, Folder, Users, CheckSquare, Bell, ArrowLeft,
  Send, Wand2, Check, Folder as FolderIcon, Building2,
  Paperclip, FileCode, Film, FolderUp, Palette, Loader2,
} from "lucide-react";
import { readPsd, initializeCanvas } from "ag-psd";
import { UserMenu, HelpButton } from "./TopBarComponents";

// ag-psd necesita una fábrica de canvas para renderizar el composite/artboards en el navegador
if (typeof document !== "undefined") {
  initializeCanvas((width: number, height: number) => {
    const c = document.createElement("canvas");
    c.width = width; c.height = height;
    return c as any;
  });
}
import { HtmlBannerFrame } from "./HtmlBannerFrame";
import { Orb } from "./Orb";
import { CoverTemplateMini, COVER_TEMPLATES } from "./CoverSlide";

export type AssetKind = "image" | "video" | "design" | "html" | "htmlbanner";
export interface AICreatedAsset { id: string; name: string; url: string; type: AssetKind; brand?: string; campaign?: string; format: string; dim: string; ar: number }

// formatos permitidos: Photoshop (.psd), Illustrator (.ai), Figma (.fig), png, jpg, mp4 (mpeg-4), html
function assetKind(f: File): AssetKind | null {
  const n = f.name.toLowerCase();
  if (/\.(png|jpe?g)$/.test(n) || f.type.startsWith("image/")) return "image";
  if (/\.(mp4|m4v)$/.test(n) || f.type === "video/mp4") return "video";
  if (/\.(psd|ai|fig)$/.test(n)) return "design";
  if (/\.html?$/.test(n) || f.type === "text/html") return "html";
  return null;
}

const MIME_MAP: Record<string, string> = {
  ttf: "font/ttf", otf: "font/otf",
  woff: "font/woff", woff2: "font/woff2",
  eot: "application/vnd.ms-fontobject",
  js: "text/javascript", json: "application/json",
  svg: "image/svg+xml", png: "image/png",
  jpg: "image/jpeg", jpeg: "image/jpeg",
  gif: "image/gif", webp: "image/webp",
  mp4: "video/mp4",
};

function fileToDataUrl(f: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
    const mime = MIME_MAP[ext] || f.type || "application/octet-stream";
    const r = new FileReader();
    r.onload = () => {
      const result = r.result as string;
      // override MIME type in data URL if FileReader used wrong one
      const fixed = result.replace(/^data:[^;]+;/, `data:${mime};`);
      resolve(fixed);
    };
    r.onerror = reject;
    r.readAsDataURL(f);
  });
}

const ENABLER_STUB = `<script>(function(){var cbs={};var EV={INIT:'init',VISIBLE:'visible',PAGE_LOADED:'page_loaded',EXIT:'exit',INTERACTION:'interaction',HIDDEN:'hidden',FULLSCREEN_SUPPORT:'fullscreen_support',FULLSCREEN_EXPAND_START:'fs_es',FULLSCREEN_EXPAND_FINISH:'fs_ef',FULLSCREEN_COLLAPSE_START:'fs_cs',FULLSCREEN_COLLAPSE_FINISH:'fs_cf',ORIENTATION:'orientation'};window.studio={events:{StudioEvent:new Proxy(EV,{get:function(t,p){return p in t?t[p]:String(p);}}),StudioRuntimeEvent:{}},common:{}};var base={isInitialized:function(){return true;},isVisible:function(){return true;},isPageLoaded:function(){return true;},isServingInLiveEnvironment:function(){return false;},addEventListener:function(t,fn){(cbs[t]=cbs[t]||[]).push(fn);setTimeout(function(){try{fn({});}catch(e){}},0);},removeEventListener:function(){},getUrl:function(u){return u;},getParameter:function(){return '';},getDevDinamicContent:function(){return null;}};window.Enabler=new Proxy(base,{get:function(t,p){return p in t?t[p]:function(){return undefined;};}});})();<\/script>`;

let _bannerId = 0;

async function buildHtmlBanner(htmlFile: File, groupFiles: File[], dir: string): Promise<{ url: string; w: number; h: number }> {
  const id = `b${++_bannerId}-${Date.now()}`;

  // Store all files in Service Worker so the iframe can load them normally
  const swFiles: { path: string; file: File }[] = [];
  for (const f of groupFiles) {
    const rel = (f as any).webkitRelativePath as string | undefined;
    const path = rel && dir && rel.startsWith(dir + "/") ? rel.slice(dir.length + 1) : f.name;
    swFiles.push({ path, file: f });
  }
  // Also store the HTML file itself
  swFiles.push({ path: "index.html", file: htmlFile });
  await storeBanner(id, swFiles);

  // Read HTML and only patch the Enabler stub — let the SW serve all assets normally
  let html = await htmlFile.text();
  html = html.split("https://s0.2mdn.net/ads/studio/Enabler.js").join("data:text/javascript,");
  html = html.split("http://s0.2mdn.net/ads/studio/Enabler.js").join("data:text/javascript,");
  if (/<head[^>]*>/i.test(html)) html = html.replace(/<head[^>]*>/i, (m) => m + ENABLER_STUB);
  else html = ENABLER_STUB + html;

  // Store the patched HTML under the same banner ID
  const patchedHtmlBlob = new Blob([html], { type: "text/html" });
  const patchedHtmlFile = new File([patchedHtmlBlob], "index.html", { type: "text/html" });
  await storeBanner(id, [{ path: "index.html", file: patchedHtmlFile }, ...swFiles.filter(f => f.path !== "index.html")]);

  // Detect dimensions from HTML or folder name
  let w = 0, h = 0;
  const meta = html.match(/width\s*=\s*(\d+)\s*,\s*height\s*=\s*(\d+)/i);
  if (meta) { w = +meta[1]; h = +meta[2]; }

  return { url: `/banner-preview/${id}/index.html`, w, h };
}

// ─── Segmentación por estructura de carpetas: Marca > Campaña > Formato > anuncios ──
// El "Formato" es la carpeta inmediata que contiene el archivo.
function segment(pathParts: string[], fileName: string): { brand?: string; campaign?: string; format: string } {
  if (pathParts.length >= 1) {
    const format = pathParts[pathParts.length - 1];
    const campaign = pathParts.length >= 2 ? pathParts[pathParts.length - 2] : undefined;
    const brand = pathParts.length >= 3 ? pathParts[pathParts.length - 3] : undefined;
    return { brand, campaign, format };
  }
  // archivos sueltos (sin carpeta): inferir por tamaño en el nombre, si no "Sin clasificar"
  if (/\d{2,4}\s*[xX×]\s*\d{2,4}/.test(fileName)) return { format: "Display" };
  return { format: "Sin clasificar" };
}
function parseDims(fileName: string, type: AssetKind): { dim: string; ar: number } {
  const m = fileName.match(/(\d{2,4})\s*[xX×]\s*(\d{2,4})/);
  if (m) { const w = +m[1], h = +m[2]; return { dim: `${w}×${h}`, ar: w / h }; }
  if (type === "video") return { dim: "1920×1080", ar: 16 / 9 };
  return { dim: "1080×1080", ar: 1 };
}

// Lee un PSD y extrae cada mesa de trabajo (artboard) como imagen PNG
async function parsePsdArtboards(file: File): Promise<{ name: string; url: string; dim: string; ar: number }[]> {
  const buf = await file.arrayBuffer();
  const psd = readPsd(buf, { skipThumbnail: true });
  const composite: HTMLCanvasElement | undefined = psd.canvas;
  const base = file.name.replace(/\.psd$/i, "");
  const out: { name: string; url: string; dim: string; ar: number }[] = [];

  // Recolectar artboards recursivamente (ag-psd los marca con layer.artboard.rect)
  const artboards: any[] = [];
  const walk = (nodes: any[]) => {
    for (const n of nodes) {
      if (n && n.artboard && n.artboard.rect) artboards.push(n);
      if (n && Array.isArray(n.children)) walk(n.children);
    }
  };
  walk(psd.children ?? []);

  const cropToUrl = (left: number, top: number, w: number, h: number, src: HTMLCanvasElement) => {
    const cv = document.createElement("canvas");
    cv.width = w; cv.height = h;
    cv.getContext("2d")!.drawImage(src, left, top, w, h, 0, 0, w, h);
    return cv.toDataURL("image/png");
  };

  if (artboards.length && composite) {
    artboards.forEach((ab: any, i: number) => {
      const r = ab.artboard.rect;
      const left = Math.round(Math.max(0, r.left)), top = Math.round(Math.max(0, r.top));
      const w = Math.round(r.right - r.left), h = Math.round(r.bottom - r.top);
      if (w <= 0 || h <= 0) return;
      // preferir el canvas propio del artboard si ag-psd lo generó, si no recortar del composite
      const url = ab.canvas && ab.canvas.width ? ab.canvas.toDataURL("image/png") : cropToUrl(left, top, w, h, composite);
      out.push({ name: ab.name || `${base} — Mesa ${i + 1}`, url, dim: `${w}×${h}`, ar: w / h });
    });
  }
  // si no hay artboards (o no se pudo), usar el lienzo completo como una sola imagen
  if (!out.length && composite) {
    out.push({ name: base, url: composite.toDataURL("image/png"), dim: `${composite.width}×${composite.height}`, ar: composite.width / composite.height });
  }
  return out;
}

interface Props {
  onBack: () => void;
  onCreateCampaign: (data: { name: string; brand: string; formats: string[]; assets: AICreatedAsset[]; date?: string; round?: string; template?: string }) => void;
  onCreateBrand: (data: { name: string; industry: string }) => void;
  dark: boolean;
  setDark: (v: boolean) => void;
}

const ACCENT = "#2c6bf2";

type Msg = { role: "user" | "bot"; text?: string; chips?: { label: string; value: string }[]; summary?: Summary; attachments?: AICreatedAsset[]; multiFormats?: boolean; templatePicker?: boolean };
type Summary = { type: "campaña"; name: string; brand: string; formats: string[]; date?: string; round?: string; template?: string } | { type: "marca"; name: string; industry: string };

type Stage =
  | "intent" | "dudas"
  | "c_name" | "c_brand" | "c_date" | "c_round" | "c_template" | "c_upload" | "c_done"
  | "b_name" | "b_industry" | "b_done";

function renderMd(text: string, dark: boolean) {
  const lines = text.split("\n").filter((l) => l.trim() !== "");
  return lines.map((line, i) => {
    const numMatch = line.match(/^(\d+)\.\s+\*\*(.+?)\*\*:?\s*(.*)/);
    if (numMatch) return (
      <div key={i} className="flex gap-2 mt-1.5 first:mt-0">
        <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5" style={{ background: "rgba(44,107,242,0.15)", color: "#2c6bf2" }}>{numMatch[1]}</span>
        <span><strong className="font-semibold">{numMatch[2]}</strong>{numMatch[3] ? `: ${numMatch[3]}` : ""}</span>
      </div>
    );
    const parts = line.split(/\*\*(.+?)\*\*/g);
    const rendered = parts.map((p, j) => j % 2 === 1 ? <strong key={j} className="font-semibold">{p}</strong> : p);
    return <p key={i} className={i > 0 ? "mt-1.5" : ""}>{rendered}</p>;
  });
}

const dpick = (...opts: string[]) => opts[Math.floor(Math.random() * opts.length)];

const DOUBTS: { test: (q: string) => boolean; answer: () => string }[] = [
  { test: (q) => /crear|nueva campa|empezar campa/.test(q),        answer: () => "Para crear una campaña puedes decirme aquí \"crea una campaña para [marca]\" y te guío, o sube una carpeta con tus assets y la armo automáticamente detectando los formatos." },
  { test: (q) => /compartir|link|enviar.*cliente|mandar.*cliente/. test(q), answer: () => "Dentro de la campaña hay un botón \"Compartir\" — genera un link único. Tu cliente lo abre, ve el preview y comenta sin necesitar cuenta." },
  { test: (q) => /aprob|rechaz|estado.*campa/.test(q),             answer: () => "En la sección Aprobaciones ves el estado de cada campaña: Pendientes y Aprobadas. El cliente aprueba o pide cambios desde su link y el estado se actualiza al instante." },
  { test: (q) => /integraci|cor\b|slack|drive|figma|conectar/.test(q), answer: () => "En Ajustes → Integraciones puedes conectar COR, Slack, Google Drive y Figma con un clic." },
  { test: (q) => /ajuste|perfil|configuraci|cuenta|settings/.test(q), answer: () => dpick(
    "Los ajustes están en el menú izquierdo, abajo del todo — el ícono de tu perfil. Desde ahí entras a Perfil, Cuenta, Apariencia, Notificaciones y Privacidad.",
    "Para ir a ajustes: en el sidebar izquierdo, clic en tu nombre (Andrea Camila) abajo del todo → se abre el menú → seleccionas \"Ajustes\".",
  )},
  { test: (q) => /tema|oscuro|claro|apariencia/.test(q),           answer: () => "El toggle claro/oscuro está en el sidebar izquierdo, debajo de Ayuda. También en Ajustes → Apariencia." },
  { test: (q) => /psd|photoshop|html|banner|formato|archivo|png|mp4|video/.test(q), answer: () => "Acepto PNG, JPG, MP4, HTML5, PSD e Illustrator. Si subes un PSD con mesas de trabajo, extraigo cada una. Si subes una carpeta de banner HTML5, lo monto listo para previsualizar." },
  { test: (q) => /\bmarca\b|marcas|cliente nuevo/.test(q),         answer: () => "En la sección Marcas ves todos tus clientes. Puedes crear una nueva diciéndome aquí \"crea una marca\" o con el botón en la sección." },
  { test: (q) => /aprobaci.*campa|campa.*aprobaci/.test(q),        answer: () => "Cuando el cliente aprueba desde su link de preview, la campaña pasa a Aprobadas en la sección Aprobaciones. Si pide cambios, queda en Pendientes con su comentario." },
];

let doubtLastTopic: string | null = null;
const DOUBT_ELABORATIONS: Record<string, string> = {
  ajuste: "En Ajustes tienes 5 secciones: Perfil (tu nombre, foto y rol), Cuenta (email y contraseña), Apariencia (tema claro u oscuro), Notificaciones (qué alertas quieres recibir) y Privacidad y seguridad (2FA y sesiones activas). ¿Cuál te interesa?",
  aprob: "Más detallado: en el menú izquierdo clic en \"Aprobaciones\". Ves las campañas en dos columnas. El cliente recibe un link (desde \"Compartir\" en la campaña), abre ese link, ve todos los assets y tiene botones de Aprobar o Solicitar cambios. Al dar clic, el estado cambia aquí al instante.",
  compartir: "Paso a paso: abre la campaña → arriba a la derecha hay un botón azul \"Compartir\" → genera un link → copiás ese link → se lo mandás al cliente por donde quieras → el cliente lo abre en cualquier navegador sin registrarse.",
};

function getDoubtAnswer(q: string): string {
  const norm = q.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  const isConfused = /no entend|sigo sin|no me queda|no comprend|perdon|puedes explicar|mas detalle|como asi/.test(norm);
  const isFollowUp = /(pero que|y que|y alli|y ahi|que (hay|tiene|puedo|opciones|encuentro|contiene)|que mas (hay|tiene)|como se usa|para que sirve|como funciona|y eso que|que incluye|que trae)/.test(norm);
  if ((isConfused || isFollowUp) && doubtLastTopic) return DOUBT_ELABORATIONS[doubtLastTopic] ?? "¿Me puedes contar un poco más sobre qué parte no te quedó clara?";

  for (const d of DOUBTS) {
    if (d.test(norm)) {
      // guardar topic para follow-up
      if (/ajuste|perfil|configuraci/.test(norm)) doubtLastTopic = "ajuste";
      else if (/aprob|rechaz/.test(norm)) doubtLastTopic = "aprob";
      else if (/compartir|link/.test(norm)) doubtLastTopic = "compartir";
      return d.answer();
    }
  }
  return dpick(
    "Mmm, no entendí bien. ¿Me puedes contar un poco más? Puedo ayudarte con campañas, marcas, aprobaciones, ajustes, integraciones o formatos.",
    "No tengo eso muy claro. Pregúntame sobre cómo usar alguna parte específica de la plataforma.",
    "¿Puedes darme más contexto? No quiero darte una respuesta que no sirva.",
  );
}

const FORMAT_OPTIONS = ["Meta", "Display Ads", "PMax", "Stories", "Otro"];
const INDUSTRIES = ["Retail", "Bebidas", "Tech", "Deportes", "Moda", "Otro"];
const KNOWN_BRANDS = ["Éxito", "Homecenter", "Diageo", "ATT", "Postobón", "Novobanco", "Unisys"];

// Extrae intención, nombre y marca de una frase libre (lenguaje natural)
function extractIntent(text: string): { type?: "campaña" | "marca"; name?: string; brand?: string } {
  const low = text.toLowerCase();
  const hasCamp = /campa(ñ|n)a/.test(low);
  const hasMarca = /\bmarca\b/.test(low);
  const type = hasCamp ? "campaña" : hasMarca ? "marca" : undefined;

  // nombre: "que se llame X" / "llamada X" / "se llama X" / "nombre X" / 'titulada "X"'
  let name: string | undefined;
  const nm = text.match(/(?:que se llamen?|que se llame|se llaman?|llamad[oa]s?|titulad[oa]s?|nombre|con nombre)\s+["'«]?([^"'»]+?)["'»]?\s*$/i);
  if (nm) name = nm[1].trim();

  // marca: por nombre conocido o "para (la) marca X"
  let brand: string | undefined;
  for (const b of KNOWN_BRANDS) {
    const norm = b.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (low.includes(b.toLowerCase()) || low.normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(norm)) { brand = b; break; }
  }
  if (!brand) {
    const bm = text.match(/(?:para (?:la )?marca|de (?:la )?marca|marca)\s+([A-Za-zÁÉÍÓÚáéíóúñÑ0-9 ]+?)(?:\s+que\b|\s+con\b|\s+llamad|\s+y\b|[,.]|$)/i);
    if (bm) brand = bm[1].trim();
  }
  return { type, name, brand };
}

export function Frame02gCreateAI({ onBack, onCreateCampaign, onCreateBrand, dark, setDark }: Props) {
  const T = {
    page: dark ? "#161619" : "#ffffff",     // tarjetas / composer
    surface: dark ? "#0a0a0c" : "#f9fafb",  // fondo general (más oscuro y neutro)
    border: dark ? "#26262b" : "#f0f0f2",
    text: dark ? "#f4f5f7" : "#111827",
    sub: dark ? "#9a9aa3" : "#9ca3af",
    hover: dark ? "#222227" : "#f3f4f6",
    inputBg: dark ? "#222227" : "#f3f4f6",
  };

  const [messages, setMessages] = useState<Msg[]>([
    { role: "bot", text: "¡Hola Andrea! ✨ Soy tu asistente de creación. Puedo ayudarte a crear una campaña o una marca conversando. ¿Qué quieres crear?", chips: [{ label: "📁 Una campaña", value: "campaña" }, { label: "🏷️ Una marca", value: "marca" }] },
  ]);
  const [stage, setStage] = useState<Stage>("intent");
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [creating, setCreating] = useState<"campaña" | "marca" | null>(null);
  const [draft, setDraft] = useState<{ name?: string; brand?: string; formats: string[]; industry?: string; date?: string; round?: string; template?: string }>({ formats: [] });
  const [assets, setAssets] = useState<AICreatedAsset[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const valid: AICreatedAsset[] = [];
    let rejected = 0;
    const rejectedNames: string[] = [];
    let psdBoards = 0;
    let psdFailed = 0;
    let banners = 0;
    const uid = () => `a-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const all = Array.from(files);

    // ── 1) Detectar banners HTML5 agrupando por la carpeta que contiene el HTML ──
    // Para cada archivo .html, su carpeta contenedora es el "banner root".
    // Todos los archivos dentro de esa carpeta (y subcarpetas) pertenecen al mismo banner.
    const htmlFiles = all.filter((f) => {
      const rel = (f as any).webkitRelativePath as string | undefined;
      if (!rel) return /\.html?$/i.test(f.name);
      const parts = rel.split("/");
      return /\.html?$/i.test(parts[parts.length - 1]);
    });
    // Prefer index.html over other html files within the same folder
    const htmlByDir = new Map<string, File>();
    for (const f of htmlFiles) {
      const rel = (f as any).webkitRelativePath as string ?? f.name;
      const parts = rel.split("/");
      const dir = parts.length > 1 ? parts.slice(0, -1).join("/") : "";
      if (!htmlByDir.has(dir) || f.name.toLowerCase() === "index.html") {
        htmlByDir.set(dir, f);
      }
    }
    const consumed = new Set<File>();
    for (const [bannerDir, htmlFile] of htmlByDir) {
      // Group: all files whose path starts with bannerDir/
      const groupFiles = bannerDir
        ? all.filter((f) => {
            const rel = (f as any).webkitRelativePath as string | undefined;
            return rel && (rel === `${bannerDir}/${htmlFile.name}` || rel.startsWith(`${bannerDir}/`));
          })
        : [htmlFile];
      if (!groupFiles.length) continue;
      try {
        const { url, w, h } = await buildHtmlBanner(htmlFile, groupFiles, bannerDir);
        const folderName = bannerDir.split("/").pop() || htmlFile.name.replace(/\.html?$/i, "");
        const m = folderName.match(/(\d{2,4})\s*[xX×]\s*(\d{2,4})/);
        const W = m ? +m[1] : (w || 300), H = m ? +m[2] : (h || 250);
        const parts = bannerDir.split("/");
        const brand = parts.length >= 3 ? parts[parts.length - 3] : undefined;
        const campaign = parts.length >= 2 ? parts[parts.length - 2] : undefined;
        valid.push({ id: uid(), name: folderName, url, type: "htmlbanner", brand, campaign, format: "HTML5", dim: `${W}×${H}`, ar: W / H });
        groupFiles.forEach((f) => consumed.add(f));
        banners++;
      } catch { /* si falla, los archivos caen al flujo normal */ }
    }

    // ── 2) Archivos restantes (sueltos o no parte de un banner) ──
    for (const f of all) {
      if (consumed.has(f)) continue;
      if (/^\./.test(f.name)) continue; // silently skip hidden/system files (.DS_Store, etc.)
      const t = assetKind(f);
      if (!t) { rejected++; rejectedNames.push(f.name); continue; }
      const relPath = (f as any).webkitRelativePath as string | undefined;
      const pathParts = relPath ? relPath.split("/").slice(0, -1) : [];
      const { brand, campaign, format } = segment(pathParts, f.name);
      // PSD → extraer mesas de trabajo como imágenes
      if (/\.psd$/i.test(f.name)) {
        try {
          const boards = await parsePsdArtboards(f);
          if (boards.length) {
            boards.forEach((b) => valid.push({ id: uid(), name: b.name, url: b.url, type: "image", brand, campaign, format, dim: b.dim, ar: b.ar }));
            psdBoards += boards.length;
          } else {
            psdFailed++;
          }
        } catch (err) {
          console.error("PSD parse error:", err);
          psdFailed++;
        }
        continue; // nunca empujar el .psd crudo (no es renderizable)
      }
      const { dim, ar } = parseDims(f.name, t);
      valid.push({ id: uid(), name: f.name, url: URL.createObjectURL(f), type: t, brand, campaign, format, dim, ar });
    }
    if (valid.length) {
      setAssets((a) => [...a, ...valid]);
      const isFolder = valid.some((v) => (v as any).campaign) || valid.length > 3;
      setMessages((m) => [...m, { role: "user", text: valid.length === 1 ? "Subí 1 archivo" : `Subí ${valid.length} archivos`, attachments: valid }]);
      // resumen por formato (manteniendo orden de aparición)
      const counts: Record<string, number> = {};
      const order: string[] = [];
      valid.forEach((v) => { if (!(v.format in counts)) order.push(v.format); counts[v.format] = (counts[v.format] ?? 0) + 1; });
      const breakdown = order.map((p) => `• ${counts[p]} en ${p}`).join("\n");
      const ctx = valid[0]?.brand && valid[0]?.campaign ? ` (${valid[0].brand} › ${valid[0].campaign})` : "";
      const psdNote = psdBoards > 0 ? `\n• ${psdBoards} mesa${psdBoards !== 1 ? "s" : ""} de trabajo extraída${psdBoards !== 1 ? "s" : ""} del PSD.` : "";
      const bannerNote = banners > 0 ? `\n• ${banners} banner${banners !== 1 ? "s" : ""} HTML5 montado${banners !== 1 ? "s" : ""}.` : "";
      const header = isFolder
        ? `¡Listo! Organicé tus ${valid.length} assets${ctx}:`
        : `¡Recibido! ${valid.length} asset${valid.length !== 1 ? "s" : ""} guardado${valid.length !== 1 ? "s" : ""}:`;
      const uploadMsg = `${header}\n${breakdown}${psdNote}${bannerNote}`;
      botSay({ role: "bot", text: uploadMsg + (stage === "c_upload" ? " ¿Subimos más o continuamos?" : " Puedes seguir subiendo o continuar.") }, 600);
    }
    if (psdFailed) botSay({ role: "bot", text: `No pude extraer las mesas de trabajo de ${psdFailed} PSD. Asegúrate de que el archivo use la función de Mesas de trabajo (Artboards) de Photoshop, o expórtalo como PNG.` }, 700);
    if (rejected) {
      const names = rejectedNames.slice(0, 4).join(", ") + (rejectedNames.length > 4 ? ` y ${rejectedNames.length - 4} más` : "");
      botSay({ role: "bot", text: `Ignoré ${rejected} archivo${rejected !== 1 ? "s" : ""} que no son compatibles: ${names}. Solo acepto PNG, JPG, MP4, HTML5 y PSD.` }, 500);
    }
  };

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages, typing]);
  useEffect(() => { registerBannerSW().catch(() => {}); }, []);

  const started = messages.some((m) => m.role === "user");

  const botSay = (msg: Msg, delay = 600) => {
    setTyping(true);
    setTimeout(() => { setMessages((m) => [...m, msg]); setTyping(false); }, delay);
  };

  const startDoubts = () => {
    setStage("dudas");
    setMessages((m) => [...m, { role: "user", text: "Tengo una duda" }]);
    botSay({ role: "bot", text: "¡Claro! Pregúntame lo que necesites sobre la plataforma: campañas, marcas, aprobaciones, integraciones, formatos de archivo, el tema… ¿En qué te ayudo?" });
  };

  const navItems = [
    { icon: LayoutGrid, label: "Dashboard", active: false, onClick: onBack },
    { icon: Folder, label: "Campañas", active: false, onClick: undefined },
    { icon: Users, label: "Marcas", active: false, onClick: undefined },
    { icon: CheckSquare, label: "Aprobaciones", active: false, onClick: undefined },
    { icon: Wand2, label: "Crear con IA", active: true, onClick: undefined },
  ];

  // ── conversational engine ──────────────────────────────────────────────
  const handle = (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    const low = text.toLowerCase();

    switch (stage) {
      case "dudas": {
        setTyping(true);
        const history = [...messages, { role: "user" as const, text }].map((m) => ({
          role: m.role === "bot" ? "assistant" as const : "user" as const,
          content: m.text ?? "",
        }));
        askOpenAI(history)
          .then((reply) => { setMessages((m) => [...m, { role: "bot", text: reply }]); })
          .catch(() => { setMessages((m) => [...m, { role: "bot", text: "Tuve un problema de conexión. Intenta de nuevo." }]); })
          .finally(() => setTyping(false));
        break;
      }
      case "intent": {
        const ex = extractIntent(text);
        const folderFormats = [...new Set(assets.filter((a) => a.format && a.format !== "Sin clasificar").map((a) => a.format))];
        if (ex.type === "campaña") {
          const nm = ex.name, br = ex.brand;
          setDraft((d) => ({ ...d, name: nm ?? d.name, brand: br ?? d.brand }));
          if (!nm) {
            setStage("c_name");
            botSay({ role: "bot", text: "¡Genial! Vamos a crear una campaña 📁 ¿Cómo se va a llamar?" });
          } else if (!br) {
            setStage("c_brand");
            botSay({ role: "bot", text: `Perfecto, "${nm}". ¿Para qué marca es?`, chips: KNOWN_BRANDS.map((b) => ({ label: b, value: b })) });
          } else {
            setStage("c_date");
            botSay({ role: "bot", text: `Perfecto, "${nm}" para ${br} 👌 ¿Cuál es la fecha de entrega?`, chips: [{ label: "Sin fecha por ahora", value: "—" }] });
          }
        } else if (ex.type === "marca") {
          const nm = ex.name;
          setDraft((d) => ({ ...d, name: nm ?? d.name }));
          if (!nm) {
            setStage("b_name");
            botSay({ role: "bot", text: "¡Perfecto! Creemos una marca 🏷️ ¿Cuál es el nombre de la marca?" });
          } else {
            setStage("b_industry");
            botSay({ role: "bot", text: `"${nm}" 🏷️ ¿En qué industria está?`, chips: INDUSTRIES.map((i) => ({ label: i, value: i })) });
          }
        } else {
          botSay({ role: "bot", text: "¿Quieres crear una campaña o una marca?", chips: [{ label: "📁 Una campaña", value: "campaña" }, { label: "🏷️ Una marca", value: "marca" }] });
        }
        break;
      }
      // ── Campaign flow ──
      case "c_name": {
        setDraft((d) => ({ ...d, name: text }));
        setStage("c_brand");
        botSay({ role: "bot", text: `"${text}" — me gusta. ¿Para qué marca es esta campaña?`, chips: KNOWN_BRANDS.map((b) => ({ label: b, value: b })) });
        break;
      }
      case "c_brand": {
        setDraft((d) => ({ ...d, brand: text }));
        setStage("c_date");
        botSay({ role: "bot", text: `Perfecto, "${text}" 👌 ¿Cuál es la fecha de entrega? Puedes escribirla como quieras (ej. "15 de julio" o "15/07/2025") o saltar este paso.`, chips: [{ label: "Sin fecha por ahora", value: "—" }] });
        break;
      }
      case "c_date": {
        setDraft((d) => ({ ...d, date: text === "—" ? undefined : text }));
        setStage("c_round");
        botSay({ role: "bot", text: "¿En qué ronda de revisión están?", chips: [{ label: "Ronda 1", value: "Ronda 1" }, { label: "Ronda 2", value: "Ronda 2" }, { label: "Ronda 3", value: "Ronda 3" }, { label: "Sin ronda", value: "—" }] });
        break;
      }
      case "c_round": {
        setDraft((d) => ({ ...d, round: text === "—" ? undefined : text }));
        setStage("c_template");
        botSay({ role: "bot", text: "¿Qué plantilla de portada prefieres para el preview que verá el cliente? Estas son las opciones:", templatePicker: true });
        break;
      }
      case "c_template": {
        setDraft((d) => ({ ...d, template: text }));
        // si ya hay assets de una carpeta, los formatos vienen en su estructura → no preguntar
        const folderFormats2 = [...new Set(assets.filter((a) => a.format && a.format !== "Sin clasificar").map((a) => a.format))];
        if (assets.length && folderFormats2.length) {
          setDraft((d) => ({ ...d, formats: folderFormats2 }));
          setStage("c_done");
          botSay({ role: "bot", text: `Plantilla "${text}" ✓ Detecté los formatos desde tu carpeta: ${folderFormats2.join(", ")}. Aquí va el resumen:` });
          botSay({ role: "bot", summary: { type: "campaña", name: draft.name!, brand: draft.brand!, formats: folderFormats2, date: draft.date, round: draft.round, template: text } }, 1100);
        } else {
          setStage("c_upload");
          botSay({ role: "bot", text: `Plantilla "${text}" ✓ Ahora sube tus anuncios. Puedes subir archivos sueltos o una carpeta completa — yo los organizo automáticamente.` });
        }
        break;
      }
      case "c_formats": {
        if (low.includes("list") || low.includes("continu") || low.includes("ya")) {
          proceedFormats();
        } else {
          const match = FORMAT_OPTIONS.find((f) => f.toLowerCase() === low);
          if (match) toggleFormat(match);
        }
        break;
      }
      case "c_upload": {
        if (low.includes("list") || low.includes("continu") || low.includes("omit") || low.includes("sin asset") || low.includes("despues")) {
          proceedUpload();
        }
        break;
      }
      // ── Brand flow ──
      case "b_name": {
        setDraft((d) => ({ ...d, name: text }));
        setStage("b_industry");
        botSay({ role: "bot", text: `"${text}" 🏷️ ¿En qué industria está?`, chips: INDUSTRIES.map((i) => ({ label: i, value: i })) });
        break;
      }
      case "b_industry": {
        setDraft((d) => ({ ...d, industry: text }));
        setStage("b_done");
        botSay({ role: "bot", summary: { type: "marca", name: draft.name!, industry: text } });
        break;
      }
    }
  };

  const toggleFormat = (f: string) => {
    setDraft((d) => ({ ...d, formats: d.formats.includes(f) ? d.formats.filter((x) => x !== f) : [...d.formats, f] }));
  };

  const proceedFormats = () => {
    setStage("c_upload");
    botSay({ role: "bot", text: "¡Perfecto! Ahora sube tus anuncios 👆 Puedes arrastrar archivos aquí o usar el botón de adjuntar. Acepto PNG, JPG, MP4 y HTML5." });
  };

  const proceedUpload = () => {
    setStage("c_done");
    setDraft((d) => {
      botSay({ role: "bot", summary: { type: "campaña", name: d.name!, brand: d.brand!, formats: d.formats, date: d.date, round: d.round, template: d.template } });
      return d;
    });
  };

  const confirmCreate = (s: Summary) => {
    if (creating) return;
    setCreating(s.type);
    // breve estado de "creando" para dar feedback antes de navegar
    setTimeout(() => {
      if (s.type === "campaña") onCreateCampaign({ name: s.name, brand: s.brand, formats: s.formats, assets, date: s.date, round: s.round, template: s.template });
      else onCreateBrand({ name: s.name, industry: s.industry });
    }, 1800);
  };

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');`}</style>
      <div className="flex h-screen w-full overflow-hidden" style={{ fontFamily: "'Roboto', sans-serif", background: T.surface }}>

        <input ref={fileRef} type="file" multiple accept=".psd,.ai,.fig,.png,.jpg,.jpeg,.mp4,.m4v,.html,.htm,image/png,image/jpeg,video/mp4,text/html" className="hidden"
          onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }} />
        <input ref={folderRef} type="file" multiple className="hidden"
          {...({ webkitdirectory: "" } as React.InputHTMLAttributes<HTMLInputElement>)}
          onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }} />

        <Sidebar active="assistant" dark={dark} setDark={setDark} />
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* TOP BAR */}
          <div className="flex items-center gap-2.5 px-8 py-4 border-b" style={{ background: T.page, borderColor: T.border }}>
            <Orb size={26} dark={dark} />
            <span className="text-[15px] font-semibold" style={{ color: T.text }}>Asistente</span>
            <div className="flex-1" />
            <button className="relative p-2 rounded-lg cursor-pointer" style={{ color: T.text }} onMouseEnter={(e) => (e.currentTarget.style.background = T.hover)} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              <Bell size={15} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
            </button>
          </div>

          {/* ── WELCOME STATE ── */}
          {!started ? (
            <div className="flex-1 flex flex-col items-center justify-center px-6" style={{ background: T.surface }}>
              <div className="w-full max-w-2xl flex flex-col items-center">
                {/* orb */}
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="mb-6"
                >
                  <Orb size={68} active={typing} dark={dark} />
                </motion.div>
                <h1 className="text-[26px] font-semibold tracking-tight text-center mb-1.5" style={{ color: T.text }}>
                  ¡Hola Andrea! Soy tu asistente
                </h1>
                <p className="text-[14px] text-center mb-8" style={{ color: T.sub }}>
                  ¿Qué quieres hacer hoy? Elige una opción o escríbeme directamente.
                </p>

                {/* option cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full mb-5">
                  {[
                    { icon: FolderIcon, color: "#2c6bf2", title: "Crear campaña", desc: "Arma una campaña o sube tus assets y los organizo.", onClick: () => handle("campaña") },
                    { icon: Building2, color: "#8B5CF6", title: "Crear marca", desc: "Registra una nueva marca paso a paso.", onClick: () => handle("marca") },
                    { icon: Wand2, color: "#00C566", title: "Resolver dudas", desc: "Pregúntame cómo usar la plataforma.", onClick: startDoubts },
                  ].map(({ icon: Icon, color, title, desc, onClick }) => (
                    <motion.button
                      key={title}
                      whileHover={{ y: -3 }}
                      onClick={onClick}
                      className="rounded-2xl p-4 text-left cursor-pointer transition-colors"
                      style={{ background: T.page, border: `1px solid ${T.border}` }}
                    >
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${color}1f` }}>
                        <Icon size={17} style={{ color }} />
                      </div>
                      <p className="text-[13px] font-semibold mb-0.5" style={{ color: T.text }}>{title}</p>
                      <p className="text-[12px] leading-snug" style={{ color: T.sub }}>{desc}</p>
                    </motion.button>
                  ))}
                </div>

                {/* composer */}
                <div className="w-full rounded-3xl px-4 pt-3.5 pb-2.5" style={{ background: T.page, border: `1px solid ${T.border}`, boxShadow: dark ? "0 4px 24px rgba(0,0,0,0.3)" : "0 6px 28px rgba(0,0,0,0.07)" }}>
                  <input
                    autoFocus
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handle(input); }}
                    placeholder="Escríbeme lo que necesitas..."
                    className="w-full bg-transparent outline-none text-[14px] px-1 mb-1 placeholder:text-gray-500"
                    style={{ color: T.text }}
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <button onClick={() => fileRef.current?.click()} title="Subir archivos (PNG, JPG, MP4, HTML, PSD…)"
                        className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all" style={{ color: T.sub }} onMouseEnter={(e) => (e.currentTarget.style.background = T.hover)} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                        <Paperclip size={16} />
                      </button>
                      <button onClick={() => folderRef.current?.click()} title="Subir carpeta"
                        className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all" style={{ color: T.sub }} onMouseEnter={(e) => (e.currentTarget.style.background = T.hover)} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                        <FolderUp size={16} />
                      </button>
                    </div>
                    <button onClick={() => handle(input)} disabled={!input.trim()}
                      className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-all shrink-0 disabled:opacity-30"
                      style={{ background: input.trim() ? `linear-gradient(135deg, ${ACCENT}, #5b7cf0)` : (dark ? "#3a3a44" : "#e5e7eb") }}>
                      <Send size={15} style={{ color: "#fff" }} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
          /* ── CHAT ── */
          <div ref={scrollRef} className="flex-1 overflow-y-auto" style={{ background: T.surface }}>
            <div className="max-w-2xl mx-auto px-6 py-8 space-y-4">
              {messages.map((m, i) => (
                <div key={i}>
                  <div className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} gap-2.5`}>
                    {m.role === "bot" && (
                      <div className="mt-0.5"><Orb size={30} dark={dark} /></div>
                    )}
                    <div className="max-w-[75%]">
                      {m.text && (
                        <div className="rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed"
                          style={m.role === "user"
                            ? { background: dark ? "rgba(44,107,242,0.2)" : "rgba(44,107,242,0.1)", color: dark ? "#dbe4ff" : "#1e40af", borderBottomRightRadius: 4 }
                            : { background: T.page, color: T.text, border: `1px solid ${T.border}`, borderBottomLeftRadius: 4 }}>
                          {m.role === "bot" ? renderMd(m.text, dark) : m.text}
                        </div>
                      )}
                      {/* attachments — grouped by Formato */}
                      {m.attachments && (() => {
                        const groups: Record<string, AICreatedAsset[]> = {};
                        const order: string[] = [];
                        m.attachments.forEach((a) => { if (!(a.format in groups)) { groups[a.format] = []; order.push(a.format); } groups[a.format].push(a); });
                        const ctx = m.attachments[0]?.brand && m.attachments[0]?.campaign ? `${m.attachments[0].brand} › ${m.attachments[0].campaign}` : null;
                        return (
                          <div className="mt-2 space-y-3">
                            {ctx && <p className="text-[11px] font-medium" style={{ color: T.sub }}>📁 {ctx}</p>}
                            {order.map((fmt) => (
                              <div key={fmt} className="rounded-2xl p-3" style={{ background: T.page, border: `1px solid ${T.border}` }}>
                                <div className="flex items-center gap-2 mb-2.5">
                                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: ACCENT }} />
                                  <span className="text-[12px] font-semibold" style={{ color: T.text }}>{fmt}</span>
                                  <span className="text-[11px]" style={{ color: T.sub }}>{groups[fmt].length} anuncio{groups[fmt].length !== 1 ? "s" : ""}</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {groups[fmt].map((a) => {
                                    if (a.type === "htmlbanner") {
                                      const [bw, bh] = a.dim.split("×").map(Number);
                                      const tileW = 200, scale = tileW / (bw || 300);
                                      return (
                                        <div key={a.id} className="rounded-lg overflow-hidden" style={{ border: `1px solid ${T.border}`, width: tileW }} title={`${a.name} · ${a.dim}`}>
                                          <div style={{ width: tileW, height: (bh || 250) * scale, overflow: "hidden", position: "relative", background: "#fff" }}>
                                            <HtmlBannerFrame src={a.url} title={a.name}
                                              style={{ width: bw || 300, height: bh || 250, transform: `scale(${scale})`, transformOrigin: "top left", pointerEvents: "none" }} />
                                          </div>
                                          <p className="text-[9px] truncate px-1.5 py-1" style={{ color: T.sub }}>{a.name} · {a.dim}</p>
                                        </div>
                                      );
                                    }
                                    return (
                                      <div key={a.id} className="rounded-lg overflow-hidden" style={{ border: `1px solid ${T.border}`, width: 78 }} title={`${a.name} · ${a.dim}`}>
                                        <div className="h-16 flex items-center justify-center relative" style={{ background: T.hover }}>
                                          {a.type === "image" ? <img src={a.url} alt={a.name} className="w-full h-full object-cover" />
                                            : a.type === "video" ? <Film size={18} style={{ color: T.sub }} />
                                            : a.type === "design" ? <Palette size={18} style={{ color: T.sub }} />
                                            : <FileCode size={18} style={{ color: T.sub }} />}
                                        </div>
                                        <p className="text-[9px] truncate px-1.5 py-1" style={{ color: T.sub }}>{a.name}</p>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                      {/* selector visual de plantillas de portada */}
                      {m.templatePicker && (
                        <div className="grid grid-cols-2 gap-2.5 mt-2.5" style={{ maxWidth: 360 }}>
                          {COVER_TEMPLATES.map((t) => (
                            <button
                              key={t.id}
                              onClick={() => stage === "c_template" && handle(t.label)}
                              disabled={stage !== "c_template"}
                              className="rounded-xl p-2 cursor-pointer transition-all text-left hover:brightness-105 disabled:cursor-default disabled:opacity-70"
                              style={{ background: T.page, border: `1px solid ${T.border}` }}
                            >
                              <CoverTemplateMini id={t.id} accent={ACCENT} />
                              <span className="block text-center mt-1.5" style={{ fontSize: "11px", fontWeight: 500, color: T.text }}>{t.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {/* chips */}
                      {m.chips && (
                        <div className="flex flex-wrap gap-2 mt-2.5">
                          {m.chips.map((c) => (
                            <button key={c.value} onClick={() => handle(c.value)}
                              className="px-3.5 py-1.5 rounded-full text-[12px] font-medium cursor-pointer transition-all hover:brightness-105"
                              style={{ background: T.page, border: `1px solid ${T.border}`, color: T.text }}>
                              {c.label}
                            </button>
                          ))}
                        </div>
                      )}
                      {/* multi-select formats */}
                      {m.multiFormats && stage === "c_formats" && (
                        <div className="mt-2.5">
                          <div className="flex flex-wrap gap-2 mb-3">
                            {FORMAT_OPTIONS.map((f) => {
                              const sel = draft.formats.includes(f);
                              return (
                                <button key={f} onClick={() => toggleFormat(f)}
                                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-medium cursor-pointer transition-all"
                                  style={sel
                                    ? { background: "rgba(44,107,242,0.12)", border: `1px solid ${ACCENT}`, color: ACCENT }
                                    : { background: T.page, border: `1px solid ${T.border}`, color: T.text }}>
                                  {sel && <Check size={12} />} {f}
                                </button>
                              );
                            })}
                          </div>
                          <button onClick={proceedFormats} disabled={draft.formats.length === 0}
                            className="px-4 py-2 rounded-xl text-[13px] font-medium cursor-pointer transition-all disabled:opacity-40"
                            style={{ background: dark ? "#f4f5f7" : "#111114", color: dark ? "#111114" : "#fff" }}>
                            Continuar {draft.formats.length > 0 && `(${draft.formats.length})`}
                          </button>
                        </div>
                      )}
                      {/* upload step CTA */}
                      {stage === "c_upload" && messages[messages.length - 1] === m && (
                        <div className="mt-3 flex items-center gap-2 flex-wrap">
                          <button onClick={() => fileRef.current?.click()}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium cursor-pointer transition-all"
                            style={{ background: ACCENT, color: "#fff" }}>
                            Subir archivos
                          </button>
                          <button onClick={() => folderRef.current?.click()}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium cursor-pointer transition-all"
                            style={{ background: T.page, border: `1px solid ${T.border}`, color: T.text }}>
                            Subir carpeta
                          </button>
                          <button onClick={proceedUpload}
                            className="px-4 py-2 rounded-xl text-[13px] cursor-pointer transition-all"
                            style={{ color: T.sub }}>
                            Omitir por ahora
                          </button>
                        </div>
                      )}
                      {/* summary card */}
                      {m.summary && (
                        <div className="rounded-2xl p-5 mt-1" style={{ background: T.page, border: `1px solid ${T.border}` }}>
                          <div className="flex items-center gap-2.5 mb-4">
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(44,107,242,0.12)" }}>
                              {m.summary.type === "campaña" ? <FolderIcon size={16} style={{ color: ACCENT }} /> : <Building2 size={16} style={{ color: ACCENT }} />}
                            </div>
                            <div>
                              <p className="text-[11px] uppercase tracking-wide font-semibold" style={{ color: T.sub }}>Nueva {m.summary.type}</p>
                              <p className="text-[15px] font-semibold" style={{ color: T.text }}>{m.summary.name}</p>
                            </div>
                          </div>
                          <div className="space-y-2 mb-4">
                            {m.summary.type === "campaña" ? (
                              <>
                                <Row T={T} label="Marca" value={m.summary.brand} />
                                {m.summary.date && <Row T={T} label="Entrega" value={m.summary.date} />}
                                {m.summary.round && <Row T={T} label="Revisión" value={m.summary.round} />}
                                {m.summary.template && <Row T={T} label="Portada" value={m.summary.template} />}
                                <Row T={T} label="Formatos" value={m.summary.formats.length ? m.summary.formats.join(", ") : "Por definir"} />
                                <Row T={T} label="Assets" value={assets.length ? `${assets.length} archivo${assets.length !== 1 ? "s" : ""}` : "Sin assets aún"} />
                              </>
                            ) : (
                              <Row T={T} label="Industria" value={m.summary.industry} />
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => confirmCreate(m.summary!)} disabled={!!creating}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-white text-[13px] font-medium cursor-pointer hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-default disabled:hover:brightness-100"
                              style={{ background: ACCENT }}>
                              {creating ? (
                                <><Loader2 size={14} className="animate-spin" /> Creando {m.summary.type}…</>
                              ) : (
                                <><Check size={14} /> Crear {m.summary.type}</>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {typing && (
                <div className="flex justify-start items-center gap-2.5">
                  <Orb size={30} active dark={dark} />
                  <span className="text-[13px]" style={{ color: T.sub }}>Pensando…</span>
                </div>
              )}
            </div>
          </div>
          )}

          {/* INPUT (only while chatting) */}
          {started && (
            <div className="px-6 py-4" style={{ background: T.surface }}>
              <div className="max-w-2xl mx-auto rounded-3xl px-4 pt-3 pb-2.5" style={{ background: T.page, border: `1px solid ${T.border}`, boxShadow: dark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 6px 24px rgba(0,0,0,0.07)" }}>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handle(input); }}
                  placeholder="Escribe tu respuesta..."
                  className="w-full bg-transparent outline-none text-[14px] px-1 mb-1 placeholder:text-gray-500"
                  style={{ color: T.text }}
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button onClick={() => fileRef.current?.click()} title="Subir archivos"
                      className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all" style={{ color: T.sub }} onMouseEnter={(e) => (e.currentTarget.style.background = T.hover)} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                      <Paperclip size={16} />
                    </button>
                    <button onClick={() => folderRef.current?.click()} title="Subir carpeta"
                      className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all" style={{ color: T.sub }} onMouseEnter={(e) => (e.currentTarget.style.background = T.hover)} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                      <FolderUp size={16} />
                    </button>
                  </div>
                  <button onClick={() => handle(input)} disabled={!input.trim()}
                    className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-all shrink-0 disabled:opacity-30"
                    style={{ background: input.trim() ? `linear-gradient(135deg, ${ACCENT}, #5b7cf0)` : (dark ? "#3a3a44" : "#e5e7eb") }}>
                    <Send size={15} style={{ color: "#fff" }} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* overlay "creando…" mientras se confirma la campaña/marca */}
        <AnimatePresence>
          {creating && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5"
              style={{ background: dark ? "rgba(10,10,12,0.85)" : "rgba(255,255,255,0.88)", backdropFilter: "blur(8px)" }}>
              <Orb size={84} active dark={dark} />
              <div className="text-center">
                <p className="text-[16px] font-semibold" style={{ color: T.text }}>
                  Creando tu {creating}…
                </p>
                <p className="text-[13px] mt-1" style={{ color: T.sub }}>
                  {creating === "campaña" ? "Organizando assets y preparando el preview" : "Guardando la información de la marca"}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

function Row({ T, label, value }: { T: any; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[12px]" style={{ color: T.sub }}>{label}</span>
      <span className="text-[13px] font-medium" style={{ color: T.text }}>{value}</span>
    </div>
  );
}
