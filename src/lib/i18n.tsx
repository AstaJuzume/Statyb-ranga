import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import dayjs from "dayjs";
import "dayjs/locale/lt";
import "dayjs/locale/en";
import type { Lang, Role } from "./types";
interface AppContextValue {
  lang: Lang;
  setLang: (v: Lang) => void;
  t: (lt: string, en: string) => string;
  personId: string;
  setPersonId: (id: string) => void;
  role: Role;
  setRole: (role: Role) => void;
}
const Context = createContext<AppContextValue | null>(null);
export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(
    localStorage.getItem("sr.lang") === "en" ? "en" : "lt",
  );
  const [personId, setPersonId] = useState(
    localStorage.getItem("sr.person") || "u1",
  );
  const [role, setRole] = useState<Role>(
    (localStorage.getItem("sr.role") as Role) || "manager",
  );
  useEffect(() => {
    localStorage.setItem("sr.lang", lang);
    document.documentElement.lang = lang;
    dayjs.locale(lang);
  }, [lang]);
  useEffect(() => {
    localStorage.setItem("sr.person", personId);
    localStorage.setItem("sr.role", role);
  }, [personId, role]);
  return (
    <Context.Provider
      value={{
        lang,
        setLang,
        t: (lt, en) => (lang === "lt" ? lt : en),
        personId,
        setPersonId,
        role,
        setRole,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useApp() {
  const context = useContext(Context);
  if (!context) throw new Error("AppProvider required");
  return context;
}
