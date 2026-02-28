/**
 * Google Tag Manager e Meta Pixel só são carregados em PRODUÇÃO.
 * Em desenvolvimento não injetam scripts, evitando erros de permissão de tráfego.
 */
export function initAnalytics() {
  if (import.meta.env.DEV) return

  // Google Tag Manager
  const gtmId = 'GTM-M72RRSP8'
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' })
  const gtmScript = document.createElement('script')
  gtmScript.async = true
  gtmScript.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`
  document.head.appendChild(gtmScript)

  // Meta Pixel
  const pixelId = '3172404862939663'
  const fbevents = 'https://connect.facebook.net/en_US/fbevents.js'
  const n = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments) }
  if (!window.fbq) window.fbq = n
  if (!window._fbq) window._fbq = n
  n.push = n
  n.loaded = true
  n.version = '2.0'
  n.queue = []
  const fbScript = document.createElement('script')
  fbScript.async = true
  fbScript.src = fbevents
  document.head.appendChild(fbScript)
  window.fbq('init', pixelId)
  window.fbq('track', 'PageView')
}
