const site = window.SITE || { printPrice: 88, currencySymbol: "$", stripe: { tips: {} } };
const form = document.getElementById("orderForm");
const tips = [...document.querySelectorAll(".tip")];
const accession = document.getElementById("accession");
const slipEl = document.getElementById("slip");
const payButton = document.getElementById("payButton");
const mailButton = document.getElementById("mailButton");
const copyButton = document.getElementById("copyButton");
const payNotice = document.getElementById("payNotice");
let tip = 0;

function money(n) {
  return `${site.currencySymbol || "$"}${n}`;
}

function syncTotals() {
  const base = site.printPrice || 88;
  document.getElementById("baseTotal").textContent = money(base);
  document.getElementById("tipTotal").textContent = money(tip);
  document.getElementById("grandTotal").textContent = money(base + tip);
}

tips.forEach((button) => {
  button.addEventListener("click", () => {
    tip = Number(button.dataset.tip) || 0;
    tips.forEach((other) => other.setAttribute("aria-pressed", other === button ? "true" : "false"));
    syncTotals();
  });
});

function orderId() {
  const now = new Date();
  const y = String(now.getFullYear()).slice(2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `PP-${y}${m}${d}-${rand}`;
}

function paymentUrl(total, email, id) {
  const links = site.stripe?.tips || {};
  const specific = links[String(total)] || (total === (site.printPrice || 88) ? site.stripe?.print : "");
  const fallback = site.stripe?.print || site.stripe?.tipJar || "";
  const url = specific || fallback;
  if (!url) return "";
  const join = url.includes("?") ? "&" : "?";
  return `${url}${join}prefilled_email=${encodeURIComponent(email)}&client_reference_id=${encodeURIComponent(id)}`;
}

function slipText(id, data, total) {
  return [
    `PHOTO PACKAGER`,
    `ORDER      ${id}`,
    `DATE       ${new Date().toISOString().slice(0, 16).replace("T", " ")}`,
    ``,
    `NAME       ${data.name}`,
    `EMAIL      ${data.email}`,
    `ADDRESS    ${data.address}`,
    `            ${data.city}  ${data.postal}`,
    `            ${data.country}`,
    `FORMAT     ${data.format}`,
    `COUNT      ${data.count} photographs (max ${site.photoLimit || 24})`,
    `TITLE      ${data.title || "—"}`,
    `NOTES      ${data.notes || "—"}`,
    ``,
    `PRINT+POST ${money(site.printPrice || 88)}`,
    `TIP        ${money(tip)}`,
    `DUE        ${money(total)}`,
    ``,
    `Photos are not attached to this slip.`,
    `After payment, send a private album or WeTransfer link.`,
    `Files are deleted after the parcel is posted.`,
  ].join("\n");
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  const id = orderId();
  const total = (site.printPrice || 88) + tip;
  const text = slipText(id, data, total);
  slipEl.textContent = text;
  document.getElementById("accessionTitle").textContent = `Order ${id}`;
  accession.hidden = false;
  accession.style.display = "block";
  accession.scrollIntoView({ behavior: "smooth", block: "start" });

  const pay = paymentUrl(total, data.email, id);
  if (pay) {
    payButton.hidden = false;
    payButton.href = pay;
    payNotice.textContent = "Pay now opens the checkout for the amount due. Keep this order number; you will send photographs after payment.";
  } else {
    payButton.hidden = true;
    payNotice.textContent = site.email
      ? `Email the slip to ${site.email}. Payment details will follow.`
      : "Copy or email the slip. Payment details will follow.";
  }

  const subject = `Photo Packager order ${id}`;
  const mailto = site.email || data.email;
  mailButton.href = `mailto:${encodeURIComponent(mailto)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
  try { localStorage.setItem("photo-packager-order", JSON.stringify({ id, data, tip, total, text })); } catch (_) {}
});

copyButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(slipEl.textContent);
    copyButton.textContent = "Copied";
    setTimeout(() => { copyButton.textContent = "Copy slip"; }, 1600);
  } catch (_) {
    copyButton.textContent = "Copy failed";
  }
});

function hasPayLinks() {
  const links = site.stripe?.tips || {};
  return Boolean(links["88"] || links[88] || site.stripe?.print);
}

if (hasPayLinks()) {
  payNotice.textContent = site.email
    ? `Place the order, then Pay now. Keep the order number. Send photographs afterwards with a private link to ${site.email}.`
    : "Place the order, then Pay now. Keep the order number. Send photographs afterwards with a private link.";
} else if (site.email) {
  payNotice.textContent = `Place the order, then email the slip to ${site.email}. Payment details will follow.`;
} else {
  payNotice.textContent = "Place the order, then copy or email the slip. Payment details will follow.";
}

syncTotals();
