// ============================================================
// STRATA TECH — Admin Dashboard Logic
// ============================================================

(function () {
  const CFG = window.STRATA_CONFIG;

  const STATUS_LABELS = {
    new: { label: 'New', color: '#38BDF8' },
    contacted: { label: 'Contacted', color: '#A78BFA' },
    proposal_sent: { label: 'Proposal Sent', color: '#FB923C' },
    in_progress: { label: 'In Progress', color: '#FACC15' },
    won: { label: 'Won ✓', color: '#22C55E' },
    lost: { label: 'Lost', color: '#EF4444' },
    archived: { label: 'Archived', color: '#555' },
  };

  let sb = null;
  let allEnquiries = [];
  let currentFilter = 'all';

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    const loginForm = document.getElementById('adminLoginForm');
    const dashboard = document.getElementById('adminDashboard');
    const loginSection = document.getElementById('adminLogin');

    // Check if already logged in this session
    if (sessionStorage.getItem('strata_admin') === 'true') {
      showDashboard(loginSection, dashboard);
    }

    if (loginForm) {
      loginForm.addEventListener('submit', e => {
        e.preventDefault();
        const pw = document.getElementById('adminPw').value;
        if (pw === CFG.ADMIN_PASSWORD) {
          sessionStorage.setItem('strata_admin', 'true');
          showDashboard(loginSection, dashboard);
        } else {
          document.getElementById('loginError').hidden = false;
        }
      });
    }

    document.getElementById('logoutBtn')?.addEventListener('click', () => {
      sessionStorage.removeItem('strata_admin');
      loginSection.hidden = false;
      dashboard.hidden = true;
    });

    // Filter tabs
    document.querySelectorAll('[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        currentFilter = btn.dataset.filter;
        document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderTable(allEnquiries);
      });
    });
  }

  async function showDashboard(loginSection, dashboard) {
    loginSection.hidden = true;
    dashboard.hidden = false;
    await loadEnquiries();
  }

  async function loadEnquiries() {
    const tbody = document.getElementById('enquiriesBody');
    const statsEl = document.getElementById('adminStats');

    if (!CFG.SUPABASE_ENABLED) {
      // Demo mode — show sample data
      allEnquiries = getDemoData();
      renderStats(allEnquiries);
      renderTable(allEnquiries);
      document.getElementById('demoNotice').hidden = false;
      return;
    }

    tbody.innerHTML = '<tr><td colspan="7" class="loading-row">Loading…</td></tr>';

    try {
      const { createClient } = window.supabase;
      sb = createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);
      const { data, error } = await sb
        .from('enquiries')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      allEnquiries = data;
      renderStats(allEnquiries);
      renderTable(allEnquiries);
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="7" class="loading-row" style="color:#EF4444">Error loading data: ${err.message}</td></tr>`;
    }
  }

  function renderStats(data) {
    const counts = {};
    Object.keys(STATUS_LABELS).forEach(s => counts[s] = 0);
    data.forEach(e => counts[e.status] = (counts[e.status] || 0) + 1);
    const el = document.getElementById('adminStats');
    if (!el) return;
    el.innerHTML = [
      { key: 'total', label: 'Total', val: data.length, color: '#9A9A9A' },
      { key: 'new', label: 'New', val: counts.new || 0, color: STATUS_LABELS.new.color },
      { key: 'in_progress', label: 'In Progress', val: (counts.contacted || 0) + (counts.proposal_sent || 0) + (counts.in_progress || 0), color: STATUS_LABELS.in_progress.color },
      { key: 'won', label: 'Won', val: counts.won || 0, color: STATUS_LABELS.won.color },
    ].map(s => `
      <div class="stat-chip" style="border-color:${s.color}22;background:${s.color}08">
        <div class="stat-chip-val" style="color:${s.color}">${s.val}</div>
        <div class="stat-chip-label">${s.label}</div>
      </div>`).join('');
  }

  function renderTable(data) {
    const tbody = document.getElementById('enquiriesBody');
    if (!tbody) return;
    const filtered = currentFilter === 'all' ? data : data.filter(e => e.status === currentFilter);
    if (!filtered.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="loading-row">No enquiries yet.</td></tr>';
      return;
    }
    tbody.innerHTML = filtered.map(e => {
      const st = STATUS_LABELS[e.status] || STATUS_LABELS.new;
      const date = new Date(e.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
      const waLink = `https://wa.me/${e.phone?.replace(/\D/g,'')}?text=${encodeURIComponent(`Hi ${e.name}, following up on your Strata Tech enquiry.`)}`;
      return `<tr data-id="${e.id}">
        <td>${date}</td>
        <td><strong>${escHtml(e.name)}</strong></td>
        <td><a href="${waLink}" target="_blank" class="wa-link">${escHtml(e.phone)}</a></td>
        <td>${escHtml(e.service)}</td>
        <td><span class="status-badge" style="background:${st.color}18;color:${st.color};border-color:${st.color}44">${st.label}</span></td>
        <td>
          <select class="status-select" data-id="${e.id}" onchange="STRATA_ADMIN.updateStatus('${e.id}', this.value)">
            ${Object.entries(STATUS_LABELS).map(([k, v]) => `<option value="${k}" ${e.status === k ? 'selected' : ''}>${v.label}</option>`).join('')}
          </select>
        </td>
        <td><button class="detail-btn" onclick="STRATA_ADMIN.showDetail('${e.id}')">View</button></td>
      </tr>`;
    }).join('');
  }

  async function updateStatus(id, newStatus) {
    const row = allEnquiries.find(e => e.id === id);
    if (!row) return;
    row.status = newStatus;
    renderStats(allEnquiries);

    if (!CFG.SUPABASE_ENABLED) return; // demo mode

    try {
      await sb.from('enquiries').update({ status: newStatus }).eq('id', id);
    } catch (err) {
      console.error('Failed to update status', err);
    }
  }

  function showDetail(id) {
    const e = allEnquiries.find(x => x.id === id);
    if (!e) return;
    const modal = document.getElementById('detailModal');
    const st = STATUS_LABELS[e.status] || STATUS_LABELS.new;
    const date = new Date(e.created_at).toLocaleString('en-KE');
    const extra = e.extra_data ? Object.entries(e.extra_data).map(([k, v]) => `<div class="detail-row"><span>${k.replace('fu_', '')}</span><span>${v}</span></div>`).join('') : '';
    document.getElementById('detailContent').innerHTML = `
      <div class="detail-header">
        <h3>${escHtml(e.name)}</h3>
        <span class="status-badge" style="background:${st.color}18;color:${st.color};border-color:${st.color}44">${st.label}</span>
      </div>
      <div class="detail-row"><span>Date</span><span>${date}</span></div>
      <div class="detail-row"><span>Phone</span><span><a href="https://wa.me/${e.phone?.replace(/\D/g,'')}" target="_blank" class="wa-link">${escHtml(e.phone)}</a></span></div>
      ${e.email ? `<div class="detail-row"><span>Email</span><span>${escHtml(e.email)}</span></div>` : ''}
      <div class="detail-row"><span>Service</span><span>${escHtml(e.service)}</span></div>
      ${e.budget ? `<div class="detail-row"><span>Budget</span><span>${escHtml(e.budget)}</span></div>` : ''}
      ${e.timeline ? `<div class="detail-row"><span>Timeline</span><span>${escHtml(e.timeline)}</span></div>` : ''}
      ${extra}
      ${e.details ? `<div class="detail-notes"><strong>Notes:</strong><p>${escHtml(e.details)}</p></div>` : ''}
      ${e.admin_notes ? `<div class="detail-notes" style="border-color:var(--accent)44"><strong>Your notes:</strong><p>${escHtml(e.admin_notes)}</p></div>` : ''}
      <div class="detail-actions">
        <a href="https://wa.me/${e.phone?.replace(/\D/g,'')}?text=${encodeURIComponent(`Hi ${e.name}, following up on your Strata Tech enquiry.`)}" target="_blank" class="btn-primary" style="font-size:14px;padding:10px 20px;">Reply on WhatsApp</a>
        ${e.email ? `<a href="mailto:${e.email}?subject=Re: Strata Tech Enquiry" class="btn-secondary" style="font-size:14px;padding:10px 20px;">Send Email</a>` : ''}
      </div>`;
    modal.hidden = false;
  }

  function getDemoData() {
    return [
      { id: '1', created_at: new Date(Date.now() - 86400000).toISOString(), name: 'Demo: Alice Wanjiru', phone: '0722000001', email: 'alice@example.com', service: 'Website Design & Development', budget: 'KES 50k–100k', timeline: '1–3 months', details: 'Need a 5-page site for my restaurant.', extra_data: { fu_pages: '4–7 (standard)', fu_cms: 'Yes' }, channel: 'whatsapp', status: 'new', admin_notes: '' },
      { id: '2', created_at: new Date(Date.now() - 172800000).toISOString(), name: 'Demo: Brian Kamau', phone: '0733000002', email: '', service: 'E-commerce Store', budget: 'KES 100k–200k', timeline: 'ASAP', details: 'Fashion brand, about 80 products.', extra_data: { fu_products: '50–200', fu_platform: 'Shopify' }, channel: 'call', status: 'proposal_sent', admin_notes: 'Sent quote on 15 Nov.' },
      { id: '3', created_at: new Date(Date.now() - 259200000).toISOString(), name: 'Demo: Carol Atieno', phone: '0711000003', email: 'carol@example.com', service: 'Branding & Design', budget: 'KES 20k–50k', timeline: 'Flexible', details: '', extra_data: { fu_assets: 'Full brand identity kit' }, channel: 'email', status: 'won', admin_notes: '' },
    ];
  }

  function escHtml(str) {
    if (!str) return '';
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  window.STRATA_ADMIN = { updateStatus, showDetail, reload: loadEnquiries };
})();
