/* ==========================================================
   login.js  -->  REAL LOGIN / SIGNUP (Supabase Auth) + DASHBOARD
   ========================================================== */

var tabStudent = document.getElementById("tabStudent");
var tabAdmin = document.getElementById("tabAdmin");
var studentForm = document.getElementById("studentForm");
var adminForm = document.getElementById("adminForm");
var signupForm = document.getElementById("signupForm");
var dashboard = document.getElementById("dashboard");
var loginMsg = document.getElementById("loginMsg");

function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
}
function hideAllForms() {
    [studentForm, adminForm, signupForm, dashboard].forEach(function (x) { x.classList.add("hidden"); });
}
function showMessage(text, type) { loginMsg.textContent = text; loginMsg.className = "login-msg " + type; }
function clearMessage() { loginMsg.textContent = ""; loginMsg.className = "login-msg"; }
function isValidEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }

// 1) TABS
tabStudent.addEventListener("click", function () {
    clearMessage(); hideAllForms(); studentForm.classList.remove("hidden");
    tabStudent.classList.add("active"); tabAdmin.classList.remove("active");
});
tabAdmin.addEventListener("click", function () {
    clearMessage(); hideAllForms(); adminForm.classList.remove("hidden");
    tabAdmin.classList.add("active"); tabStudent.classList.remove("active");
});
document.getElementById("showSignup").addEventListener("click", function (e) {
    e.preventDefault(); clearMessage(); hideAllForms(); signupForm.classList.remove("hidden");
});
document.getElementById("backToLogin").addEventListener("click", function (e) {
    e.preventDefault(); clearMessage(); hideAllForms(); studentForm.classList.remove("hidden");
});

// 2) CHECK ROLE
async function isStaff(userId) {
    var r = await sb.from("user_roles").select("role").eq("user_id", userId);
    return (r.data || []).some(function (x) { return x.role === "organizer" || x.role === "admin"; });
}

// 3) LOGIN (same for both tabs; admin tab also checks the role)
async function doLogin(emailId, passId, wantStaff) {
    var email = document.getElementById(emailId).value.trim();
    var password = document.getElementById(passId).value;
    if (!email || !password) return showMessage("Please enter both email and password.", "error");
    if (!isValidEmail(email)) return showMessage("Please enter a valid email address.", "error");

    var res = await sb.auth.signInWithPassword({ email: email, password: password });
    if (res.error) return showMessage(res.error.message, "error");

    if (wantStaff && !(await isStaff(res.data.user.id))) {
        await sb.auth.signOut();
        return showMessage("This account is not an organizer / admin.", "error");
    }
    showMessage("Login successful!", "success");
    showDashboard(res.data.user);
}
studentForm.addEventListener("submit", function (e) { e.preventDefault(); doLogin("studentEmail", "studentPassword", false); });
adminForm.addEventListener("submit", function (e) { e.preventDefault(); doLogin("adminEmail", "adminPassword", true); });

// 4) SIGNUP
signupForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    var name = document.getElementById("signupName").value.trim();
    var email = document.getElementById("signupEmail").value.trim();
    var password = document.getElementById("signupPassword").value;
    var confirm = document.getElementById("confirmPassword").value;
    if (!name || !email || !password || !confirm) return showMessage("Please fill all the fields.", "error");
    if (!isValidEmail(email)) return showMessage("Please enter a valid email address.", "error");
    if (password.length < 6) return showMessage("Password must be at least 6 characters long.", "error");
    if (password !== confirm) return showMessage("Password and Confirm Password do not match.", "error");

    var res = await sb.auth.signUp({
        email: email, password: password,
        options: { data: { full_name: name }, emailRedirectTo: window.location.origin + "/login.html" }
    });
    if (res.error) return showMessage(res.error.message, "error");
    if (res.data.session) {
        showMessage("Account created! You are now logged in.", "success");
        showDashboard(res.data.user);
    } else {
        showMessage("Account created! Please check your email to confirm, then login.", "success");
        hideAllForms(); studentForm.classList.remove("hidden");
    }
});

// 5) DASHBOARD
async function showDashboard(user) {
    hideAllForms();
    dashboard.classList.remove("hidden");
    var staff = await isStaff(user.id);
    document.getElementById("dashboardText").textContent =
        "Logged in as " + (staff ? "Organizer / Admin" : "Student") + ": " + user.email;

    // my registrations
    var mine = await sb.from("registrations").select("id, attended, events(name, event_date)").eq("user_id", user.id);
    var box = document.getElementById("myRegs");
    box.innerHTML = (mine.data || []).map(function (r) {
        return '<div class="dash-item">' + esc(r.events && r.events.name) + " — " + esc(r.events && r.events.event_date) +
            (r.attended ? " ✅ Attended" : "") + "</div>";
    }).join("") || "<p>No registrations yet.</p>";

    document.getElementById("staffArea").classList.toggle("hidden", !staff);
    if (staff) loadAllRegistrations(user);
}

// organizer: list every registration with an "Issue Certificate" button
async function loadAllRegistrations(user) {
    var regs = await sb.from("registrations")
        .select("id, user_id, event_id, full_name, roll_number, events(name, event_date), certificates(certificate_code)")
        .order("created_at", { ascending: false });
    var box = document.getElementById("allRegs");
    box.innerHTML = (regs.data || []).map(function (r) {
        var cert = r.certificates && (r.certificates.certificate_code || (r.certificates[0] && r.certificates[0].certificate_code));
        return '<div class="dash-item"><b>' + esc(r.full_name) + "</b> (" + esc(r.roll_number) + ") — " + esc(r.events.name) +
            "<br>" + (cert ? "Certificate: " + esc(cert)
                : '<button data-id="' + r.id + '">Mark Attended &amp; Issue Certificate</button>') + "</div>";
    }).join("") || "<p>No registrations yet.</p>";

    box.querySelectorAll("button").forEach(function (btn) {
        btn.addEventListener("click", async function () {
            var r = regs.data.find(function (x) { return x.id === btn.getAttribute("data-id"); });
            await sb.from("registrations").update({ attended: true }).eq("id", r.id);
            var ins = await sb.from("certificates").insert({
                registration_id: r.id, user_id: r.user_id, event_id: r.event_id,
                student_name: r.full_name, event_name: r.events.name, event_date: r.events.event_date, issued_by: user.id
            });
            if (ins.error) return showMessage(ins.error.message, "error");
            showMessage("Certificate issued to " + r.full_name, "success");
            loadAllRegistrations(user);
        });
    });
}

// organizer: add event
document.getElementById("eventForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    var ev = {
        name: document.getElementById("evName").value.trim(),
        category: document.getElementById("evCategory").value,
        event_date: document.getElementById("evDate").value,
        venue: document.getElementById("evVenue").value.trim(),
        icon: document.getElementById("evIcon").value.trim() || "📅",
        description: document.getElementById("evDesc").value.trim()
    };
    if (!ev.name || !ev.event_date || !ev.venue) return showMessage("Event name, date and venue are required.", "error");
    var u = (await sb.auth.getUser()).data.user;
    ev.created_by = u.id;
    var res = await sb.from("events").insert(ev);
    if (res.error) return showMessage(res.error.message, "error");
    showMessage("Event added!", "success");
    e.target.reset();
});

// 6) LOGOUT
document.getElementById("logoutBtn").addEventListener("click", async function () {
    await sb.auth.signOut();
    clearMessage(); hideAllForms(); studentForm.classList.remove("hidden");
});

// 7) ALREADY LOGGED IN? go straight to the dashboard
sb.auth.getUser().then(function (r) { if (r.data.user) showDashboard(r.data.user); });
