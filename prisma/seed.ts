import { PrismaClient, UserRole } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL tanımlı değil.");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const permissionDefinitions = [
  ["donation:create", "Bağış ekleme"], ["donation:view", "Bağış görüntüleme"],
  ["donation:update", "Bağış düzenleme"], ["donation:delete", "Bağış silme"],
  ["sacrifice:manage", "Kurban hissesi yönetme"], ["sms:send", "SMS gönderme"],
  ["report:view", "Rapor görüntüleme"], ["user:manage", "Kullanıcı yönetme"],
  ["settings:manage", "Sistem ayarları"],
] as const;

const rolePermissionCodes: Record<UserRole, string[]> = {
  ADMIN: permissionDefinitions.map(([code]) => code),
  DONATION_STAFF: ["donation:create", "donation:view", "sacrifice:manage", "sms:send"],
  REPORT_VIEWER: ["donation:view", "report:view"],
};

async function main() {
  for (const [code, name] of permissionDefinitions) {
    await prisma.permission.upsert({ where: { code }, update: { name }, create: { code, name } });
  }
  const roleNames: Record<UserRole, string> = {
    ADMIN: "Yönetici", DONATION_STAFF: "Bağış Personeli", REPORT_VIEWER: "Rapor Kullanıcısı",
  };
  for (const code of Object.values(UserRole)) {
    const permissions = await prisma.permission.findMany({ where: { code: { in: rolePermissionCodes[code] } } });
    await prisma.role.upsert({
      where: { code },
      update: { name: roleNames[code], permissions: { set: permissions.map(({ id }) => ({ id })) } },
      create: { code, name: roleNames[code], permissions: { connect: permissions.map(({ id }) => ({ id })) } },
    });
  }
  const adminRole = await prisma.role.findUniqueOrThrow({ where: { code: "ADMIN" } });
  await prisma.user.upsert({
    where: { email: "yonetici@vefa.org" },
    update: { roleId: adminRole.id, roleCode: "ADMIN", isActive: true },
    create: {
      name: "Sistem Yöneticisi", email: "yonetici@vefa.org",
      passwordHash: await hash(process.env.SEED_ADMIN_PASSWORD ?? "Degistir123!", 12),
      roleId: adminRole.id, roleCode: "ADMIN",
    },
  });
  const donationTypes = [
    ["KURBAN", "Kurban"], ["ZEKAT", "Zekât"], ["KURAN", "Kur’an"], ["GENEL", "Genel Bağış"],
  ] as const;
  for (const [code, name] of donationTypes) {
    await prisma.donationType.upsert({ where: { code }, update: { name }, create: { code, name } });
  }
  const sacrifices = [
    { number: 1, region: "Somali", sharePrice: 14500 },
    { number: 2, region: "Afrika", sharePrice: 12500 },
    { number: 3, region: "Türkiye", sharePrice: 18500 },
  ];
  for (const definition of sacrifices) {
    await prisma.sacrifice.upsert({
      where: { number: definition.number },
      update: { region: definition.region, sharePrice: definition.sharePrice },
      create: {
        ...definition,
        shares: { create: Array.from({ length: 7 }, (_, index) => ({ shareNo: index + 1 })) },
      },
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
