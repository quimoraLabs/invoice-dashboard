import {
  collection,
  addDoc,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "./firebaseConfig";

// Dummy Customers Data (5 Clean Records with standardized field keys: full_name, email, phone_number, address, company, gstin)
const SAMPLE_CUSTOMERS = [
  {
    full_name: "Rohan Mehta",
    company: "Mehta Digital Solutions",
    email: "rohan@mehtadigital.com",
    phone_number: "9820012345",
    address: "Suite 402, Trade Centre, BKC, Mumbai - 400051",
    gstin: "27AABCM1234H1Z5",
  },
  {
    full_name: "Priya Patel",
    company: "Apex Tech Innovations",
    email: "priya@pateltech.in",
    phone_number: "9909987654",
    address: "Plot 14, IT Park, SG Highway, Ahmedabad - 380015",
    gstin: "24AAACP5678J1Z9",
  },
  {
    full_name: "Samir Kumar Sinha",
    company: "Sinha Global Logistics",
    email: "samir@sinhalogistics.com",
    phone_number: "9431054321",
    address: "B-12, Sector 62, Noida, Uttar Pradesh - 201309",
    gstin: "09AAACS9012K1Z3",
  },
  {
    full_name: "Anita Sharma",
    company: "Creative Pulse Studio",
    email: "anita@creativepulse.design",
    phone_number: "9811122334",
    address: "HSR Layout, Sector 3, Bengaluru - 560102",
    gstin: "29AAACD3456L1Z2",
  },
  {
    full_name: "Vikram Malhotra",
    company: "Malhotra Financial Services",
    email: "vikram@malhotrafinance.org",
    phone_number: "9830066778",
    address: "Park Street, 5th Floor, Kolkata - 700016",
    gstin: "19AAACM7890M1Z8",
  },
];

// Dummy Products Data (10 Records with categories matching standard options)
const SAMPLE_PRODUCTS = [
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
  {
    title: "Brand Identity & Logo Suite",
    description: "Vector logo creation, color palette specs, typography hierarchy, and brand manual.",
    price: 12000,
    category: "Branding",
    imageUrl: "https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=400&q=80",
  },
  {
    title: "Payment Gateway Integration (Razorpay/Stripe)",
    description: "Secure online payment gateway checkout, webhook handling, and dynamic link dispatch.",
    price: 9500,
    category: "Development",
    imageUrl: "https://images.unsplash.com/photo-1556742049-0a675409956b?auto=format&fit=crop&w=400&q=80",
  },
  {
    title: "Social Media Campaign Banner Pack",
    description: "10 custom promotional banner graphics optimized for LinkedIn, Twitter, and Instagram.",
    price: 8000,
    category: "Design Services",
    imageUrl: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=400&q=80",
  },
  {
    title: "Database Optimization & Indexing",
    description: "Firestore / PostgreSQL query speed optimization, schema normalization, and index tuning.",
    price: 22000,
    category: "Database",
    imageUrl: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=400&q=80",
  },
  {
    title: "Annual Technical Maintenance & Retainer",
    description: "Priority technical support, bug resolution, server uptime monitoring, and daily backups.",
    price: 60000,
    category: "Maintenance",
    imageUrl: "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=400&q=80",
  },
];

/**
 * Clear all data belonging to the specified user ID (or legacy unassigned docs)
 * @param {string} targetUserId - Target User UID
 */
export async function clearUserData(targetUserId) {
  const uid = targetUserId || auth.currentUser?.uid;
  if (!uid) {
    throw new Error("Cannot clear data: No authenticated user ID found.");
  }

  const collectionsToClear = ["invoices", "customers", "products"];
  for (const collName of collectionsToClear) {
    try {
      const snap = await getDocs(collection(db, collName));
      const docsToDelete = snap.docs.filter((d) => {
        const data = d.data();
        return !data.userId || data.userId === uid;
      });

      const deletePromises = docsToDelete.map((docSnap) =>
        deleteDoc(doc(db, collName, docSnap.id)).catch((err) =>
          console.warn(`Failed deleting ${collName}/${docSnap.id}:`, err)
        )
      );
      await Promise.all(deletePromises);
    } catch (err) {
      console.error(`Error clearing collection ${collName}:`, err);
    }
  }
}

/**
 * Seed sample data (5 customers, 10 products, 5 invoices) for a specified user ID
 * @param {string} targetUserId - Target User UID (defaults to current logged in user)
 */
export async function seedUserData(targetUserId) {
  const uid = targetUserId || auth.currentUser?.uid;
  if (!uid) {
    throw new Error("Cannot seed data: No authenticated user ID found.");
  }

  // 1. Clear existing seed data first to avoid duplicates
  await clearUserData(uid);

  // 2. Seed Business Profile
  const profileRef = doc(db, "business_profiles", uid);
  await setDoc(profileRef, {
    userId: uid,
    companyName: "Invomora Solutions Pvt Ltd",
    ownerName: "Madhav Kumar",
    email: "billing@invomora.io",
    phone: "+91 98100 99887",
    address: "Tower C, 8th Floor, DLF Cyber City, Gurugram, Haryana - 122002",
    taxId: "07AAACI1234A1Z1",
    bankName: "HDFC Bank Ltd",
    accountNumber: "50100234567890",
    ifscCode: "HDFC0001234",
    updatedAt: serverTimestamp(),
  });

  // 3. Seed Customers
  const customerDocs = [];
  for (const customer of SAMPLE_CUSTOMERS) {
    const custRef = await addDoc(collection(db, "customers"), {
      ...customer,
      userId: uid,
      created_at: serverTimestamp(),
    });
    customerDocs.push({ id: custRef.id, ...customer });
  }

  // 4. Seed Products
  const productDocs = [];
  for (const product of SAMPLE_PRODUCTS) {
    const prodRef = await addDoc(collection(db, "products"), {
      ...product,
      userId: uid,
      created_at: serverTimestamp(),
    });
    productDocs.push({ id: prodRef.id, ...product });
  }

  // 5. Seed Invoices (5 Invoices with YYYY-MM-DD date format)
  const sampleInvoices = [
    {
      invoice_no: "INV-001",
      client: {
        id: customerDocs[0].id,
        name: customerDocs[0].full_name,
        full_name: customerDocs[0].full_name,
        email: customerDocs[0].email,
        phone: customerDocs[0].phone_number,
        phone_number: customerDocs[0].phone_number,
        address: customerDocs[0].address,
      },
      invoice_date: "2026-03-03",
      paid_date: "2026-03-03",
      due_date: "2026-03-17",
      status: "Paid",
      payment_type: "UPI",
      tax_percentage: 18,
      items: [
        {
          id: productDocs[0].id,
          title: productDocs[0].title,
          quantity: 1,
          price: productDocs[0].price,
        },
      ],
      total_price: productDocs[0].price * 1.18,
    },
    {
      invoice_no: "INV-002",
      client: {
        id: customerDocs[1].id,
        name: customerDocs[1].full_name,
        full_name: customerDocs[1].full_name,
        email: customerDocs[1].email,
        phone: customerDocs[1].phone_number,
        phone_number: customerDocs[1].phone_number,
        address: customerDocs[1].address,
      },
      invoice_date: "2026-06-03",
      paid_date: "2026-06-03",
      due_date: "2026-06-17",
      status: "Paid",
      payment_type: "Bank Transfer",
      tax_percentage: 18,
      items: [
        {
          id: productDocs[1].id,
          title: productDocs[1].title,
          quantity: 1,
          price: productDocs[1].price,
        },
        {
          id: productDocs[6].id,
          title: productDocs[6].title,
          quantity: 1,
          price: productDocs[6].price,
        },
      ],
      total_price: (productDocs[1].price + productDocs[6].price) * 1.18,
    },
    {
      invoice_no: "INV-003",
      client: {
        id: customerDocs[2].id,
        name: customerDocs[2].full_name,
        full_name: customerDocs[2].full_name,
        email: customerDocs[2].email,
        phone: customerDocs[2].phone_number,
        phone_number: customerDocs[2].phone_number,
        address: customerDocs[2].address,
      },
      invoice_date: "2026-08-03",
      paid_date: null,
      due_date: "2026-08-17",
      status: "Pending",
      payment_type: null,
      tax_percentage: 18,
      items: [
        {
          id: productDocs[2].id,
          title: productDocs[2].title,
          quantity: 2,
          price: productDocs[2].price,
        },
      ],
      total_price: productDocs[2].price * 2 * 1.18,
    },
    {
      invoice_no: "INV-004",
      client: {
        id: customerDocs[3].id,
        name: customerDocs[3].full_name,
        full_name: customerDocs[3].full_name,
        email: customerDocs[3].email,
        phone: customerDocs[3].phone_number,
        phone_number: customerDocs[3].phone_number,
        address: customerDocs[3].address,
      },
      invoice_date: "2026-08-15",
      paid_date: null,
      due_date: "2026-08-29",
      status: "Pending",
      payment_type: null,
      tax_percentage: 18,
      items: [
        {
          id: productDocs[5].id,
          title: productDocs[5].title,
          quantity: 1,
          price: productDocs[5].price,
        },
      ],
      total_price: productDocs[5].price * 1.18,
    },
    {
      invoice_no: "INV-005",
      client: {
        id: customerDocs[4].id,
        name: customerDocs[4].full_name,
        full_name: customerDocs[4].full_name,
        email: customerDocs[4].email,
        phone: customerDocs[4].phone_number,
        phone_number: customerDocs[4].phone_number,
        address: customerDocs[4].address,
      },
      invoice_date: "2026-09-01",
      paid_date: null,
      due_date: "2026-09-15",
      status: "Unpaid",
      payment_type: null,
      tax_percentage: 18,
      items: [
        {
          id: productDocs[3].id,
          title: productDocs[3].title,
          quantity: 1,
          price: productDocs[3].price,
        },
      ],
      total_price: productDocs[3].price * 1.18,
    },
  ];

  for (const invoice of sampleInvoices) {
    await addDoc(collection(db, "invoices"), {
      ...invoice,
      userId: uid,
      created_at: serverTimestamp(),
    });
  }

  return { customers: customerDocs.length, products: productDocs.length, invoices: sampleInvoices.length };
}
