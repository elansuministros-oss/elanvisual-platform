import React from 'react';
import { getSlotConfig } from './slotRegistry.js';

export default function HtmlSlot({ slotId, html, className = '' }) {
  const config = getSlotConfig(slotId);

  return (
    <section
      className={`html-slot html-slot--${config.kind} ${className}`.trim()}
      data-slot-id={slotId}
      aria-label={config.label}
    >
      <iframe
        title={config.label}
        srcDoc={html}
        sandbox="allow-scripts allow-forms allow-popups allow-top-navigation-by-user-activation"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    </section>
  );
}
