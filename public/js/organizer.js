/* ==========================================================
   organizer.js  -->  ORGANIZER DASHBOARD
   1) Only organizers/admins may open this page
   2) Create Event (saved in the "events" table)
   3) My Events  (events where created_by = me)
   4) Participants of the clicked event (from "registrations")
   5) Issue certificates to every participant (insert into
      "certificates" + mark registration attended = true).
      Students then see them on their own dashboard.
   ========================================================== */

var user = null;
var currentEvent = null;   // the event whose participants are shown
var participants = [];

function toast(text) {
    var m = document.getElementById("dashMsg");
    m.textContent = text; m.style.display = "block";
    setTimeout(function () { m.style.display = "none"; }, 3500);
}
function niceDate(d) {
    return new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// 1) PROTECT THE PAGE (must be logged in AND organizer/admin)
async function start() {
    var r = await sb.auth.getUser();
    if (!r.data.user) { window.location.replace("login.html"); return; }
    user = r.data.user;

    var roles = await sb.from("user_roles").select("role").eq("user_id", user.id);
    var staff = (roles.data || []).some(function (x) { return x.role === "organizer" || x.role === "admin"; });
    if (!staff) { window.location.replace("dashboard.html"); return; }

    document.getElementById("loading").classList.add("hidden");
    document.getElementById("orgMain").classList.remove("hidden");

    var prof = await sb.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
    var name = (prof.data && prof.data.full_name) || user.email.split("@")[0];
    document.getElementById("orgGreeting").textContent = "Welcome, " + name + " 👋";
    document.getElementById("orgEmail").textContent = user.email;

    loadTemplates();
    loadMyEvents();
}

// 2) TEMPLATE CHOICES for the create form
async function loadTemplates() {
    var res = await sb.from("certificate_templates").select("id, name");
    document.getElementById("evTemplate").innerHTML = '<option value="">Classic (built-in)</option>' +
        (res.data || []).map(function (t) { return '<option value="' + t.id + '">' + esc(t.name) + "</option>"; }).join("");
}

// 3) CREATE EVENT
document.getElementById("createForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    var ev = {
        name: document.getElementById("evName").value.trim(),
        event_date: document.getElementById("evDate").value,
        category: document.getElementById("evCategory").value,
        venue: document.getElementById("evVenue").value.trim() || "TBA",
        description: document.getElementById("evDesc").value.trim(),
        template_id: document.getElementById("evTemplate").value || null,
        created_by: user.id
    };
    if (!ev.name || !ev.event_date) return toast("Event name and date are required.");

    var res = await sb.from("events").insert(ev);
    // If the template_id column has not been added yet, save without it
    if (res.error && /template_id/.test(res.error.message)) {
        delete ev.template_id;
        res = await sb.from("events").insert(ev);
    }
    toast(res.error ? res.error.message : "Event created!");
    if (!res.error) { e.target.reset(); loadMyEvents(); }
});

// 4) MY EVENTS (+ stats)
async function loadMyEvents() {
    var res = await sb.from("events")
        .select("*, registrations(id), certificates(id)")
        .eq("created_by", user.id)
        .order("event_date", { ascending: false });
    var events = res.data || [];

    var totalP = 0, totalC = 0;
    events.forEach(function (ev) { totalP += (ev.registrations || []).length; totalC += (ev.certificates || []).length; });
    document.getElementById("statEvents").textContent = events.length;
    document.getElementById("statParticipants").textContent = totalP;
    document.getElementById("statIssued").textContent = totalC;

    var box = document.getElementById("myEvents");
    box.innerHTML = events.map(function (ev) {
        return '<div class="ev-item clickable" data-id="' + ev.id + '"><span class="ev-icon">' + esc(ev.icon || "📅") +
            '</span><div class="ev-info"><b>' + esc(ev.name) + "</b><br><small>" + niceDate(ev.event_date) + " · " +
            esc(ev.category) + '</small></div><span class="badge">' + (ev.registrations || []).length + " registered</span></div>";
    }).join("") || '<p class="empty">You have not created any events yet.</p>';

    box.querySelectorAll(".ev-item").forEach(function (item) {
        item.addEventListener("click", function () {
            box.querySelectorAll(".ev-item").forEach(function (x) { x.classList.remove("selected"); });
            item.classList.add("selected");
            var ev = events.find(function (x) { return x.id === item.getAttribute("data-id"); });
            showParticipants(ev);
        });
    });
}

// 5) PARTICIPANT LIST for one event
async function showParticipants(ev) {
    currentEvent = ev;
    document.getElementById("partPanel").classList.remove("hidden");
    document.getElementById("partTitle").textContent = "👥 Participants — " + ev.name;
    var list = document.getElementById("partList");
    list.innerHTML = "<p>Loading…</p>";

    var res = await sb.from("registrations")
        .select("id, user_id, full_name, roll_number, email, branch, year, attended, certificates(certificate_code)")
        .eq("event_id", ev.id).order("created_at");
    participants = res.data || [];

    if (!participants.length) { list.innerHTML = '<p class="empty">No one has registered yet.</p>'; return; }
    list.innerHTML = '<table class="part-table"><tr><th>#</th><th>Name</th><th>Roll No</th><th>Email</th><th>Branch / Year</th><th>Certificate</th></tr>' +
        participants.map(function (p, i) {
            var code = certCode(p);
            return "<tr><td>" + (i + 1) + "</td><td>" + esc(p.full_name) + "</td><td>" + esc(p.roll_number) + "</td><td>" +
                esc(p.email) + "</td><td>" + esc(p.branch) + " / " + esc(p.year) + "</td><td>" +
                (code ? '<span class="badge green">' + esc(code) + "</span>" : '<span class="badge">Pending</span>') + "</td></tr>";
        }).join("") + "</table>";
}
function certCode(p) {
    var c = p.certificates;
    return c && (c.certificate_code || (c[0] && c[0].certificate_code));
}

// 6) ISSUE CERTIFICATES to everyone who doesn't have one yet
document.getElementById("issueBtn").addEventListener("click", async function () {
    if (!currentEvent) return;
    var pending = participants.filter(function (p) { return !certCode(p); });
    if (!pending.length) return toast("All participants already have certificates.");

    var btn = this; btn.disabled = true; btn.textContent = "Issuing…";
    var rows = pending.map(function (p) {
        return {
            registration_id: p.id, user_id: p.user_id, event_id: currentEvent.id,
            template_id: currentEvent.template_id || null,
            student_name: p.full_name, event_name: currentEvent.name,
            event_date: currentEvent.event_date, issued_by: user.id
        };
    });
    var ins = await sb.from("certificates").insert(rows);
    if (!ins.error) {
        await sb.from("registrations").update({ attended: true })
            .in("id", pending.map(function (p) { return p.id; }));
    }
    btn.disabled = false; btn.textContent = "🎓 Generate / Issue Certificates";
    toast(ins.error ? ins.error.message : pending.length + " certificate(s) issued!");
    showParticipants(currentEvent);
    loadMyEvents();
});

// 7) LOGOUT
document.getElementById("logoutBtn").addEventListener("click", async function () {
    await sb.auth.signOut();
    window.location.replace("login.html");
});

start();
