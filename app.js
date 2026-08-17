/**
 * AegisGuard Cybersecurity Portal - Core Application Logic
 * Supports Dynamic English / Traditional Chinese Bilingual Switching
 */

let currentLang = localStorage.getItem('aegis-lang') || 'zh-TW';

const TRANSLATIONS = {
  'zh-TW': {
    navThreatMap: '威脅地圖 Threat Map',
    navToolkit: '安檢工具 Toolkit',
    navCVE: 'CVE 情報 Intel',
    navPlaybooks: '應變劇本 Playbooks',
    navAudit: '成熟度評估 Audit',
    sysStatus: 'DEFCON 4 • 系統正常運作',
    btnEmergency: '🚨 緊急通報 Emergency',
    tickerLabel: '即時威脅快訊',
    heroBadge: '⚡ 主動防禦協定已啟用 ACTIVE DEFENSE PROTOCOL',
    heroTitle: '新世代資安 <span>威脅情報與診斷指揮中心</span>',
    heroSubtitle: '為資安團隊提供即時網域安全標頭診斷、密碼熵強度分析、CVE 漏洞情報追蹤與自動化事件應變劇本。',
    heroBtnTools: '啟動診斷工具 Hub 🛠️',
    heroBtnMap: '探索全球威脅地圖 🌐',
    statScanned: '已檢測網域',
    statCVEs: '收錄 CVE 漏洞',
    statUptime: '防禦運作率',
    telemetryTitle: '即時遙測節點運作中',
    telemetrySub: '網路延遲: 14ms • 封包丟失率: 0%',
    btnRefresh: '重新整理',
    mapTitle: '全球網路攻擊即時動態地圖',
    mapDesc: '模擬追蹤全球網路攻擊流量、惡意程式 C2 中繼站連線與 DDoS 洗流量中心動態。',
    legC2: 'C2 中繼連線',
    legRansom: '勒索/漏洞利用',
    legDdos: 'DDoS 洗流量',
    legProtected: '受保護節點',
    toolkitTitle: '資安檢測工具箱 Hub',
    toolkitDesc: '提供 DevSecOps、SOC 分析師與系統管理員使用的高效前端純檢測工具。',
    tabHeaders: '網域 HTTP 安全標頭',
    tabEntropy: '密碼熵值與雜湊計算',
    tabPhishing: '釣魚與偽造連結檢測',
    tabDarkweb: '暗網外洩紀錄模擬',
    p1Title: 'HTTP 安全標頭與 SSL 體檢',
    p1Desc: '評估 Web 應用程式對抗 Clickjacking、XSS、MIME 偽造與 SSL 降級攻擊的防禦能力。',
    p1Label: '目標網域或 URL',
    p1Placeholder: '例如：secure-portal.company.com',
    p1Btn: '開始健檢 ⚡',
    gaugeLbl: '整體安全評級',
    p2Title: '密碼熵值強度與密碼學雜湊引擎',
    p2Desc: '測試憑證密碼對抗超級電腦與 GPU 叢集的破解時間，並即時計算 SHA-256 雜湊。',
    p2Label: '輸入測試密碼 / 密鑰字串',
    p2Placeholder: '請在此輸入密碼...',
    p2RatingLbl: '熵值評級:',
    p2GpuCluster: 'NVIDIA RTX 4090 算力叢集',
    p2CloudBotnet: '分佈式雲端殭屍網路',
    p2CharLength: '字元總長度',
    p2ShaLabel: '前端純 Hash 計算 (SHA-256)',
    p2Copy: '複製 Hash',
    p3Title: '網絡釣魚與同形異義字 URL 檢查器',
    p3Desc: '拆解可疑 URL 結構，自動比對假冒網域、多重連字號與可疑 IP 重定向。',
    p3Label: '要檢測的可疑 URL',
    p3Placeholder: '例如：http://login-paypalls-update.com/signin',
    p3Btn: '分析 URL 結構',
    p4Title: '暗網外洩紀錄模擬查詢',
    p4Desc: '查詢企業 Email 或網域是否曾出現在公開洩漏資料庫或暗網竊密軟體 (Stealer Log) 檔案庫中。',
    p4Label: '企業 Email 或 網域名稱',
    p4Placeholder: 'employee@company.com',
    p4Btn: '查詢外洩紀錄',
    cveTitle: 'CVE 漏洞情報資料庫',
    cveDesc: '整合 NVD 與 CISA KEV 目錄的最新高危險漏洞數據，支援即時搜尋與嚴重度篩選。',
    cveSearchPh: '搜尋 CVE 編號、軟體名稱 (如 Linux, Apache, Chrome) 或關鍵字...',
    filterAll: '全部等級',
    filterCrit: '嚴重 Critical',
    filterHigh: '高危 High',
    filterMed: '中度 Medium',
    playbookTitle: '資安事件應變標準作業劇本 (SOP)',
    playbookDesc: '提供 SOC 監控人員與事件應變小組 (IRT) 在面對資安事件時的標準處置步驟。',
    auditTitle: '企業資安防禦成熟度評估',
    auditDesc: '回答 5 個關鍵策略問題，快速衡量貴單位的資安成熟度指數與改善建議。',
    footerBrand: '企業級網路安全情報遙測、漏洞診斷與資安事件處置平台。',
    footerCol1: '核心檢測工具',
    footerCol2: '國際權威機構',
    footerCol3: '緊急事件求助',
    modalTitle: '🚨 宣告重大資安事件 (Emergency)',
    modalSub: '即時通報值班指揮官並啟動應變隔離程序。',
    modalTypeLabel: '事件類別 Category',
    optRansom: '受勒索軟體感染 / 檔案大規模加密',
    optCloud: '雲端或 Active Directory 未授權侵入',
    optDdos: '大規模 DDoS 服務中斷',
    optExfil: '機密資料外洩 / 內部威脅',
    modalContactLabel: '通報人電話 / Slack 帳號',
    modalContactPh: '@security-lead 或 +886 912-345-678',
    btnCancel: '取消',
    btnSubmitEmergency: '發送緊急通報 🚨'
  },
  'en': {
    navThreatMap: 'Threat Map',
    navToolkit: 'Security Toolkit',
    navCVE: 'CVE Intel',
    navPlaybooks: 'Playbooks',
    navAudit: 'Audit Score',
    sysStatus: 'DEFCON 4 • OPERATIONAL',
    btnEmergency: '🚨 Emergency Incident',
    tickerLabel: 'LIVE THREAT FEED',
    heroBadge: '⚡ ACTIVE DEFENSE PROTOCOL ACTIVE',
    heroTitle: 'Next-Gen Cyber <span>Intelligence & Diagnostics</span>',
    heroSubtitle: 'Empowering security teams with real-time domain header diagnostics, cryptographic entropy analysis, live CVE vulnerability telemetry, and automated response playbooks.',
    heroBtnTools: 'Launch Diagnostic Tools 🛠️',
    heroBtnMap: 'Explore Threat Map 🌐',
    statScanned: 'Scanned Domains',
    statCVEs: 'Indexed CVEs',
    statUptime: 'Defense Uptime',
    telemetryTitle: 'Real-Time Telemetry Node',
    telemetrySub: 'Latency: 14ms • Packet Loss: 0%',
    btnRefresh: 'Refresh',
    mapTitle: 'Live Cyber Attack Vector Map',
    mapDesc: 'Simulated real-time tracking of global cyber attack traffic, malware command & control nodes, and scrubbing center telemetry.',
    legC2: 'C2 Ping',
    legRansom: 'Ransomware / Exploit',
    legDdos: 'DDoS Scrubbing',
    legProtected: 'Protected Node',
    toolkitTitle: 'Cyber Security Toolkit Hub',
    toolkitDesc: 'Instant client-side security auditing tools designed for DevOps, SOC analysts, and system administrators.',
    tabHeaders: 'Domain Security Headers',
    tabEntropy: 'Password & Hash Entropy',
    tabPhishing: 'Phishing Link Inspector',
    tabDarkweb: 'Dark Web Exposure Check',
    p1Title: 'HTTP Security Headers & SSL Scanner',
    p1Desc: 'Evaluate your web application\'s defense posture against clickjacking, XSS, MIME sniffing, and SSL downgrade vectors.',
    p1Label: 'Target Domain or URL',
    p1Placeholder: 'e.g. secure-portal.company.com',
    p1Btn: 'Run Audit ⚡',
    gaugeLbl: 'OVERALL SECURITY GRADE',
    p2Title: 'Password Entropy & Crypto Hash Engine',
    p2Desc: 'Test credential entropy against quantum cracking hardware and generate client-side SHA-256 hashes.',
    p2Label: 'Enter Test Password / Secret Phrase',
    p2Placeholder: 'Type password here...',
    p2RatingLbl: 'Entropy Rating:',
    p2GpuCluster: 'NVIDIA RTX 4090 Cluster',
    p2CloudBotnet: 'Distributed Cloud Botnet',
    p2CharLength: 'Character Length',
    p2ShaLabel: 'Client-Side SHA-256 Hash',
    p2Copy: 'Copy Hash',
    p3Title: 'Phishing & Typosquatting Link Inspector',
    p3Desc: 'Deconstruct suspicious URLs, identify homograph attacks, lookalike domains, and suspicious IP redirects.',
    p3Label: 'Suspicious URL to Inspect',
    p3Placeholder: 'e.g. http://login-paypalls-update.com/signin',
    p3Btn: 'Inspect URL',
    p4Title: 'Dark Web Exposure Search Simulator',
    p4Desc: 'Check if enterprise email accounts or domains exist in public breach corpuses or dark web stealer log archives.',
    p4Label: 'Email Address or Enterprise Domain',
    p4Placeholder: 'employee@company.com',
    p4Btn: 'Check Exposure',
    cveTitle: 'CVE Threat Intelligence Explorer',
    cveDesc: 'Search and filter active Common Vulnerabilities and Exposures (CVEs) curated from NVD and CISA KEV catalogs.',
    cveSearchPh: 'Search by CVE ID, software (e.g. Linux, Apache, Chrome), or keyword...',
    filterAll: 'All Severities',
    filterCrit: 'Critical',
    filterHigh: 'High',
    filterMed: 'Medium',
    playbookTitle: 'Incident Response Playbooks',
    playbookDesc: 'Interactive SOP workflows for SOC analysts during live cyber security incidents.',
    auditTitle: 'Security Posture Maturity Calculator',
    auditDesc: 'Answer 5 quick strategic questions to benchmark your organization\'s cybersecurity defense score.',
    footerBrand: 'Enterprise Cyber Threat Telemetry, Vulnerability Diagnostics, and Incident Containment Platform.',
    footerCol1: 'Core Tools',
    footerCol2: 'Advisories',
    footerCol3: 'Emergency Support',
    modalTitle: '🚨 Declare Emergency Incident',
    modalSub: 'Notify on-call Incident Commander and isolate compromise scope immediately.',
    modalTypeLabel: 'Incident Category',
    optRansom: 'Active Ransomware / File Encryption',
    optCloud: 'Unauthorized Cloud / Active Directory Breach',
    optDdos: 'Volumetric DDoS Outage',
    optExfil: 'Data Exfiltration / Insider Threat',
    modalContactLabel: 'On-Call Phone / Slack Handle',
    modalContactPh: '@security-lead or +1 555-0199',
    btnCancel: 'Cancel',
    btnSubmitEmergency: 'Dispatch Emergency Alert 🚨'
  }
};

/* Ticker Stream Content */
const TICKER_ITEMS = {
  'zh-TW': [
    '<span><strong class="highlight">[高危漏洞]</strong> CVE-2026-21840 Apache HTTP Server 遠端程式碼執行 (CVSS 9.8)</span>',
    '<span><strong class="highlight">[勒索威脅]</strong> 偵測到 LockBit 4.0 變種針對車用供應鏈網路發動攻擊</span>',
    '<span><strong class="highlight">[DDOS 聯防]</strong> 亞太雲端區段已啟動 1.2 Tbps SYN Flood 流量清洗</span>',
    '<span><strong class="highlight">[零日警告]</strong> Chrome V8 JIT 編譯器記憶體損毀修補程式已發布 (請立即更新)</span>',
    '<span><strong class="highlight">[社交工程]</strong> 偵測到假冒 Microsoft Entra ID 單一簽入頁面之釣魚郵件</span>'
  ],
  'en': [
    '<span><strong class="highlight">[CRITICAL]</strong> CVE-2026-21840 Remote Code Execution in Apache HTTP Server (CVSS 9.8)</span>',
    '<span><strong class="highlight">[RANSOMWARE]</strong> LockBit 4.0 variant detected targeting automotive supply chain networks</span>',
    '<span><strong class="highlight">[DDOS]</strong> Active 1.2 Tbps SYN Flood scrubbing initiated for APAC Cloud region</span>',
    '<span><strong class="highlight">[ZERO-DAY]</strong> Chrome V8 JIT compiler memory corruption bug patch released (UPDATE NOW)</span>',
    '<span><strong class="highlight">[PHISHING]</strong> Spear-phishing campaign impersonating Microsoft Entra ID SSO portal detected</span>'
  ]
};

document.addEventListener('DOMContentLoaded', () => {
  initLanguageToggle();
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

  // Apply initial language
  setLanguage(currentLang);
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

/* Language Toggle Logic */
function initLanguageToggle() {
  const btn = document.getElementById('langToggleBtn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    currentLang = currentLang === 'zh-TW' ? 'en' : 'zh-TW';
    localStorage.setItem('aegis-lang', currentLang);
    setLanguage(currentLang);
    showToast(currentLang === 'zh-TW' ? '已切換至 繁體中文' : 'Switched to English', 'success');
  });
}

function setLanguage(lang) {
  currentLang = lang;
  document.documentElement.lang = lang;

  const dictionary = TRANSLATIONS[lang] || TRANSLATIONS['zh-TW'];

  // Replace textContent for elements with data-i18n
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dictionary[key]) {
      el.innerHTML = dictionary[key];
    }
  });

  // Update input placeholders
  const domainInput = document.getElementById('domainInput');
  if (domainInput) domainInput.placeholder = dictionary.p1Placeholder;

  const passInput = document.getElementById('passInput');
  if (passInput) passInput.placeholder = dictionary.p2Placeholder;

  const phishingUrlInput = document.getElementById('phishingUrlInput');
  if (phishingUrlInput) phishingUrlInput.placeholder = dictionary.p3Placeholder;

  const darkwebEmailInput = document.getElementById('darkwebEmailInput');
  if (darkwebEmailInput) darkwebEmailInput.placeholder = dictionary.p4Placeholder;

  const cveSearchInput = document.getElementById('cveSearchInput');
  if (cveSearchInput) cveSearchInput.placeholder = dictionary.cveSearchPh;

  const reporterContact = document.getElementById('reporterContact');
  if (reporterContact) reporterContact.placeholder = dictionary.modalContactPh;

  // Update ticker stream
  const tickerContainer = document.getElementById('threatTickerContent');
  if (tickerContainer) {
    tickerContainer.innerHTML = (TICKER_ITEMS[lang] || TICKER_ITEMS['zh-TW']).join('');
  }

  // Update button label
  const langBtn = document.getElementById('langToggleBtn');
  if (langBtn) {
    langBtn.textContent = lang === 'zh-TW' ? '🌐 繁中 / EN' : '🌐 EN / 繁中';
  }

  // Re-render playbooks and audit quiz for active language
  renderPlaybooks();
  renderAuditQuiz();
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

    showToast(currentLang === 'zh-TW' ? `正在分析網域 ${domain}...` : `Scanning domain ${domain}...`, 'info');

    setTimeout(() => {
      let score = 88;
      if (domain.includes('bank') || domain.includes('gov') || domain.includes('secure')) score = 96;
      if (domain.includes('test') || domain.includes('demo')) score = 64;

      const isZh = currentLang === 'zh-TW';

      const checks = [
        {
          name: 'Strict-Transport-Security (HSTS)',
          status: score >= 80 ? 'pass' : 'warn',
          desc: isZh ? '強制執行 HTTPS 加密連線，防止 SSL 降級與中間人攻擊 (max-age=31536000; includeSubDomains)。' : 'Enforces HTTPS connections and prevents SSL stripping attacks (max-age=31536000; includeSubDomains).'
        },
        {
          name: 'Content-Security-Policy (CSP)',
          status: score >= 90 ? 'pass' : score >= 70 ? 'warn' : 'fail',
          desc: isZh ? '限制腳本執行來源，有效抵禦跨站腳本攻擊 (XSS) 與資料注入。' : 'Restricts script execution sources to prevent Cross-Site Scripting (XSS) and data injection.'
        },
        {
          name: 'X-Frame-Options',
          status: 'pass',
          desc: isZh ? '設定為 SAMEORIGIN。保護網站不被嵌入外頁發動 Clickjacking 點擊劫持。' : 'Set to SAMEORIGIN. Protects site against clickjacking attacks.'
        },
        {
          name: 'X-Content-Type-Options',
          status: 'pass',
          desc: isZh ? '設定為 nosniff。防止瀏覽器猜測與誤判 MIME 檔案類型。' : 'Set to nosniff. Prevents browser MIME-type sniffing.'
        },
        {
          name: 'Referrer-Policy',
          status: score >= 75 ? 'pass' : 'warn',
          desc: isZh ? '設定為 strict-origin-when-cross-origin。避免外洩敏感 URL 參數數據。' : 'Set to strict-origin-when-cross-origin. Limits referrer data exposure.'
        },
        {
          name: 'Permissions-Policy',
          status: score >= 85 ? 'pass' : 'fail',
          desc: isZh ? '限制攝影機、麥克風、地理位置與支付 API 之未授權調用。' : 'Restricts camera, microphone, geolocation, and payment API access.'
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
      scoreLbl.textContent = score >= 90 ? (isZh ? 'A+ 安全極佳' : 'A+ EXCELLENT') : score >= 70 ? (isZh ? 'B 尚可接受' : 'B ACCEPTABLE') : (isZh ? 'C 需立即改善' : 'C ACTION REQUIRED');

      resultsContainer.style.display = 'block';
      showToast(isZh ? `網域 ${domain} 健檢完成` : `Scan complete for ${domain}`, 'success');
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

    const isZh = currentLang === 'zh-TW';

    if (!val) {
      bar.style.width = '0%';
      bitsText.textContent = '0 bits';
      ratingText.textContent = isZh ? '無' : 'None';
      ratingText.style.color = 'var(--accent-rose)';
      gpuText.textContent = '0s';
      cloudText.textContent = '0s';
      sha256Output.textContent = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
      return;
    }

    let poolSize = 0;
    if (/[a-z]/.test(val)) poolSize += 26;
    if (/[A-Z]/.test(val)) poolSize += 26;
    if (/[0-9]/.test(val)) poolSize += 10;
    if (/[^a-zA-Z0-9]/.test(val)) poolSize += 32;

    const entropyBits = Math.round(val.length * (Math.log2(poolSize || 1)));
    bitsText.textContent = `${entropyBits} bits`;

    const pct = Math.min(100, Math.round((entropyBits / 110) * 100));
    bar.style.width = `${pct}%`;

    if (entropyBits < 40) {
      bar.style.backgroundColor = 'var(--accent-rose)';
      ratingText.textContent = isZh ? '極度脆弱' : 'Very Weak';
      ratingText.style.color = 'var(--accent-rose)';
      gpuText.textContent = '< 0.01 秒';
      cloudText.textContent = '< 0.001 秒';
    } else if (entropyBits < 65) {
      bar.style.backgroundColor = 'var(--accent-amber)';
      ratingText.textContent = isZh ? '中等強度' : 'Moderate';
      ratingText.style.color = 'var(--accent-amber)';
      gpuText.textContent = '4.2 分鐘';
      cloudText.textContent = '12 秒';
    } else if (entropyBits < 90) {
      bar.style.backgroundColor = '#60a5fa';
      ratingText.textContent = isZh ? '高度安全' : 'Strong';
      ratingText.style.color = '#60a5fa';
      gpuText.textContent = '18.4 年';
      cloudText.textContent = '42 天';
    } else {
      bar.style.backgroundColor = 'var(--accent-emerald)';
      ratingText.textContent = isZh ? '量子抗性強' : 'Quantum Resistant';
      ratingText.style.color = 'var(--accent-emerald)';
      gpuText.textContent = '3,400+ 世紀';
      cloudText.textContent = '120+ 世紀';
    }

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
      showToast(currentLang === 'zh-TW' ? 'SHA-256 雜湊已複製至剪貼簿！' : 'SHA-256 hash copied to clipboard!', 'success');
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
      showToast(currentLang === 'zh-TW' ? '網址格式無效' : 'Invalid URL format', 'error');
      return;
    }

    const host = parsed.hostname;
    const isIP = /^(\d{1,3}\.){3}\d{1,3}$/.test(host);
    const suspiciousTLDs = ['.top', '.xyz', '.biz', '.cc', '.work', '.click'];
    const hasSuspiciousTLD = suspiciousTLDs.some(t => host.endsWith(t));
    const hyphensCount = (host.match(/-/g) || []).length;
    const targetKeywords = ['login', 'paypal', 'apple', 'google', 'update', 'verify', 'account', 'bank', 'secure'];
    const matchKeywords = targetKeywords.filter(k => host.includes(k));

    const isZh = currentLang === 'zh-TW';

    let riskLevel = 'LOW';
    let riskColor = 'var(--accent-emerald)';
    if (isIP || hasSuspiciousTLD || hyphensCount > 2 || matchKeywords.length > 0) {
      riskLevel = (isIP || (matchKeywords.length > 0 && hasSuspiciousTLD)) ? (isZh ? '高風險極危險' : 'HIGH DANGER') : (isZh ? '可疑網址' : 'SUSPICIOUS');
      riskColor = riskLevel.includes('HIGH') || riskLevel.includes('高') ? 'var(--accent-rose)' : 'var(--accent-amber)';
    }

    results.innerHTML = `
      <div style="background: var(--bg-surface); padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); margin-bottom: 1rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
          <strong style="font-size: 1.1rem;">${isZh ? '網址拆解分析:' : 'URL Breakdown:'} ${host}</strong>
          <span style="background: ${riskColor}22; color: ${riskColor}; padding: 0.25rem 0.75rem; border-radius: var(--radius-sm); font-weight: 700; font-family: var(--font-mono); font-size: 0.8rem;">
            ${isZh ? '風險等級:' : 'RISK LEVEL:'} ${riskLevel}
          </span>
        </div>
        <ul style="list-style: none; display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.875rem;">
          <li>🌐 <strong>${isZh ? '目標網域 Host:' : 'Host Domain:'}</strong> <span class="mono">${host}</span></li>
          <li>🔒 <strong>${isZh ? '連線協定 Protocol:' : 'Protocol:'}</strong> <span class="mono">${parsed.protocol}</span></li>
          <li>⚠️ <strong>${isZh ? 'IP 網址檢測:' : 'IP Host Detection:'}</strong> ${isIP ? (isZh ? '❌ 偵測到純 IP 位址 (高度可疑)' : '❌ Raw IP Address detected (Suspicious)') : (isZh ? '✅ 標準網域名稱' : '✅ Standard Domain Name')}</li>
          <li>🚩 <strong>${isZh ? '釣魚關鍵字匹配:' : 'Suspicious Keyword Matching:'}</strong> ${matchKeywords.length ? `⚠️ ${isZh ? '命中關鍵字:' : 'Found:'} ${matchKeywords.join(', ')}` : (isZh ? '✅ 未發現常見釣魚詞彙' : '✅ None detected')}</li>
          <li>🔗 <strong>${isZh ? '連字號密度分析:' : 'Hyphenation Density:'}</strong> ${hyphensCount > 2 ? `⚠️ ${isZh ? '密度過高' : 'High'} (${hyphensCount} ${isZh ? '個連字號' : 'hyphens'})` : (isZh ? '✅ 數量正常' : '✅ Normal')}</li>
        </ul>
      </div>
    `;

    results.style.display = 'block';
    showToast(isZh ? `已完成 ${host} 之釣魚特徵分析` : `URL analysis generated for ${host}`, 'info');
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

    const isZh = currentLang === 'zh-TW';

    showToast(isZh ? `正在查詢外洩索引庫 ${query}...` : `Querying breach index for ${query}...`, 'info');

    setTimeout(() => {
      const isBreached = query.includes('test') || query.includes('admin') || query.length % 2 === 0;

      if (!isBreached) {
        results.innerHTML = `
          <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); padding: 1.25rem; border-radius: var(--radius-md); text-align: center;">
            <span style="font-size: 2rem; display: block; margin-bottom: 0.5rem;">🛡️</span>
            <strong style="color: var(--accent-emerald); font-size: 1.1rem; display: block;">${isZh ? '未發現已知外洩紀錄' : 'NO KNOWN BREACH EXPOSURE FOUND'}</strong>
            <p style="color: var(--text-secondary); font-size: 0.85rem; margin-top: 0.35rem;">${isZh ? `公開竊密檔案與數據庫中未查獲 <strong>${query}</strong> 之憑證。` : `No record of <strong>${query}</strong> was detected in public stealer logs or credential leaks.`}</p>
          </div>
        `;
      } else {
        results.innerHTML = `
          <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); padding: 1.25rem; border-radius: var(--radius-md);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
              <strong style="color: var(--accent-rose); font-size: 1.1rem;">⚠️ ${isZh ? '偵測到 2 筆數據庫外洩紀錄' : 'EXPOSURE DETECTED IN 2 DATASETS'}</strong>
              <span class="mono" style="font-size: 0.75rem; color: var(--text-muted);">${isZh ? '查詢目標:' : 'TARGET:'} ${query}</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
              <div style="background: var(--bg-surface); padding: 0.75rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                <strong style="font-size: 0.9rem; display: block; color: var(--accent-amber);">1. RedLine Stealer 惡意軟體日誌庫 (2025)</strong>
                <span style="font-size: 0.8rem; color: var(--text-secondary);">${isZh ? '外洩欄位：明文密碼, 瀏覽器 Cookie, 登入 IP (185.220.x.x)' : 'Exposed: Plaintext Passwords, Browser Cookies, IP Log (185.220.x.x)'}</span>
              </div>
              <div style="background: var(--bg-surface); padding: 0.75rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                <strong style="font-size: 0.9rem; display: block; color: var(--accent-amber);">2. 電商平台 SQL 資料庫洩漏 (2024)</strong>
                <span style="font-size: 0.8rem; color: var(--text-secondary);">${isZh ? '外洩欄位：Email, Bcrypt 密碼雜湊, 帳單地址' : 'Exposed: Email, Bcrypt Password Hash, Billing Address'}</span>
              </div>
            </div>
          </div>
        `;
      }

      results.style.display = 'block';
      showToast(isZh ? '暗網掃描模擬數據已更新' : 'Dark web scan results updated', 'success');
    }, 500);
  });
}

/* CVE Database Explorer */
const CVE_DATABASE = [
  {
    id: 'CVE-2026-21840',
    titleEn: 'Apache HTTP Server Remote Code Execution in mod_proxy',
    titleZh: 'Apache HTTP Server mod_proxy 模組遠端程式碼執行漏洞',
    severity: 'CRITICAL',
    cvss: '9.8',
    software: 'Apache HTTP Server 2.4.50 - 2.4.58',
    date: '2026-08-10',
    descEn: 'An unauthenticated remote attacker can trigger heap buffer overflow via crafted HTTP/2 headers to gain root shell execution.',
    descZh: '未授權攻擊者可透過特製的 HTTP/2 標頭觸發堆疊緩衝區溢位，取得最高系統權限 (Root Shell)。'
  },
  {
    id: 'CVE-2026-19342',
    titleEn: 'Linux Kernel eBPF Subsystem Privilege Escalation',
    titleZh: 'Linux 核心 eBPF 子系統本地權限提升漏洞',
    severity: 'HIGH',
    cvss: '8.4',
    software: 'Linux Kernel 6.1.0 - 6.8.4',
    date: '2026-07-28',
    descEn: 'Flaw in eBPF verifier allows unprivileged local users to bypass kernel memory protection bounds and escalate to root.',
    descZh: 'eBPF 驗證器瑕疵允許非特權本地使用者繞過核心記憶體邊界限制，直接提權至系統管理者。'
  },
  {
    id: 'CVE-2026-14022',
    titleEn: 'Kubernetes API Server Unauthorized Cluster Admin Access',
    titleZh: 'Kubernetes API Server 未授權集群管理者存取漏洞',
    severity: 'CRITICAL',
    cvss: '9.9',
    software: 'Kubernetes v1.28.0 - v1.30.1',
    date: '2026-07-15',
    descEn: 'Improper token validation in aggressive caching proxy leads to session takeover across worker nodes.',
    descZh: '快取代理伺服器之 Token 驗證漏洞可導致跨工作節點的 Session 挾持與集群全面接管。'
  },
  {
    id: 'CVE-2026-08191',
    titleEn: 'OpenSSL TLS 1.3 Handshake State Confusion DoS',
    titleZh: 'OpenSSL TLS 1.3 握手狀態混淆拒絕服務漏洞 (DoS)',
    severity: 'MEDIUM',
    cvss: '6.5',
    software: 'OpenSSL 3.2.0 - 3.2.2',
    date: '2026-06-30',
    descEn: 'Specially crafted client hello packets cause persistent memory leak resulting in daemon crash.',
    descZh: '特製的 Client Hello 封包將引發持續性記憶體洩漏，導致 OpenSSL 服務進程崩潰與拒絕服務。'
  },
  {
    id: 'CVE-2026-05411',
    titleEn: 'Google Chrome V8 Engine Out-of-Bounds Memory Write',
    titleZh: 'Google Chrome V8 引擎越界記憶體寫入漏洞',
    severity: 'HIGH',
    cvss: '8.8',
    software: 'Google Chrome < 128.0.6613',
    date: '2026-06-12',
    descEn: 'Type confusion in JIT compiler allows sandbox escape upon rendering malicious WebGL canvas.',
    descZh: 'JIT 編譯器類型混淆允許攻擊者利用特製 WebGL Canvas 逃逸沙盒並執行惡意程式。'
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
    const isZh = currentLang === 'zh-TW';

    const filtered = CVE_DATABASE.filter(item => {
      const matchesSev = activeSeverity === 'ALL' || item.severity === activeSeverity;
      const title = isZh ? item.titleZh : item.titleEn;
      const desc = isZh ? item.descZh : item.descEn;
      const matchesText = item.id.toLowerCase().includes(searchQuery) ||
                          title.toLowerCase().includes(searchQuery) ||
                          desc.toLowerCase().includes(searchQuery) ||
                          item.software.toLowerCase().includes(searchQuery);
      return matchesSev && matchesText;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
          ${isZh ? '沒有找到符合搜尋條件的 CVE 漏洞紀錄。' : 'No CVE records matched your search query.'}
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
        <h4 class="cve-title">${isZh ? c.titleZh : c.titleEn}</h4>
        <p style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 0.35rem;">${isZh ? c.descZh : c.descEn}</p>
        <div class="cve-meta">
          <span>📦 ${isZh ? '影響軟體:' : 'Software:'} ${c.software}</span>
          <span>📅 ${isZh ? '揭露日期:' : 'Disclosed:'} ${c.date}</span>
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

/* Incident Response Playbooks Dynamic Rendering */
const PLAYBOOK_DATA = {
  'zh-TW': [
    {
      icon: '🦠',
      title: '勒索軟體爆發與處置隔離流程',
      code: 'SOP-SEC-0104 • 嚴重等級 Level 1',
      desc: '當發現未授權的檔案加密或磁碟陰影複製 (Volume Shadow Copy) 被刪除時，請立即執行以下程序：',
      steps: [
        { name: '1. 切斷受影響子網域 VLAN', detail: '停用交換器埠號、切斷無線 WiFi SSID，並在 Hypervisor 中隔離虛擬主機以阻止蠕蟲橫向移動。' },
        { name: '2. 保存記憶體 Dump 與揮發性跡證', detail: '關機前使用 WinPmem / LiME 擷取 RAM 映像檔，以擷取加密金鑰與記憶體駐留惡意碼。' },
        { name: '3. 重設網域管理者與服務帳號憑證', detail: '在 Active Directory 中連續重設兩次 Kerberos 票證發放票證 (KRBTGT) 金鑰。' },
        { name: '4. 驗證離線備份完整性', detail: '確認離線不可變 (Immutable) 備份快照健康狀況後，方可開始主機重裝與還原。' }
      ]
    },
    {
      icon: '🌊',
      title: '大規模容量型與應用層 DDoS 攻擊清洗',
      code: 'SOP-SEC-0209 • 嚴重等級 Level 2',
      desc: '當網頁服務回應時間驟增，頻寬達到上限時執行：',
      steps: [
        { name: '1. 啟用 Cloudflare / Akamai Under Attack 模式', detail: '在邊緣代理節點強制執行 JavaScript 挑戰與速率限制規章。' },
        { name: '2. 切換 BGP Anycast 洗流量路由', detail: '將自治系統 (AS) 流量重導至電信級 ISP 流量清洗中心進行深層封包過濾。' }
      ]
    }
  ],
  'en': [
    {
      icon: '🦠',
      title: 'Ransomware Outbreak & Containment Protocol',
      code: 'SOP-SEC-0104 • Severity Level 1',
      desc: 'Execute these steps immediately upon discovering unauthorized file encryption or volume shadow copy deletion.',
      steps: [
        { name: '1. Isolate Affected Subnet VLANs', detail: 'Disable switch ports, sever WiFi SSIDs, and isolate virtual hosts in hypervisor to halt worm propagation.' },
        { name: '2. Preserve Memory Dump & Volatile Artifacts', detail: 'Extract RAM image using WinPmem/LiME prior to powering off hosts to capture encryption keys.' },
        { name: '3. Revoke Domain Admin & Service Credentials', detail: 'Reset Kerberos Ticket Granting Ticket (KRBTGT) twice in Active Directory.' },
        { name: '4. Verify Offline Backup Integrity', detail: 'Confirm air-gapped immutable backup snapshot health prior to initiating host re-imaging.' }
      ]
    },
    {
      icon: '🌊',
      title: 'Volumetric & Application Layer DDoS Scrubbing',
      code: 'SOP-SEC-0209 • Severity Level 2',
      desc: 'Execute when traffic volume spikes and origin servers hit capacity limits:',
      steps: [
        { name: '1. Enable Cloudflare / Akamai Under Attack Mode', detail: 'Enforce JavaScript challenges and rate-limiting rules at edge proxies.' },
        { name: '2. Activate BGP Anycast Scrubbing Route', detail: 'Reroute autonomous system (AS) incoming traffic through upstream ISP cleaning centers.' }
      ]
    }
  ]
};

function renderPlaybooks() {
  const container = document.getElementById('playbookAccordion');
  if (!container) return;

  const data = PLAYBOOK_DATA[currentLang] || PLAYBOOK_DATA['zh-TW'];

  container.innerHTML = data.map((pb, index) => `
    <div class="playbook-item ${index === 0 ? 'open' : ''}">
      <div class="playbook-header">
        <div class="playbook-title-group">
          <div class="playbook-icon">${pb.icon}</div>
          <div>
            <strong style="font-size: 1.1rem; display: block;">${pb.title}</strong>
            <span style="font-size: 0.8rem; color: var(--text-muted);">${pb.code}</span>
          </div>
        </div>
        <span class="mono" style="color: var(--accent-cyan);">${currentLang === 'zh-TW' ? '點擊展開/收合 ▾' : 'Click to toggle ▾'}</span>
      </div>
      <div class="playbook-content">
        <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 1rem;">${pb.desc}</p>
        <div class="checklist">
          ${pb.steps.map(s => `
            <label class="checklist-step">
              <input type="checkbox">
              <div>
                <strong>${s.name}</strong>
                <p style="font-size: 0.8rem; color: var(--text-muted);">${s.detail}</p>
              </div>
            </label>
          `).join('')}
        </div>
      </div>
    </div>
  `).join('');

  initPlaybookAccordion();
}

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

/* Security Audit Quiz Dynamic Rendering */
const QUIZ_QUESTIONS = {
  'zh-TW': [
    {
      title: '多因素驗證 (MFA) 在基礎設施中的強制執行程度為何？',
      opts: [
        { text: '全面強制執行 FIDO2 / Passkeys / 實體硬體 Key 驗證', score: 30 },
        { text: '遠端存取與管理者登入強制使用 Authenticator 推播 App', score: 20 },
        { text: '可選擇性使用 SMS / Email 簡訊驗證碼', score: 10 },
        { text: '未強制執行 MFA，僅使用單一密碼', score: 0 }
      ]
    },
    {
      title: '端點偵測與回應 (EDR) 的涵蓋範圍為何？',
      opts: [
        { text: '100% 端點皆安裝託管型 EDR / XDR 並由 24/7 SOC 團隊監控', score: 25 },
        { text: '安裝傳統防毒軟體，並有集中式 Log 收集', score: 15 },
        { text: '使用系統內建 Windows Defender，無集中管理', score: 0 }
      ]
    },
    {
      title: '資料備份的實體隔離 (Air-gap) 與還原演練頻率為何？',
      opts: [
        { text: '每日自動執行不可變 (Immutable) 離線備份，並每季進行災難還原演練', score: 25 },
        { text: '定期雲端備份，但缺乏定期演練還原程序', score: 15 },
        { text: '手動或僅複製至本地外接硬碟備份', score: 0 }
      ]
    },
    {
      title: '針對高危 (Critical / High) 漏洞修補的 SLA 規範為何？',
      opts: [
        { text: '漏洞公布後 24 至 72 小時內完成測試與修補部署', score: 10 },
        { text: '30 天內完成修補', score: 5 },
        { text: '無固定 SLA，視情況不定期更新', score: 0 }
      ]
    },
    {
      title: '是否定期實施社交工程演練與資安事件演習？',
      opts: [
        { text: '每月進行釣魚郵件測試，且每年實施兵棋推演桌上演練', score: 10 },
        { text: '每年觀看一次合規資安宣導影片', score: 5 },
        { text: '未舉辦資安宣導與測試演練', score: 0 }
      ]
    }
  ],
  'en': [
    {
      title: 'How is Multi-Factor Authentication (MFA) enforced across your infrastructure?',
      opts: [
        { text: 'Enforced everywhere with FIDO2 / Passkeys / Hardware Tokens', score: 30 },
        { text: 'Enforced for remote & admin users using Authenticator Push Apps', score: 20 },
        { text: 'SMS / Email OTP codes used optionally', score: 10 },
        { text: 'No MFA or passwords only', score: 0 }
      ]
    },
    {
      title: 'What Endpoint Detection & Response (EDR) telemetry is deployed?',
      opts: [
        { text: 'Managed EDR / XDR active on 100% endpoints with 24/7 SOC monitoring', score: 25 },
        { text: 'Standard Anti-Virus installed with centralized log collection', score: 15 },
        { text: 'Default OS Windows Defender with no central monitoring', score: 0 }
      ]
    },
    {
      title: 'How frequently are backups tested and air-gapped?',
      opts: [
        { text: 'Daily automated immutable air-gapped backups with quarterly bare-metal recovery tests', score: 25 },
        { text: 'Regular cloud backups without periodic recovery testing', score: 15 },
        { text: 'Manual or local external drive backups', score: 0 }
      ]
    },
    {
      title: 'What is your patching SLA for Critical / High severity CVEs?',
      opts: [
        { text: 'Patched within 24 to 72 hours of publication', score: 10 },
        { text: 'Patched within 30 days', score: 5 },
        { text: 'Ad-hoc / Unscheduled patching', score: 0 }
      ]
    },
    {
      title: 'Are phishing simulations and incident drills conducted?',
      opts: [
        { text: 'Monthly phishing tests & annual tabletop incident response exercises', score: 10 },
        { text: 'Annual compliance security training video', score: 5 },
        { text: 'No security awareness training', score: 0 }
      ]
    }
  ]
};

function renderAuditQuiz() {
  const wizard = document.getElementById('quizWizard');
  if (!wizard) return;

  const isZh = currentLang === 'zh-TW';
  const questions = QUIZ_QUESTIONS[currentLang] || QUIZ_QUESTIONS['zh-TW'];

  let html = '';

  questions.forEach((q, idx) => {
    const qNum = idx + 1;
    html += `
      <div class="quiz-step ${qNum === 1 ? 'active' : ''}" data-step="${qNum}">
        <span style="font-family: var(--font-mono); color: var(--accent-cyan); font-size: 0.8rem;">
          ${isZh ? `問題 ${qNum} / 5` : `QUESTION ${qNum} OF 5`}
        </span>
        <h3 style="margin: 0.5rem 0 1rem;">${q.title}</h3>
        <div class="quiz-options">
          ${q.opts.map(o => `
            <button class="quiz-opt-btn" data-score="${o.score}">
              <span>${o.text}</span>
              <span class="mono">+${o.score} pts</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;
  });

  // Final step template
  html += `
    <div class="quiz-step" id="quizResultStep">
      <div style="text-align: center; padding: 1rem 0;">
        <span style="font-size: 3rem; display: block; margin-bottom: 0.5rem;">🏆</span>
        <h3 style="font-size: 1.75rem; margin-bottom: 0.5rem;">${isZh ? '資安防禦成熟度評估完成' : 'Audit Score Analysis Complete'}</h3>
        <div style="font-size: 3.5rem; font-weight: 800; font-family: var(--font-mono); color: var(--accent-cyan);" id="quizFinalScore">0 / 100</div>
        <p id="quizTierBadge" style="font-weight: 700; color: var(--accent-emerald); margin-bottom: 1rem; font-size: 1.2rem;">TIER 4: ENTERPRISE SENTINEL</p>
        <p id="quizRecommendation" style="color: var(--text-secondary); max-width: 540px; margin: 0 auto 1.5rem;">Your security posture demonstrates robust defense-in-depth controls.</p>
        <button class="btn btn-primary" onclick="window.print()">${isZh ? '列印 / 下載資安成熟度評估報告 📄' : 'Download / Print Security Assessment Report 📄'}</button>
        <button class="btn btn-secondary" id="restartQuizBtn" style="margin-left: 0.5rem;">${isZh ? '重新評估' : 'Restart Audit'}</button>
      </div>
    </div>
  `;

  wizard.innerHTML = html;
  initAuditQuiz();
}

function initAuditQuiz() {
  const wizard = document.getElementById('quizWizard');
  if (!wizard) return;

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
      const resultStep = document.getElementById('quizResultStep');
      const scoreNum = document.getElementById('quizFinalScore');
      const tierBadge = document.getElementById('quizTierBadge');
      const rec = document.getElementById('quizRecommendation');

      if (resultStep) resultStep.classList.add('active');
      if (scoreNum) scoreNum.textContent = `${totalScore} / 100`;

      const isZh = currentLang === 'zh-TW';

      if (totalScore >= 85) {
        tierBadge.textContent = isZh ? '層級 4：企業高階哨兵 (Enterprise Sentinel)' : 'TIER 4: ENTERPRISE SENTINEL';
        tierBadge.style.color = 'var(--accent-emerald)';
        rec.textContent = isZh ? '貴單位具備優異的深度防禦機制，且具備自動化 SOC 遙測與應變能力。' : 'Outstanding security controls with proactive defense-in-depth and automated SOC telemetry.';
      } else if (totalScore >= 60) {
        tierBadge.textContent = isZh ? '層級 3：進階防禦體系 (Advanced Posture)' : 'TIER 3: ADVANCED POSTURE';
        tierBadge.style.color = 'var(--accent-cyan)';
        rec.textContent = isZh ? '具備基礎資安防禦。建議補強不可變離線備份與強制部署 FIDO2 硬體 Key。' : 'Solid baseline controls. Recommend expanding immutable backups and mandatory FIDO2 hardware keys.';
      } else {
        tierBadge.textContent = isZh ? '層級 1-2：高風險警示 (Elevated Risk)' : 'TIER 1-2: ELEVATED RISK';
        tierBadge.style.color = 'var(--accent-rose)';
        rec.textContent = isZh ? '偵測到顯著資安防禦漏洞（如未強制 MFA 或缺乏備份隔離），建議立即著手改善。' : 'Critical security gaps detected in MFA and backup isolation. Immediate remediation required.';
      }

      showToast(isZh ? '資安成熟度計算完成！' : 'Audit calculation complete!', 'success');
    }
  });

  const restartBtn = document.getElementById('restartQuizBtn');
  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      renderAuditQuiz();
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

  for (let i = 0; i < 8; i++) spawnPacket();

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

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

      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(currentX, currentY);
      ctx.lineTo(x1 + (x2 - x1) * Math.max(0, p.progress - 0.08), y1 + (y2 - y1) * Math.max(0, p.progress - 0.08));
      ctx.stroke();
    }

    nodes.forEach(n => {
      const nx = n.x * canvas.width;
      const ny = n.y * canvas.height;

      ctx.fillStyle = n.color;
      ctx.beginPath();
      ctx.arc(nx, ny, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = n.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(nx, ny, 10, 0, Math.PI * 2);
      ctx.stroke();

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
      showToast(currentLang === 'zh-TW' ? '🚨 緊急通報已發送至 SOC 值班指揮中心' : '🚨 EMERGENCY ALERT DISPATCHED TO SOC COMMAND TEAM', 'error');
    });
  }
}

/* Dynamic Counters Animation */
function initCounters() {
  const scanned = document.getElementById('statScannedDomains');
  const monitored = document.getElementById('statMonitoredCVEs');

  if (!scanned || !monitored) return;

  let scannedCount = 24819;

  setInterval(() => {
    scannedCount += Math.floor(Math.random() * 3) + 1;
    scanned.textContent = scannedCount.toLocaleString();
  }, 3000);

  const refreshBtn = document.getElementById('refreshTelemetryBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      showToast(currentLang === 'zh-TW' ? '正在刷新 SOC 遙測數據流...' : 'Refreshing SOC telemetry feeds...', 'info');
    });
  }
}
