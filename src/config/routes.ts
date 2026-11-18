import {
  LayoutDashboard,
  Building2,
  ChartNoAxesGantt,
  ClipboardCheck,
  Handshake,
  Truck,
  FileSignature,
  FolderOpen,
  Users,
  ClipboardList,
} from "lucide-react";
export const navigation = [
  { path: "/", lt: "Apžvalga", en: "Overview", icon: LayoutDashboard },
  { path: "/projects", lt: "Projektai", en: "Projects", icon: Building2 },
  {
    path: "/planning",
    lt: "Planavimas",
    en: "Planning",
    icon: ChartNoAxesGantt,
  },
  {
    path: "/tasks",
    lt: "Kasdienės užduotys",
    en: "Daily tasks",
    icon: ClipboardCheck,
  },
  { path: "/tenders", lt: "Konkursai", en: "Tenders", icon: Handshake },
  {
    path: "/suppliers",
    lt: "Tiekėjai ir subrangovai",
    en: "Suppliers & subcontractors",
    icon: Truck,
  },
  { path: "/contracts", lt: "Sutartys", en: "Contracts", icon: FileSignature },
  { path: "/documents", lt: "Dokumentai", en: "Documents", icon: FolderOpen },
  { path: "/handover", lt: "Pridavimas", en: "Handover", icon: ClipboardList },
  {
    path: "/users",
    lt: "Naudotojai ir prieigos",
    en: "Users & access",
    icon: Users,
  },
];
