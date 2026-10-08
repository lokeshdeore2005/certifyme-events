/* ==========================================================
   dashboard.js  -->  STRICT READ-ONLY STUDENT DASHBOARD
   Organizers are AUTOMATICALLY redirected to organizer-dashboard.html!
   ========================================================== */

var user = null;

function toast(text) {
    var m = document.getElementById("dashMsg");
    if (!m) return;
    m.textContent = text;
    m.style.display = "block";
    setTimeout(function () { m.style.display = "none"; }, 3000);
}

function niceDate(d) {
    if (!d) return "";
    return new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// 1) PROTECT THE PAGE + AUTO-REDIRECT ORGANIZERS
async function start() {
    var r = await sb.auth.getUser();
    if (!r.data.user) {
        window.location.replace("login.html");
        return;
    }
    user = r.data.user;

    // Check role across profiles, user_roles, and auth metadata
    var prof = await sb.from("profiles").select("full_name, role").eq("id", user.id).maybeSingle();
    var roles = await sb.from("user_roles").select("role").eq("user_id", user.id);

    var isOrganizer =
        (prof.data && prof.data.role && prof.data.role !== "student") ||
        (user.user_metadata && user.user_metadata.role && user.user_metadata.role !== "student") ||
        (roles.data || []).some(function (x) { return x.role !== "student"; });

    // 👉 AUTOMATIC REDIRECT: Agar Organizer hai toh seedha Organizer Dashboard par bhejo!
    if (isOrganizer) {
        window.location.replace("organizer-dashboard.html");
        return;
    }

    // Sirf Student ke liye niche ka page dikhao
    document.getElementById("loading").classList.add("hidden");
    document.getElementById("dashMain").classList.remove("hidden");

    var name = (prof.data && prof.data.full_name) || (user.user_metadata && user.user_metadata.full_name) || user.email.split("@")[0];
    var h = new Date().getHours();
    var part = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
    document.getElementById("greeting").textContent = part + ", " + name + " 👋";
    document.getElementById("todayText").textContent =
        new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

    document.getElementById("roleText").textContent = "Student · " + user.email;

    loadStudentData();
}

// 2) STRICT READ-ONLY STUDENT DATA (Registrations + Issued Certificates + Upcoming)
async function loadStudentData() {
    var today = new Date().toISOString().slice(0, 10);
    var res = await Promise.all([
        sb.from("registrations").select("id, attended, events(id, name, event_date, icon, venue)").eq("user_id", user.id),
        sb.from("certificates").select("id, certificate_code, event_name, event_date").eq("user_id", user.id),
        sb.from("events").select("*").gte("event_date", today).order("event_date").limit(5)
    ]);

    var regs = res[0].data || [];
    var certs = res[1].data || [];
    var upcoming = res[2].data || [];

    document.getElementById("statRegs").textContent = regs.length;
    document.getElementById("statAttended").textContent = regs.filter(function (r) { return r.attended; }).length;
    document.getElementById("statCerts").textContent = certs.length;
    document.getElementById("statUpcoming").textContent = upcoming.length;

    document.getElementById("myRegs").innerHTML = regs.map(function (r) {
        var e = r.events || {};
        return '<div class="ev-item"><span class="ev-icon">' + esc(e.icon || "📅") + '</span><div class="ev-info"><b>' +
            esc(e.name || "Event") + "</b><br><small>" + (e.event_date ? niceDate(e.event_date) : "") + "</small></div>" +
            (r.attended ? '<span class="badge green">Attended</span>' : '<span class="badge">Registered</span>') + "</div>";
    }).join("") || '<p class="empty">You have not registered for any event yet.</p>';

    var certBox = document.getElementById("myCerts");
    if (certBox) {
        certBox.innerHTML = certs.map(function (c) {
            var codeParam = c.certificate_code ? '?code=' + encodeURIComponent(c.certificate_code) : '?id=' + encodeURIComponent(c.id);
            return '<div class="ev-item"><span class="ev-icon">🎓</span><div class="ev-info"><b>' +
                esc(c.event_name || "Certificate") + "</b><br><small>" +
                (c.event_date ? niceDate(c.event_date) : "") +
                (c.certificate_code ? " · Code: " + esc(c.certificate_code) : "") + "</small></div>" +
                '<a class="badge green" href="certificate.html' + codeParam + '">View / Download</a></div>';
        }).join("") || '<p class="empty">No certificates issued yet.</p>';
    }

    document.getElementById("upcomingList").innerHTML = upcoming.map(function (e) {
        return '<div class="ev-item"><span class="ev-icon">' + esc(e.icon || "📅") + '</span><div class="ev-info"><b>' +
            esc(e.name) + "</b><br><small>" + niceDate(e.event_date) + " · " + esc(e.venue) + '</small></div>' +
            '<a class="badge" href="registration.html?id=' + e.id + '&event=' + encodeURIComponent(e.name) + '">Register</a></div>';
    }).join("") || '<p class="empty">No upcoming events yet.</p>';
}

// 3) LOGOUT
document.getElementById("logoutBtn").addEventListener("click", async function () {
    await sb.auth.signOut();
    window.location.replace("login.html");
});

start();