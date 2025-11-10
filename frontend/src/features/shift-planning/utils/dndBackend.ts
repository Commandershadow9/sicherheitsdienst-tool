/**
 * DnD Backend Setup
 * Multi-Backend für Desktop (HTML5) und Mobile (Touch) Support
 */

import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';

/**
 * Dynamische Backend-Auswahl basierend auf Gerätetyp
 * Verwendet Touch-Backend für mobile Geräte und HTML5-Backend für Desktop
 */
export function getDnDBackend() {
  // Touch-Unterstützung prüfen
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  if (isTouchDevice) {
    return {
      backend: TouchBackend,
      options: {
        enableMouseEvents: true, // Erlaubt weiterhin Maus-Events auf Touch-Geräten
        delayTouchStart: 200, // 200ms Verzögerung um Scrolling vs Drag zu unterscheiden
        touchSlop: 5, // Minimale Bewegung in px bevor Drag startet
      },
    };
  }

  return {
    backend: HTML5Backend,
    options: {},
  };
}
