// Google Tag Manager utility
// Usa o dataLayer do GTM para enviar eventos

// Inicializar dataLayer se não existir
if (typeof window !== 'undefined') {
  window.dataLayer = window.dataLayer || []
}

// Função helper para compatibilidade (usa dataLayer do GTM)
const gtagHelper = (...args) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    // Se for chamado como gtag('event', 'eventName', {...})
    if (args[0] === 'event' && args[1]) {
      window.dataLayer.push({
        event: args[1],
        ...args[2]
      })
    } else {
      // Outros formatos de chamada
      window.dataLayer.push(...args)
    }
  }
}

// Exportar como gtag para compatibilidade
export const gtag = gtagHelper

// Inicializar GTM (já inicializado no index.html)
export const initGA = () => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: 'page_view',
      page_path: window.location.pathname + window.location.search,
    })
  }
}

// Eventos personalizados via GTM
export const trackEvent = (eventName, eventParams = {}) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    const eventData = {
      event: eventName,
      ...eventParams
    }
    window.dataLayer.push(eventData)
  }
}

// Eventos específicos do checkout
export const trackCheckoutStep = (step, planName = null, planValue = null) => {
  trackEvent('checkout_step', {
    step_number: step,
    step_name: step === 1 ? 'selecao_plano' : step === 2 ? 'dados_pessoais' : 'pagamento',
    plan_name: planName,
    plan_value: planValue,
  })
}

export const trackPlanSelection = (planName, planId, planValue) => {
  trackEvent('select_plan', {
    plan_name: planName,
    plan_id: planId,
    value: planValue,
    currency: 'BRL',
  })
}

export const trackFormSubmission = (formType, formData = {}) => {
  trackEvent('form_submit', {
    form_type: formType,
    ...formData,
  })
}

export const trackButtonClick = (buttonName, location) => {
  trackEvent('button_click', {
    button_name: buttonName,
    location: location,
  })
}

export const trackConversion = (conversionType, value = null, currency = 'BRL') => {
  trackEvent('conversion', {
    conversion_type: conversionType,
    value: value,
    currency: currency,
  })
}

