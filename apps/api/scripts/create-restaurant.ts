import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";

const prisma = new PrismaClient();

function parseArgs() {
  const args = process.argv.slice(2);
  const out: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const value = args[i + 1];
      out[key] = value;
      i++;
    }
  }
  return out;
}

function generateTempPassword() {
  return crypto.randomBytes(9).toString("base64url");
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main() {
  const { name, slug, email } = parseArgs();

  if (!name || !email) {
    console.error(
      "Usage: npm run create-restaurant -w apps/api -- --name \"Restaurant Name\" --email owner@example.com [--slug custom-slug]"
    );
    process.exit(1);
  }

  const finalSlug = slug ? slugify(slug) : slugify(name);
  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  const restaurant = await prisma.restaurant.create({
    data: {
      name,
      slug: finalSlug,
      users: {
        create: {
          email: email.toLowerCase(),
          passwordHash,
          role: "OWNER",
        },
      },
    },
    include: { users: true },
  });

  console.log("\nRestaurant created:");
  console.log(`  name:  ${restaurant.name}`);
  console.log(`  slug:  ${restaurant.slug}`);
  console.log(`  menu:  /menu/${restaurant.slug}`);
  console.log("\nOwner login:");
  console.log(`  email:    ${email.toLowerCase()}`);
  console.log(`  password: ${tempPassword}`);
  console.log("\nShare these credentials with the restaurant owner. There is no password reset flow yet — store them safely.\n");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
