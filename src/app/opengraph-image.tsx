import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = "Pal' Oeste — El directorio del oeste de Puerto Rico"
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#1c1917',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ fontSize: 96, fontWeight: 900, color: '#ffffff' }}>
          Pal&apos; Oeste
        </div>
        <div style={{ fontSize: 32, color: '#d6d3d1', marginTop: 20 }}>
          El directorio del oeste de Puerto Rico
        </div>
        <div style={{ fontSize: 20, color: '#78716c', marginTop: 80 }}>
          CaboRojo.com · Angel Anderson · 787-417-7711
        </div>
      </div>
    ),
    { ...size }
  )
}
