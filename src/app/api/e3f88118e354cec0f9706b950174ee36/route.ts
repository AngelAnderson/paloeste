// Llave del protocolo IndexNow — pública POR DISEÑO (así se verifica el dominio).
// syndication-indexnow (Vecinoai) usa keyLocation https://paloeste.com/api/<key>;
// el archivo viejo /71add5d5....txt en public/ estaba en el root, no en /api, y por
// eso los 1,131 pings de paloeste llevaban 422 desde que existe la función.
export async function GET() {
  return new Response('e3f88118e354cec0f9706b950174ee36', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, s-maxage=86400' },
  })
}
