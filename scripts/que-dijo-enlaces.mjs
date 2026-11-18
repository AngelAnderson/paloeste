// Enlaces de prueba de ¿Qué dijo? (18 nov 2026). Cada enlace da 30 días sin tope en el navegador que lo abre
// y marca lo que esa persona haga con su etiqueta (columna cid de registro_events).
// Uso (la llave entra por el ambiente, nunca por argumento ni a la pantalla):
//   LLAVE=$(grep '^SUPABASE_SERVICE_ROLE_KEY=' .env.local | cut -d= -f2- | tr -d '"')
//   SUPABASE_SERVICE_ROLE_KEY="$LLAVE" node scripts/que-dijo-enlaces.mjs angel prueba-1 prueba-2 prueba-3
// Tiene que ser la misma llave que usa producción; si no, el enlace no da pase (se prueba abriéndolo).
import { createHmac } from "node:crypto";

const llave = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!llave) {
  console.error("Falta SUPABASE_SERVICE_ROLE_KEY en el ambiente.");
  process.exit(1);
}
const secreto = createHmac("sha256", llave).update("que-dijo-v1").digest("hex");
for (const etiqueta of process.argv.slice(2)) {
  if (!/^[a-z0-9-]{2,20}$/.test(etiqueta)) {
    console.error(`Etiqueta no válida (minúsculas, números y guion, 2 a 20): ${etiqueta}`);
    continue;
  }
  const firma = createHmac("sha256", secreto).update(`prueba|${etiqueta}`).digest("hex").slice(0, 12);
  console.log(`${etiqueta}\thttps://www.paloeste.com/que-dijo?prueba=${etiqueta}.${firma}`);
}
