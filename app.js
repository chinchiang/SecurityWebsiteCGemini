/**
 * AegisGuard Cybersecurity Portal - Core Application Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initToolTabs();
  initHeaderScanner();
  initPasswordEntropyEngine();
  initPhishingInspector();
  initDarkWebChecker();
  initCVEExplorer();
  initPlaybookAccordion();
  initAuditQuiz();
  initThreatMapCanvas();
  initEmergencyModal();
  initCounters();
});

/* Toast Notification Utility */
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  
  const icon = type === 'success' ? '✅' : type === 'error' ? '🚨' : 'ℹ️';
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

/* Theme Toggle */
function initThemeToggle() {
  const btn = document.getElementById('themeToggleBtn');
  if (!btn) return;

  const currentTheme = localStorage.getItem('aegis-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);
  btn.textContent = currentTheme === 'dark' ? '🌙' : '☀️';

  btn.addEventListener('click', () => {
    const activeTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = activeTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('aegis-theme', newTheme);
    btn.textContent = newTheme === 'dark' ? '🌙' : '☀️';
    showToast(`Switched to ${newTheme} mode`);
  });
}

/* Tool Tab Switcher */
function initToolTabs() {
  const tabBtns = document.querySelectorAll('.tool-nav-btn');
  const panels = document.querySelectorAll('.tool-panel');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');

      tabBtns.forEach(b => b.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) {
        targetPanel.classList.add('active');
      }
    });
  });
}

/* Tool 1: HTTP Security Headers Scanner */
function initHeaderScanner() {
  const form = document.getElementById('headerScanForm');
  const input = document.getElementById('domainInput');
  const resultsContainer = document.getElementById('headerResultsContainer');
  const checksGrid = document.getElementById('headerChecksGrid');
  const scoreNum = document.getElementById('headerScoreNumber');
  const scoreLbl = document.getElementById('headerScoreLabel');

  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const domain = input.value.trim().toLowerCase().replace(/^(https?:\/\/)/, '');
    if (!domain) return;

    showToast(`Scanning domain ${domain}...`, 'info');

    // Simulate audit evaluation based on domain name hash
    setTimeout(() => {
      let score = 88;
      if (domain.includes('bank') || domain.includes('gov') || domain.includes('secure')) score = 96;
      if (domain.includes('test') || domain.includes('demo')) score = 64;

      const checks = [
        {
          name: 'Strict-Transport-Security (HSTS)',
          status: score >= 80 ? 'pass' : 'warn',
          desc: 'Enforces HTTPS connections and prevents SSL stripping attacks (max-age=31536000; includeSubDomains).'
        },
        {
          name: 'Content-Security-Policy (CSP)',
          status: score >= 90 ? 'pass' : score >= 70 ? 'warn' : 'fail',
          desc: 'Restricts script execution sources to prevent Cross-Site Scripting (XSS) and data injection.'
        },
        {
          name: 'X-Frame-Options',
          status: 'pass',
          desc: 'Set to SAMEORIGIN. Protects site against clickjacking attacks.'
        },
        {
          name: 'X-Content-Type-Options',
          status: 'pass',
          desc: 'Set to nosniff. Prevents browser MIME-type sniffing.'
        },
        {
          name: 'Referrer-Policy',
          status: score >= 75 ? 'pass' : 'warn',
          desc: 'Set to strict-origin-when-cross-origin. Limits referrer data exposure.'
        },
        {
          name: 'Permissions-Policy',
          status: score >= 85 ? 'pass' : 'fail',
          desc: 'Restricts camera, microphone, geolocation, and payment API access.'
        }
      ];

      checksGrid.innerHTML = checks.map(c => `
        <div class="check-card ${c.status}">
          <div class="check-header">
            <span class="check-name">${c.name}</span>
            <span class="check-status-pill pill-${c.status}">${c.status.toUpperCase()}</span>
          </div>
          <p class="check-desc">${c.desc}</p>
        </div>
      `).join('');

      scoreNum.textContent = `${score} / 100`;
      scoreNum.style.color = score >= 90 ? 'var(--accent-emerald)' : score >= 70 ? 'var(--accent-amber)' : 'var(--accent-rose)';
      scoreLbl.textContent = score >= 90 ? 'A+ EXCELLENT' : score >= 70 ? 'B ACCEPTABLE' : 'C ACTION REQUIRED';

      resultsContainer.style.display = 'block';
      showToast(`Scan complete for ${domain}`, 'success');
    }, 600);
  });
}

/* Tool 2: Password Entropy & Crypto Hash Engine */
function initPasswordEntropyEngine() {
  const passInput = document.getElementById('passInput');
  const bar = document.getElementById('entropyBar');
  const bitsText = document.getElementById('entropyBitsText');
  const ratingText = document.getElementById('entropyRatingText');
  const countText = document.getElementById('passCharacterCount');
  const gpuText = document.getElementById('crackTimeGpu');
  const cloudText = document.getElementById('crackTimeCloud');
  const sha256Output = document.getElementById('sha256HashOutput');
  const copyBtn = document.getElementById('copyHashBtn');

  if (!passInput) return;

  passInput.addEventListener('input', async () => {
    const val = passInput.value;
    countText.textContent = val.length;

    if (!val) {
      bar.style.width = '0%';
      bitsText.textContent = '0 bits';
      ratingText.textContent = 'None';
      ratingText.style.color = 'var(--accent-rose)';
      gpuText.textContent = '0s';
      cloudText.textContent = '0s';
      sha256Output.textContent = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
      return;
    }

    // Calculate pool size N
    let poolSize = 0;
    if (/[a-z]/.test(val)) poolSize += 26;
    if (/[A-Z]/.test(val)) poolSize += 26;
    if (/[0-9]/.test(val)) poolSize += 10;
    if (/[^a-zA-Z0-9]/.test(val)) poolSize += 32;

    const entropyBits = Math.round(val.length * (Math.log2(poolSize || 1)));
    bitsText.textContent = `${entropyBits} bits`;

    // Percentage for entropy meter (capped at 120 bits)
    const pct = Math.min(100, Math.round((entropyBits / 110) * 100));
    bar.style.width = `${pct}%`;

    if (entropyBits < 40) {
      bar.style.backgroundColor = 'var(--accent-rose)';
      ratingText.textContent = 'Very Weak';
      ratingText.style.color = 'var(--accent-rose)';
      gpuText.textContent = '< 0.01 sec';
      cloudText.textContent = '< 0.001 sec';
    } else if (entropyBits < 65) {
      bar.style.backgroundColor = 'var(--accent-amber)';
      ratingText.textContent = 'Moderate';
      ratingText.style.color = 'var(--accent-amber)';
      gpuText.textContent = '4.2 minutes';
      cloudText.textContent = '12 seconds';
    } else if (entropyBits < 90) {
      bar.style.backgroundColor = '#60a5fa';
      ratingText.textContent = 'Strong';
      ratingText.style.color = '#60a5fa';
      gpuText.textContent = '18.4 years';
      cloudText.textContent = '42 days';
    } else {
      bar.style.backgroundColor = 'var(--accent-emerald)';
      ratingText.textContent = 'Quantum Resistant';
      ratingText.style.color = 'var(--accent-emerald)';
      gpuText.textContent = '3,400+ centuries';
      cloudText.textContent = '120+ centuries';
    }

    // SHA-256 calculation using Web Crypto API
    try {
      const msgUint8 = new TextEncoder().encode(val);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      sha256Output.textContent = hashHex;
    } catch (err) {
      sha256Output.textContent = 'Error computing hash';
    }
  });

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(sha256Output.textContent);
      showToast('SHA-256 hash copied to clipboard!', 'success');
    });
  }
}

/* Tool 3: Phishing Link Inspector */
function initPhishingInspector() {
  const form = document.getElementById('phishingForm');
  const input = document.getElementById('phishingUrlInput');
  const results = document.getElementById('phishingResults');

  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const rawUrl = input.value.trim();
    if (!rawUrl) return;

    let parsed;
    try {
      parsed = new URL(rawUrl.startsWith('http') ? rawUrl : `http://${rawUrl}`);
    } catch (err) {
      showToast('Invalid URL format', 'error');
      return;
    }

    const host = parsed.hostname;
    const isIP = /^(\d{1,3}\.){3}\d{1,3}$/.test(host);
    const suspiciousTLDs = ['.top', '.xyz', '.biz', '.cc', '.work', '.click'];
    const hasSuspiciousTLD = suspiciousTLDs.some(t => host.endsWith(t));
    const hyphensCount = (host.match(/-/g) || []).length;
    const targetKeywords = ['login', 'paypal', 'apple', 'google', 'update', 'verify', 'account', 'bank', 'secure'];
    const matchKeywords = targetKeywords.filter(k => host.includes(k));

    let riskLevel = 'LOW';
    let riskColor = 'var(--accent-emerald)';
    if (isIP || hasSuspiciousTLD || hyphensCount > 2 || matchKeywords.length > 0) {
      riskLevel = (isIP || (matchKeywords.length > 0 && hasSuspiciousTLD)) ? 'HIGH DANGER' : 'SUSPICIOUS';
      riskColor = riskLevel === 'HIGH DANGER' ? 'var(--accent-rose)' : 'var(--accent-amber)';
    }

    results.innerHTML = `
      <div style="background: var(--bg-surface); padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); margin-bottom: 1rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
          <strong style="font-size: 1.1rem;">URL Breakdown: ${host}</strong>
          <span style="background: ${riskColor}22; color: ${riskColor}; padding: 0.25rem 0.75rem; border-radius: var(--radius-sm); font-weight: 700; font-family: var(--font-mono); font-size: 0.8rem;">
            RISK LEVEL: ${riskLevel}
          </span>
        </div>
        <ul style="list-style: none; display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.875rem;">
          <li>🌐 <strong>Host Domain:</strong> <span class="mono">${host}</span></li>
          <li>🔒 <strong>Protocol:</strong> <span class="mono">${parsed.protocol}</span></li>
          <li>⚠️ <strong>IP Host Detection:</strong> ${isIP ? '❌ Raw IP Address detected (Suspicious)' : '✅ Standard Domain Name'}</li>
          <li>🚩 <strong>Suspicious Keyword Matching:</strong> ${matchKeywords.length ? `⚠️ Found: ${matchKeywords.join(', ')}` : '✅ None detected'}</li>
          <li>🔗 <strong>Hyphenation Density:</strong> ${hyphensCount > 2 ? `⚠️ High (${hyphensCount} hyphens)` : '✅ Normal'}</li>
        </ul>
      </div>
    `;

    results.style.display = 'block';
    showToast(`URL analysis generated for ${host}`, 'info');
  });
}

/* Tool 4: Dark Web Exposure Search Simulator */
function initDarkWebChecker() {
  const form = document.getElementById('darkwebForm');
  const input = document.getElementById('darkwebEmailInput');
  const results = document.getElementById('darkwebResults');

  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = input.value.trim();
    if (!query) return;

    showToast(`Querying breach index for ${query}...`, 'info');

    setTimeout(() => {
      const isBreached = query.includes('test') || query.includes('admin') || query.length % 2 === 0;

      if (!isBreached) {
        results.innerHTML = `
          <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); padding: 1.25rem; border-radius: var(--radius-md); text-align: center;">
            <span style="font-size: 2rem; display: block; margin-bottom: 0.5rem;">🛡️</span>
            <strong style="color: var(--accent-emerald); font-size: 1.1rem; display: block;">NO KNOWN BREACH EXPOSURE FOUND</strong>
            <p style="color: var(--text-secondary); font-size: 0.85rem; margin-top: 0.35rem;">No record of <strong>${query}</strong> was detected in public stealer logs or credential leaks.</p>
          </div>
        `;
      } else {
        results.innerHTML = `
          <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); padding: 1.25rem; border-radius: var(--radius-md);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
              <strong style="color: var(--accent-rose); font-size: 1.1rem;">⚠️ EXPOSURE DETECTED IN 2 DATASETS</strong>
              <span class="mono" style="font-size: 0.75rem; color: var(--text-muted);">TARGET: ${query}</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
              <div style="background: var(--bg-surface); padding: 0.75rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                <strong style="font-size: 0.9rem; display: block; color: var(--accent-amber);">1. RedLine Stealer Malware Archive (2025)</strong>
                <span style="font-size: 0.8rem; color: var(--text-secondary);">Exposed: Plaintext Passwords, Browser Cookies, IP Log (185.220.x.x)</span>
              </div>
              <div style="background: var(--bg-surface); padding: 0.75rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                <strong style="font-size: 0.9rem; display: block; color: var(--accent-amber);">2. E-Commerce SQL Dump Leak (2024)</strong>
                <span style="font-size: 0.8rem; color: var(--text-secondary);">Exposed: Email, Bcrypt Password Hash, Billing Address</span>
              </div>
            </div>
          </div>
        `;
      }

      results.style.display = 'block';
      showToast('Dark web scan results updated', 'success');
    }, 500);
  });
}

/* CVE Database Explorer */
const CVE_DATABASE = [
  {
    id: 'CVE-2026-21840',
    title: 'Apache HTTP Server Remote Code Execution in mod_proxy',
    severity: 'CRITICAL',
    cvss: '9.8',
    software: 'Apache HTTP Server 2.4.50 - 2.4.58',
    date: '2026-08-10',
    desc: 'An unauthenticated remote attacker can trigger heap buffer overflow via crafted HTTP/2 headers to gain root shell execution.'
  },
  {
    id: 'CVE-2026-19342',
    title: 'Linux Kernel eBPF Subsystem Privilege Escalation',
    severity: 'HIGH',
    cvss: '8.4',
    software: 'Linux Kernel 6.1.0 - 6.8.4',
    date: '2026-07-28',
    desc: 'Flaw in eBPF verifier allows unprivileged local users to bypass kernel memory protection bounds and escalate to root.'
  },
  {
    id: 'CVE-2026-14022',
    title: 'Kubernetes API Server Unauthorized Cluster Admin Access',
    severity: 'CRITICAL',
    cvss: '9.9',
    software: 'Kubernetes v1.28.0 - v1.30.1',
    date: '2026-07-15',
    desc: 'Improper token validation in aggressive caching proxy leads to session takeover across worker nodes.'
  },
  {
    id: 'CVE-2026-08191',
    title: 'OpenSSL TLS 1.3 Handshake State Confusion DoS',
    severity: 'MEDIUM',
    cvss: '6.5',
    software: 'OpenSSL 3.2.0 - 3.2.2',
    date: '2026-06-30',
    desc: 'Specially crafted client hello packets cause persistent memory leak resulting in daemon crash.'
  },
  {
    id: 'CVE-2026-05411',
    title: 'Google Chrome V8 Engine Out-of-Bounds Memory Write',
    severity: 'HIGH',
    cvss: '8.8',
    software: 'Google Chrome < 128.0.6613',
    date: '2026-06-12',
    desc: 'Type confusion in JIT compiler allows sandbox escape upon rendering malicious WebGL canvas.'
  }
];

function initCVEExplorer() {
  const container = document.getElementById('cveListContainer');
  const searchInput = document.getElementById('cveSearchInput');
  const filterBtns = document.querySelectorAll('.filter-btn');

  if (!container) return;

  let activeSeverity = 'ALL';
  let searchQuery = '';

  function renderCVEs() {
    const filtered = CVE_DATABASE.filter(item => {
      const matchesSev = activeSeverity === 'ALL' || item.severity === activeSeverity;
      const matchesText = item.id.toLowerCase().includes(searchQuery) ||
                          item.title.toLowerCase().includes(searchQuery) ||
                          item.software.toLowerCase().includes(searchQuery);
      return matchesSev && matchesText;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
          No CVE records matched your search query.
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(c => `
      <div class="cve-card">
        <div class="cve-header">
          <span class="cve-id">${c.id}</span>
          <span class="severity-tag sev-${c.severity.toLowerCase()}">${c.severity} • CVSS ${c.cvss}</span>
        </div>
        <h4 class="cve-title">${c.title}</h4>
        <p style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 0.35rem;">${c.desc}</p>
        <div class="cve-meta">
          <span>📦 Software: ${c.software}</span>
          <span>📅 Disclosed: ${c.date}</span>
        </div>
      </div>
    `).join('');
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeSeverity = btn.getAttribute('data-severity');
      renderCVEs();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      renderCVEs();
    });
  }

  renderCVEs();
}

/* Incident Response Playbook Accordion */
function initPlaybookAccordion() {
  const items = document.querySelectorAll('.playbook-item');

  items.forEach(item => {
    const header = item.querySelector('.playbook-header');
    if (!header) return;

    header.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      items.forEach(i => i.classList.remove('open'));
      if (!isOpen) {
        item.classList.add('open');
      }
    });
  });
}

/* Security Audit Quiz / Maturity Score Calculator */
function initAuditQuiz() {
  const wizard = document.getElementById('quizWizard');
  if (!wizard) return;

  const steps = wizard.querySelectorAll('.quiz-step');
  let currentStep = 1;
  let totalScore = 0;

  wizard.addEventListener('click', (e) => {
    const btn = e.target.closest('.quiz-opt-btn');
    if (!btn) return;

    const score = parseInt(btn.getAttribute('data-score') || '0', 10);
    totalScore += score;

    const activeStepEl = wizard.querySelector(`.quiz-step[data-step="${currentStep}"]`);
    if (activeStepEl) activeStepEl.classList.remove('active');

    currentStep++;
    const nextStepEl = wizard.querySelector(`.quiz-step[data-step="${currentStep}"]`);

    if (nextStepEl) {
      nextStepEl.classList.add('active');
    } else {
      // Show final result step
      const resultStep = document.getElementById('quizResultStep');
      const scoreNum = document.getElementById('quizFinalScore');
      const tierBadge = document.getElementById('quizTierBadge');
      const rec = document.getElementById('quizRecommendation');

      if (resultStep) resultStep.classList.add('active');
      if (scoreNum) scoreNum.textContent = `${totalScore} / 100`;

      if (totalScore >= 85) {
        tierBadge.textContent = 'TIER 4: ENTERPRISE SENTINEL';
        tierBadge.style.color = 'var(--accent-emerald)';
        rec.textContent = 'Outstanding security controls with proactive defense-in-depth and automated SOC telemetry.';
      } else if (totalScore >= 60) {
        tierBadge.textContent = 'TIER 3: ADVANCED POSTURE';
        tierBadge.style.color = 'var(--accent-cyan)';
        rec.textContent = 'Solid baseline controls. Recommend expanding immutable backups and mandatory FIDO2 hardware keys.';
      } else {
        tierBadge.textContent = 'TIER 1-2: ELEVATED RISK';
        tierBadge.style.color = 'var(--accent-rose)';
        rec.textContent = 'Critical security gaps detected in MFA and backup isolation. Immediate remediation required.';
      }

      showToast('Audit calculation complete!', 'success');
    }
  });

  const restartBtn = document.getElementById('restartQuizBtn');
  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      currentStep = 1;
      totalScore = 0;
      steps.forEach(s => s.classList.remove('active'));
      const step1 = wizard.querySelector('.quiz-step[data-step="1"]');
      if (step1) step1.classList.add('active');
    });
  }
}

/* Global Cyber Threat Map Canvas Animation */
function initThreatMapCanvas() {
  const canvas = document.getElementById('threatCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Define global nodes
  const nodes = [
    { name: 'Tokyo', x: 0.82, y: 0.38, color: '#00e5ff' },
    { name: 'San Francisco', x: 0.22, y: 0.35, color: '#10b981' },
    { name: 'Frankfurt', x: 0.52, y: 0.30, color: '#f59e0b' },
    { name: 'London', x: 0.48, y: 0.28, color: '#00e5ff' },
    { name: 'Singapore', x: 0.76, y: 0.58, color: '#ef4444' },
    { name: 'Sydney', x: 0.88, y: 0.80, color: '#10b981' },
    { name: 'Sao Paulo', x: 0.35, y: 0.72, color: '#f59e0b' }
  ];

  const packets = [];

  function spawnPacket() {
    const srcIndex = Math.floor(Math.random() * nodes.length);
    let dstIndex = Math.floor(Math.random() * nodes.length);
    while (dstIndex === srcIndex) {
      dstIndex = Math.floor(Math.random() * nodes.length);
    }

    packets.push({
      src: nodes[srcIndex],
      dst: nodes[dstIndex],
      progress: 0,
      speed: 0.005 + Math.random() * 0.008,
      color: nodes[srcIndex].color
    });
  }

  // Pre-fill packets
  for (let i = 0; i < 8; i++) spawnPacket();

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    const gridSpacing = 40;
    for (let x = 0; x < canvas.width; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw node connections
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        ctx.beginPath();
        ctx.moveTo(nodes[i].x * canvas.width, nodes[i].y * canvas.height);
        ctx.lineTo(nodes[j].x * canvas.width, nodes[j].y * canvas.height);
        ctx.stroke();
      }
    }

    // Draw packets arc
    for (let i = packets.length - 1; i >= 0; i--) {
      const p = packets[i];
      p.progress += p.speed;

      if (p.progress >= 1) {
        packets.splice(i, 1);
        spawnPacket();
        continue;
      }

      const x1 = p.src.x * canvas.width;
      const y1 = p.src.y * canvas.height;
      const x2 = p.dst.x * canvas.width;
      const y2 = p.dst.y * canvas.height;

      const currentX = x1 + (x2 - x1) * p.progress;
      const currentY = y1 + (y2 - y1) * p.progress;

      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(currentX, currentY, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Particle trail
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(currentX, currentY);
      ctx.lineTo(x1 + (x2 - x1) * Math.max(0, p.progress - 0.08), y1 + (y2 - y1) * Math.max(0, p.progress - 0.08));
      ctx.stroke();
    }

    // Draw nodes
    nodes.forEach(n => {
      const nx = n.x * canvas.width;
      const ny = n.y * canvas.height;

      ctx.fillStyle = n.color;
      ctx.beginPath();
      ctx.arc(nx, ny, 5, 0, Math.PI * 2);
      ctx.fill();

      // Outer ring
      ctx.strokeStyle = n.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(nx, ny, 10, 0, Math.PI * 2);
      ctx.stroke();

      // Label
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '10px JetBrains Mono';
      ctx.fillText(n.name, nx + 12, ny + 3);
    });

    requestAnimationFrame(animate);
  }

  animate();
}

/* Emergency Modal Logic */
function initEmergencyModal() {
  const modal = document.getElementById('emergencyModal');
  const openBtn = document.getElementById('openEmergencyModalBtn');
  const closeBtn = document.getElementById('closeEmergencyModalBtn');
  const cancelBtn = document.getElementById('cancelEmergencyBtn');
  const form = document.getElementById('emergencyForm');

  if (!modal) return;

  function openModal() {
    modal.classList.add('active');
  }

  function closeModal() {
    modal.classList.remove('active');
  }

  if (openBtn) openBtn.addEventListener('click', openModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      closeModal();
      showToast('🚨 EMERGENCY ALERT DISPATCHED TO SOC COMMAND TEAM', 'error');
    });
  }
}

/* Dynamic Counters Animation */
function initCounters() {
  const scanned = document.getElementById('statScannedDomains');
  const monitored = document.getElementById('statMonitoredCVEs');

  if (!scanned || !monitored) return;

  let scannedCount = 24819;
  let cveCount = 8410;

  setInterval(() => {
    scannedCount += Math.floor(Math.random() * 3) + 1;
    scanned.textContent = scannedCount.toLocaleString();
  }, 3000);

  const refreshBtn = document.getElementById('refreshTelemetryBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      showToast('Refreshing SOC telemetry feeds...', 'info');
    });
  }
}
