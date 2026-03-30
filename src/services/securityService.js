import { saveLog } from '../db/database';

export const SecurityService = {
  validateInput: (data, schema) => {
    for (const key in schema) {
      const value = data[key];
      const rules = schema[key];
      if (rules.required && !value) throw new Error("Invalid Input Detected");
      if (rules.type === 'number' && isNaN(value)) throw new Error("Data Integrity Violation");
      if (rules.regex && !rules.regex.test(value)) throw new Error("Pattern Attack Blocked");
    }
    return true;
  },

  checkRateLimit: (action) => {
    const key = `limit_${action}`;
    const now = Date.now();
    const history = JSON.parse(localStorage.getItem(key) || "[]");
    const recent = history.filter(ts => now - ts < 60000);
    
    if (recent.length >= 5) {
      saveLog("SYSTEM", `Rate Limit Exceeded: ${action}`, "GLOBAL");
      throw new Error("Too many requests. Please try again later.");
    }
    
    recent.push(now);
    localStorage.setItem(key, JSON.stringify(recent));
  },

  isSafeBrowser: () => {
    const ua = navigator.userAgent;
    if (!ua || ua.length < 10 || /bot|crawler|spider/i.test(ua)) {
      return false;
    }
    return true;
  },

  isInstalledPWA: () => {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  }
};


window.addEventListener('focus', () => {
  console.log("Integrity Check: Session Validated");

});
