import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import admin from "firebase-admin";
import Groq from "groq-sdk";

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(sa),
      });
    } catch {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
    }
  } else {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  }
}

export const db = admin.firestore();

const groqApiKey = process.env.GROQ_API_KEY;
export const groq = groqApiKey ? new Groq({ apiKey: groqApiKey }) : null;

export const GROQ_MODEL = "openai/gpt-oss-120b";

// Parse CLI Arguments: --user=<userId> --org=<orgId>
export function parseArgs() {
  const args = {};
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith("--user=")) {
      args.userId = arg.split("=")[1]?.trim();
    }
    if (arg.startsWith("--org=")) {
      args.orgId = arg.split("=")[1]?.trim();
    }
  }
  return args;
}

// Fallback Static Data with camelCase keys
export const FALLBACK_CUSTOMERS = [
  {
    name: "Rohan Mehta",
    company: "Mehta Digital Solutions",
    email: "rohan@mehtadigital.com",
    phone: "9820012345",
    address: "Suite 402, Trade Centre, BKC, Mumbai - 400051",
    gstin: "27AABCM1234H1Z5",
  },
  {
    name: "Priya Patel",
    company: "Apex Tech Innovations",
    email: "priya@pateltech.in",
    phone: "9909987654",
    address: "Plot 14, IT Park, SG Highway, Ahmedabad - 380015",
    gstin: "24AAACP5678J1Z9",
  },
  {
    name: "Samir Kumar Sinha",
    company: "Sinha Global Logistics",
    email: "samir@sinhalogistics.com",
    phone: "9431054321",
    address: "B-12, Sector 62, Noida, Uttar Pradesh - 201309",
    gstin: "09AAACS9012K1Z3",
  },
];

export const FALLBACK_PRODUCTS = [
  {
    title: "UI/UX Web Design & Wireframing",
    description: "Complete responsive web dashboard UI design system and Figma interactive prototype.",
    price: 25000,
    category: "Design Services",
    imageUrl: "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&w=400&q=80",
  },
  {
    title: "Full-Stack Web Application Development",
    description: "Custom React 19 + Node.js web application built with REST API integration.",
    price: 45000,
    category: "Development",
    imageUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=400&q=80",
  },
  {
    title: "Monthly SEO & Content Optimization",
    description: "On-page SEO, technical audit, backlink strategy, and keyword rank optimization.",
    price: 15000,
    category: "Marketing",
    imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80",
  },
  {
    title: "Cloud Infrastructure Setup & Migration",
    description: "AWS / Firebase backend serverless setup, HTTPS SSL, and automated CI/CD pipeline.",
    price: 30000,
    category: "DevOps & Cloud",
    imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=400&q=80",
  },
  {
    title: "Mobile App Performance Audit",
    description: "Comprehensive React Native app audit, memory leak diagnosis, and bundle optimization.",
    price: 18000,
    category: "Development",
    imageUrl: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=400&q=80",
  },
];

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Exponential Backoff Retry Utility for Groq API
export async function callGroqWithRetry(fn, maxRetries = 3, initialDelay = 500) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await delay(110); // 110ms delay enforces max 10 req/s
      return await fn();
    } catch (err) {
      if (attempt === maxRetries) throw err;
      const waitTime = initialDelay * Math.pow(2, attempt - 1);
      console.warn(`Groq request failed (attempt ${attempt}/${maxRetries}). Retrying in ${waitTime}ms...`, err?.message);
      await delay(waitTime);
    }
  }
}

// Generate Realistic Indian B2B Customers using Groq AI
export async function generateCustomers(count = 5) {
  if (!groq) {
    console.warn("⚠️ GROQ_API_KEY not found. Falling back to static sample customers.");
    return FALLBACK_CUSTOMERS.slice(0, count);
  }

  const chunkSize = Math.min(count, 10);
  const results = [];

  for (let i = 0; i < count; i += chunkSize) {
    const currentChunk = Math.min(chunkSize, count - i);
    try {
      const res = await callGroqWithRetry(() =>
        groq.chat.completions.create({
          model: GROQ_MODEL,
          temperature: 1.0,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: "Return ONLY valid JSON. No markdown. Indian B2B context.",
            },
            {
              role: "user",
              content: `Generate ${currentChunk} realistic Indian B2B customer records. Return a JSON object with a "customers" array. Each item must have:
- name (Indian person full name)
- company (Indian business name)
- email (business email)
- phone (10-digit Indian mobile starting with 6, 7, 8, or 9)
- address (realistic Indian business address with city, state, and 6-digit PIN code)
- gstin (valid 15-character Indian GSTIN format, e.g. 27AABCM1234H1Z5)`
            },
          ],
        })
      );

      const parsed = JSON.parse(res.choices[0]?.message?.content || "{}");
      if (Array.isArray(parsed.customers) && parsed.customers.length > 0) {
        results.push(...parsed.customers.slice(0, currentChunk));
      } else {
        throw new Error("Groq returned invalid customer structure");
      }
    } catch (err) {
      console.warn(`⚠️ Groq customer generation failed for chunk: ${err.message}. Falling back to static data.`);
      const remainingNeeded = count - results.length;
      results.push(...FALLBACK_CUSTOMERS.slice(0, remainingNeeded));
      break;
    }
  }

  console.log(`🎲 Generated ${results.length} customers via Groq AI`);
  return results;
}

// Generate Realistic Products & Services Catalog using Groq AI
export async function generateProducts(count = 10) {
  if (!groq) {
    console.warn("⚠️ GROQ_API_KEY not found. Falling back to static sample products.");
    return FALLBACK_PRODUCTS.slice(0, count);
  }

  const chunkSize = Math.min(count, 10);
  const results = [];

  for (let i = 0; i < count; i += chunkSize) {
    const currentChunk = Math.min(chunkSize, count - i);
    try {
      const res = await callGroqWithRetry(() =>
        groq.chat.completions.create({
          model: GROQ_MODEL,
          temperature: 1.0,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: "Return ONLY valid JSON. No markdown. Indian B2B context.",
            },
            {
              role: "user",
              content: `Generate ${currentChunk} realistic B2B service or product catalog items for an Indian IT / consulting / creative agency. Return a JSON object with a "products" array. Each item must have:
- title (service / product title)
- description (1-2 sentence professional description)
- price (integer in INR between 3000 and 95000)
- category (one of: Design Services, Development, Marketing, DevOps & Cloud, Branding, Database, Maintenance, Consulting)`
            },
          ],
        })
      );

      const parsed = JSON.parse(res.choices[0]?.message?.content || "{}");
      if (Array.isArray(parsed.products) && parsed.products.length > 0) {
        const enriched = parsed.products.slice(0, currentChunk).map((p, idx) => ({
          ...p,
          imageUrl: FALLBACK_PRODUCTS[idx % FALLBACK_PRODUCTS.length]?.imageUrl || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80",
        }));
        results.push(...enriched);
      } else {
        throw new Error("Groq returned invalid product structure");
      }
    } catch (err) {
      console.warn(`⚠️ Groq product generation failed for chunk: ${err.message}. Falling back to static data.`);
      const remainingNeeded = count - results.length;
      results.push(...FALLBACK_PRODUCTS.slice(0, remainingNeeded));
      break;
    }
  }

  console.log(`🎲 Generated ${results.length} products via Groq AI`);
  return results;
}

// Helper to construct static invoices fallback
function generateStaticInvoices(count, customers, products) {
  const invoices = [];
  const statuses = ["Paid", "Paid", "Pending", "Pending", "Unpaid"];
  const paymentTypes = ["UPI", "Bank Transfer", null, null, null];

  for (let i = 0; i < count; i++) {
    const cust = customers[i % customers.length];
    const prod1 = products[i % products.length];
    const prod2 = products[(i + 3) % products.length];
    const items = [
      { id: prod1.id, title: prod1.title, quantity: 1, price: prod1.price },
    ];
    if (i % 2 === 1 && prod2 && prod2.id !== prod1.id) {
      items.push({ id: prod2.id, title: prod2.title, quantity: 2, price: prod2.price });
    }

    const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const taxRate = 18;
    const totalAmount = Math.round((subtotal * 1.18) * 100) / 100;

    const invoiceDate = new Date(Date.now() - (count - i) * 7 * 24 * 60 * 60 * 1000);
    const dueDate = new Date(invoiceDate.getTime() + 14 * 24 * 60 * 60 * 1000);
    const status = statuses[i % statuses.length];
    const paidDate = status === "Paid" ? invoiceDate : null;

    invoices.push({
      invoiceNumber: `INV-${String(i + 1).padStart(3, "0")}`,
      client: {
        id: cust.id,
        name: cust.name,
        email: cust.email,
        phone: cust.phone,
        address: cust.address,
      },
      invoiceDate: admin.firestore.Timestamp.fromDate(invoiceDate),
      dueDate: admin.firestore.Timestamp.fromDate(dueDate),
      paidDate: paidDate ? admin.firestore.Timestamp.fromDate(paidDate) : null,
      status: status,
      paymentType: status === "Paid" ? (paymentTypes[i % paymentTypes.length] || "UPI") : null,
      taxRate: taxRate,
      items: items,
      totalAmount: totalAmount,
    });
  }

  return invoices;
}

// Generate Realistic Invoices using Groq AI
export async function generateInvoices(count = 5, customers = [], products = []) {
  if (!customers.length || !products.length) {
    throw new Error("Cannot generate invoices without customers and products");
  }

  if (!groq) {
    console.warn("⚠️ GROQ_API_KEY not found. Falling back to static invoices.");
    return generateStaticInvoices(count, customers, products);
  }

  try {
    const custSummary = customers.map((c, i) => ({
      idx: i,
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      address: c.address,
    }));
    const prodSummary = products.map((p, i) => ({
      idx: i,
      id: p.id,
      title: p.title,
      price: p.price,
    }));

    const res = await callGroqWithRetry(() =>
      groq.chat.completions.create({
        model: GROQ_MODEL,
        temperature: 1.0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "Return ONLY valid JSON. No markdown. Indian B2B context.",
          },
          {
            role: "user",
            content: `Generate ${count} realistic Indian B2B invoices using the provided customers and products.
Customers: ${JSON.stringify(custSummary)}
Products: ${JSON.stringify(prodSummary)}

Return a JSON object with an "invoices" array. For each invoice:
- invoiceNumber (e.g. "INV-001", "INV-002"...)
- customerIdx (integer index matching Customers array)
- status (one of: "Paid", "Pending", "Unpaid", "Overdue")
- paymentType (if Paid: "UPI", "Bank Transfer", or "Card"; if Unpaid/Pending: null)
- invoiceDateIso (string YYYY-MM-DD within the last 90 days, not in the future)
- dueDateIso (string YYYY-MM-DD, 14 to 30 days after invoiceDateIso)
- paidDateIso (string YYYY-MM-DD if Paid, otherwise null)
- items: array of 1 to 3 distinct items, each with:
    - productIdx (integer index matching Products array)
    - quantity (integer between 1 and 5)`
          },
        ],
      })
    );

    const parsed = JSON.parse(res.choices[0]?.message?.content || "{}");
    if (!Array.isArray(parsed.invoices) || parsed.invoices.length === 0) {
      throw new Error("Groq returned empty invoice array");
    }

    const invoices = parsed.invoices.slice(0, count).map((inv, i) => {
      const cust = customers[(inv.customerIdx ?? inv.customer_idx) % customers.length] || customers[0];
      const items = (inv.items || []).map((item) => {
        const prod = products[(item.productIdx ?? item.product_idx) % products.length] || products[0];
        const qty = Math.max(1, Number(item.quantity) || 1);
        return {
          id: prod.id,
          title: prod.title,
          quantity: qty,
          price: prod.price,
        };
      });

      if (items.length === 0) {
        const prod = products[i % products.length];
        items.push({ id: prod.id, title: prod.title, quantity: 1, price: prod.price });
      }

      const subtotal = items.reduce((acc, it) => acc + it.price * it.quantity, 0);
      const taxRate = 18;
      const totalAmount = Math.round((subtotal * 1.18) * 100) / 100;

      const dateStr = inv.invoiceDateIso || inv.invoice_date_iso;
      const dueDateStr = inv.dueDateIso || inv.due_date_iso;
      const paidDateStr = inv.paidDateIso || inv.paid_date_iso;

      const invDate = dateStr ? new Date(dateStr) : new Date();
      const dueDate = dueDateStr ? new Date(dueDateStr) : new Date(invDate.getTime() + 14 * 86400000);
      const paidDate = (inv.status === "Paid" && paidDateStr) ? new Date(paidDateStr) : (inv.status === "Paid" ? invDate : null);

      return {
        invoiceNumber: inv.invoiceNumber || inv.invoice_no || `INV-${String(i + 1).padStart(3, "0")}`,
        client: {
          id: cust.id,
          name: cust.name,
          email: cust.email,
          phone: cust.phone,
          address: cust.address,
        },
        invoiceDate: admin.firestore.Timestamp.fromDate(invDate),
        dueDate: admin.firestore.Timestamp.fromDate(dueDate),
        paidDate: paidDate ? admin.firestore.Timestamp.fromDate(paidDate) : null,
        status: inv.status || "Pending",
        paymentType: inv.paymentType || inv.payment_type || (inv.status === "Paid" ? "UPI" : null),
        taxRate: taxRate,
        items: items,
        totalAmount: totalAmount,
      };
    });

    console.log(`🎲 Generated ${invoices.length} invoices via Groq AI`);
    return invoices;
  } catch (err) {
    console.warn(`⚠️ Groq invoice generation failed: ${err.message}. Falling back to static invoices.`);
    return generateStaticInvoices(count, customers, products);
  }
}

// Clear Existing User & Org Data
export async function clearData(userId, orgId) {
  console.log(`🧹 Clearing existing data for user ${userId} and org ${orgId}...`);
  const collections = ["invoices", "customers", "products"];

  for (const collName of collections) {
    const snapUser = await db.collection(collName).where("userId", "==", userId).get();
    const snapOrg = orgId ? await db.collection(collName).where("orgId", "==", orgId).get() : { docs: [] };
    
    const docMap = new Map();
    snapUser.docs.forEach((docSnap) => docMap.set(docSnap.id, docSnap.ref));
    snapOrg.docs.forEach((docSnap) => docMap.set(docSnap.id, docSnap.ref));

    const batch = db.batch();
    docMap.forEach((ref) => batch.delete(ref));
    if (docMap.size > 0) {
      await batch.commit();
      console.log(`  - Deleted ${docMap.size} docs from ${collName}`);
    }
  }
}

// Main Execution Function
export async function runSeed(userId, orgId) {
  if (!userId) {
    throw new Error("User ID is required. Pass --user=<userId>");
  }
  const effectiveOrgId = orgId || userId;
  console.log(`🌱 Starting seed for user: ${userId}, org: ${effectiveOrgId}`);

  // 1. Clear existing data
  await clearData(userId, effectiveOrgId);

  // 2. Generate & Insert Customers
  const rawCustomers = await generateCustomers(5);
  const customerDocs = [];
  for (const cust of rawCustomers) {
    const docRef = await db.collection("customers").add({
      ...cust,
      orgId: effectiveOrgId,
      userId: userId,
      createdBy: userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    customerDocs.push({ id: docRef.id, ...cust });
  }
  console.log(`✅ Saved ${customerDocs.length} customers to Firestore`);

  // 3. Generate & Insert Products
  const rawProducts = await generateProducts(10);
  const productDocs = [];
  for (const prod of rawProducts) {
    const docRef = await db.collection("products").add({
      ...prod,
      orgId: effectiveOrgId,
      userId: userId,
      createdBy: userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    productDocs.push({ id: docRef.id, ...prod });
  }
  console.log(`✅ Saved ${productDocs.length} products to Firestore`);

  // 4. Generate & Insert Invoices
  const rawInvoices = await generateInvoices(5, customerDocs, productDocs);
  for (const inv of rawInvoices) {
    await db.collection("invoices").add({
      ...inv,
      orgId: effectiveOrgId,
      userId: userId,
      createdBy: userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
  console.log(`✅ Saved ${rawInvoices.length} invoices to Firestore`);

  return {
    customers: customerDocs.length,
    products: productDocs.length,
    invoices: rawInvoices.length,
  };
}

// CLI Execution Entrypoint
const args = parseArgs();
if (args.userId) {
  runSeed(args.userId, args.orgId)
    .then((stats) => {
      console.log(`\n🎉 Seeding finished successfully! Loaded ${stats.customers} Customers, ${stats.products} Products, ${stats.invoices} Invoices.`);
      process.exit(0);
    })
    .catch((err) => {
      console.error("❌ Seeding failed:", err);
      process.exit(1);
    });
}
