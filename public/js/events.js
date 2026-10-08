/* ==========================================================
   events.js  -->  LOAD EVENTS FROM SUPABASE + SEARCH + FILTER
   + DYNAMIC HACKATHON SPONSORS (ONLY FOR HACKATHON EVENTS)
   ========================================================== */

var events = [];   // filled from the database
var sponsors = []; // filled from the sponsors table

var eventList = document.getElementById("eventList");
var searchBox = document.getElementById("searchBox");
var noResult = document.getElementById("noResult");
var filterButtons = document.querySelectorAll(".filter-btn");
var sponsorSection = document.getElementById("sponsorSection") || document.querySelector(".sponsors");
var selectedCategory = "All";

function formatDate(d) {
    if (!d) return "";
    return new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// Helper: Check if an event's category or title/name is a Hackathon
function isHackathonEvent(e) {
    var cat = (e.category || "").toLowerCase();
    var title = (e.name || e.title || "").toLowerCase();
    return cat.indexOf("hackathon") !== -1 || title.indexOf("hackathon") !== -1;
}

// 1) SHOW CARDS (With Dynamic Sponsor Tag ONLY for Hackathons)
function showEvents(list) {
    eventList.innerHTML = "";
    var hasHackathonInView = false;

    for (var i = 0; i < list.length; i++) {
        var e = list[i];
        var isHack = isHackathonEvent(e);
        if (isHack) hasHackathonInView = true;

        // Build dynamic sponsor HTML ONLY if this event is a Hackathon
        var sponsorBadgeHTML = "";
        if (isHack) {
            var evSponsors = sponsors.filter(function (s) {
                return !s.event_id || s.event_id === e.id;
            });

            if (evSponsors.length > 0) {
                var spNames = evSponsors.map(function (s) { return esc(s.name); }).join(", ");
                sponsorBadgeHTML = '<p class="sponsor-note" style="margin: 8px 0; padding: 6px 10px; background: #eef6ff; border-left: 3px solid #1e70b8; border-radius: 4px; font-size: 0.85rem; color: #1e70b8;">🤝 <b>Sponsored by:</b> ' + spNames + '</p>';
            } else {
                sponsorBadgeHTML = '<p class="sponsor-note" style="margin: 8px 0; padding: 6px 10px; background: #fff8e1; border-left: 3px solid #f59e0b; border-radius: 4px; font-size: 0.85rem; color: #b45309;">🏆 Hackathon sponsors announcing soon</p>';
            }
        }

        var card = document.createElement("div");
        card.className = "card event-card";
        card.innerHTML =
            '<div class="event-icon">' + esc(e.icon || "📅") + '</div>' +
            '<span class="event-tag">' + esc(e.category) + '</span>' +
            '<h3>' + esc(e.name) + '</h3>' +
            '<p>Date: ' + formatDate(e.event_date) + '</p>' +
            '<p>Venue: ' + esc(e.venue) + '</p>' +
            '<p class="desc">' + esc(e.description || "") + '</p>' +
            sponsorBadgeHTML +
            '<a class="card-btn" href="registration.html?id=' + e.id + '&event=' + encodeURIComponent(e.name) + '">Register</a>';
        eventList.appendChild(card);
    }

    noResult.style.display = list.length === 0 ? "block" : "none";

    // Show the bottom Hackathon Sponsors section ONLY when Hackathon events are visible
    if (sponsorSection) {
        sponsorSection.style.display = hasHackathonInView ? "block" : "none";
    }
}

// 2) SEARCH + CATEGORY FILTER
function filterEvents() {
    var text = searchBox.value.toLowerCase();
    showEvents(events.filter(function (e) {
        var catOk = selectedCategory === "All" ||
            e.category === selectedCategory ||
            (selectedCategory === "Hackathon" && isHackathonEvent(e));
        var textOk = (e.name + " " + e.venue + " " + (e.description || "")).toLowerCase().indexOf(text) !== -1;
        return catOk && textOk;
    }));
}

searchBox.addEventListener("input", filterEvents);
filterButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
        filterButtons.forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        selectedCategory = btn.getAttribute("data-category");
        filterEvents();
    });
});

// 3) LOAD EVENTS & SPONSORS FROM DATABASE
async function initEventsPage() {
    var spRes = await sb.from("sponsors").select("*").order("created_at");
    sponsors = spRes.data || [];
    renderSponsorsSection();

    var res = await sb.from("events").select("*").order("event_date");
    if (res.error) {
        noResult.textContent = "Could not load events: " + res.error.message;
        noResult.style.display = "block";
        return;
    }
    events = res.data || [];
    noResult.textContent = "No events found. Try another search.";
    filterEvents();
}

// 4) RENDER BOTTOM HACKATHON SPONSORS LIST
function renderSponsorsSection() {
    var box = document.getElementById("sponsorList");
    if (!box) return;
    if (sponsors.length === 0) {
        box.innerHTML = "<p>Hackathon sponsors announcing soon.</p>";
        return;
    }
    box.innerHTML = sponsors.map(function (s) {
        var logo = s.logo_path ? sb.storage.from("sponsor-logos").getPublicUrl(s.logo_path).data.publicUrl : "";
        return '<div class="sponsor-card">' +
            (logo ? '<img src="' + esc(logo) + '" alt="' + esc(s.name) + ' logo">' : '<div class="sponsor-ph">🏢</div>') +
            '<h4>' + esc(s.name) + '</h4><p>' + esc(s.description || "") + '</p>' +
            (s.website_url ? '<a href="' + esc(s.website_url) + '" target="_blank" rel="noopener">Visit website</a>' : '') +
            '</div>';
    }).join("");
}

initEventsPage();