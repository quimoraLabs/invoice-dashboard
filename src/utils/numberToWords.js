/**
 * Indian State Codes lookup mapping (GST 2-digit state code to State Name)
 */
export const GST_STATE_CODES = {
  "01": "Jammu & Kashmir",
  "02": "Himachal Pradesh",
  "03": "Punjab",
  "04": "Chandigarh",
  "05": "Uttarakhand",
  "06": "Haryana",
  "07": "Delhi",
  "08": "Rajasthan",
  "09": "Uttar Pradesh",
  "10": "Bihar",
  "11": "Sikkim",
  "12": "Arunachal Pradesh",
  "13": "Nagaland",
  "14": "Manipur",
  "15": "Mizoram",
  "16": "Tripura",
  "17": "Meghalaya",
  "18": "Assam",
  "19": "West Bengal",
  "20": "Jharkhand",
  "21": "Odisha",
  "22": "Chhattisgarh",
  "23": "Madhya Pradesh",
  "24": "Gujarat",
  "26": "Dadra & Nagar Haveli and Daman & Diu",
  "27": "Maharashtra",
  "29": "Karnataka",
  "30": "Goa",
  "31": "Lakshadweep",
  "32": "Kerala",
  "33": "Tamil Nadu",
  "34": "Puducherry",
  "35": "Andaman & Nicobar Islands",
  "36": "Telangana",
  "37": "Andhra Pradesh",
  "38": "Ladakh",
  "97": "Other Territory",
};

const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];

const TENS = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

function convertBelowThousand(num) {
  let str = "";
  if (num >= 100) {
    str += ONES[Math.floor(num / 100)] + " Hundred ";
    num %= 100;
  }
  if (num >= 20) {
    str += TENS[Math.floor(num / 10)] + " ";
    num %= 10;
  }
  if (num > 0) {
    str += ONES[num] + " ";
  }
  return str.trim();
}

function convertRupees(num) {
  let str = "";
  if (num >= 10000000) {
    const crores = Math.floor(num / 10000000);
    str += convertRupees(crores) + " Crore ";
    num %= 10000000;
  }
  if (num >= 100000) {
    const lakhs = Math.floor(num / 100000);
    str += convertBelowThousand(lakhs) + " Lakh ";
    num %= 100000;
  }
  if (num >= 1000) {
    const thousands = Math.floor(num / 1000);
    str += convertBelowThousand(thousands) + " Thousand ";
    num %= 1000;
  }
  if (num > 0) {
    str += convertBelowThousand(num) + " ";
  }
  return str.trim();
}

/**
 * Converts a positive number to Indian Currency words (INR).
 * Follows the Indian numbering system: Crores, Lakhs, Thousands, Hundreds.
 * Example: 12345.67 -> "Rupees Twelve Thousand Three Hundred Forty Five and Sixty Seven Paise Only"
 *
 * @param {number|string} amount
 * @returns {string}
 */
export function numberToWordsINR(amount) {
  const numericAmount = Number(amount);
  if (isNaN(numericAmount) || numericAmount < 0) {
    return "Invalid Amount";
  }

  // Handle true zero case
  if (numericAmount === 0) {
    return "Rupees Zero Only";
  }

  // Split integer and paise (rounded to 2 decimal places)
  const fixed = numericAmount.toFixed(2);
  const [rupeesPartStr, paisePartStr] = fixed.split(".");
  const rupees = parseInt(rupeesPartStr, 10);
  const paise = parseInt(paisePartStr, 10);

  if (rupees === 0 && paise > 0) {
    // Only paise
    const paiseWords = convertBelowThousand(paise);
    return `${paiseWords} Paise Only`;
  }

  const words = convertRupees(rupees);

  let result = `Rupees ${words}`;
  if (paise > 0) {
    const paiseWords = convertBelowThousand(paise);
    result += ` and ${paiseWords} Paise`;
  }
  result += " Only";

  return result.replace(/\s+/g, " ");
}

/**
 * Extracts 2-digit GST state code from a GSTIN or state info.
 * @param {string} gstin
 * @param {string} explicitStateCode
 * @returns {string|null} 2-digit code string e.g. "27"
 */
export function extractStateCode(gstin, explicitStateCode) {
  if (explicitStateCode && String(explicitStateCode).trim().length >= 2) {
    return String(explicitStateCode).trim().slice(0, 2);
  }
  if (gstin && typeof gstin === "string") {
    const cleaned = gstin.trim();
    if (cleaned.length >= 2 && /^\d{2}/.test(cleaned)) {
      return cleaned.slice(0, 2);
    }
  }
  return null;
}

/**
 * Resolves state display name from state code or fallback state name
 */
export function getStateDisplayName(stateCode, fallbackStateName) {
  if (stateCode && GST_STATE_CODES[stateCode]) {
    return `${GST_STATE_CODES[stateCode]} (${stateCode})`;
  }
  if (stateCode) {
    return `State (${stateCode})`;
  }
  return fallbackStateName || "Not specified";
}
