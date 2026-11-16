// ============================================================
// STRATA TECH — Booking Form Logic
// ============================================================

(function () {
  const CFG = window.STRATA_CONFIG;

  // --- Dynamic follow-up questions per service ---
  const FOLLOW_UPS = {
    website: [
      { id: 'fu_pages', label: 'How many pages do you need?', type: 'select', options: ['1–3 (simple)', '4–7 (standard)', '8+ (large)', 'Not sure yet'] },
      { id: 'fu_cms', label: 'Do you need a CMS (ability to edit content yourself)?', type: 'select', options: ['Yes', 'No', 'Not sure'] },
    ],
    ecommerce: [
      { id: 'fu_products', label: 'Roughly how many products?', type: 'select', options: ['Under 50', '50–200', '200+', 'Not sure'] },
      { id: 'fu_platform', label: 'Platform preference?', type: 'select', options: ['No preference', 'Shopify', 'WooCommerce', 'Custom'] },
    ],
    webapp: [
      { id: 'fu_users', label: 'Who are the users?', type: 'select', options: ['Internal team only', 'Customers / public', 'Both'] },
      { id: 'fu_auth', label: 'Do users need to log in?', type: 'select', options: ['Yes', 'No', 'Not sure'] },
    ],
    seo: [
      { id: 'fu_existing', label: 'Do you have an existing website?', type: 'select', options: ['Yes', 'No'] },
      { id: 'fu_target', label: 'Target market?', type: 'select', options: ['Kenya only', 'East Africa', 'Global'] },
    ],
    branding: [
      { id: 'fu_assets', label: 'What do you need?', type: 'select', options: ['Logo only', 'Logo + colour palette', 'Full brand identity kit', 'Not sure'] },
    ],
    maintenance: [
      { id: 'fu_stack', label: 'What is your site built on?', type: 'select', options: ['WordPress', 'Custom HTML', 'Shopify', 'Other / Not sure'] },
    ],
    unsure: [],
  };

  const SERVICE_LABELS = {
    website: 'Website Design & Development',
    ecommerce: 'E-commerce Store',
    webapp: 'Custom Web App / Software',
    seo: 'SEO & Digital Marketing',
    branding: 'Branding & Design',
    maintenance: 'Website Maintenance',
    unsure: 'Not sure — let\'s talk',
  };

  // --- Init ---
  document.addEventListener('DOMContentLoaded', () => {
    const serviceEl = document.getElementById('bService');
    const fuContainer = document.getElementById('followUpContainer');
    const form = document.getElementById('enquiryForm');

    if (serviceEl) serviceEl.addEventListener('change', () => renderFollowUps(serviceEl.value, fuContainer));
    if (form) form.addEventListener('submit', handleSubmit);
  });

  function renderFollowUps(service, container) {
    if (!container) return;
    container.innerHTML = '';
    const questions = FOLLOW_UPS[service] || [];
    questions.forEach(q => {
      const field = document.createElement('div');
      field.className = 'field';
      field.innerHTML = `<label for="${q.id}">${q.label}</label>` +
        (q.type === 'select'
          ? `<select id="${q.id}" name="${q.id}"><option value="">Select…</option>${q.options.map(o => `<option value="${o}">${o}</option>`).join('')}</select>`
          : `<input type="text" id="${q.id}" name="${q.id}" placeholder="${q.placeholder || ''}">`);
      container.appendChild(field);
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('.form-submit');
    const successEl = document.getElementById('enquirySuccess');
    const errorEl = document.getElementById('enquiryError');

    // Collect data
    const name = form.querySelector('#bName').value.trim();
    const phone = form.querySelector('#bPhone').value.trim();
    const email = form.querySelector('#bEmail')?.value.trim() || '';
    const serviceKey = form.querySelector('#bService').value;
    const serviceLabel = SERVICE_LABELS[serviceKey] || serviceKey;
    const budget = form.querySelector('#bBudget')?.value || '';
    const timeline = form.querySelector('#bTimeline')?.value || '';
    const details = form.querySelector('#bDetails')?.value.trim() || '';
    const channel = form.querySelector('input[name="channel"]:checked')?.value || 'whatsapp';

    // Collect follow-up answers
    const extra = {};
    const fuContainer = document.getElementById('followUpContainer');
    if (fuContainer) {
      fuContainer.querySelectorAll('select, input').forEach(el => {
        if (el.name && el.value) extra[el.name] = el.value;
      });
    }

    btn.disabled = true;
    btn.textContent = 'Sending…';
    if (errorEl) errorEl.hidden = true;

    try {
      // 1. Save to Supabase (if enabled)
      if (CFG.SUPABASE_ENABLED) {
        const { createClient } = window.supabase;
        const sb = createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);
        const { error } = await sb.from('enquiries').insert({
          name, email, phone,
          service: serviceLabel,
          budget, timeline, details,
          extra_data: extra,
          channel,
        });
        if (error) throw error;
      }

      // 2. Fire WhatsApp / email / etc. based on channel
      const lines = [
        `*New Strata Tech Enquiry*`,
        `Name: ${name}`,
        phone ? `Phone: ${phone}` : '',
        email ? `Email: ${email}` : '',
        `Service: ${serviceLabel}`,
        budget ? `Budget: ${budget}` : '',
        timeline ? `Timeline: ${timeline}` : '',
        ...Object.entries(extra).map(([k, v]) => `${k.replace('fu_', '')}: ${v}`),
        details ? `Notes: ${details}` : '',
        `Channel: ${channel}`,
      ].filter(Boolean).join('\n');

      form.hidden = true;
      successEl.hidden = false;

      if (channel === 'whatsapp') {
        successEl.innerHTML = '✓ Opening WhatsApp with your details…';
        setTimeout(() => window.open(`https://wa.me/${CFG.WHATSAPP_NUMBER}?text=${encodeURIComponent(lines)}`, '_blank'), 600);
      } else if (channel === 'call') {
        successEl.innerHTML = `✓ Got it! We'll call you on <strong>${phone}</strong> shortly.`;
      } else if (channel === 'email') {
        const subj = encodeURIComponent(`Strata Tech Enquiry — ${serviceLabel}`);
        const body = encodeURIComponent(lines.replace(/\*/g, ''));
        successEl.innerHTML = '✓ Opening your email…';
        setTimeout(() => window.location.href = `mailto:${CFG.BUSINESS_EMAIL}?subject=${subj}&body=${body}`, 600);
      } else if (channel === 'zoom') {
        successEl.innerHTML = '✓ We\'ll send you a Zoom link within a few hours.';
      }

    } catch (err) {
      console.error(err);
      btn.disabled = false;
      btn.textContent = 'Send enquiry →';
      if (errorEl) {
        errorEl.textContent = 'Something went wrong — please try again or reach us on WhatsApp.';
        errorEl.hidden = false;
      }
    }
  }

  window.STRATA_FORM = { renderFollowUps };
})();
