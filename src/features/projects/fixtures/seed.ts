import dayjs from "dayjs";
import type { Database, Localized, Status, Category } from "../../../lib/types";
const l = (lt: string, en: string): Localized => ({ lt, en });
const names = [
  "Mantas Petrauskas",
  "Rūta Kazlauskienė",
  "Tomas Jankauskas",
  "Ieva Vaitkutė",
  "Darius Stankevičius",
  "Agnė Žukauskaitė",
  "Andrius Balčiūnas",
  "Lina Paulauskienė",
  "Mindaugas Šimkus",
  "Giedrė Kavaliauskė",
  "Vytautas Urbonas",
  "Justas Norkus",
];
export function seed(): Database {
  const people = names.map((name, i) => ({
    id: `u${i + 1}`,
    name,
    email:
      [
        "mantas.petrauskas",
        "ruta.kazlauskiene",
        "tomas.jankauskas",
        "ieva.vaitkute",
        "darius.stankevicius",
        "agne.zukauskaite",
        "andrius.balciunas",
        "lina.paulauskiene",
        "mindaugas.simkus",
        "giedre.kavaliauske",
        "vytautas.urbonas",
        "justas.norkus",
      ][i] + "@rangosimone.lt",
    role: (
      [
        "manager",
        "manager",
        "procurement",
        "admin",
        "worker",
        "manager",
        "worker",
        "procurement",
        "worker",
        "admin",
        "worker",
        "worker",
      ] as const
    )[i],
    phone: `+370 612 ${String(43010 + i * 13)}`,
  }));
  const projectNames = [
    l("Paupio verslo centras", "Paupys business centre"),
    l("Ąžuolų gyvenamasis kvartalas", "Ąžuolai residential district"),
    l("Kauno logistikos centras", "Kaunas logistics centre"),
    l("Klaipėdos sveikatos klinika", "Klaipėda health clinic"),
    l("Trakų poilsio kompleksas", "Trakai leisure complex"),
    l("Naujamiesčio biurų renovacija", "Naujamiestis office renovation"),
    l("Vilniaus mokyklos priestatas", "Vilnius school extension"),
  ];
  const projects = projectNames.map((name, i) => ({
    id: `p${i + 1}`,
    name,
    address: [
      "Aukštaičių g. 12, Vilnius",
      "Ąžuolų g. 8, Vilniaus r.",
      "Terminalo g. 5, Kaunas",
      "Taikos pr. 48, Klaipėda",
      "Galvės g. 16, Trakai",
      "Naugarduko g. 32, Vilnius",
      "S. Nėries g. 24, Vilnius",
    ][i],
    client: [
      "UAB Vilniaus statybų grupė",
      "AB Ypsonas",
      "UAB Mitnija",
      "UAB Pajūrio sveikata",
      "UAB Galvės projektai",
      "UAB Miesto erdvės",
      "Vilniaus miesto savivaldybė",
    ][i],
    managerId: ["u1", "u2", "u6"][i % 3],
    worksManagerId: ["u5", "u7", "u9"][i % 3],
    team: Array.from(
      new Set([
        ["u1", "u2", "u6"][i % 3],
        ["u5", "u7", "u9"][i % 3],
        i % 2 ? "u8" : "u3",
        ...["u5", "u7", "u9", "u11", "u12"].filter((_, k) => (k + i) % 3 !== 0),
      ]),
    ),
    start: [
      "2026-07-06",
      "2026-08-03",
      "2026-09-01",
      "2026-08-17",
      "2026-10-05",
      "2026-03-02",
      "2026-12-01",
    ][i],
    deadline: [
      "2027-04-30",
      "2027-06-30",
      "2027-05-14",
      "2027-02-26",
      "2027-08-31",
      "2026-11-13",
      "2027-08-20",
    ][i],
    status: (
      [
        "active",
        "active",
        "blocked",
        "active",
        "active",
        "done",
        "planned",
      ] as Status[]
    )[i],
    budget: [2840000, 3960000, 4520000, 1620000, 2150000, 780000, 1340000][i],
  }));
  const workNames = [
    l("Žemės darbai ir pamatai", "Earthworks and foundations"),
    l("Gelžbetonio konstrukcijų įrengimas", "Reinforced concrete structures"),
    l("Fasadų šiltinimas ir apdaila", "Facade insulation and finishing"),
    l("Šildymas, vėdinimas ir elektra", "Heating, ventilation and electrical"),
    l("Vidaus apdailos darbai", "Interior finishing"),
    l("Aplinkotvarka ir pridavimas", "Landscaping and handover"),
  ];
  const groups = [
    l("01 · Paruošiamieji darbai", "01 · Preparation"),
    l("02 · Konstrukcijos", "02 · Structures"),
    l("03 · Apdaila ir inžinerija", "03 · Finishing and engineering"),
  ];
  const works = projects.flatMap((p, i) =>
    workNames.map((name, k) => ({
      id: `w${i + 1}-${k}`,
      projectId: p.id,
      group: groups[k === 0 ? 0 : k === 1 ? 1 : 2],
      name,
      quantity: Math.round(
        [1450, 380, 2400, 1, 3200, 1650][k] *
          (k === 3 ? 1 : [1, 1.4, 1.8, 0.8, 1.2, 0.5, 0.7][i]),
      ),
      unit: ["m³", "m³", "m²", "kompl.", "m²", "m²"][k],
      rate: Math.round(
        [32, 210, 58, 146000, 48, 36][k] *
          (k === 3 ? [1, 1.4, 1.8, 0.8, 1.2, 0.5, 0.7][i] : 1 + (i % 3) * 0.03),
      ),
    })),
  );
  const stages = [
    l("Darbų paruošimas ir užsakymas", "Preparation and ordering"),
    l("Darbų vykdymas ir kokybės patikra", "Execution and quality control"),
  ];
  const processes = works.flatMap((w, i) =>
    stages.map((name, k) => {
      const statusMatrix: Status[][] = [
        [
          "done",
          "done",
          "done",
          "active",
          "blocked",
          "planned",
          "active",
          "planned",
          "planned",
          "planned",
          "cancelled",
          "cancelled",
        ],
        [
          "done",
          "done",
          "done",
          "done",
          "done",
          "active",
          "active",
          "planned",
          "planned",
          "planned",
          "planned",
          "planned",
        ],
        [
          "done",
          "done",
          "blocked",
          "planned",
          "blocked",
          "planned",
          "active",
          "planned",
          "planned",
          "planned",
          "cancelled",
          "cancelled",
        ],
        [
          "done",
          "done",
          "done",
          "done",
          "done",
          "done",
          "done",
          "active",
          "planned",
          "planned",
          "planned",
          "planned",
        ],
        [
          "done",
          "active",
          "planned",
          "planned",
          "planned",
          "planned",
          "planned",
          "planned",
          "planned",
          "planned",
          "planned",
          "planned",
        ],
      ];
      const projectIndex = Number(w.projectId.slice(1)) - 1;
      const status: Status =
        projectIndex === 5
          ? "done"
          : projectIndex === 6
            ? "planned"
            : statusMatrix[projectIndex][(i % 6) * 2 + k];
      const start = dayjs(
        w.projectId === "p6"
          ? "2026-10-01"
          : w.projectId === "p7"
            ? "2026-12-02"
            : "2026-11-02",
      ).add((i % 6) * 4 + k * 7, "day");
      return {
        id: `pr${i}-${k}`,
        projectId: w.projectId,
        workId: w.id,
        name,
        assigneeId: ["u1", "u5", "u7", "u9", "u3", "u11"][i % 6],
        start: start.format("YYYY-MM-DD"),
        deadline: start.add(5 + k * 3, "day").format("YYYY-MM-DD"),
        status,
        dependencies: k ? [`pr${i}-0`] : [],
        comments:
          i % 4 === 0
            ? [
                {
                  id: `cm${i}`,
                  personId: "u1",
                  text: "Patvirtintas darbų eiliškumas. / Work sequence approved.",
                  date: "2026-11-16",
                },
              ]
            : [],
      };
    }),
  );
  const taskNames = [
    l("Patikrinti pamatų hidroizoliaciją", "Inspect foundation waterproofing"),
    l("Priimti armatūros pristatymą", "Accept reinforcement delivery"),
    l("Užfiksuoti fasado mazgų nuotraukas", "Photograph facade junctions"),
    l("Suderinti vėdinimo ortakių trasas", "Coordinate ventilation routes"),
    l("Atlikti betono kokybės bandymą", "Perform concrete quality test"),
    l("Paruošti savaitės darbų aktą", "Prepare weekly work report"),
    l("Patikrinti saugos aptvėrimus", "Inspect safety barriers"),
  ];
  const tasks = Array.from({ length: 24 }, (_, i) => ({
    id: `t${i + 1}`,
    projectId: `p${(i % 7) + 1}`,
    workId: `w${(i % 7) + 1}-${[0, 1, 2, 3, 1, 5, 0][(i + Math.floor(i / 7) * 2) % 7]}`,
    processId:
      processes.find(
        (p) =>
          p.workId ===
          `w${(i % 7) + 1}-${[0, 1, 2, 3, 1, 5, 0][(i + Math.floor(i / 7) * 2) % 7]}`,
      )?.id || "",
    name: taskNames[(i + Math.floor(i / 7) * 2) % 7],
    assigneeId: ["u5", "u7", "u9", "u11", "u12", "u1"][i % 6],
    supplierId: "",
    deadline:
      i === 18
        ? "2026-11-18"
        : dayjs(
            i % 7 === 5
              ? "2026-11-01"
              : i % 7 === 6
                ? "2026-12-02"
                : "2026-11-14",
          )
            .add(i % 12, "day")
            .format("YYYY-MM-DD"),
    status: (i === 0
      ? "active"
      : i % 7 === 5
        ? "done"
        : i % 7 === 6
          ? "planned"
          : i % 4 === 0
            ? "done"
            : i % 6 === 0
              ? "active"
              : "planned") as Status,
    comments: [],
    attachments: [],
  }));
  const supplierNames = [
    "UAB Betonika",
    "UAB Vilniaus konstrukcijos",
    "UAB Termovėjas",
    "UAB Fasadų meistrai",
    "UAB Elektros sprendimai",
    "UAB Statybų tiekimas",
    "UAB Grindų linija",
    "UAB Žalioji aplinka",
    "UAB Plieno projektai",
  ];
  const suppliers = supplierNames.map((name, i) => ({
    id: `s${i + 1}`,
    name,
    code: String(302418620 + i * 731),
    email: `pardavimai@${["betonika", "vilniauskonstrukcijos", "termovejas", "fasadumeistrai", "elektrossprendimai", "statybutiekimas", "grindulinija", "zaliojiaplinka", "plienoprojektai"][i]}.lt`,
    phone: `+370 650 ${18420 + i * 111}`,
    contact: [
      "Jonas Butkus",
      "Rasa Jakubauskienė",
      "Paulius Mikalauskas",
      "Saulius Rimkus",
      "Dovilė Petraitytė",
      "Eglė Jonaitytė",
      "Karolis Žemaitis",
      "Aistė Venskutė",
      "Gediminas Dambrauskas",
    ][i],
    categories: (
      [
        ["structure", "materials"],
        ["structure"],
        ["engineering"],
        ["finishing"],
        ["engineering"],
        ["materials", "structure"],
        ["finishing"],
        ["general"],
        ["structure", "materials"],
      ] as Category[][]
    )[i],
    address: [
      "Pramonės g. 18, Vilnius",
      "Metalo g. 6, Vilnius",
      "Savanorių pr. 112, Kaunas",
      "Laisvės pr. 54, Vilnius",
      "Taikos pr. 71, Klaipėda",
      "Sandėlių g. 3, Kaunas",
      "Draugystės g. 12, Kaunas",
      "Žalioji g. 9, Trakai",
      "Plieno g. 4, Vilnius",
    ][i],
  }));
  const documents = projects.flatMap((p, i) =>
    (
      [
        "general",
        "architecture",
        "structure",
        "engineering",
        "tender",
      ] as Category[]
    ).map((category, k) => ({
      id: `d${i}-${k}`,
      projectId: p.id,
      name: [
        l("Statybą leidžiantis dokumentas", "Construction permit"),
        l(
          "Architektūriniai planai · A laida",
          "Architectural plans · revision A",
        ),
        l("Konstrukcijų darbo projektas", "Structural working design"),
        l("Inžinerinių sistemų brėžiniai", "Engineering systems drawings"),
        l(
          "Techninė specifikacija ir kiekių žiniaraštis",
          "Technical specification and bill of quantities",
        ),
      ][k],
      category,
      url: `https://drive.google.com/drive/u/0/search?q=${encodeURIComponent(p.name.lt)}`,
      date: "2026-11-12",
      personId: p.managerId,
    })),
  );
  const supplierSets = [
    ["s1", "s2", "s6", "s9"],
    ["s4", "s7"],
    ["s3", "s5"],
    ["s4", "s7"],
    ["s1", "s6", "s9"],
    ["s1", "s2", "s6"],
    ["s3", "s5"],
  ];
  const tenders = Array.from({ length: 7 }, (_, i) => ({
    id: `tn${i + 1}`,
    projectId: `p${(i % 5) + 1}`,
    workId: `w${(i % 5) + 1}-${i % 6}`,
    name: [
      l("Gelžbetonio konstrukcijų tiekimas", "Reinforced concrete supply"),
      l("Fasadų šiltinimo darbai", "Facade insulation works"),
      l("Vėdinimo sistemų montavimas", "Ventilation system installation"),
      l("Vidaus apdailos rangovas", "Interior finishing contractor"),
      l("Armatūros ir plieno tiekimas", "Reinforcement and steel supply"),
      l("Pamatų betonavimo darbai", "Foundation concreting works"),
      l("Elektros instaliacijos darbai", "Electrical installation works"),
    ][i],
    category: (
      [
        "structure",
        "finishing",
        "engineering",
        "finishing",
        "materials",
        "structure",
        "engineering",
      ] as Category[]
    )[i],
    supplierIds: supplierSets[i],
    deadline: dayjs("2026-11-17")
      .add(i * 3, "day")
      .format("YYYY-MM-DD"),
    status: (
      [
        "evaluating",
        "sent",
        "draft",
        "awarded",
        "closed",
        "evaluating",
        "sent",
      ] as Status[]
    )[i],
    documentIds: [`d${i % 5}-4`],
    template: "standard",
    offers: (i === 2 ? [] : supplierSets[i]).map((supplierId, k) => ({
      supplierId,
      price: [79800, 84200, 76500, 88100][k] + i * 9300,
      days: 21 + k * 7,
      note: "",
    })),
    winnerId: i === 3 ? "s4" : i === 4 ? "s6" : "",
  }));
  const contracts = Array.from({ length: 6 }, (_, i) => ({
    id: `c${i + 1}`,
    number: `SR-2026-${String(41 + i).padStart(3, "0")}`,
    name: [
      l("Konstrukcijų tiekimo sutartis", "Structural supply agreement"),
      l("Fasadų rangos sutartis", "Facade subcontract"),
      l("Vėdinimo įrangos montavimas", "Ventilation equipment installation"),
      l("Vidaus apdailos rangos sutartis", "Interior finishing subcontract"),
      l("Medžiagų tiekimo sutartis", "Materials supply agreement"),
      l("Aplinkotvarkos sutartis", "Landscaping agreement"),
    ][i],
    projectId: `p${(i % 5) + 1}`,
    supplierId: ["s1", "s4", "s3", "s4", "s6", "s8"][i],
    tenderId: i === 3 ? "tn4" : i === 4 ? "tn5" : "",
    category: (
      [
        "structure",
        "finishing",
        "engineering",
        "finishing",
        "materials",
        "general",
      ] as Category[]
    )[i],
    amount: i === 3 ? 107700 : i === 4 ? 121400 : 79800 + i * 14000,
    deadline: dayjs("2026-11-19")
      .add(i * 4, "day")
      .format("YYYY-MM-DD"),
    status: (
      [
        "review",
        "signing",
        "draft",
        "approved",
        "signed",
        "rejected",
      ] as Status[]
    )[i],
    approvers: [
      {
        personId: "u1",
        status: (i === 0 || i === 2
          ? "pending"
          : i === 5
            ? "rejected"
            : "approved") as "pending" | "approved" | "rejected",
      },
      {
        personId: "u4",
        status: (i === 0 || i === 2
          ? "pending"
          : i === 5
            ? "rejected"
            : "approved") as "pending" | "approved" | "rejected",
      },
    ],
    signers: [
      {
        name: "Ieva Vaitkutė",
        email: "ieva.vaitkute@rangosimone.lt",
        status: (i === 1 || i === 4 ? "signed" : "pending") as
          | "pending"
          | "signed",
      },
      {
        name: suppliers[[0, 3, 2, 3, 5, 7][i]].contact,
        email: suppliers[[0, 3, 2, 3, 5, 7][i]].email,
        status: (i === 4 ? "signed" : "pending") as "pending" | "signed",
      },
    ],
    attachment: {
      name: `SR-2026-${41 + i}.txt`,
      url:
        "data:text/plain;charset=utf-8," +
        encodeURIComponent("Demonstracinė sutartis / Demo contract"),
    },
    signedAttachment:
      i === 4
        ? {
            name: "SR-2026-045_pasirasytas.txt",
            url:
              "data:text/plain;charset=utf-8," +
              encodeURIComponent(
                "Pasirašytos sutarties demonstracinis dokumentas / Signed contract demo document",
              ),
          }
        : null,
  }));
  const handovers = projects.flatMap((p, i) =>
    [
      l("Atliktų darbų aktų patvirtinimas", "Approval of completed works"),
      l("Sistemų bandymai ir protokolai", "System tests and certificates"),
      l("Objekto perdavimas užsakovui", "Handover to the client"),
    ].map((name, k) => ({
      id: `h${i}-${k}`,
      projectId: p.id,
      name,
      assigneeId: p.managerId,
      deadline: dayjs(p.deadline)
        .subtract((2 - k) * 7, "day")
        .format("YYYY-MM-DD"),
      status: (i === 5
        ? "done"
        : i === 6
          ? "planned"
          : i === 2 && k === 0
            ? "blocked"
            : k === 0
              ? "active"
              : "planned") as Status,
      documentIds: [`d${i}-${k}`],
    })),
  );
  return {
    people,
    projects,
    works,
    processes,
    tasks,
    suppliers,
    tenders,
    contracts,
    documents,
    handovers,
  };
}
