import { JSDOM } from 'jsdom'

const routes = [
  '/',
  '/catalogue',
  '/catalogue/peinture',
  '/produit/peinture-satinee-blanche',
  '/produit/nexiste-pas',
  '/catalogue/famille-inexistante',
]

const BASE = 'http://127.0.0.1:4173'

async function testRoute(path) {
  const errors = []
  const dom = new JSDOM('', {
    url: `${BASE}${path}`,
    runScripts: 'dangerously',
    resources: 'usable',
    pretendToBeVisual: true,
  })

  dom.window.fetch = fetch
  dom.window.console.error = (...args) => errors.push(args.map(String).join(' '))

  const res = await fetch(`${BASE}${path}`)
  const html = await res.text()
  dom.window.document.open()
  dom.window.document.write(html)
  dom.window.document.close()

  // Laisse le temps au bundle de charger, à React de monter, et aux appels
  // API (fetch) de résoudre.
  await new Promise((resolve) => setTimeout(resolve, 2500))

  const root = dom.window.document.getElementById('root')
  const mounted = root && root.children.length > 0
  const bodyText = dom.window.document.body.textContent.trim().slice(0, 120)

  dom.window.close()
  return { path, mounted, errors, bodyText }
}

for (const path of routes) {
  const result = await testRoute(path)
  console.log(`\n=== ${result.path} ===`)
  console.log('Monté:', result.mounted)
  console.log('Aperçu texte:', result.bodyText.replace(/\s+/g, ' '))
  if (result.errors.length > 0) {
    console.log('ERREURS CONSOLE:')
    result.errors.forEach((e) => console.log('  -', e.slice(0, 300)))
  } else {
    console.log('Aucune erreur console.')
  }
}
