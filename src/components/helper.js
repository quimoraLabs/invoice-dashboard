export function dateFormat(dateInput) {
  if (!dateInput) return null;

  let date;
  if (typeof dateInput === "string") {
    // If format is YYYY-MM-DD, parse year, month, day locally to avoid timezone off-by-one shifts
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      const [year, month, day] = dateInput.split("-").map(Number);
      date = new Date(year, month - 1, day);
    } else {
      date = new Date(dateInput);
    }
  } else if (dateInput?.toDate && typeof dateInput.toDate === "function") {
    date = dateInput.toDate();
  } else if (dateInput?.seconds) {
    date = new Date(dateInput.seconds * 1000);
  } else if (dateInput instanceof Date) {
    date = dateInput;
  } else {
    date = new Date(dateInput);
  }

  if (!date || isNaN(date.getTime())) return null;

  const options = {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  };

  return date.toLocaleString("en-IN", options);
}

export function formatCurrentDate() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const localISOTime = new Date(now.getTime() - offset * 60000)
    .toISOString()
    .slice(0, 10); // Return clean YYYY-MM-DD
  return localISOTime;
}
