import { redirect } from 'next/navigation'

// Puerta única: /admin aterriza en HOY (las 6 Bandejas + termómetro + alarmas).
// El antiguo Command Center (RevenueDashboard rico) vive ahora en /admin/revenue.
export default function AdminHome() {
  redirect('/admin/hoy')
}
