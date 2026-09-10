/* ==========================================================
   events.js  -->  EVENT DATA + SEARCH + CATEGORY FILTER
   Simple beginner level JavaScript (no framework used).
   ========================================================== */

// 1) SAMPLE EVENT DATA (later this can come from a database)
var events = [
    { icon: "🖥️", name: "Tech Fest 2026",                 date: "15 Sep 2026", venue: "RCPIT Auditorium",  category: "Technical",   desc: "Annual technical festival with project displays and fun tech games." },
    { icon: "💻", name: "Hackathon 2026",                  date: "22 Sep 2026", venue: "IT Department",     category: "Competition", desc: "24 hour coding challenge for students in teams of four." },
    { icon: "🌐", name: "Web Development Workshop",        date: "30 Sep 2026", venue: "Computer Lab 1",    category: "Workshop",    desc: "Hands on session on HTML, CSS and JavaScript basics." },
    { icon: "🔐", name: "Cybersecurity Awareness Seminar", date: "05 Oct 2026", venue: "Seminar Hall",      category: "Seminar",     desc: "Learn safe browsing, passwords and common online attacks." },
    { icon: "🐍", name: "Python Programming Workshop",     date: "12 Oct 2026", venue: "Computer Lab 2",    category: "Workshop",    desc: "Beginner friendly Python coding practice with small projects." },
    { icon: "🤖", name: "AI & Machine Learning Seminar",   date: "18 Oct 2026", venue: "Seminar Hall",      category: "Seminar",     desc: "Introduction to AI, ML models and real life applications." },
    { icon: "🏆", name: "Coding Competition",              date: "25 Oct 2026", venue: "IT Department",     category: "Competition", desc: "Solve programming problems and win exciting prizes." },
    { icon: "📊", name: "Project Exhibition",              date: "02 Nov 2026", venue: "Main Building",     category: "Technical",   desc: "Showcase your semester projects in front of faculty judges." },
    { icon: "📈", name: "Data Science Workshop",           date: "09 Nov 2026", venue: "Computer Lab 3",    category: "Workshop",    desc: "Work with data, charts and simple prediction models." },
    { icon: "💡", name: "Entrepreneurship Seminar",        date: "16 Nov 2026", venue: "Auditorium",        category: "Seminar",     desc: "Startup ideas, business planning and student innovation talks." }
];

// 2) GET THE PAGE ELEMENTS
var eventList = document.getElementById("eventList");
var searchBox = document.getElementById("searchBox");
var noResult = document.getElementById("noResult");
var filterButtons = document.querySelectorAll(".filter-btn");

// remember which category is selected
var selectedCategory = "All";

// 3) SHOW THE EVENT CARDS ON THE PAGE
function showEvents(list) {
    eventList.innerHTML = "";               // clear old cards

    for (var i = 0; i < list.length; i++) {
        var e = list[i];

        var card = document.createElement("div");
        card.className = "card event-card";
        card.innerHTML =
            '<div class="event-icon">' + e.icon + '</div>' +
            '<span class="event-tag">' + e.category + '</span>' +
            '<h3>' + e.name + '</h3>' +
            '<p>Date: ' + e.date + '</p>' +
            '<p>Venue: ' + e.venue + '</p>' +
            '<p class="desc">' + e.desc + '</p>' +
            // the event name is passed to the registration page using the URL
            '<a class="card-btn" href="registration.html?event=' + encodeURIComponent(e.name) + '">Register</a>';

        eventList.appendChild(card);
    }

    // show "no events found" message when the list is empty
    noResult.style.display = (list.length === 0) ? "block" : "none";
}

// 4) FILTER THE EVENTS USING SEARCH TEXT + CATEGORY
function filterEvents() {
    var text = searchBox.value.toLowerCase();
    var result = [];

    for (var i = 0; i < events.length; i++) {
        var e = events[i];
        var matchText = e.name.toLowerCase().indexOf(text) !== -1;
        var matchCategory = (selectedCategory === "All" || e.category === selectedCategory);

        if (matchText && matchCategory) {
            result.push(e);
        }
    }

    showEvents(result);
}

// 5) SEARCH BOX EVENT
searchBox.addEventListener("keyup", filterEvents);

// 6) CATEGORY BUTTON CLICKS
for (var b = 0; b < filterButtons.length; b++) {
    filterButtons[b].addEventListener("click", function () {
        // remove highlight from all buttons
        for (var j = 0; j < filterButtons.length; j++) {
            filterButtons[j].classList.remove("active");
        }
        // highlight the clicked button
        this.classList.add("active");

        selectedCategory = this.getAttribute("data-category");
        filterEvents();
    });
}

// 7) SHOW ALL EVENTS WHEN THE PAGE OPENS
showEvents(events);
