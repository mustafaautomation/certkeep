export const DEMO_ACCOUNTS = [
  {
    id: "harbor",
    label: "Harbor owner",
    email: "avery.quin@harbor.example",
    password: "harbor-demo",
    detail: "Full access to the seeded Harbor vault",
  },
  {
    id: "lakeside",
    label: "Lakeside owner",
    email: "jordan.hale@lakeside.example",
    password: "lakeside-demo",
    detail: "A second tenant, isolated from Harbor",
  },
  {
    id: "super",
    label: "Super admin",
    email: "rowan.admin@certkeep.example",
    password: "super-demo",
    detail: "Platform console across organizations",
  },
] as const;
