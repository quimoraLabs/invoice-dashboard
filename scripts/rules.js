/**
 * ============================================================================
 * 📜 SCRIPTS & COMMANDS DIRECTORY & RULES (rules.js)
 * ============================================================================
 * 
 * Standard reference guide documenting all project execution commands,
 * including Seeding, Testing, Database Cleanup, and Development rules.
 * 
 * You can execute this file directly in the terminal:
 *   node scripts/rules.js
 * ============================================================================
 */

export const COMMAND_DOCS = {
  overview: "Invomora CLI Commands & Scripts Reference Guide",
  
  // 1. SEEDING COMMANDS
  seeding: {
    title: "1. Database Seeding",
    purpose: "Populates Firestore with realistic sample Customers, Products, and Invoices using Groq AI or curated fallback data.",
    prerequisites: [
      "FIREBASE_SERVICE_ACCOUNT (JSON string) configured in .env.local.",
      "GROQ_API_KEY (optional, required only for dynamic AI-generated dataset)."
    ],
    commands: [
      {
        command: "npm run seed",
        description: "Executes default seed script using environment defaults.",
      },
      {
        command: "npm run seed -- --user=<USER_ID> --org=<ORG_ID>",
        description: "Seeds data scoped to a specific user and organization/workspace.",
        example: "npm run seed -- --user=user_2abc123 --org=ws_default",
      },
      {
        command: "node --env-file=.env.local scripts/seed.js",
        description: "Executes seed directly via Node.js by explicitly injecting .env.local.",
      }
    ],
    rules: [
      "Invoice Date Constraints: Invoices cannot be dated in the future, and cannot exceed 90 days backdated.",
      "Product Uniqueness: Duplicate items are disallowed per invoice; quantities must be incremented instead.",
      "Multi-tenancy Scope: Domain records remain scoped to userId and workspace metadata."
    ]
  },

  // 2. TESTING COMMANDS
  testing: {
    title: "2. Test Suite Execution",
    purpose: "Executes unit logic, GST computations, Firestore security rules, and end-to-end integration flows.",
    commands: [
      {
        command: "npm test",
        description: "Runs the complete Vitest test suite in single-run mode.",
      },
      {
        command: "npm run test:unit",
        description: "Runs isolated unit tests (Invoice calculations and Number-to-Words utility).",
        targetFiles: ["test/invoice.unit.test.js", "test/numberToWords.test.js"]
      },
      {
        command: "npm run test:rules",
        description: "Runs security rule assertions against the local Firebase Firestore Emulator.",
        targetFiles: ["test/firestore.rules.test.js"],
        note: "Requires Java Development Kit (JDK) and Firebase CLI emulator runtime."
      },
      {
        command: "npm run test:integration",
        description: "Executes full Firestore integration assertions in the local emulator.",
        targetFiles: ["test/invoice.integration.test.js"]
      },
      {
        command: "npm run test:emulator",
        description: "Sequentially executes both Security Rules tests and Integration tests in the emulator."
      },
      {
        command: "scripts\\run-rules-test.cmd",
        description: "Windows batch script pre-configured with local Java runtime PATH for rules tests."
      },
      {
        command: "scripts\\run-integration-test.cmd",
        description: "Windows batch script pre-configured with local Java runtime PATH for integration tests."
      }
    ],
    rules: [
      "Unit tests run against in-memory mock data without requiring the emulator.",
      "Emulator-based tests require Java (JDK 17+) available in system or script environment."
    ]
  },

  // 3. DATABASE CLEANUP COMMANDS
  cleanup: {
    title: "3. Database Cleanup",
    purpose: "Safely purges mock and test artifacts generated in Firestore.",
    commands: [
      {
        command: "npm run clear:all -- --confirm",
        description: "Wipes mock collection data (Safety flag --confirm is mandatory).",
      },
      {
        command: "npm run clear:all -- --confirm --keep-profiles",
        description: "Purges invoices, customers, and products while preserving user and workspace profiles.",
      }
    ],
    rules: [
      "The script enforces an explicit '--confirm' flag to prevent unintended production data loss."
    ]
  },

  // 4. DEVELOPMENT & BUILD COMMANDS
  development: {
    title: "4. Development & Build Lifecycle",
    commands: [
      { command: "npm run dev", description: "Launches the Vite development server on http://localhost:5173." },
      { command: "npm run build", description: "Generates an optimized production bundle." },
      { command: "npm run lint", description: "Performs ESLint static analysis checks." },
      { command: "npm run preview", description: "Locally previews the built production bundle." }
    ]
  }
};

/**
 * Formats and prints documentation cleanly to standard output
 */
export function printRules() {
  console.log("\n==================================================================");
  console.log("            ✨ INVOMORA COMMANDS & SCRIPTS CHEATSHEET ✨");
  console.log("==================================================================\n");

  Object.values(COMMAND_DOCS).forEach((section) => {
    if (typeof section === "string") return;
    console.log(`\n📌 ${section.title}`);
    if (section.purpose) console.log(`   💡 Purpose: ${section.purpose}`);
    
    if (section.prerequisites) {
      console.log(`   ⚠️ Prerequisites:`);
      section.prerequisites.forEach((pre) => console.log(`      - ${pre}`));
    }

    console.log(`   🚀 Commands:`);
    section.commands.forEach((item) => {
      console.log(`      • ${item.command}`);
      console.log(`        -> ${item.description}`);
      if (item.example) console.log(`           Example: ${item.example}`);
      if (item.note) console.log(`           Note: ${item.note}`);
    });

    if (section.rules) {
      console.log(`   📋 Rules & Constraints:`);
      section.rules.forEach((rule) => console.log(`      - ${rule}`));
    }
  });

  console.log("\n==================================================================");
  console.log("Reference: Inspect 'scripts/rules.js' or 'docs/INDEX.md'");
  console.log("==================================================================\n");
}

// Direct execution
printRules();
