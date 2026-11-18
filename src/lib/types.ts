export type Lang = "lt" | "en";
export type Localized = Record<Lang, string>;
export type Role = "manager" | "procurement" | "worker" | "admin";
export type Status =
  | "planned"
  | "active"
  | "blocked"
  | "done"
  | "cancelled"
  | "draft"
  | "sent"
  | "evaluating"
  | "awarded"
  | "closed"
  | "review"
  | "approved"
  | "signing"
  | "signed"
  | "rejected";
export type Category =
  | "general"
  | "architecture"
  | "structure"
  | "engineering"
  | "tender"
  | "finishing"
  | "materials";
export interface Base {
  id: string;
}
export interface Person extends Base {
  name: string;
  email: string;
  role: Role;
  phone: string;
}
export interface Project extends Base {
  name: Localized;
  address: string;
  client: string;
  managerId: string;
  worksManagerId: string;
  team: string[];
  start: string;
  deadline: string;
  status: Status;
  budget: number;
}
export interface Work extends Base {
  projectId: string;
  group: Localized;
  name: Localized;
  quantity: number;
  unit: string;
  rate: number;
}
export interface Comment {
  id: string;
  personId: string;
  text: string;
  date: string;
}
export interface Attachment {
  name: string;
  url: string;
}
export interface Process extends Base {
  projectId: string;
  workId: string;
  name: Localized;
  assigneeId: string;
  start: string;
  deadline: string;
  status: Status;
  dependencies: string[];
  comments: Comment[];
}
export interface Task extends Base {
  projectId: string;
  workId: string;
  processId: string;
  name: Localized;
  assigneeId: string;
  supplierId: string;
  deadline: string;
  status: Status;
  comments: Comment[];
  attachments: Attachment[];
}
export interface Supplier extends Base {
  name: string;
  code: string;
  email: string;
  phone: string;
  contact: string;
  categories: Category[];
  address: string;
}
export interface Offer {
  supplierId: string;
  price: number;
  days: number;
  note: string;
}
export interface Tender extends Base {
  projectId: string;
  workId: string;
  name: Localized;
  category: Category;
  supplierIds: string[];
  deadline: string;
  status: Status;
  documentIds: string[];
  template: string;
  offers: Offer[];
  winnerId: string;
}
export interface Approval {
  personId: string;
  status: "pending" | "approved" | "rejected";
}
export interface Signer {
  name: string;
  email: string;
  status: "pending" | "signed";
}
export interface Contract extends Base {
  number: string;
  name: Localized;
  projectId: string;
  supplierId: string;
  tenderId: string;
  category: Category;
  amount: number;
  deadline: string;
  status: Status;
  approvers: Approval[];
  signers: Signer[];
  attachment: Attachment | null;
  signedAttachment: Attachment | null;
}
export interface Document extends Base {
  projectId: string;
  name: Localized;
  category: Category;
  url: string;
  date: string;
  personId: string;
}
export interface Handover extends Base {
  projectId: string;
  name: Localized;
  assigneeId: string;
  deadline: string;
  status: Status;
  documentIds: string[];
}
export interface Database {
  people: Person[];
  projects: Project[];
  works: Work[];
  processes: Process[];
  tasks: Task[];
  suppliers: Supplier[];
  tenders: Tender[];
  contracts: Contract[];
  documents: Document[];
  handovers: Handover[];
}
export const statusLabels: Record<Status, Localized> = {
  planned: { lt: "Planuojama", en: "Planned" },
  active: { lt: "Vykdoma", en: "In progress" },
  blocked: { lt: "Vėluoja", en: "Blocked" },
  done: { lt: "Atlikta", en: "Completed" },
  cancelled: { lt: "Atšaukta", en: "Cancelled" },
  draft: { lt: "Juodraštis", en: "Draft" },
  sent: { lt: "Užklausos išsiųstos", en: "Inquiries sent" },
  evaluating: { lt: "Vertinami pasiūlymai", en: "Evaluating" },
  awarded: { lt: "Laimėtojas pasirinktas", en: "Awarded" },
  closed: { lt: "Užbaigta", en: "Closed" },
  review: { lt: "Derinama", en: "In review" },
  approved: { lt: "Patvirtinta", en: "Approved" },
  signing: { lt: "Pasirašoma", en: "Signing" },
  signed: { lt: "Pasirašyta", en: "Signed" },
  rejected: { lt: "Atmesta", en: "Rejected" },
};
export const roleLabels: Record<Role, Localized> = {
  manager: { lt: "Projekto vadovas", en: "Project Manager" },
  procurement: { lt: "Pirkimų vadovas", en: "Procurement Manager" },
  worker: { lt: "Komandos narys / darbuotojas", en: "Project Team Member" },
  admin: {
    lt: "Vadovybė / administratorius",
    en: "Management / Administrator",
  },
};
export const categoryLabels: Record<Category, Localized> = {
  general: { lt: "Bendra dokumentacija", en: "General documentation" },
  architecture: { lt: "Architektūra", en: "Architecture" },
  structure: { lt: "Konstrukcijos", en: "Structures" },
  engineering: { lt: "Inžinerija", en: "Engineering" },
  tender: { lt: "Konkurso dokumentacija", en: "Tender documentation" },
  finishing: { lt: "Apdailos darbai", en: "Finishing works" },
  materials: { lt: "Statybinės medžiagos", en: "Building materials" },
};
export const processStatuses: Status[] = [
  "planned",
  "active",
  "blocked",
  "done",
  "cancelled",
];
export const tenderStatuses: Status[] = [
  "draft",
  "sent",
  "evaluating",
  "awarded",
  "closed",
];
export const contractStatuses: Status[] = [
  "draft",
  "review",
  "approved",
  "signing",
  "signed",
  "rejected",
];
export const uid = () => crypto.randomUUID();
export const localized = (text: string): Localized => ({ lt: text, en: text });
export const money = (amount: number) =>
  new Intl.NumberFormat("lt-LT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
export const today = "2026-11-18";
export const overdue = (date: string, status: Status) =>
  date < today &&
  !["done", "signed", "closed", "cancelled", "rejected"].includes(status);

export const nextContractNumber = (contracts: Contract[]) =>
  "SR-2026-" +
  String(
    Math.max(
      40,
      ...contracts.map(
        (c) => Number(c.number.match(/SR-2026-(\d+)$/)?.[1]) || 0,
      ),
    ) + 1,
  ).padStart(3, "0");
