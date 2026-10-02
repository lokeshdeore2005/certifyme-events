/* ==========================================================
   dashboard.js  -->  PROTECTED DASHBOARD
   Not logged in?  -> sent back to login.html
   Students        -> stats, upcoming events, my activity
   Organizer/Admin -> + add events, add sponsors, issue certificates
   ========================================================== */

var user = null;

function toast(text) {
    var m = document.getElementById("dashMsg");
    m.textContent = text; m.style.display = "block";
    setTimeout(function () { m.style.display = "none"; }, 3000);
}
function niceDate(d) {
    return new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// 1) PROTECT THE PAGE
async function start() {
    var r = await sb.auth.getUser();
    if (!r.data.user) { window.location.replace("login.html"); return; }
    user = r.data.user;
    document.getElementById("loading").classList.add("hidden");
    document.getElementById("dashMain").classList.remove("hidden");

    // greeting
    var prof = await sb.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
    var name = (prof.data && prof.data.full_name) || user.email.split("@")[0];
    var h = new Date().getHours();
    var part = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
    document.getElementById("greeting").textContent = part + ", " + name + " 👋";
    document.getElementById("todayText").textContent =
        new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

    var roles = await sb.from("user_roles").select("role").eq("user_id", user.id);
    var staff = (roles.data || []).some(function (x) { return x.role !== "student"; });
    document.getElementById("roleText").textContent =
        (staff ? "Organizer / Admin" : "Student") + " · " + user.email;

    loadStudentData();
    if (staff) {
        document.getElementById("staffArea").classList.remove("hidden");
        loadAllRegistrations();
        loadHackathons();
    }
}

// 2) STUDENT DATA
async function loadStudentData() {
    var today = new Date().toISOString().slice(0, 10);
    var res = await Promise.all([
        sb.from("registrations").select("id, attended, events(name, event_date, icon)").eq("user_id", user.id),
        sb.from("certificates").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        sb.from("events").select("*").gte("event_date", today).order("event_date").limit(5)
    ]);
    var regs = res[0].data || [], upcoming = res[2].data || [];

    document.getElementById("statRegs").textContent = regs.length;
    document.getElementById("statAttended").textContent = regs.filter(function (r) { return r.attended; }).length;
    document.getElementById("statCerts").textContent = res[1].count || 0;
    document.getElementById("statUpcoming").textContent = upcoming.length;

    document.getElementById("upcomingList").innerHTML = upcoming.map(function (e) {
        return '<div class="ev-item"><span class="ev-icon">' + esc(e.icon) + '</span><div class="ev-info"><b>' +
            esc(e.name) + "</b><br><small>" + niceDate(e.event_date) + " · " + esc(e.venue) + '</small></div>' +
            '<a class="badge" href="event.html?id=' + e.id + '">View</a></div>';
    }).join("") || '<p class="empty">No upcoming events yet.</p>';

    document.getElementById("myRegs").innerHTML = regs.map(function (r) {
        var e = r.events || {};
        return '<div class="ev-item"><span class="ev-icon">' + esc(e.icon) + '</span><div class="ev-info"><b>' +
            esc(e.name) + "</b><br><small>" + (e.event_date ? niceDate(e.event_date) : "") + "</small></div>" +
            (r.attended ? '<span class="badge green">Attended</span>' : '<span class="badge">Registered</span>') + "</div>";
    }).join("") || '<p class="empty">You have not registered for any event yet.</p>';
}

// 3) ORGANIZER: registrations + issue certificate
async function loadAllRegistrations() {
    var res = await Promise.all([
        sb.from("registrations").select("id, user_id, event_id, full_name, roll_number, events(name, event_date), certificates(certificate_code)")
            .order("created_at", { ascending: false }),
        sb.from("certificate_templates").select("id, name")
    ]);
    var regs = res[0].data || [];
    var tplOptions = '<option value="">Classic</option>' + (res[1].data || []).map(function (t) {
        return '<option value="' + t.id + '">' + esc(t.name) + "</option>";
    }).join("");

    var box = document.getElementById("allRegs");
    box.innerHTML = regs.map(function (r) {
        var c = r.certificates; var code = c && (c.certificate_code || (c[0] && c[0].certificate_code));
        return '<div class="ev-item"><div class="ev-info"><b>' + esc(r.full_name) + "</b> (" + esc(r.roll_number) +
            ")<br><small>" + esc(r.events.name) + "</small></div>" +
            (code ? '<span class="badge green">' + esc(code) + "</span>"
                : '<select data-tpl="' + r.id + '">' + tplOptions + '</select><button data-id="' + r.id + '">Issue Certificate</button>') + "</div>";
    }).join("") || '<p class="empty">No registrations yet.</p>';

    box.querySelectorAll("button").forEach(function (btn) {
        btn.addEventListener("click", async function () {
            var id = btn.getAttribute("data-id");
            var r = regs.find(function (x) { return x.id === id; });
            var tpl = box.querySelector('select[data-tpl="' + id + '"]').value || null;
            await sb.from("registrations").update({ attended: true }).eq("id", id);
            var ins = await sb.from("certificates").insert({
                registration_id: id, user_id: r.user_id, event_id: r.event_id, template_id: tpl,
                student_name: r.full_name, event_name: r.events.name, event_date: r.events.event_date, issued_by: user.id
            });
            toast(ins.error ? ins.error.message : "Certificate issued to " + r.full_name);
            loadAllRegistrations();
        });
    });
}

// 4) ORGANIZER: add event
document.getElementById("eventForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    var ev = {
        name: document.getElementById("evName").value.trim(),
        category: document.getElementById("evCategory").value,
        event_date: document.getElementById("evDate").value,
        venue: document.getElementById("evVenue").value.trim(),
        icon: document.getElementById("evIcon").value.trim() || "📅",
        description: document.getElementById("evDesc").value.trim(),
        created_by: user.id
    };
    if (!ev.name || !ev.event_date || !ev.venue) return toast("Event name, date and venue are required.");
    var res = await sb.from("events").insert(ev);
    toast(res.error ? res.error.message : "Event added!");
    if (!res.error) { e.target.reset(); loadStudentData(); loadHackathons(); }
});

// 5) ORGANIZER: add sponsor (logo goes to the 'sponsor-logos' bucket)
async function loadHackathons() {
    var res = await sb.from("events").select("id, name").eq("category", "Hackathon");
    document.getElementById("spEvent").innerHTML = '<option value="">All hackathons</option>' +
        (res.data || []).map(function (e) { return '<option value="' + e.id + '">' + esc(e.name) + "</option>"; }).join("");
}

document.getElementById("sponsorForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    var name = document.getElementById("spName").value.trim();
    if (!name) return toast("Sponsor name is required.");
    var file = document.getElementById("spLogo").files[0];
    var logoPath = null;
    if (file) {
        logoPath = Date.now() + "-" + file.name.replace(/[^a-zA-Z0-9.]/g, "_");
        var up = await sb.storage.from("sponsor-logos").upload(logoPath, file);
        if (up.error) return toast("Logo upload failed: " + up.error.message);
    }
    var res = await sb.from("sponsors").insert({
        name: name,
        website_url: document.getElementById("spWebsite").value.trim() || null,
        description: document.getElementById("spDesc").value.trim() || null,
        event_id: document.getElementById("spEvent").value || null,
        logo_path: logoPath
    });
    toast(res.error ? res.error.message : "Sponsor added!");
    if (!res.error) e.target.reset();
});

// 6) LOGOUT
document.getElementById("logoutBtn").addEventListener("click", async function () {
    await sb.auth.signOut();
    window.location.replace("login.html");
});

start();
