import { create } from "zustand";

const LS_KEY = "tolab_session";

interface SessionData {
  autoLogout: boolean;
  autoLogoutMinutes: number;
  loginTime: number | null;
}

interface SessionState extends SessionData {
  setAutoLogout: (on: boolean, minutes?: number) => void;
  recordLogin: () => void;
}

function load(): SessionData {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return {
          autoLogout: !!parsed.autoLogout,
          autoLogoutMinutes: typeof parsed.autoLogoutMinutes === "number" ? parsed.autoLogoutMinutes : 30,
          loginTime: typeof parsed.loginTime === "number" ? parsed.loginTime : null,
        };
      }
    }
  } catch {}
  return { autoLogout: false, autoLogoutMinutes: 30, loginTime: null };
}

function save(data: SessionData) {
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}

export const useSessionStore = create<SessionState>((set, get) => ({
  ...load(),

  setAutoLogout: (on, minutes) => {
    const data: SessionData = {
      autoLogout: on,
      autoLogoutMinutes: minutes ?? get().autoLogoutMinutes,
      loginTime: get().loginTime,
    };
    save(data);
    set(data);
  },

  recordLogin: () => {
    const data: SessionData = {
      autoLogout: get().autoLogout,
      autoLogoutMinutes: get().autoLogoutMinutes,
      loginTime: Date.now(),
    };
    save(data);
    set(data);
  },
}));
