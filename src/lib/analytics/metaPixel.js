// Meta Pixel Integration

export const META_PIXEL_ID = "4328359100751569";

export function initMetaPixel() {
  if (typeof window !== 'undefined' && !window.metaPixelInitialized) {
    window.metaPixelInitialized = true;
    // Load Meta Pixel script
    (function(f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function() {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

    fbq('init', META_PIXEL_ID);
  }
}

export function trackPageView() {
  if (typeof window !== 'undefined' && window.fbq) {
    fbq('track', 'PageView');
  }
}

export function trackEvent(eventName, params) {
  if (typeof window !== 'undefined' && window.fbq) {
    fbq('track', eventName, params);
  }
}

export function trackContact(params) {
  trackEvent('Contact', params);
}

export function trackLead(params) {
  trackEvent('Lead', params);
}

export function trackQuoteRequested(params) {
  trackEvent('QuoteRequested', params);
}

export function trackWhatsAppClick(params) {
  trackEvent('WhatsAppClick', params);
}