# AegisGuard Portal

靜態的中英雙語資安示範入口網站：純 HTML / CSS / JavaScript，沒有建置步驟、沒有執行期相依套件。
內含釣魚網址檢查器、密碼強度、雜湊工具、CVE 查詢示範、資安稽核測驗等互動示範，以及模擬的威脅快訊。

## 執行

直接以任何靜態伺服器提供根目錄即可，例如：

```bash
python3 -m http.server 8000
# 開啟 http://localhost:8000
```

## 測試

需要 Node.js 20 以上（CI 使用 Node 24）。

```bash
npm test      # node --check app.js + node --test test/*.test.js
```

測試涵蓋釣魚網址解析、XSS 轉義、i18n、儲存、以及 GitHub Actions workflow 的安全規則（SHA 釘選、最小權限、逾時）。

## CI

- `.github/workflows/ci.yml`：push / PR 時執行 `npm test`。
- `.github/workflows/codeql.yml`：CodeQL 靜態分析。
- Dependabot 只追蹤 GitHub Actions（本專案沒有 npm 相依）。

## 安全注意事項

所有使用者輸入在寫入 DOM 前皆經 `escapeHtml()` 轉義；`test/xss.test.js` 守護此行為。
釣魚範例中的網址（例如 `http://login-paypalls-update.com/…`）僅為示範字串，不會被請求。
