// Testimonios de clientes: GET devuelve la lista, POST agrega uno.
// Se guardan en Netlify Blobs (almacén "testimonios", clave "lista").
// Para borrar uno: Netlify > tu sitio > Blobs > testimonios > lista.
import { getStore } from "@netlify/blobs";

const MAX = 500;
const limpia = (s, n) => String(s ?? "").replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, n);

export default async (req) => {
  const store = getStore("testimonios");
  if (req.method === "GET") {
    const lista = (await store.get("lista", { type: "json" })) || [];
    return Response.json(lista, { headers: { "cache-control": "no-store" } });
  }
  if (req.method === "POST") {
    let b;
    try { b = await req.json(); } catch { return new Response("JSON inválido", { status: 400 }); }
    if (b.web) return Response.json({ ok: true }); // trampa para robots
    const estrellas = parseInt(b.estrellas, 10);
    const t = {
      id: limpia(b.id, 40).replace(/[^a-z0-9]/gi, "") || crypto.randomUUID(),
      nombre: limpia(b.nombre, 40),
      resena: limpia(b.resena, 400),
      producto: limpia(b.producto, 60).replace(/[^a-z0-9-]/g, ""),
      estrellas,
      fecha: new Date().toISOString(),
    };
    if (!t.nombre || t.resena.length < 3 || !(estrellas >= 1 && estrellas <= 5)) {
      return new Response("Faltan datos", { status: 400 });
    }
    const lista = (await store.get("lista", { type: "json" })) || [];
    if (!lista.some((x) => x.id === t.id)) lista.unshift(t);
    await store.setJSON("lista", lista.slice(0, MAX));
    return Response.json(t, { status: 201 });
  }
  return new Response("Método no permitido", { status: 405 });
};

export const config = { path: "/api/testimonios" };
