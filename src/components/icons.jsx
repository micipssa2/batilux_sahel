// Hand-set line icons, drawn for this project — no icon library.
// Consistent 1.6 stroke weight, rounded caps, 24px viewbox.

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export function WhatsAppIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M6.3 17.6 4.5 20l2.5-.7a7.7 7.7 0 1 0-3-3l.3.3Z" />
      <path d="M8.8 8.6c.2-.5.4-.5.6-.5h.5c.2 0 .4 0 .5.4.2.5.6 1.5.6 1.6.1.1.1.3 0 .4-.1.2-.1.3-.3.4l-.4.5c-.1.2-.3.3-.1.6.2.3.8 1.2 1.6 1.9.9.8 1.6 1 1.9 1.2.3.1.4.1.6-.1l.6-.7c.2-.2.3-.2.5-.1l1.4.7c.2.1.3.1.4.3.1.2.1.9-.2 1.3-.3.5-1.3 1-2 1-.8 0-2-.3-3.5-1.6-1.9-1.6-3-3.2-3.2-3.7-.2-.5-.7-1.3-.5-2Z" />
    </svg>
  )
}

export function MessengerIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M12 3.5c-5 0-8.8 3.6-8.8 8.4 0 2.7 1.2 5 3.2 6.6v3l2.9-1.6c.8.2 1.7.3 2.7.3 5 0 8.8-3.6 8.8-8.3S17 3.5 12 3.5Z" />
      <path d="m6.9 13.6 3-3.2 2.3 1.8 3-3.2-3.4 3.5-2.3-1.8-2.6 2.9Z" />
    </svg>
  )
}

export function FacebookIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M14.5 21v-7h2.3l.3-2.7h-2.6V9.5c0-.8.2-1.3 1.3-1.3h1.4V5.8c-.2 0-1.1-.1-2.1-.1-2.1 0-3.5 1.3-3.5 3.6v2H9.6v2.7h2.2v7Z" />
    </svg>
  )
}

export function InstagramIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <rect x="4" y="4" width="16" height="16" rx="4.5" />
      <circle cx="12" cy="12" r="3.6" />
      <circle cx="16.6" cy="7.4" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function TikTokIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M14 3.5c.4 2 1.8 3.4 4 3.6v2.6c-1.5 0-2.9-.4-4-1.3v5.9a5 5 0 1 1-4-4.9v2.7a2.3 2.3 0 1 0 1.7 2.2V3.5Z" />
    </svg>
  )
}

export function PhoneIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M6 4h2.6l1 3.8-1.7 1.5a11 11 0 0 0 5 5l1.5-1.7 3.8 1v2.6c0 .8-.7 1.4-1.5 1.3-4-.4-7.7-2.2-10.4-4.9C3.8 15.9 2 12.2 1.6 8.2 1.5 7.4 2.1 6.7 3 6.7Z" transform="translate(1)"/>
    </svg>
  )
}

export function MailIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4.5 7 7.5 5.5L19.5 7" />
    </svg>
  )
}

export function PinIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M12 21s6.5-6 6.5-11A6.5 6.5 0 0 0 5.5 10c0 5 6.5 11 6.5 11Z" />
      <circle cx="12" cy="10" r="2.2" />
    </svg>
  )
}

export function MenuIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  )
}

export function CloseIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="m5 5 14 14M19 5 5 19" />
    </svg>
  )
}

export function ClockIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="12" cy="12" r="8.3" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  )
}
