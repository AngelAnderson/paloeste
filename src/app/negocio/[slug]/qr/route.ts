import { NextRequest, NextResponse } from "next/server";
import { SITE_URL } from "@/lib/constants";

// Simple QR code SVG generator (no external dependencies)
function generateQrSvg(url: string, size: number = 200): string {
  // Use a simple text-based QR placeholder with the URL
  // For production, this would use a proper QR library
  // For now, generate a clean SVG with the URL and branding
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size + 40}" height="${size + 100}" viewBox="0 0 ${size + 40} ${size + 100}">
    <rect width="100%" height="100%" fill="white"/>
    <rect x="10" y="10" width="${size + 20}" height="${size + 20}" rx="12" fill="#f4f4f5" stroke="#e4e4e7" stroke-width="1"/>
    <text x="${(size + 40) / 2}" y="${size / 2 + 10}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="14" font-weight="bold" fill="#18181b">QR CODE</text>
    <text x="${(size + 40) / 2}" y="${size / 2 + 30}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10" fill="#71717a">${url}</text>
    <text x="${(size + 40) / 2}" y="${size + 55}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="13" font-weight="900" fill="#dc2626">PAL' OESTE</text>
    <text x="${(size + 40) / 2}" y="${size + 72}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="#71717a">Búscanos en paloeste.com</text>
    <text x="${(size + 40) / 2}" y="${size + 88}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="#71717a">Bot WhatsApp: *787-417-7711</text>
  </svg>`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const url = `${SITE_URL}/negocio/${slug}`;
  const svg = generateQrSvg(url);

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
