/**
 * AegisGuard Cybersecurity Portal - Core Application Logic
 * Supports Dynamic English / Traditional Chinese Bilingual Switching
 */

/**
 * localStorage access can THROW rather than return null: Safari private
 * browsing, "block all cookies", a page opened from file:// in some browsers,
 * and a full storage quota all raise instead of degrading. The old code read it
 * as the very first statement of this file, so any of those threw before a
 * single listener was bound and left the whole page inert with no visible cause.
 *
 * Persistence is a nicety here — the language and theme both have defaults — so
 * every failure is swallowed and the caller continues without it.
 */
const storage = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch (err) {
      return null;
    }
  },
  /** @returns {boolean} whether the value was actually persisted. */
  set(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (err) {
      return false;
    }
  }
};

let currentLang = storage.get('aegis-lang') || 'zh-TW';

const TRANSLATIONS = {
  'zh-TW': {
    navThreatMap: '威脅地圖 Threat Map',
    navToolkit: '安檢工具 Toolkit',
    navCVE: 'CVE 情報 Intel',
    navPlaybooks: '應變劇本 Playbooks',
    navAudit: '成熟度評估 Audit',
    sysStatus: 'DEMO MODE • 模擬介面',
    btnEmergency: '🚨 緊急通報 Emergency',
    tickerLabel: '模擬威脅快訊',
    heroBadge: '⚡ 主動防禦協定已啟用 ACTIVE DEFENSE PROTOCOL',
    heroTitle: '新世代資安 <span>威脅情報與診斷指揮中心</span>',
    heroSubtitle: '以前端模擬介面展示網域安全標頭、密碼熵值、CVE 情報與事件應變劇本；不提供即時監控或真實掃描。',
    heroBtnTools: '啟動診斷工具 Hub 🛠️',
    heroBtnMap: '探索全球威脅地圖 🌐',
    statScanned: '模擬網域計數',
    statCVEs: '範例 CVE 計數',
    statUptime: '模擬運作率',
    telemetryTitle: '模擬遙測介面',
    telemetrySub: '範例延遲: 14ms • 範例封包丟失率: 0%',
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
    p1Title: 'HTTP 安全標頭與 SSL 評分示範',
    p1Desc: '示範 Web 安全標頭評分介面；不會連線或檢測輸入的網站。',
    p1Label: '目標網域或 URL',
    p1Placeholder: '例如：secure-portal.company.com',
    p1Btn: '開始健檢 ⚡',
    gaugeLbl: '整體安全評級（示範值，非真實檢測）',
    p2Title: '密碼強度與密碼學雜湊引擎',
    p2Desc: '估算密碼在離線暴力破解下可撐多久，並在瀏覽器本機計算 SHA-256 雜湊。',
    p2Label: '輸入測試密碼 / 密鑰字串',
    p2Placeholder: '請在此輸入密碼...',
    p2RatingLbl: '強度評級:',
    p2GpuCluster: 'GPU 叢集（每秒 10^11 次猜測）',
    p2CloudBotnet: '大型雲端叢集（每秒 10^13 次猜測）',
    p2RatingNone: '無',
    p2RatingVeryWeak: '極度脆弱',
    p2RatingWeak: '脆弱',
    p2RatingModerate: '中等強度',
    p2RatingStrong: '良好',
    p2RatingVeryStrong: '非常強',
    timeInstant: '瞬間破解',
    timeSeconds: '{n} 秒',
    timeMinutes: '{n} 分鐘',
    timeHours: '{n} 小時',
    timeDays: '{n} 天',
    timeMonths: '{n} 個月',
    timeYears: '{n} 年',
    timeCenturies: '{n} 世紀',
    p2CharLength: '字元總長度',
    p2ShaLabel: '前端純 Hash 計算 (SHA-256)',
    p2Copy: '複製 Hash',
    p2HashInsecureContext: '此頁面非安全環境 (secure context)，瀏覽器停用了 SubtleCrypto，無法計算 SHA-256。請改以 https:// 或 localhost 開啟。',
    p2HashError: '雜湊計算失敗，請重新輸入。',
    toastThemeDark: '已切換至深色模式',
    toastThemeLight: '已切換至淺色模式',
    p3Title: '網絡釣魚與同形異義字 URL 檢查器',
    p3Desc: '以前端啟發式規則拆解 URL，僅檢查關鍵字、連字號與純 IP 格式。',
    p3Label: '要檢測的可疑 URL',
    p3Placeholder: '例如：http://login-paypalls-update.com/signin',
    p3Btn: '分析 URL 結構',
    p3TierLow: '低風險 LOW',
    p3TierSuspicious: '可疑網址 SUSPICIOUS',
    p3TierHigh: '高風險極危險 HIGH DANGER',
    p4Title: '暗網外洩紀錄模擬查詢',
    p4Desc: '以虛構結果示範企業 Email 或網域的外洩查詢介面；不會查詢任何真實資料庫。',
    p4Label: '企業 Email 或 網域名稱',
    p4Placeholder: 'employee@company.com',
    p4Btn: '查詢外洩紀錄',
    cveTitle: 'CVE 漏洞情報資料庫',
    cveDesc: '以虛構的範例漏洞條目，示範 CVE 情報的即時搜尋與嚴重度篩選介面。',
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
    modalSub: '示範重大資安事件通報流程；不會聯絡值班指揮官或啟動任何應變程序。',
    modalTypeLabel: '事件類別 Category',
    optRansom: '受勒索軟體感染 / 檔案大規模加密',
    optCloud: '雲端或 Active Directory 未授權侵入',
    optDdos: '大規模 DDoS 服務中斷',
    optExfil: '機密資料外洩 / 內部威脅',
    modalContactLabel: '通報人電話 / Slack 帳號',
    modalContactPh: '@security-lead 或 +886 912-345-678',
    btnCancel: '取消',
    btnSubmitEmergency: '模擬送出（不會實際通報）🚨',
    demoBanner: '⚠️ 示範網站聲明：本站為前端技術示範專案，不連線任何外部服務。威脅地圖、CVE 情報、統計數字與所有掃描結果皆為虛構的模擬資料，請勿作為實際安全決策的依據。',
    noteHeaders: '⚠️ 模擬工具：受瀏覽器同源政策限制，前端 JavaScript 無法讀取其他網站的回應標頭。本工具未發出任何請求，分數與檢查結果純為示範，不代表目標網站的真實設定。實際檢測請使用 Mozilla HTTP Observatory 或 curl -I。',
    notePassword: '🔒 安全提醒：請勿輸入您的真實密碼。所有運算（含 SHA-256）皆在您的瀏覽器本機完成，不會傳送至任何伺服器。破解時間假設攻擊者已取得密碼雜湊並於離線環境暴力破解，且雜湊為快速演算法（如本頁計算的 SHA-256）；若改用 bcrypt 或 Argon2id，實際時間會長上好幾個數量級。本頁字典僅為常見密碼的取樣，真實破解工具的字典有數百萬筆，因此在此得到高分仍不代表安全。',
    notePhishing: 'ℹ️ 啟發式分析：本工具僅檢查關鍵字、連字號數量與純 IP 格式，尚未實作同形異義字 (IDN homograph) 與 punycode 偵測，也不檢查 path、query 與 userinfo。合法網域（如 accounts.google.com）可能被誤判，真實的釣魚網址也可能被漏判，結果僅供初步參考。',
    noteDarkweb: '⚠️ 模擬工具：本工具未連線任何外洩資料庫，結果由輸入字串的長度決定，與真實外洩狀況完全無關。查詢真實外洩紀錄請使用 Have I Been Pwned (haveibeenpwned.com)。',
    noteDarkwebInline: '⚠️ 以下為虛構的示範輸出，未查詢任何外洩資料庫，與此帳號的真實狀況無關。',
    noteDarkwebAction: '請注意：以上為示範情境，並非針對此帳號的查詢結果。若需確認真實外洩狀況，請至 haveibeenpwned.com 查詢。',
    noteCVE: 'ℹ️ 範例資料：以下 CVE 條目為教學用的虛構內容，並非來自 NVD 或 CISA KEV，其編號、影響版本與日期均不可信（版本號與揭露年份實際上互相矛盾）。真實漏洞資訊請查詢 nvd.nist.gov 或 CISA KEV 目錄。',
    noteAudit: 'ℹ️ 關於此評分：本評估的配分與級距為本專案自訂，未對應 NIST CSF、CIS Controls 或 ISO 27001 等公認框架，且 5 道題目無法涵蓋完整的資安成熟度。結果僅供自我檢視與討論起點，不可作為稽核或合規證明。',
    noteEmergency: '⚠️ 示範功能：本表單不會傳送資料、通知 SOC、聯絡任何人員或建立事件單。若發生真實事件，請使用貴組織正式核准的緊急通報管道。'
  },
  'en': {
    navThreatMap: 'Threat Map',
    navToolkit: 'Security Toolkit',
    navCVE: 'CVE Intel',
    navPlaybooks: 'Playbooks',
    navAudit: 'Audit Score',
    sysStatus: 'DEMO MODE • SIMULATED UI',
    btnEmergency: '🚨 Emergency Incident',
    tickerLabel: 'SIMULATED THREAT FEED',
    heroBadge: '⚡ ACTIVE DEFENSE PROTOCOL ACTIVE',
    heroTitle: 'Next-Gen Cyber <span>Intelligence & Diagnostics</span>',
    heroSubtitle: 'A front-end demonstration of security-header scoring, password entropy, CVE intelligence, and incident-response playbooks; it provides no live monitoring or real scanning.',
    heroBtnTools: 'Launch Diagnostic Tools 🛠️',
    heroBtnMap: 'Explore Threat Map 🌐',
    statScanned: 'Simulated Domain Count',
    statCVEs: 'Sample CVE Count',
    statUptime: 'Simulated Uptime',
    telemetryTitle: 'Simulated Telemetry UI',
    telemetrySub: 'Sample latency: 14ms • Sample packet loss: 0%',
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
    tabDarkweb: 'Dark Web Check (Simulated)',
    p1Title: 'HTTP Security Headers & SSL Scoring Demo',
    p1Desc: 'Demonstrates a web security-header scoring interface; it does not connect to or inspect the entered site.',
    p1Label: 'Target Domain or URL',
    p1Placeholder: 'e.g. secure-portal.company.com',
    p1Btn: 'Run Audit ⚡',
    gaugeLbl: 'OVERALL GRADE (DEMO VALUE, NOT A REAL SCAN)',
    p2Title: 'Password Strength & Crypto Hash Engine',
    p2Desc: 'Estimate how long a password survives offline guessing, and compute its SHA-256 hash locally in your browser.',
    p2Label: 'Enter Test Password / Secret Phrase',
    p2Placeholder: 'Type password here...',
    p2RatingLbl: 'Strength Rating:',
    p2GpuCluster: 'GPU cluster (10^11 guesses/sec)',
    p2CloudBotnet: 'Large cloud fleet (10^13 guesses/sec)',
    p2RatingNone: 'None',
    p2RatingVeryWeak: 'Very Weak',
    p2RatingWeak: 'Weak',
    p2RatingModerate: 'Moderate',
    p2RatingStrong: 'Good',
    p2RatingVeryStrong: 'Very Strong',
    timeInstant: 'Instantly',
    timeSeconds: '{n} seconds',
    timeMinutes: '{n} minutes',
    timeHours: '{n} hours',
    timeDays: '{n} days',
    timeMonths: '{n} months',
    timeYears: '{n} years',
    timeCenturies: '{n} centuries',
    p2CharLength: 'Character Length',
    p2ShaLabel: 'Client-Side SHA-256 Hash',
    p2Copy: 'Copy Hash',
    p2HashInsecureContext: 'This page is not a secure context, so the browser withholds SubtleCrypto and SHA-256 cannot be computed. Open it over https:// or from localhost.',
    p2HashError: 'Hash computation failed. Try entering the value again.',
    toastThemeDark: 'Switched to dark mode',
    toastThemeLight: 'Switched to light mode',
    p3Title: 'Phishing & Typosquatting Link Inspector',
    p3Desc: 'Applies basic client-side heuristics limited to keywords, hyphen count, and raw-IP format.',
    p3Label: 'Suspicious URL to Inspect',
    p3Placeholder: 'e.g. http://login-paypalls-update.com/signin',
    p3Btn: 'Inspect URL',
    p3TierLow: 'LOW',
    p3TierSuspicious: 'SUSPICIOUS',
    p3TierHigh: 'HIGH DANGER',
    p4Title: 'Dark Web Exposure Search Simulator',
    p4Desc: 'Demonstrates an exposure-search interface with fictional results; no real breach database is queried.',
    p4Label: 'Email Address or Enterprise Domain',
    p4Placeholder: 'employee@company.com',
    p4Btn: 'Check Exposure',
    cveTitle: 'CVE Threat Intelligence Explorer',
    cveDesc: 'A CVE search and severity-filter interface, demonstrated with fictional sample vulnerability records.',
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
    modalSub: 'Demonstrates an emergency-reporting workflow; it does not contact an Incident Commander or start any response action.',
    modalTypeLabel: 'Incident Category',
    optRansom: 'Active Ransomware / File Encryption',
    optCloud: 'Unauthorized Cloud / Active Directory Breach',
    optDdos: 'Volumetric DDoS Outage',
    optExfil: 'Data Exfiltration / Insider Threat',
    modalContactLabel: 'On-Call Phone / Slack Handle',
    modalContactPh: '@security-lead or +1 555-0199',
    btnCancel: 'Cancel',
    btnSubmitEmergency: 'Simulate submission (not dispatched) 🚨',
    demoBanner: '⚠️ Demo site notice: this is a front-end technical demo that connects to no external service. The threat map, CVE feed, statistics and all scan results are fictional simulated data. Do not rely on them for real security decisions.',
    noteHeaders: '⚠️ Simulated tool: the same-origin policy prevents browser JavaScript from reading another site\'s response headers. This tool issues no request — the grade and checks are illustrative only and do not reflect the target site\'s real configuration. For a real assessment use Mozilla HTTP Observatory or curl -I.',
    notePassword: '🔒 Safety note: do not enter a real password. All computation (including SHA-256) happens locally in your browser and is never transmitted. Crack times assume an attacker already holds the hash and is guessing offline against a fast algorithm — the same SHA-256 this page computes; bcrypt or Argon2id would take orders of magnitude longer. The wordlist here is only a sample of common passwords, while real cracking tools carry millions of entries, so a good score here is still not proof of safety.',
    notePhishing: 'ℹ️ Heuristic analysis: this tool only checks keywords, hyphen count and raw-IP format. It does not detect IDN homographs / punycode, and does not inspect the path, query string or userinfo. Legitimate domains (e.g. accounts.google.com) may be flagged and real phishing URLs may be missed. Treat results as indicative only.',
    noteDarkweb: '⚠️ Simulated tool: no breach database is queried. The result is derived from the length of your input and bears no relation to any actual exposure. For real breach data use Have I Been Pwned (haveibeenpwned.com).',
    noteDarkwebInline: '⚠️ The output below is fictional sample data. No breach database was queried and it says nothing about this account.',
    noteDarkwebAction: 'Note: the above is an illustrative scenario, not a lookup result for this account. To check real exposure, visit haveibeenpwned.com.',
    noteCVE: 'ℹ️ Sample data: the CVE entries below are fictional teaching examples. They are NOT sourced from NVD or CISA KEV, and their IDs, affected versions and dates are not trustworthy (the version numbers in fact contradict the stated disclosure years). For real advisories consult nvd.nist.gov or the CISA KEV catalog.',
    noteAudit: 'ℹ️ About this score: the weightings and tiers are specific to this project and are not mapped to NIST CSF, CIS Controls, ISO 27001 or any recognised framework. Five questions cannot characterise security maturity. Use the result as a discussion starting point, not as audit or compliance evidence.',
    noteEmergency: '⚠️ Demo only: this form does not transmit data, notify a SOC, contact anyone, or create an incident ticket. For a real incident, use your organization\'s formally approved emergency-reporting channel.'
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
  initThreatMapCanvas();
  initEmergencyModal();
  initCounters();

  // Everything whose markup depends on the language is rendered by
  // setLanguage(): playbooks, the audit quiz, the password panel, and the CVE
  // list. The quiz and the playbooks are also *bound* there, so calling their
  // init functions here as well would bind a second set of listeners to the
  // same containers.
  setLanguage(currentLang);
});

/* Translation Lookup Helper */
function t(key) {
  const dictionary = TRANSLATIONS[currentLang] || TRANSLATIONS['zh-TW'];
  return dictionary[key] || '';
}

/**
 * Escape a value before interpolating it into an HTML template string.
 * Required for any user-controlled value: note that new URL() permits `"`
 * and `=` inside hostname, so parsed URL parts are NOT safe by themselves.
 */
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

/* Toast Notification Utility */
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  
  const icon = type === 'success' ? '✅' : type === 'error' ? '🚨' : 'ℹ️';

  // Built via textContent, never innerHTML: toast messages embed raw user
  // input (scanned domain, inspected URL, breach query) and would otherwise
  // be a DOM XSS sink.
  const iconEl = document.createElement('span');
  iconEl.setAttribute('aria-hidden', 'true');
  iconEl.textContent = icon;

  const messageEl = document.createElement('span');
  messageEl.textContent = message;

  toast.append(iconEl, messageEl);
  
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
    // The switch takes effect for this page view even if it cannot be remembered.
    storage.set('aegis-lang', currentLang);
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

  // Re-render everything whose text is built in JavaScript rather than sitting
  // in the markup behind a data-i18n attribute. Miss one and it silently stays
  // in the previous language until the user interacts with it again.
  renderPlaybooks();
  renderAuditQuiz();
  renderPasswordStrength();
  renderHashOutput();
  renderCVEs();

  // Each of these repaints a tool result the visitor has already produced. They
  // are no-ops until the corresponding tool has been used once.
  renderHeaderScan();
  renderPhishingResult();
  renderDarkwebResult();
}

/* Theme Toggle */
function initThemeToggle() {
  const btn = document.getElementById('themeToggleBtn');
  if (!btn) return;

  const currentTheme = storage.get('aegis-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);
  btn.textContent = currentTheme === 'dark' ? '🌙' : '☀️';

  btn.addEventListener('click', () => {
    const activeTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = activeTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    storage.set('aegis-theme', newTheme);
    btn.textContent = newTheme === 'dark' ? '🌙' : '☀️';
    showToast(t(newTheme === 'dark' ? 'toastThemeDark' : 'toastThemeLight'));
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

/* ------------------------------------------------------------------------- *
 * Tool 1: HTTP Security Headers Scanner
 *
 * Split into state / render / bind so that setLanguage() can repaint the
 * result. Everything below is built in JavaScript rather than sitting behind a
 * data-i18n attribute, so while the render lived inside the submit listener a
 * language switch left the entire panel — check names aside — in the previous
 * language until the user pressed Scan again.
 * ------------------------------------------------------------------------- */

/** Domain of the most recent scan; '' means the panel has never been shown. */
let headerScanDomain = '';

/**
 * Illustrative grade for a domain NAME.
 *
 * NOTE: no request is made. Same-origin policy prevents browser JS from reading
 * cross-origin response headers, so this is a substring match on the domain and
 * is illustrative only. A real implementation needs a server-side proxy or the
 * Mozilla HTTP Observatory API.
 *
 * Kept as a pure function of the domain so the two languages cannot disagree
 * about the number: re-rendering recomputes it rather than trusting stored text.
 */
function headerScanScore(domain) {
  let score = 88;
  if (domain.includes('bank') || domain.includes('gov') || domain.includes('secure')) score = 96;
  if (domain.includes('test') || domain.includes('demo')) score = 64;
  return score;
}

function renderHeaderScan() {
  const resultsContainer = document.getElementById('headerResultsContainer');
  const checksGrid = document.getElementById('headerChecksGrid');
  const scoreNum = document.getElementById('headerScoreNumber');
  const scoreLbl = document.getElementById('headerScoreLabel');
  if (!resultsContainer || !checksGrid || !scoreNum || !scoreLbl) return;

  if (!headerScanDomain) {
    resultsContainer.style.display = 'none';
    return;
  }

  const score = headerScanScore(headerScanDomain);
  const isZh = currentLang === 'zh-TW';

  // Descriptions explain what each header DOES. They must never assert what the
  // scanned site actually returned, because nothing was fetched.
  const checks = [
    {
      name: 'Strict-Transport-Security (HSTS)',
      status: score >= 80 ? 'pass' : 'warn',
      desc: isZh ? '作用：強制瀏覽器僅以 HTTPS 連線，防止 SSL 降級與中間人攻擊。建議值 max-age 至少一年並加上 includeSubDomains。' : 'Purpose: forces browsers to connect over HTTPS only, preventing SSL stripping and MITM attacks. Recommended max-age of at least one year plus includeSubDomains.'
    },
    {
      name: 'Content-Security-Policy (CSP)',
      status: score >= 90 ? 'pass' : score >= 70 ? 'warn' : 'fail',
      desc: isZh ? '作用：限制腳本可執行的來源，抵禦跨站腳本攻擊 (XSS) 與資料注入。建議避免 unsafe-inline。' : 'Purpose: restricts which sources may execute scripts, mitigating XSS and data injection. Avoid unsafe-inline where possible.'
    },
    {
      name: 'X-Frame-Options',
      status: 'pass',
      desc: isZh ? '作用：控制網頁是否可被嵌入 iframe，用於防禦 Clickjacking 點擊劫持。現代作法建議改用 CSP frame-ancestors。' : 'Purpose: controls whether the page may be framed, defending against clickjacking. Modern equivalent is the CSP frame-ancestors directive.'
    },
    {
      name: 'X-Content-Type-Options',
      status: 'pass',
      desc: isZh ? '作用：關閉瀏覽器的 MIME 類型猜測，避免上傳內容被誤判為可執行腳本。建議值 nosniff。' : 'Purpose: disables browser MIME-type sniffing so uploaded content is not reinterpreted as executable script. Recommended value nosniff.'
    },
    {
      name: 'Referrer-Policy',
      status: score >= 75 ? 'pass' : 'warn',
      desc: isZh ? '作用：控制 Referer 標頭的傳送範圍，避免外洩敏感 URL 參數。建議值 strict-origin-when-cross-origin。' : 'Purpose: controls how much referrer information is sent, avoiding leakage of sensitive URL parameters. Recommended value strict-origin-when-cross-origin.'
    },
    {
      name: 'Permissions-Policy',
      status: score >= 85 ? 'pass' : 'fail',
      desc: isZh ? '作用：限制攝影機、麥克風、地理位置與支付 API 的未授權調用。' : 'Purpose: restricts unauthorized use of camera, microphone, geolocation, and payment APIs.'
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
  scoreLbl.textContent = score >= 90 ? (isZh ? 'A+（示範值）' : 'A+ (DEMO VALUE)') : score >= 70 ? (isZh ? 'B（示範值）' : 'B (DEMO VALUE)') : (isZh ? 'C（示範值）' : 'C (DEMO VALUE)');

  resultsContainer.style.display = 'block';
}

function initHeaderScanner() {
  const form = document.getElementById('headerScanForm');
  const input = document.getElementById('domainInput');

  if (!form || !input) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const domain = input.value.trim().toLowerCase().replace(/^(https?:\/\/)/, '');
    if (!domain) return;

    showToast(currentLang === 'zh-TW' ? `正在產生 ${domain} 的示範評分...` : `Generating demo grade for ${domain}...`, 'info');

    setTimeout(() => {
      headerScanDomain = domain;
      renderHeaderScan();
      // Toasts are deliberately not re-rendered on a language switch: they are
      // transient, and the language at the moment of the action is the right one.
      showToast(currentLang === 'zh-TW' ? `${domain} 的示範評分已產生` : `Demo grade generated for ${domain}`, 'success');
    }, 600);
  });
}

/* ------------------------------------------------------------------------- *
 * Password strength estimation
 *
 * The previous model was `length x log2(charset)`, which is only correct for a
 * uniformly random string. Real passwords are not random, so that formula rated
 * "Password123!" and "aaaaaaaaaaaaaaaa" as strong. This is a small, dependency-
 * free implementation of the approach zxcvbn popularised: find the patterns an
 * attacker's cracker already knows about, then charge the cheapest way of
 * assembling the whole password out of those patterns.
 *
 * Deliberate limitations, stated in the UI rather than hidden:
 * - The wordlist below is a sample. A real cracker carries millions of entries,
 *   so a password that scores well here can still fall to a bigger dictionary.
 * - Everything runs locally. Nothing is looked up over the network, because the
 *   page promises it makes no requests.
 * ------------------------------------------------------------------------- */

/**
 * Sampled from the leaks that cracking wordlists are built out of, roughly in
 * frequency order. Position matters: rank is used as the guess count, so the
 * first entry costs an attacker a single guess.
 */
const COMMON_PASSWORDS = [
  'password', '123456', '123456789', 'qwerty', '12345678', '111111', '1234567890',
  '1234567', 'password1', '12345', '123123', '000000', 'iloveyou', '1234',
  'admin', 'letmein', 'monkey', 'dragon', 'sunshine', 'princess', 'football',
  'welcome', 'abc123', 'qwerty123', 'trustno1', 'passw0rd', 'shadow', 'master',
  'baseball', 'superman', 'batman', 'starwars', 'whatever', 'cheese', 'ninja',
  'freedom', 'computer', 'michael', 'jennifer', 'jordan', 'hunter', 'ranger',
  'buster', 'soccer', 'harley', 'thomas', 'summer', 'ashley', 'bailey',
  'love', 'secret', 'god', 'sex', 'money', 'internet', 'server', 'root',
  'toor', 'test', 'guest', 'user', 'oracle', 'changeme', 'default', 'access',
  'login', 'pass', 'secure', 'security', 'cyber', 'hacker', 'firewall',
  'january', 'february', 'march', 'april', 'august', 'september', 'october',
  'november', 'december', 'monday', 'friday', 'taiwan', 'taipei', 'china',
  'google', 'facebook', 'youtube', 'amazon', 'apple', 'samsung', 'microsoft',
  'aegis', 'aegisguard', 'company', 'corporate', 'office', 'work'
];

const COMMON_RANK = new Map(COMMON_PASSWORDS.map((word, i) => [word, i + 1]));

// Adjacent runs a cracker walks for free. Reversed runs are checked too.
const KEYBOARD_ROWS = ['1234567890', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm'];

// One canonical letter per substitute. '1' could be l or i; picking one keeps
// the search linear and only ever *under*-credits the attacker slightly.
const LEET_MAP = {
  '4': 'a', '@': 'a', '8': 'b', '(': 'c', '3': 'e', '6': 'g', '1': 'l',
  '!': 'i', '|': 'l', '0': 'o', '9': 'q', '5': 's', '$': 's', '7': 't',
  '+': 't', '2': 'z'
};

function charsetSize(str) {
  let size = 0;
  if (/[a-z]/.test(str)) size += 26;
  if (/[A-Z]/.test(str)) size += 26;
  if (/[0-9]/.test(str)) size += 10;
  if (/[^A-Za-z0-9]/.test(str)) size += 33;   // printable ASCII symbols + space
  return size || 1;
}

function unleet(str) {
  return str.replace(/[4@8(3619!|0592$7+]/g, ch => LEET_MAP[ch] || ch);
}

function binomial(n, k) {
  let result = 1;
  for (let i = 1; i <= k; i++) result = (result * (n - k + i)) / i;
  return Math.round(result);
}

/**
 * How many capitalisation variants of a known word an attacker must try.
 * "password" is free; "pAsSwOrD" is not.
 */
function capitalisationVariants(token) {
  if (!/[A-Z]/.test(token)) return 1;
  if (/^[A-Z][^A-Z]*$/.test(token)) return 2;    // Password
  if (/^[A-Z]+$/.test(token)) return 2;          // PASSWORD
  if (/^[^A-Z]*[A-Z]$/.test(token)) return 2;    // passworD
  const upper = (token.match(/[A-Z]/g) || []).length;
  const lower = token.length - upper;
  let variants = 0;
  for (let i = 1; i <= Math.min(upper, lower); i++) variants += binomial(token.length, i);
  return Math.max(variants, 2);
}

/** Every match is { i, j, guesses, kind } with j inclusive. */
function dictionaryMatches(password) {
  const lower = password.toLowerCase();
  const matches = [];
  for (let i = 0; i < password.length; i++) {
    for (let j = i; j < password.length; j++) {
      const slice = lower.slice(i, j + 1);
      const plain = COMMON_RANK.get(slice);
      const leet = plain ? null : COMMON_RANK.get(unleet(slice));
      if (!plain && !leet) continue;
      const raw = password.slice(i, j + 1);
      // Substitutions are a rule every cracker applies, so they multiply the
      // cost by a small constant rather than by the size of the symbol space.
      const guesses = (plain || leet) * capitalisationVariants(raw) * (plain ? 1 : 2);
      matches.push({ i, j, guesses, kind: 'dictionary' });
    }
  }
  return matches;
}

function repeatMatches(password) {
  const matches = [];
  for (let unitLen = 1; unitLen <= Math.floor(password.length / 2); unitLen++) {
    for (let i = 0; i + unitLen * 2 <= password.length; i++) {
      const unit = password.slice(i, i + unitLen);
      let end = i + unitLen;
      while (password.slice(end, end + unitLen) === unit) end += unitLen;
      const repeats = (end - i) / unitLen;
      if (repeats < 2) continue;
      // Guess the unit once, then guess how many times it repeats.
      const unitGuesses = Math.pow(charsetSize(unit), unit.length);
      matches.push({ i, j: end - 1, guesses: unitGuesses * repeats, kind: 'repeat' });
    }
  }
  return matches;
}

function sequenceMatches(password) {
  const matches = [];
  for (let i = 0; i + 2 < password.length; i++) {
    const delta = password.charCodeAt(i + 1) - password.charCodeAt(i);
    if (Math.abs(delta) !== 1) continue;
    let j = i + 1;
    while (j + 1 < password.length &&
           password.charCodeAt(j + 1) - password.charCodeAt(j) === delta) j++;
    if (j - i + 1 < 3) continue;
    // Guess the starting character, the direction, and the length.
    const alphabet = /[0-9]/.test(password[i]) ? 10 : 26;
    matches.push({ i, j, guesses: alphabet * 2 * (j - i + 1), kind: 'sequence' });
  }
  return matches;
}

function keyboardMatches(password) {
  const lower = password.toLowerCase();
  const matches = [];
  for (let i = 0; i + 2 < lower.length; i++) {
    for (let j = lower.length - 1; j - i >= 2; j--) {
      const slice = lower.slice(i, j + 1);
      const reversed = slice.split('').reverse().join('');
      const onRow = KEYBOARD_ROWS.some(row => row.includes(slice) || row.includes(reversed));
      if (!onRow) continue;
      // Guess the row, the direction, the start key, and the length.
      matches.push({
        i, j,
        guesses: KEYBOARD_ROWS.length * 2 * 10 * slice.length,
        kind: 'keyboard'
      });
      break;   // longest run from this start position wins
    }
  }
  return matches;
}

function yearMatches(password) {
  const matches = [];
  for (const m of password.matchAll(/(?:19|20)\d\d/g)) {
    // ~120 plausible years is a rounding error next to a 4-digit brute force.
    matches.push({ i: m.index, j: m.index + 3, guesses: 120, kind: 'year' });
  }
  return matches;
}

/**
 * Pattern-aware strength estimate.
 *
 * Works in bits (log2 of the guess count) throughout: a 40-character random
 * password needs more guesses than a double can hold, and adding logarithms
 * cannot overflow the way multiplying counts does.
 *
 * Returns { bits, length, segments } where segments is the cheapest cover the
 * search found — useful for explaining the score and for testing it.
 */
function estimatePasswordStrength(password) {
  if (!password) return { bits: 0, length: 0, segments: [] };

  // Pattern search is quadratic; past this length the tail is brute force
  // anyway, and this keeps a paste of a 10 KB string from freezing the tab.
  const ANALYSIS_LIMIT = 64;
  const analysed = password.slice(0, ANALYSIS_LIMIT);
  const overflow = password.slice(ANALYSIS_LIMIT);

  const n = analysed.length;
  const byRange = new Map();
  const all = [
    ...dictionaryMatches(analysed), ...repeatMatches(analysed),
    ...sequenceMatches(analysed), ...keyboardMatches(analysed),
    ...yearMatches(analysed)
  ];
  for (const m of all) {
    const key = `${m.i}:${m.j}`;
    const existing = byRange.get(key);
    if (!existing || m.guesses < existing.guesses) byRange.set(key, m);
  }

  // Brute force is priced off the charset of the WHOLE password, not of each
  // chunk. Per-chunk pricing would let the search cut a random password into
  // digits-only and letters-only runs and charge each at its own smaller
  // alphabet, making "9f3Kd8sPq2m" look cheaper than it is.
  const bruteforceBitsPerChar = Math.log2(charsetSize(analysed));

  // best[k] = cheapest cover of the first k characters.
  const best = new Array(n + 1).fill(null);
  best[0] = { bits: 0, segments: [] };

  for (let k = 1; k <= n; k++) {
    for (let start = 0; start < k; start++) {
      const prefix = best[start];
      if (!prefix) continue;
      const token = analysed.slice(start, k);
      const options = [{
        bits: token.length * bruteforceBitsPerChar,
        kind: 'bruteforce'
      }];
      const match = byRange.get(`${start}:${k - 1}`);
      if (match) options.push({ bits: Math.log2(match.guesses), kind: match.kind });

      for (const option of options) {
        const candidate = {
          bits: prefix.bits + option.bits,
          segments: prefix.segments.concat({ token, kind: option.kind, bits: option.bits })
        };
        if (!best[k] || scoreOf(candidate) < scoreOf(best[k])) best[k] = candidate;
      }
    }
  }

  const cover = best[n] || { bits: 0, segments: [] };
  // Merge before scoring: fewer segments means a smaller ordering penalty, so
  // the merged cover is the genuinely cheapest one of the two.
  cover.segments = mergeBruteforceRuns(cover.segments);
  let bits = scoreOf(cover);

  // Anything past the analysis window is credited as pure brute force.
  if (overflow) bits += overflow.length * Math.log2(charsetSize(overflow));

  return { bits, length: password.length, segments: cover.segments };
}

/**
 * Two adjacent brute-forced runs cost exactly what one run of their combined
 * length costs, so the search picks between them arbitrarily. Joining them
 * makes the explanation readable without changing the score.
 */
function mergeBruteforceRuns(segments) {
  return segments.reduce((acc, segment) => {
    const previous = acc[acc.length - 1];
    if (previous && previous.kind === 'bruteforce' && segment.kind === 'bruteforce') {
      previous.token += segment.token;
      previous.bits += segment.bits;
      return acc;
    }
    return acc.concat({ ...segment });
  }, []);
}

/**
 * A multi-part password also costs the attacker the choice of *how* to split
 * it, which zxcvbn charges as (segments - 1)! extra guesses. Folded into the
 * comparison so the search prefers few large patterns over many small ones.
 */
function scoreOf(cover) {
  let orderingBits = 0;
  for (let i = 2; i < cover.segments.length; i++) orderingBits += Math.log2(i);
  return cover.bits + orderingBits;
}

/**
 * Offline guessing rates, guesses per second, for a FAST unsalted hash — which
 * is exactly what the SHA-256 field below computes. A password stored with
 * bcrypt or Argon2id costs an attacker orders of magnitude more per guess, so
 * these are a worst case for the defender rather than a universal figure.
 */
const ATTACK_RATES = {
  gpuCluster: 1e11,    // a small rig of consumer GPUs against SHA-256
  cloudBotnet: 1e13    // a large rented or compromised fleet
};

/** log10 of the expected time to crack, in seconds. */
function crackTimeSeconds(bits, guessesPerSecond) {
  // Expected work is half the keyspace, hence the -1 bit.
  return (bits - 1) * Math.log10(2) - Math.log10(guessesPerSecond);
}

const TIME_UNITS = [
  { key: 'timeSeconds', seconds: 1 },
  { key: 'timeMinutes', seconds: 60 },
  { key: 'timeHours', seconds: 3600 },
  { key: 'timeDays', seconds: 86400 },
  { key: 'timeMonths', seconds: 2629800 },       // average Gregorian month
  { key: 'timeYears', seconds: 31557600 },       // Julian year
  { key: 'timeCenturies', seconds: 3155760000 }
];

/** Renders a quantity without needing plural forms in either language. */
function formatQuantity(value) {
  if (value < 10) return value.toFixed(1);
  if (value < 1e6) return Math.round(value).toLocaleString('en-US');
  const exponent = Math.floor(Math.log10(value));
  return `${(value / Math.pow(10, exponent)).toFixed(1)} × 10^${exponent}`;
}

/** Takes the log10 seconds from crackTimeSeconds() and localises it. */
function formatCrackTime(log10Seconds) {
  if (log10Seconds < 0) return t('timeInstant');

  const seconds = Math.pow(10, log10Seconds);
  if (!Number.isFinite(seconds)) {
    const centuries = log10Seconds - Math.log10(3155760000);
    return t('timeCenturies').replace('{n}', `10^${Math.round(centuries)}`);
  }

  let unit = TIME_UNITS[0];
  for (const candidate of TIME_UNITS) if (seconds >= candidate.seconds) unit = candidate;
  return t(unit.key).replace('{n}', formatQuantity(seconds / unit.seconds));
}

/** Five bands over the guess count, not over a charset assumption. */
function strengthTier(bits) {
  if (bits < 28) return { key: 'p2RatingVeryWeak', colour: 'var(--accent-rose)' };
  if (bits < 40) return { key: 'p2RatingWeak', colour: 'var(--accent-rose)' };
  if (bits < 60) return { key: 'p2RatingModerate', colour: 'var(--accent-amber)' };
  if (bits < 80) return { key: 'p2RatingStrong', colour: '#60a5fa' };
  return { key: 'p2RatingVeryStrong', colour: 'var(--accent-emerald)' };
}

const EMPTY_SHA256 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

/**
 * Paints the strength panel from the current input value. Split out of the
 * input listener so setLanguage() can repaint it — the rating and the crack
 * times are translated strings, and they used to stay in the old language
 * (and, before that, were hardcoded Chinese in both).
 */
function renderPasswordStrength() {
  const passInput = document.getElementById('passInput');
  const bar = document.getElementById('entropyBar');
  const bitsText = document.getElementById('entropyBitsText');
  const ratingText = document.getElementById('entropyRatingText');
  const countText = document.getElementById('passCharacterCount');
  const gpuText = document.getElementById('crackTimeGpu');
  const cloudText = document.getElementById('crackTimeCloud');
  if (!passInput || !bar) return;

  const val = passInput.value;
  if (countText) countText.textContent = val.length;

  if (!val) {
    bar.style.width = '0%';
    if (bitsText) bitsText.textContent = '0 bits';
    if (ratingText) {
      ratingText.textContent = t('p2RatingNone');
      ratingText.style.color = 'var(--accent-rose)';
    }
    if (gpuText) gpuText.textContent = '—';
    if (cloudText) cloudText.textContent = '—';
    return;
  }

  const strength = estimatePasswordStrength(val);
  const tier = strengthTier(strength.bits);

  if (bitsText) bitsText.textContent = `${strength.bits.toFixed(1)} bits`;
  // 100 bits fills the bar; beyond that the difference stops being meaningful.
  bar.style.width = `${Math.min(100, Math.round(strength.bits))}%`;
  bar.style.backgroundColor = tier.colour;

  if (ratingText) {
    ratingText.textContent = t(tier.key);
    ratingText.style.color = tier.colour;
  }
  if (gpuText) {
    gpuText.textContent = formatCrackTime(crackTimeSeconds(strength.bits, ATTACK_RATES.gpuCluster));
  }
  if (cloudText) {
    cloudText.textContent = formatCrackTime(crackTimeSeconds(strength.bits, ATTACK_RATES.cloudBotnet));
  }
}

/* Tool 2: Password Entropy & Crypto Hash Engine */

/**
 * The hash currently on display, or '' when the panel is showing a notice
 * instead. Only a non-empty value is offered to the clipboard, so the copy
 * button can never quietly hand the user an error message.
 */
let sha256Current = EMPTY_SHA256;

/** i18n key of the notice replacing the hash, or '' when a hash is shown. */
let sha256Notice = '';

/**
 * SubtleCrypto is only exposed in a secure context. Served over plain http://
 * from anything other than localhost — or opened as a file:// URL in some
 * browsers — `crypto.subtle` is undefined, so the digest call threw a
 * TypeError. That was caught, but the panel then showed a hardcoded English
 * "Error computing hash" with no hint that the cause was the page's origin
 * rather than the input.
 */
function subtleCryptoAvailable() {
  return Boolean(
    typeof crypto !== 'undefined' && crypto && crypto.subtle &&
    typeof crypto.subtle.digest === 'function'
  );
}

function renderHashOutput() {
  const output = document.getElementById('sha256HashOutput');
  const copyBtn = document.getElementById('copyHashBtn');

  if (output) output.textContent = sha256Notice ? t(sha256Notice) : sha256Current;
  if (copyBtn) copyBtn.disabled = !sha256Current;
}

/** @param {string} notice i18n key, or '' to display `hash` instead. */
function setHashOutput(hash, notice) {
  sha256Current = hash;
  sha256Notice = notice;
  renderHashOutput();
}

function initPasswordEntropyEngine() {
  const passInput = document.getElementById('passInput');
  const copyBtn = document.getElementById('copyHashBtn');

  if (!passInput) return;

  passInput.addEventListener('input', async () => {
    renderPasswordStrength();

    const val = passInput.value;

    if (!val) {
      setHashOutput(EMPTY_SHA256, '');
      return;
    }

    if (!subtleCryptoAvailable()) {
      setHashOutput('', 'p2HashInsecureContext');
      return;
    }

    try {
      const msgUint8 = new TextEncoder().encode(val);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      setHashOutput(hashHex, '');
    } catch (err) {
      setHashOutput('', 'p2HashError');
    }
  });

  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      // The panel is showing a notice, not a hash. The button is disabled in
      // that state, but a click can still arrive from assistive tooling.
      if (!sha256Current) return;

      const isZh = currentLang === 'zh-TW';
      try {
        // navigator.clipboard is itself undefined outside a secure context, and
        // writeText() rejects when the permission is denied or the document is
        // not focused, so both the property access and the await belong in here.
        await navigator.clipboard.writeText(sha256Current);
        showToast(isZh ? 'SHA-256 雜湊已複製至剪貼簿！' : 'SHA-256 hash copied to clipboard!', 'success');
      } catch (err) {
        showToast(
          isZh ? '無法存取剪貼簿，請手動選取後複製。' : 'Clipboard access failed — select the hash and copy it manually.',
          'error'
        );
      }
    });
  }
}

/* ------------------------------------------------------------------------- *
 * Tool 3: Phishing Link Inspector
 *
 * Split into state / render / bind for the same reason as Tool 1: the whole
 * result is built in JavaScript, so it has to be repainted on a language switch.
 * ------------------------------------------------------------------------- */

const PHISHING_SUSPICIOUS_TLDS = ['.top', '.xyz', '.biz', '.cc', '.work', '.click'];
const PHISHING_KEYWORDS = ['login', 'paypal', 'apple', 'google', 'update', 'verify', 'account', 'bank', 'secure'];

/**
 * Display text and colour per risk tier, keyed by a language-independent tier
 * name. The tier used to BE the translated string, and the colour was picked by
 * substring-matching that string for 'HIGH' or '高' — so rewording either
 * translation would silently have turned every high-risk verdict amber.
 */
const PHISHING_TIERS = {
  low: { key: 'p3TierLow', colour: 'var(--accent-emerald)' },
  suspicious: { key: 'p3TierSuspicious', colour: 'var(--accent-amber)' },
  high: { key: 'p3TierHigh', colour: 'var(--accent-rose)' }
};

/** Findings from the last inspected URL, or null before the first one. */
let phishingFindings = null;

/**
 * Reduce a parsed URL to the language-independent facts the panel displays.
 *
 * Known gaps, stated in notePhishing rather than hidden: no IDN homograph or
 * punycode detection, and the path, query string and userinfo are not examined.
 */
function inspectUrl(parsed) {
  const host = parsed.hostname;
  const isIP = /^(\d{1,3}\.){3}\d{1,3}$/.test(host);
  const hasSuspiciousTLD = PHISHING_SUSPICIOUS_TLDS.some(tld => host.endsWith(tld));
  const hyphens = (host.match(/-/g) || []).length;
  const keywords = PHISHING_KEYWORDS.filter(k => host.includes(k));

  let tier = 'low';
  if (isIP || hasSuspiciousTLD || hyphens > 2 || keywords.length > 0) {
    tier = (isIP || (keywords.length > 0 && hasSuspiciousTLD)) ? 'high' : 'suspicious';
  }

  return { host, protocol: parsed.protocol, isIP, hyphens, keywords, tier };
}

function renderPhishingResult() {
  const results = document.getElementById('phishingResults');
  if (!results) return;

  if (!phishingFindings) {
    results.style.display = 'none';
    return;
  }

  const { host, protocol, isIP, hyphens, keywords, tier } = phishingFindings;
  const isZh = currentLang === 'zh-TW';
  const { key: tierKey, colour: riskColor } = PHISHING_TIERS[tier];
  const riskLevel = escapeHtml(t(tierKey));

  // The host and protocol come from user input. new URL() permits `"` and `=`
  // inside a hostname, so parsed parts are not safe by themselves.
  const safeHost = escapeHtml(host);
  const safeProtocol = escapeHtml(protocol);
  const safeKeywords = escapeHtml(keywords.join(', '));

  results.innerHTML = `
    <div style="background: var(--bg-surface); padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); margin-bottom: 1rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
        <strong style="font-size: 1.1rem;">${isZh ? '網址拆解分析:' : 'URL Breakdown:'} ${safeHost}</strong>
        <span style="background: ${riskColor}22; color: ${riskColor}; padding: 0.25rem 0.75rem; border-radius: var(--radius-sm); font-weight: 700; font-family: var(--font-mono); font-size: 0.8rem;">
          ${isZh ? '風險等級:' : 'RISK LEVEL:'} ${riskLevel}
        </span>
      </div>
      <ul style="list-style: none; display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.875rem;">
        <li>🌐 <strong>${isZh ? '目標網域 Host:' : 'Host Domain:'}</strong> <span class="mono">${safeHost}</span></li>
        <li>🔒 <strong>${isZh ? '連線協定 Protocol:' : 'Protocol:'}</strong> <span class="mono">${safeProtocol}</span></li>
        <li>⚠️ <strong>${isZh ? 'IP 網址檢測:' : 'IP Host Detection:'}</strong> ${isIP ? (isZh ? '❌ 偵測到純 IP 位址 (高度可疑)' : '❌ Raw IP Address detected (Suspicious)') : (isZh ? '✅ 標準網域名稱' : '✅ Standard Domain Name')}</li>
        <li>🚩 <strong>${isZh ? '釣魚關鍵字匹配:' : 'Suspicious Keyword Matching:'}</strong> ${keywords.length ? `⚠️ ${isZh ? '命中關鍵字:' : 'Found:'} ${safeKeywords}` : (isZh ? '✅ 未發現常見釣魚詞彙' : '✅ None detected')}</li>
        <li>🔗 <strong>${isZh ? '連字號密度分析:' : 'Hyphenation Density:'}</strong> ${hyphens > 2 ? `⚠️ ${isZh ? '密度過高' : 'High'} (${hyphens} ${isZh ? '個連字號' : 'hyphens'})` : (isZh ? '✅ 數量正常' : '✅ Normal')}</li>
      </ul>
    </div>
  `;

  results.style.display = 'block';
}

function initPhishingInspector() {
  const form = document.getElementById('phishingForm');
  const input = document.getElementById('phishingUrlInput');

  if (!form || !input) return;

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

    phishingFindings = inspectUrl(parsed);
    renderPhishingResult();
    showToast(
      currentLang === 'zh-TW'
        ? `已完成 ${phishingFindings.host} 之釣魚特徵分析`
        : `URL analysis generated for ${phishingFindings.host}`,
      'info'
    );
  });
}

/* ------------------------------------------------------------------------- *
 * Tool 4: Dark Web Exposure Search Simulator
 *
 * Split into state / render / bind for the same reason as Tools 1 and 3.
 * ------------------------------------------------------------------------- */

/** The last query string, or '' before the first search. */
let darkwebQuery = '';

/**
 * NOTE: a deterministic stub, not a lookup. No breach database is queried
 * (app.js makes zero network requests). The verdict is a pure function of the
 * query so that both languages agree, and it is meaningless either way — which
 * is why noteDarkwebInline is rendered above every result.
 */
function darkwebIsBreached(query) {
  return query.includes('test') || query.includes('admin') || query.length % 2 === 0;
}

function renderDarkwebResult() {
  const results = document.getElementById('darkwebResults');
  if (!results) return;

  if (!darkwebQuery) {
    results.style.display = 'none';
    return;
  }

  const isZh = currentLang === 'zh-TW';
  const isBreached = darkwebIsBreached(darkwebQuery);
  const safeQuery = escapeHtml(darkwebQuery);
  const simNotice = `<div class="demo-note demo-note-inline">${escapeHtml(t('noteDarkwebInline'))}</div>`;

  if (!isBreached) {
    results.innerHTML = `
      ${simNotice}
      <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); padding: 1.25rem; border-radius: var(--radius-md); text-align: center;">
        <span style="font-size: 2rem; display: block; margin-bottom: 0.5rem;">🛡️</span>
        <strong style="color: var(--accent-emerald); font-size: 1.1rem; display: block;">${isZh ? '示範結果：未發現外洩紀錄' : 'SAMPLE RESULT: NO EXPOSURE FOUND'}</strong>
        <p style="color: var(--text-secondary); font-size: 0.85rem; margin-top: 0.35rem;">${isZh ? `此為示範輸出，並未實際查詢 <strong>${safeQuery}</strong>。` : `This is sample output. No lookup was performed for <strong>${safeQuery}</strong>.`}</p>
      </div>
    `;
  } else {
    results.innerHTML = `
      ${simNotice}
      <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); padding: 1.25rem; border-radius: var(--radius-md);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
          <strong style="color: var(--accent-rose); font-size: 1.1rem;">⚠️ ${isZh ? '示範情境：虛構的 2 筆外洩紀錄' : 'SAMPLE SCENARIO: 2 FICTIONAL RECORDS'}</strong>
          <span class="mono" style="font-size: 0.75rem; color: var(--text-muted);">${isZh ? '查詢目標:' : 'TARGET:'} ${safeQuery}</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          <div style="background: var(--bg-surface); padding: 0.75rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
            <strong style="font-size: 0.9rem; display: block; color: var(--accent-amber);">${isZh ? '1.〔範例〕Stealer 惡意軟體日誌庫' : '1. [EXAMPLE] Stealer Malware Log Corpus'}</strong>
            <span style="font-size: 0.8rem; color: var(--text-secondary);">${isZh ? '此類外洩通常包含：明文密碼、瀏覽器 Cookie、登入來源 IP' : 'This breach class typically exposes: plaintext passwords, browser cookies, source IP'}</span>
          </div>
          <div style="background: var(--bg-surface); padding: 0.75rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
            <strong style="font-size: 0.9rem; display: block; color: var(--accent-amber);">${isZh ? '2.〔範例〕電商平台資料庫洩漏' : '2. [EXAMPLE] E-commerce Database Leak'}</strong>
            <span style="font-size: 0.8rem; color: var(--text-secondary);">${isZh ? '此類外洩通常包含：Email、密碼雜湊、帳單地址' : 'This breach class typically exposes: email, password hashes, billing address'}</span>
          </div>
        </div>
        <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.85rem;">${escapeHtml(t('noteDarkwebAction'))}</p>
      </div>
    `;
  }

  results.style.display = 'block';
}

function initDarkWebChecker() {
  const form = document.getElementById('darkwebForm');
  const input = document.getElementById('darkwebEmailInput');

  if (!form || !input) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = input.value.trim();
    if (!query) return;

    showToast(
      currentLang === 'zh-TW'
        ? `正在產生 ${query} 的模擬查詢結果...`
        : `Generating simulated result for ${query}...`,
      'info'
    );

    setTimeout(() => {
      darkwebQuery = query;
      renderDarkwebResult();
      showToast(
        currentLang === 'zh-TW' ? '模擬的暗網查詢結果已更新' : 'Simulated dark web result updated',
        'success'
      );
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

/**
 * Filter state lives at module scope, not inside initCVEExplorer's closure.
 *
 * renderCVEs() has to be callable from setLanguage(), and the search text and
 * severity filter have to survive that call — a language switch must not
 * silently reset the list the user narrowed down.
 */
let cveActiveSeverity = 'ALL';
let cveSearchQuery = '';

function renderCVEs() {
  const container = document.getElementById('cveListContainer');
  if (!container) return;

  const isZh = currentLang === 'zh-TW';

  const filtered = CVE_DATABASE.filter(item => {
    const matchesSev = cveActiveSeverity === 'ALL' || item.severity === cveActiveSeverity;
    const title = isZh ? item.titleZh : item.titleEn;
    const desc = isZh ? item.descZh : item.descEn;
    const matchesText = item.id.toLowerCase().includes(cveSearchQuery) ||
                        title.toLowerCase().includes(cveSearchQuery) ||
                        desc.toLowerCase().includes(cveSearchQuery) ||
                        item.software.toLowerCase().includes(cveSearchQuery);
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

function initCVEExplorer() {
  const container = document.getElementById('cveListContainer');
  const searchInput = document.getElementById('cveSearchInput');
  const filterBtns = document.querySelectorAll('.filter-btn');

  if (!container) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      cveActiveSeverity = btn.getAttribute('data-severity');
      renderCVEs();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      cveSearchQuery = e.target.value.toLowerCase().trim();
      renderCVEs();
    });
  }

  // No initial render here: setLanguage() does it, for whichever language is
  // active. The filter buttons live in the static markup, so binding them once
  // is enough.
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

/**
 * Audit quiz progress is held at module scope on purpose.
 * renderAuditQuiz() replaces #quizWizard's innerHTML on every language switch
 * and restart but leaves the container element itself in place. Keeping the
 * step/score in a per-call closure meant old listeners survived with stale
 * state, so after a restart the first click jumped straight to the result step
 * with an accumulated score.
 */
let quizCurrentStep = 1;
let quizTotalScore = 0;

function renderAuditQuiz() {
  const wizard = document.getElementById('quizWizard');
  if (!wizard) return;

  const isZh = currentLang === 'zh-TW';
  const questions = QUIZ_QUESTIONS[currentLang] || QUIZ_QUESTIONS['zh-TW'];
  const totalQuestions = questions.length;

  let html = '';

  questions.forEach((q, idx) => {
    const qNum = idx + 1;
    html += `
      <div class="quiz-step ${qNum === 1 ? 'active' : ''}" data-step="${qNum}">
        <span style="font-family: var(--font-mono); color: var(--accent-cyan); font-size: 0.8rem;">
          ${isZh ? `問題 ${qNum} / ${totalQuestions}` : `QUESTION ${qNum} OF ${totalQuestions}`}
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

  // Final step. Score, tier and recommendation start empty: the previous
  // hardcoded "TIER 4: ENTERPRISE SENTINEL" placeholder meant any failure in
  // the scoring path would surface as a flattering top grade.
  html += `
    <div class="quiz-step" id="quizResultStep">
      <div style="text-align: center; padding: 1rem 0;">
        <span style="font-size: 3rem; display: block; margin-bottom: 0.5rem;">🏆</span>
        <h3 style="font-size: 1.75rem; margin-bottom: 0.5rem;">${isZh ? '資安防禦成熟度評估完成' : 'Audit Score Analysis Complete'}</h3>
        <div style="font-size: 3.5rem; font-weight: 800; font-family: var(--font-mono); color: var(--accent-cyan);" id="quizFinalScore"></div>
        <p id="quizTierBadge" style="font-weight: 700; margin-bottom: 1rem; font-size: 1.2rem;"></p>
        <p id="quizRecommendation" style="color: var(--text-secondary); max-width: 540px; margin: 0 auto 1.5rem;"></p>
        <div class="demo-note demo-note-inline" style="max-width: 560px; margin: 0 auto 1.5rem; text-align: left;">${escapeHtml(t('noteAudit'))}</div>
        <button class="btn btn-primary" id="printReportBtn">${isZh ? '列印 / 下載資安成熟度評估報告 📄' : 'Download / Print Security Assessment Report 📄'}</button>
        <button class="btn btn-secondary" id="restartQuizBtn" style="margin-left: 0.5rem;">${isZh ? '重新評估' : 'Restart Audit'}</button>
      </div>
    </div>
  `;

  wizard.innerHTML = html;

  // A render always returns the wizard to question 1, so the score resets too.
  quizCurrentStep = 1;
  quizTotalScore = 0;

  bindAuditQuiz();
}

/**
 * Bind exactly one delegated click listener for the lifetime of #quizWizard.
 * The marker lives on the element (not in a module flag) so that replacing the
 * container would correctly yield a fresh binding.
 */
function bindAuditQuiz() {
  const wizard = document.getElementById('quizWizard');
  if (!wizard || wizard.dataset.quizBound === '1') return;

  wizard.addEventListener('click', handleQuizClick);
  wizard.dataset.quizBound = '1';
}

function handleQuizClick(e) {
  const wizard = document.getElementById('quizWizard');
  if (!wizard) return;

  if (e.target.closest('#restartQuizBtn')) {
    renderAuditQuiz();
    return;
  }

  // Replaces an inline onclick="window.print()" attribute, which would have
  // required script-src 'unsafe-inline' in any future CSP.
  if (e.target.closest('#printReportBtn')) {
    window.print();
    return;
  }

  const btn = e.target.closest('.quiz-opt-btn');
  if (!btn) return;

  quizTotalScore += parseInt(btn.getAttribute('data-score') || '0', 10);

  const activeStepEl = wizard.querySelector(`.quiz-step[data-step="${quizCurrentStep}"]`);
  if (activeStepEl) activeStepEl.classList.remove('active');

  quizCurrentStep++;
  const nextStepEl = wizard.querySelector(`.quiz-step[data-step="${quizCurrentStep}"]`);

  if (nextStepEl) {
    nextStepEl.classList.add('active');
    return;
  }

  showQuizResult();
}

function showQuizResult() {
  const isZh = currentLang === 'zh-TW';

  const resultStep = document.getElementById('quizResultStep');
  const scoreNum = document.getElementById('quizFinalScore');
  const tierBadge = document.getElementById('quizTierBadge');
  const rec = document.getElementById('quizRecommendation');

  if (resultStep) resultStep.classList.add('active');
  if (scoreNum) scoreNum.textContent = `${quizTotalScore} / 100`;
  if (!tierBadge || !rec) return;

  if (quizTotalScore >= 85) {
    tierBadge.textContent = isZh ? '層級 4：企業高階哨兵 (Enterprise Sentinel)' : 'TIER 4: ENTERPRISE SENTINEL';
    tierBadge.style.color = 'var(--accent-emerald)';
    rec.textContent = isZh ? '貴單位具備優異的深度防禦機制，且具備自動化 SOC 遙測與應變能力。' : 'Outstanding security controls with proactive defense-in-depth and automated SOC telemetry.';
  } else if (quizTotalScore >= 60) {
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
      showToast(currentLang === 'zh-TW' ? '示範完成：未傳送資料，也未發出任何緊急通報。' : 'Demo complete: no data was transmitted and no emergency alert was dispatched.', 'info');
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
      showToast(currentLang === 'zh-TW' ? '正在重新產生模擬遙測畫面...' : 'Regenerating the simulated telemetry display...', 'info');
    });
  }
}
