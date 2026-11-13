// Menu Data
const M = {
  "Maki": [
    ["Kappa Maki", 430, "Cucumber roll"],
    ["Spicy Maki 🌶", 430],
    ["Edamame Maki", 430],
    ["Veggie Maki", 430],
    ["Asparagus Maki", 430],
    ["Kappa Avocado Maki", 430]
  ],
  "Uramaki": [
    ["Classic Cucumber", 430],
    ["California Roll", 430],
    ["Summer Roll", 430],
    ["Avocado Roll", 430],
    ["Veggie Supreme", 430],
    ["Spicy Avocado 🌶", 430],
    ["Asparagus Cream Cheese Roll", 430],
    ["Avocado Asparagus Roll", 430]
  ],
  "Tempura": [
    ["Japanese Spice Roll", 430],
    ["TSC Signature Roll", 430],
    ["Avocado Blast", 480],
    ["Crunchy Edamame Roll", 430],
    ["Asparagus Tempura Roll", 430],
    ["Assorted Veggies Tempura Roll", 430],
    ["Baby Corn Tempura Roll", 430],
    ["Rock Corn Tempura Roll", 430]
  ],
  "Boats & Gift Boxes": [
    ["24 pcs Sushi Boat", 1800, "24 pcs signature veg assortment on a wooden boat platter", "images/sushi-boat.jpg"],
    ["12 pcs Sushi Gift Box", 850, "12 pcs handcrafted veg sushi in an elegant gift box", "images/sushi-gift-box.jpg"],
    ["16 pcs Sushi Gift Box", 1400, "16 pcs luxury veg sushi assortment in an elegant gift box", "images/sushi-gift-box.jpg"]
  ],
  "Cakes & more": [
    ["1 kg Signature Sushi Cake", 1800, "Layers of seasoned rice, nori, cucumber and avocado"],
    ["1 kg Avocado Sushi Cake", 2000, "Rich avocado sushi cake for celebrations"],
    ["½ kg Signature Sushi Cake", 1000, "Signature celebration sushi cake"],
    ["½ kg Avocado Sushi Cake", 1200, "Half kg fresh avocado sushi cake"],
    ["Mini Sushi Cake", 700, "Personalized mini celebration sushi cake"],
    ["Sushi Bowl", 500],
    ["Edamame Starter", 400]
  ]
};

// Cart state: key -> quantity
const q = {};
let cur = "Maki";
const VISITOR_ID_KEY = "tsh_visitor_id";

// Helper utilities
const $ = id => document.getElementById(id);
const R = n => "₹" + n.toLocaleString("en-IN");
const backendConfig = window.SUPABASE_CONFIG || {};

function isBackendConfigured() {
  return /^https:\/\/.+\.supabase\.co\/?$/.test((backendConfig.url || "").trim()) &&
    Boolean((backendConfig.anonKey || "").trim());
}

function setStatus(element, message, state = "info") {
  if (!element) return;
  element.textContent = message;
  element.dataset.state = state;
  element.hidden = !message;
}

async function supabaseRequest(path, options = {}) {
  const apiKey = backendConfig.anonKey.trim();
  const headers = new Headers(options.headers || {});
  headers.set("apikey", apiKey);
  headers.set("Content-Type", "application/json");
  if (/^eyJ/.test(apiKey)) headers.set("Authorization", `Bearer ${apiKey}`);

  let response;
  try {
    response = await fetch(`${backendConfig.url.replace(/\/+$/, "")}/rest/v1/${path}`, {
      ...options,
      headers
    });
  } catch (error) {
    console.error("Supabase request failed", error);
    throw new Error("Could not reach Supabase. Check the project URL and internet connection.");
  }

  if (!response.ok) {
    const details = await response.text();
    console.error(`Supabase request failed (${response.status})`, details);
    throw new Error(`Supabase returned error ${response.status}. Check the setup and database policies.`);
  }

  const body = await response.text();
  return body ? JSON.parse(body) : null;
}

async function recordVisit() {
  if (!isBackendConfigured()) return;

  let visitorId;
  try {
    visitorId = localStorage.getItem(VISITOR_ID_KEY);
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      localStorage.setItem(VISITOR_ID_KEY, visitorId);
    }
  } catch (error) {
    console.error("Could not persist a visitor ID in this browser", error);
    return;
  }

  const pagePath = window.location.pathname.slice(0, 255) || "/";
  try {
    await supabaseRequest("rpc/record_visit", {
      method: "POST",
      body: JSON.stringify({ p_visitor_id: visitorId, p_page_path: pagePath })
    });
  } catch (error) {
    console.error("Could not record this website visitor in Supabase", error);
  }
}

// Render category tabs
function tabs() {
  $("tabs").innerHTML = Object.keys(M).map(k =>
    `<button class="tab" role="tab" aria-selected="${k === cur}" data-k="${k}">${k}</button>`
  ).join("");
}

// Render menu items for currently active category
function list() {
  $("list").innerHTML = M[cur].map(([n, p, d, img], i) => {
    const key = cur + i;
    const quantity = q[key] || 0;
    const imgHtml = img ? `<img class="thumb" src="${img}" alt="${n}" loading="lazy">` : '';
    return `<div class="item">
      ${imgHtml}
      <div class="n">${n}${d ? `<small>${d}</small>` : ""}</div>
      <div class="price">${R(p)}</div>
      <div class="qty">
        <button aria-label="Remove one ${n}" data-d="-1" data-k="${key}" ${quantity === 0 ? "disabled" : ""}>−</button>
        <span>${quantity}</span>
        <button aria-label="Add one ${n}" data-d="1" data-k="${key}">+</button>
      </div>
    </div>`;
  }).join("");
}

// Collect selected cart items
function lines() {
  const o = [];
  for (const c in M) {
    M[c].forEach(([n, p], i) => {
      const x = q[c + i];
      if (x) o.push([n.replace(" 🌶", ""), p, x]);
    });
  }
  return o;
}

// Update order summary and sticky bottom bar
function sum() {
  const L = lines();
  const t = L.reduce((a, [, p, x]) => a + p * x, 0);
  const c = L.reduce((a, [, , x]) => a + x, 0);

  $("sum").innerHTML = L.length
    ? L.map(([n, p, x]) => `<div><span>${x} × ${n}</span><span>${R(p * x)}</span></div>`).join("") +
      `<div class="t"><span>Total</span><span>${R(t)}</span></div>`
    : `<p class="empty">Your order is empty. Add rolls from the menu.</p>`;

  $("bar").classList.toggle("on", c > 0);
  $("bc").textContent = `${c} item${c > 1 ? "s" : ""} · ${R(t)}`;
}

// Event Delegation for tab clicks & quantity change buttons
document.addEventListener("click", e => {
  const b = e.target.closest("button");
  if (!b) return;

  if (b.dataset.k && b.classList.contains("tab")) {
    cur = b.dataset.k;
    tabs();
    list();
  } else if (b.dataset.d) {
    const k = b.dataset.k;
    q[k] = Math.max(0, (q[k] || 0) + +b.dataset.d);
    list();
    sum();
  }
});

// Helper to format YYYY-MM-DD into DD-MM-YYYY (e.g. 10-11-2026)
function formatDate(val) {
  if (!val) return "-";
  const [y, m, d] = val.split("-");
  if (d && m && y) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[parseInt(m, 10) - 1] || m;
    return `${d}-${m}-${y} (${d} ${month} ${y})`;
  }
  return val;
}

// Save the order on this click, then open the prefilled WhatsApp message.
$("send").onclick = async () => {
  const L = lines();
  if (!L.length) {
    $("sum").innerHTML = '<p class="empty">Your order is empty. Tap + next to a roll in the menu first.</p>';
    $("sum").scrollIntoView({ block: "center", behavior: "smooth" });
    return;
  }

  const form = $("f");
  if (form && !form.reportValidity()) {
    return;
  }

  const t = L.reduce((a, [, p, x]) => a + p * x, 0);
  const customization = $("custom").value.trim();
  const msg = `Hi The Sushi Home, I’d like to order:\n` +
    L.map(([n, , x]) => `• ${x} × ${n}`).join("\n") +
    `\nTotal: ${R(t)} (delivery extra)\n` +
    `Name: ${$("nm").value.trim() || "-"}\n` +
    `Delivery date: ${formatDate($("dt").value)}\n` +
    `Address: ${$("ad").value.trim() || "-"}` +
    (customization ? `\nCustomization: ${customization}` : "");

  const whatsappUrl = "https://wa.me/917045371003?text=" + encodeURIComponent(msg);
  const order = {
    customer_name: $("nm").value.trim(),
    delivery_date: $("dt").value,
    address: $("ad").value.trim(),
    customization,
    items: L.map(([name, price, quantity]) => ({
      name,
      quantity,
      unit_price: price
    })),
    total: t
  };

  const sendButton = $("send");
  sendButton.disabled = true;
  const whatsappWindow = window.open("about:blank", "_blank");

  if (isBackendConfigured()) {
    setStatus($("order-status"), "Saving your order…");
    try {
      await supabaseRequest("orders", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify(order)
      });
      setStatus($("order-status"), "Order saved. Opening WhatsApp…", "success");
    } catch (error) {
      console.error("Order could not be saved to Supabase", error);
      setStatus(
        $("order-status"),
        `Order was not saved (${error.message}). Opening WhatsApp so you can still place it.`,
        "error"
      );
    }
  } else {
    setStatus(
      $("order-status"),
      "Supabase is not configured, so this order will only be sent to WhatsApp.",
      "error"
    );
  }

  sendButton.disabled = false;
  if (whatsappWindow) {
    whatsappWindow.location.href = whatsappUrl;
  } else {
    window.location.href = whatsappUrl;
  }
};

// Initial render
tabs();
list();
sum();
recordVisit();

// ─── Reviews ──────────────────────────────────────────────────────────────────

const REVIEWS_KEY = "tsh_reviews";

const DEFAULT_REVIEWS = [
  { name: "Priya S.", stars: 5, text: "Absolutely loved the California Roll! So fresh and perfectly made. Anjali really puts in so much love into every piece. Will order again!", date: "5 Nov 2026" },
  { name: "Rahul M.", stars: 5, text: "Ordered the Sushi Boat for my wife's birthday and it was a showstopper! Everyone was amazed. The floral decoration was so beautiful.", date: "2 Nov 2026" },
  { name: "Sneha K.", stars: 5, text: "Best veg sushi in Mumbai! The Avocado Blast tempura roll is out of this world 🤤 The gift box packaging is gorgeous too.", date: "28 Oct 2026" },
  { name: "Ankit T.", stars: 4, text: "Really tasty sushi cake for our office party. Everyone loved it. Quick delivery and very neatly packed.", date: "20 Oct 2026" },
  { name: "Meera J.", stars: 5, text: "The sushi gift box was perfect for Diwali gifting. Something so unique and healthy. Packaging was premium!", date: "15 Oct 2026" },
  { name: "Rohan D.", stars: 5, text: "Asparagus Tempura Roll was amazing! Never thought veg sushi could taste this good. Highly recommend to everyone.", date: "9 Oct 2026" }
];

function loadLocalReviews() {
  try {
    const saved = JSON.parse(localStorage.getItem(REVIEWS_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch (error) {
    console.error("Could not read locally saved reviews", error);
    return [];
  }
}

function saveLocalReview(review) {
  try {
    const saved = loadLocalReviews();
    saved.unshift(review);
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(saved));
    return true;
  } catch (error) {
    console.error("Could not save review in this browser", error);
    return false;
  }
}

function starsHtml(n) {
  const stars = Math.max(0, Math.min(5, Number(n) || 0));
  return "★".repeat(stars) + "☆".repeat(5 - stars);
}

let sharedReviews = [];

function renderReviews() {
  const grid = document.getElementById("reviews-grid");
  if (!grid) return;
  grid.replaceChildren();
  [...sharedReviews, ...loadLocalReviews(), ...DEFAULT_REVIEWS].forEach(review => {
    const card = document.createElement("article");
    card.className = "review-card";

    const stars = document.createElement("div");
    stars.className = "review-stars";
    stars.textContent = starsHtml(review.stars);

    const text = document.createElement("p");
    text.className = "review-text";
    text.textContent = `"${review.text}"`;

    const authorBlock = document.createElement("div");
    const author = document.createElement("div");
    author.className = "review-author";
    author.textContent = `— ${review.name}`;

    const date = document.createElement("div");
    date.className = "review-date";
    date.textContent = review.created_at
      ? new Date(review.created_at).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric"
        })
      : (review.date || "");

    authorBlock.append(author, date);
    card.append(stars, text, authorBlock);
    grid.append(card);
  });
}

async function refreshReviews(successMessage = "") {
  if (!isBackendConfigured()) {
    renderReviews();
    return;
  }

  try {
    const reviews = await supabaseRequest(
      "reviews?select=id,name,stars,text,created_at&order=created_at.desc&limit=100"
    );
    if (!Array.isArray(reviews)) throw new Error("Supabase returned an invalid reviews response.");
    sharedReviews = reviews;
    renderReviews();
    setStatus($("review-status"), successMessage, "success");
  } catch (error) {
    console.error("Could not load shared reviews from Supabase", error);
    renderReviews();
    setStatus(
      $("review-status"),
      `Shared reviews could not be loaded (${error.message}). Showing saved reviews instead.`,
      "error"
    );
  }
}

// Star picker logic
let selectedStars = 0;

function updateStarPick() {
  document.querySelectorAll("#star-pick button").forEach(b => {
    b.classList.toggle("lit", +b.dataset.s <= selectedStars);
  });
}

document.addEventListener("click", e => {
  const sp = e.target.closest("#star-pick button");
  if (sp) {
    selectedStars = +sp.dataset.s;
    updateStarPick();
    return;
  }
  // Hover effect for stars
}, { passive: true });

// Star hover
document.addEventListener("mouseover", e => {
  const sp = e.target.closest("#star-pick button");
  if (sp) {
    const hv = +sp.dataset.s;
    document.querySelectorAll("#star-pick button").forEach(b => {
      b.classList.toggle("lit", +b.dataset.s <= hv);
    });
  }
});
document.addEventListener("mouseout", e => {
  if (e.target.closest("#star-pick")) updateStarPick();
});

// Submit review
const rsub = document.getElementById("rsub");
if (rsub) {
  rsub.onclick = async () => {
    const name = (document.getElementById("rname").value || "").trim();
    const text = (document.getElementById("rtext").value || "").trim();
    if (!name) { document.getElementById("rname").focus(); return; }
    if (!selectedStars) { alert("Please select a star rating!"); return; }
    if (!text) { document.getElementById("rtext").focus(); return; }

    const now = new Date();
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const dateStr = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
    const review = { name, stars: selectedStars, text, date: dateStr };

    rsub.disabled = true;
    if (isBackendConfigured()) {
      setStatus($("review-status"), "Saving your review…");
      try {
        await supabaseRequest("reviews", {
          method: "POST",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({ name, stars: selectedStars, text })
        });
        sharedReviews.unshift({ ...review, created_at: now.toISOString() });
        renderReviews();
        setStatus($("review-status"), "Review saved and shared with everyone.", "success");
      } catch (error) {
        console.error("Review could not be saved to Supabase", error);
        setStatus(
          $("review-status"),
          `Review could not be saved (${error.message}). Your form is still here so you can try again.`,
          "error"
        );
        rsub.disabled = false;
        return;
      }
    } else if (saveLocalReview(review)) {
      renderReviews();
      setStatus(
        $("review-status"),
        "Supabase is not configured yet. This review is saved only in this browser.",
        "info"
      );
    } else {
      setStatus($("review-status"), "Could not save the review in this browser.", "error");
      rsub.disabled = false;
      return;
    }

    document.getElementById("rname").value = "";
    document.getElementById("rtext").value = "";
    selectedStars = 0;
    updateStarPick();

    const thanks = document.getElementById("rthanks");
    thanks.hidden = false;
    setTimeout(() => { thanks.hidden = true; }, 4000);
    rsub.disabled = false;
  };
}

renderReviews();
if (isBackendConfigured()) refreshReviews();

const headlineText = document.querySelector("#hero-title span");
if (headlineText) {
  const headlines = [
    "rolled to order",
    "made fresh for you",
    "crafted with care",
    "made for sharing"
  ];
  let headlineIndex = 0;

  window.setInterval(() => {
    headlineIndex = (headlineIndex + 1) % headlines.length;
    headlineText.textContent = headlines[headlineIndex];
  }, 5000);
}

// ─── Hamburger Menu ───────────────────────────────────────────────────────────
const hamburger = document.getElementById("hamburger");
const navEl = document.getElementById("nav");
if (hamburger && navEl) {
  hamburger.onclick = () => {
    const open = navEl.classList.toggle("open");
    hamburger.setAttribute("aria-expanded", open);
    hamburger.textContent = open ? "✕" : "☰";
  };
  // Close nav when any nav link is clicked
  navEl.querySelectorAll("a").forEach(a => {
    a.addEventListener("click", () => {
      navEl.classList.remove("open");
      hamburger.setAttribute("aria-expanded", false);
      hamburger.textContent = "☰";
    });
  });
}
