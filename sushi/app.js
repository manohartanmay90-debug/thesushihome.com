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
    ["1 kg Signature Sushi Cake", 1800, "Layers of seasoned rice, nori, cucumber and avocado", "images/cake-feature.jpg"],
    ["1 kg Avocado Sushi Cake", 2000, "Rich avocado sushi cake for celebrations", "images/cake-feature.jpg"],
    ["½ kg Signature Sushi Cake", 1000, "Signature celebration sushi cake", "images/cake-feature.jpg"],
    ["½ kg Avocado Sushi Cake", 1200, "Half kg fresh avocado sushi cake", "images/cake-feature.jpg"],
    ["Mini Sushi Cake", 700, "Personalized mini celebration sushi cake", "images/cake-feature.jpg"],
    ["Sushi Bowl", 500],
    ["Edamame Starter", 400]
  ]
};

// Cart state: key -> quantity
const q = {};
let cur = "Maki";

// Helper utilities
const $ = id => document.getElementById(id);
const R = n => "₹" + n.toLocaleString("en-IN");

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

// WhatsApp checkout integration with validation
$("send").onclick = () => {
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
  const msg = `Hi The Sushi Home, I’d like to order:\n` +
    L.map(([n, , x]) => `• ${x} × ${n}`).join("\n") +
    `\nTotal: ${R(t)} (delivery extra)\n` +
    `Name: ${$("nm").value.trim() || "-"}\n` +
    `Delivery date: ${formatDate($("dt").value)}\n` +
    `Address: ${$("ad").value.trim() || "-"}`;

  const u = "https://wa.me/917045371003?text=" + encodeURIComponent(msg);
  if (!window.open(u, "_blank")) {
    location.href = u;
  }
};

// Initial render
tabs();
list();
sum();

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

function loadReviews() {
  try {
    const saved = JSON.parse(localStorage.getItem(REVIEWS_KEY) || "[]");
    return [...saved, ...DEFAULT_REVIEWS];
  } catch { return DEFAULT_REVIEWS; }
}

function saveReview(r) {
  try {
    const saved = JSON.parse(localStorage.getItem(REVIEWS_KEY) || "[]");
    saved.unshift(r);
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(saved));
  } catch {}
}

function starsHtml(n) {
  return "★".repeat(n) + "☆".repeat(5 - n);
}

function renderReviews() {
  const grid = document.getElementById("reviews-grid");
  if (!grid) return;
  const reviews = loadReviews();
  grid.innerHTML = reviews.map(r => `
    <div class="review-card">
      <div class="review-stars">${starsHtml(r.stars)}</div>
      <p class="review-text">"${r.text}"</p>
      <div>
        <div class="review-author">— ${r.name}</div>
        <div class="review-date">${r.date}</div>
      </div>
    </div>`).join("");
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
  rsub.onclick = () => {
    const name = (document.getElementById("rname").value || "").trim();
    const text = (document.getElementById("rtext").value || "").trim();
    if (!name) { document.getElementById("rname").focus(); return; }
    if (!selectedStars) { alert("Please select a star rating!"); return; }
    if (!text) { document.getElementById("rtext").focus(); return; }

    const now = new Date();
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const dateStr = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;

    saveReview({ name, stars: selectedStars, text, date: dateStr });
    renderReviews();

    document.getElementById("rname").value = "";
    document.getElementById("rtext").value = "";
    selectedStars = 0;
    updateStarPick();

    const thanks = document.getElementById("rthanks");
    thanks.hidden = false;
    setTimeout(() => { thanks.hidden = true; }, 4000);
  };
}

renderReviews();

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
