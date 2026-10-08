/* ==========================================================
   organizer.js  -->  BULLETPROOF ORGANIZER DASHBOARD
   ========================================================== */

var user = null;
var currentEvent = null;
var participants = [];

function toast(text) {
    var m = document.getElementById("dashMsg");
    if (!m) return;
    m.textContent = text;
    m.style.display = "block";
    setTimeout(function () { m.style.display = "none"; }, 3500);
}

function niceDate(d) {
    if (!d) return "";
    return new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// Generate Unique Certificate Code for QR Verification
function makeCertCode() {
    var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    var rand = "";
    for (var i = 0; i < 6; i++) {
        rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return "RCPIT-2026-" + rand;
}

// 1) PROTECT THE PAGE (Safe against missing columns or DB errors)
async function start() {
    var loadingEl = document.getElementById("loading");
    var mainEl = document.getElementById("orgMain");

    try {
        var r = await sb.auth.getUser();
        if (!r.data || !r.data.user) {
            window.location.replace("login.html");
            return;
        }
        user = r.data.user;

        // Safely check roles & profile without crashing if a column doesn't exist
        var rolesRes = await sb.from("user_roles").select("role").eq("user_id", user.id);
        var profRes = await sb.from("profiles").select("*").eq("id", user.id).maybeSingle();

        var isOrganizer =
            (user.user_metadata && (user.user_metadata.role === "organizer" || user.user_metadata.role === "admin")) ||
            (profRes.data && (profRes.data.role === "organizer" || profRes.data.role === "admin")) ||
            (rolesRes.data || []).some(function (x) { return x.role === "organizer" || x.role === "admin"; });

        if (!isOrganizer) {
            window.location.replace("dashboard.html");
            return;
        }

        // Show Organizer Dashboard immediately
        if (loadingEl) loadingEl.classList.add("hidden");
        if (mainEl) mainEl.classList.remove("hidden");

        var name = (profRes.data && profRes.data.full_name) ||
                   (user.user_metadata && user.user_metadata.full_name) ||
                   user.email.split("@")[0];

        var greetEl = document.getElementById("orgGreeting");
        var emailEl = document.getElementById("orgEmail");
        if (greetEl) greetEl.textContent = "Welcome, " + name + " 👋";
        if (emailEl) emailEl.textContent = "Organizer · " + user.email;

        loadTemplates();
        loadMyEvents();
        loadHackathons();
    } catch (err) {
        console.error("Organizer init error:", err);
        if (loadingEl) loadingEl.classList.add("hidden");
        if (mainEl) mainEl.classList.remove("hidden");
    }
}

// 2) TEMPLATE CHOICES
async function loadTemplates() {
    var res = await sb.from("certificate_templates").select("id, name");
    var builtInOptions =
        '<option value="classic">Classic Academic (Built-in)</option>' +
        '<option value="modern">Modern Tech (Built-in)</option>' +
        '<option value="royal">Royal Gold (Built-in)</option>' +
        '<option value="dark">Dark Elegance (Built-in)</option>';

    var customOptions = (res.data || []).map(function (t) {
        return '<option value="' + t.id + '">' + esc(t.name) + "</option>";
    }).join("");

    var evTpl = document.getElementById("evTemplate");
    var issueTpl = document.getElementById("issueTemplate");
    if (evTpl) evTpl.innerHTML = builtInOptions + customOptions;
    if (issueTpl) issueTpl.innerHTML = builtInOptions + customOptions;
}

// 3) CREATE EVENT
var createForm = document.getElementById("createForm");
if (createForm) {
    createForm.addEventListener("submit", async function (e) {
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

        var colorInput = document.getElementById("evColor");
        var chosenColor = colorInput ? colorInput.value : "#1e70b8";
        localStorage.setItem("cert_color_" + ev.name, chosenColor);

        var res = await sb.from("events").insert(ev);
        if (res.error && /template_id|uuid/i.test(res.error.message)) {
            localStorage.setItem("cert_tpl_" + ev.name, ev.template_id);
            delete ev.template_id;
            res = await sb.from("events").insert(ev);
        }
        toast(res.error ? res.error.message : "Event created!");
        if (!res.error) {
            e.target.reset();
            loadMyEvents();
            loadHackathons();
        }
    });
}

// 4) MY EVENTS (+ stats)
async function loadMyEvents() {
    var res = await sb.from("events")
        .select("*, registrations(id), certificates(id)")
        .eq("created_by", user.id)
        .order("event_date", { ascending: false });
    var events = res.data || [];

    var totalP = 0, totalC = 0;
    events.forEach(function (ev) {
        totalP += (ev.registrations || []).length;
        totalC += (ev.certificates || []).length;
    });

    if (document.getElementById("statEvents")) document.getElementById("statEvents").textContent = events.length;
    if (document.getElementById("statParticipants")) document.getElementById("statParticipants").textContent = totalP;
    if (document.getElementById("statIssued")) document.getElementById("statIssued").textContent = totalC;

    var box = document.getElementById("myEvents");
    if (!box) return;

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

// 5) PARTICIPANT LIST
async function showParticipants(ev) {
    currentEvent = ev;
    var partPanel = document.getElementById("partPanel");
    if (partPanel) partPanel.classList.remove("hidden");
    if (document.getElementById("partTitle")) {
        document.getElementById("partTitle").textContent = "👥 Participants — " + ev.name;
    }

    var savedTpl = ev.template_id || localStorage.getItem("cert_tpl_" + ev.name) || "classic";
    var savedColor = localStorage.getItem("cert_color_" + ev.name) || "#1e70b8";
    if (document.getElementById("issueTemplate")) document.getElementById("issueTemplate").value = savedTpl;
    if (document.getElementById("issueColor")) document.getElementById("issueColor").value = savedColor;

    var list = document.getElementById("partList");
    list.innerHTML = "<p>Loading…</p>";

    var res = await sb.from("registrations")
        .select("id, user_id, full_name, roll_number, email, branch, year, attended, certificates(certificate_code)")
        .eq("event_id", ev.id).order("created_at");
    participants = res.data || [];

    if (!participants.length) {
        list.innerHTML = '<p class="empty">No one has registered yet.</p>';
        return;
    }
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

// 6) GENERATE & SEND CERTIFICATES
var issueBtn = document.getElementById("issueBtn");
if (issueBtn) {
    issueBtn.addEventListener("click", async function () {
        if (!currentEvent) return;
        var pending = participants.filter(function (p) { return !certCode(p); });
        if (!pending.length) return toast("All participants already have certificates.");

        var tplEl = document.getElementById("issueTemplate");
        var colEl = document.getElementById("issueColor");
        var selectedTpl = tplEl ? tplEl.value : (currentEvent.template_id || null);
        var selectedColor = colEl ? colEl.value : "#1e70b8";

        localStorage.setItem("cert_tpl_" + currentEvent.name, selectedTpl);
        localStorage.setItem("cert_color_" + currentEvent.name, selectedColor);

        var btn = this;
        btn.disabled = true;
        btn.textContent = "Generating & Sending…";

        var rows = pending.map(function (p) {
            var r = {
                registration_id: p.id,
                user_id: p.user_id,
                event_id: currentEvent.id,
                certificate_code: makeCertCode(),
                student_name: p.full_name,
                event_name: currentEvent.name,
                event_date: currentEvent.event_date,
                issued_by: user.id
            };
            if (selectedTpl && selectedTpl.length > 20) r.template_id = selectedTpl;
            return r;
        });

        var ins = await sb.from("certificates").insert(rows);

        if (!ins.error) {
            await sb.from("registrations").update({ attended: true })
                .in("id", pending.map(function (p) { return p.id; }));
        }

        btn.disabled = false;
        btn.textContent = "🎓 Generate & Send";
        toast(ins.error ? ins.error.message : pending.length + " certificate(s) generated & sent!");
        showParticipants(currentEvent);
        loadMyEvents();
    });
}

// 7) UPLOAD CUSTOM CERTIFICATE TEMPLATE
var uploadForm = document.getElementById("uploadForm");
if (uploadForm) {
    uploadForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        var name = document.getElementById("tplName").value.trim();
        var file = document.getElementById("tplFile").files[0];
        if (!name || !file) return toast("Please enter a template name and choose an image file.");

        var filePath = Date.now() + "-" + file.name.replace(/[^a-zA-Z0-9.]/g, "_");
        var up = await sb.storage.from("certificate-templates").upload(filePath, file);
        if (up.error) return toast("Upload failed: " + up.error.message);

        var ins = await sb.from("certificate_templates").insert({
            name: name,
            bg_path: filePath,
            created_by: user.id
        });
        toast(ins.error ? ins.error.message : "Custom template uploaded!");
        if (!ins.error) {
            e.target.reset();
            loadTemplates();
        }
    });
}

// 8) ADD HACKATHON SPONSOR
async function loadHackathons() {
    var spSelect = document.getElementById("spEvent");
    if (!spSelect) return;
    var res = await sb.from("events").select("id, name").eq("category", "Hackathon");
    spSelect.innerHTML = '<option value="">All hackathons</option>' +
        (res.data || []).map(function (e) { return '<option value="' + e.id + '">' + esc(e.name) + "</option>"; }).join("");
}

var sponsorForm = document.getElementById("sponsorForm");
if (sponsorForm) {
    sponsorForm.addEventListener("submit", async function (e) {
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
}

// 9) LOGOUT
var logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", async function () {
        await sb.auth.signOut();
        window.location.replace("login.html");
    });
}

start();