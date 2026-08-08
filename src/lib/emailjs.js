import emailjs from '@emailjs/browser'

// Fill these in /.env (see .env.example) with the values from your EmailJS
// dashboard: https://dashboard.emailjs.com/admin
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

export const emailjsConfigured = Boolean(SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY)

export async function sendContactMessage({ name, contact, message }) {
  if (!emailjsConfigured) {
    throw new Error(
      'EmailJS n\'est pas configuré — renseignez VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID et VITE_EMAILJS_PUBLIC_KEY dans .env'
    )
  }

  return emailjs.send(
    SERVICE_ID,
    TEMPLATE_ID,
    {
      from_name: name,
      reply_contact: contact,
      message,
    },
    { publicKey: PUBLIC_KEY }
  )
}
