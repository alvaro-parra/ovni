// Foco en diálogos (accesibilidad con teclado y lectores de pantalla):
// al abrirse, el foco entra en el diálogo (en el elemento marcado con data-autofoco, o el
// primero enfocable); Tab no sale de él; Escape ejecuta `alEscape` si se da; al cerrarse,
// el foco vuelve a donde estaba.
import { useEffect, useRef } from 'react'

const ENFOCABLES = 'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'

export function useFocoDialogo<T extends HTMLElement>(alEscape?: () => void) {
  const ref = useRef<T>(null)
  const escape = useRef(alEscape)
  escape.current = alEscape

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const previo = document.activeElement as HTMLElement | null
    const lista = () => [...el.querySelectorAll<HTMLElement>(ENFOCABLES)]
    const inicial = el.querySelector<HTMLElement>('[data-autofoco]') ?? lista()[0]
    inicial?.focus({ preventScroll: true })

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && escape.current) {
        e.preventDefault()
        escape.current()
        return
      }
      if (e.key !== 'Tab') return
      const items = lista()
      if (items.length === 0) return
      const primero = items[0]
      const ultimo = items[items.length - 1]
      const activo = document.activeElement
      if (e.shiftKey && (activo === primero || !el.contains(activo))) {
        e.preventDefault()
        ultimo.focus()
      } else if (!e.shiftKey && (activo === ultimo || !el.contains(activo))) {
        e.preventDefault()
        primero.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      if (previo && document.contains(previo)) previo.focus({ preventScroll: true })
    }
  }, [])

  return ref
}
