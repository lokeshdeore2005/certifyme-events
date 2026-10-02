/* ==========================================================
   events.js  -->  LOAD EVENTS FROM SUPABASE + SEARCH + FILTER
   ========================================================== */

var events = [];   // filled from the database

var eventList = document.getElementById("eventList");
var searchBox = document.getElementById("searchBox");
var noResult = document.getElementById("noResult");
var filterButtons = document.querySelectorAll(".filter-btn");
var selectedCategory = "All";

// makes text safe to put inside HTML

function formatDate(d) {
    return new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// 1) SHOW CARDS
function showEvents(list) {
    eventList.innerHTML = "";
    for (var i = 0; i < list.length; i++) {
        var e = list[i];
        var card = document.createElement("div");
        card.className = "card event-card";
        card.innerHTML =
            '<div class="event-icon">' + esc(e.icon) + '</div>' +
            '<span class="event-tag">' + esc(e.category) + '</span>' +
            '<h3>' + esc(e.name) + '</h3>' +
            '<p>Date: ' + formatDate(e.event_date) + '</p>' +
            '<p>Venue: ' + esc(e.venue) + '</p>' +
            '<p class="desc">' + esc(e.description) + '</p>' +
            // event id + name are passed to the registration page
            '<a class="card-btn" href="registration.html?id=' + e.id + '&event=' + encodeURIComponent(e.name) + '">Register</a>';
        eventList.appendChild(card);
    }
    noResult.style.display = list.length === 0 ? "block" : "none";
}

// 2) SEARCH + CATEGORY
function filterEvents() {
    var text = searchBox.value.toLowerCase();
    showEvents(events.filter(function (e) {
        var catOk = selectedCategory === "All" || e.category === selectedCategory;
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

// 3) LOAD FROM DATABASE
async function loadEvents() {
    var res = await sb.from("events").select("*").order("event_date");
    if (res.error) {
        noResult.textContent = "Could not load events: " + res.error.message;
        noResult.style.display = "block";
        return;
    }
    events = res.data;
    noResult.textContent = "No events found. Try another search.";
    filterEvents();
}
loadEvents();
