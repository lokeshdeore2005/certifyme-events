/* ==========================================================
   login.js  -->  REAL LOGIN / SIGNUP (Supabase Auth) + ROLE SYNC
   ========================================================== */

var tabStudent = document.getElementById("tabStudent");
var tabAdmin = document.getElementById("tabAdmin");
var studentForm = document.getElementById("studentForm");
var adminForm = document.getElementById("adminForm");
var signupForm = document.getElementById("signupForm");
var loginMsg = document.getElementById("loginMsg");

function hideAllForms() {
    [studentForm, adminForm, signupForm].forEach(function (x) {
        if (x) x.classList.add("hidden");
    });
}
function showMessage(text, type) {
    loginMsg.textContent = text;
    loginMsg.className = "login-msg " + type;
}
function clearMessage() {
    loginMsg.textContent = "";
    loginMsg.className = "login-msg";
}
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// 1) TABS & FORM SWITCHING
tabStudent.addEventListener("click", function () {
    clearMessage();
    hideAllForms();
    studentForm.classList.remove("hidden");
    tabStudent.classList.add("active");
    tabAdmin.classList.remove("active");
});

tabAdmin.addEventListener("click", function () {
    clearMessage();
    hideAllForms();
    adminForm.classList.remove("hidden");
    tabAdmin.classList.add("active");
    tabStudent.classList.remove("active");
});

document.getElementById("showSignup").addEventListener("click", function (e) {
    e.preventDefault();
    clearMessage();
    hideAllForms();
    var roleSel = document.getElementById("signupRole");
    if (roleSel) roleSel.value = "student";
    signupForm.classList.remove("hidden");
});

var orgSignupBtn = document.getElementById("showOrganizerSignup");
if (orgSignupBtn) {
    orgSignupBtn.addEventListener("click", function (e) {
        e.preventDefault();
        clearMessage();
        hideAllForms();
        var roleSel = document.getElementById("signupRole");
        if (roleSel) roleSel.value = "organizer";
        signupForm.classList.remove("hidden");
    });
}

document.getElementById("backToLogin").addEventListener("click", function (e) {
    e.preventDefault();
    clearMessage();
    hideAllForms();
    studentForm.classList.remove("hidden");
    tabStudent.classList.add("active");
    tabAdmin.classList.remove("active");
});

// 2) SYNC ROLE TO DATABASE TABLES ('profiles' & 'user_roles')
async function syncUserRole(user, chosenRole, fullName) {
    if (!user) return;
    var roleToSave = chosenRole || (user.user_metadata && user.user_metadata.role) || "student";
    var nameToSave = fullName || (user.user_metadata && user.user_metadata.full_name) || user.email.split("@")[0];

    await sb.from("profiles").upsert({
        id: user.id,
        full_name: nameToSave,
        email: user.email,
        role: roleToSave
    });

    var existing = await sb.from("user_roles").select("role").eq("user_id", user.id);
    if (!existing.data || existing.data.length === 0) {
        await sb.from("user_roles").insert({
            user_id: user.id,
            role: roleToSave
        });
    } else if (chosenRole) {
        await sb.from("user_roles").delete().eq("user_id", user.id);
        await sb.from("user_roles").insert({
            user_id: user.id,
            role: roleToSave
        });
    }
}

// 3) CHECK IF USER IS ORGANIZER / ADMIN
async function isStaff(user) {
    if (!user) return false;
    var userId = user.id;

    // Check user_metadata first
    if (user.user_metadata && (user.user_metadata.role === "organizer" || user.user_metadata.role === "admin")) {
        return true;
    }

    // Check 'profiles' and 'user_roles' tables
    var p = await sb.from("profiles").select("role").eq("id", userId).maybeSingle();
    if (p.data && (p.data.role === "organizer" || p.data.role === "admin")) {
        return true;
    }

    var r = await sb.from("user_roles").select("role").eq("user_id", userId);
    return (r.data || []).some(function (x) {
        return x.role === "organizer" || x.role === "admin";
    });
}

// 4) LOGIN
async function doLogin(emailId, passId, wantStaff) {
    var email = document.getElementById(emailId).value.trim();
    var password = document.getElementById(passId).value;
    if (!email || !password) return showMessage("Please enter both email and password.", "error");
    if (!isValidEmail(email)) return showMessage("Please enter a valid email address.", "error");

    var res = await sb.auth.signInWithPassword({ email: email, password: password });
    if (res.error) return showMessage(res.error.message, "error");

    // Ensure role from signup metadata is synced into database tables on first login
    await syncUserRole(res.data.user);

    var staffStatus = await isStaff(res.data.user);
    if (wantStaff && !staffStatus) {
        await sb.auth.signOut();
        return showMessage("This account is registered as a Student, not an Organizer.", "error");
    }

    showMessage("Login successful!", "success");
    window.location.href = staffStatus ? "organizer-dashboard.html" : "dashboard.html";
}

studentForm.addEventListener("submit", function (e) {
    e.preventDefault();
    doLogin("studentEmail", "studentPassword", false);
});

adminForm.addEventListener("submit", function (e) {
    e.preventDefault();
    doLogin("adminEmail", "adminPassword", true);
});

// 5) SIGNUP (WITH ROLE DROPDOWN)
signupForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    var name = document.getElementById("signupName").value.trim();
    var email = document.getElementById("signupEmail").value.trim();
    var role = document.getElementById("signupRole") ? document.getElementById("signupRole").value : "student";
    var password = document.getElementById("signupPassword").value;
    var confirm = document.getElementById("confirmPassword").value;

    if (!name || !email || !password || !confirm) return showMessage("Please fill all the fields.", "error");
    if (!isValidEmail(email)) return showMessage("Please enter a valid email address.", "error");
    if (password.length < 6) return showMessage("Password must be at least 6 characters long.", "error");
    if (password !== confirm) return showMessage("Password and Confirm Password do not match.", "error");

    var res = await sb.auth.signUp({
        email: email,
        password: password,
        options: {
            data: { full_name: name, role: role },
            emailRedirectTo: window.location.origin + "/login.html"
        }
    });

    if (res.error) return showMessage(res.error.message, "error");

    if (res.data.user) {
        await syncUserRole(res.data.user, role, name);
    }

    if (res.data.session) {
        showMessage("Account created as " + role + "! Redirecting…", "success");
        showDashboard();
    } else {
        showMessage("Account created as " + role + "! Please check your email to confirm, then login.", "success");
        hideAllForms();
        if (role === "organizer") {
            adminForm.classList.remove("hidden");
            tabAdmin.classList.add("active");
            tabStudent.classList.remove("active");
        } else {
            studentForm.classList.remove("hidden");
            tabStudent.classList.add("active");
            tabAdmin.classList.remove("active");
        }
    }
});

// 6) AFTER LOGIN -> organizers go to organizer-dashboard, students to dashboard
async function showDashboard() {
    var r = await sb.auth.getUser();
    if (!r.data.user) return;
    var staff = await isStaff(r.data.user);
    window.location.href = staff ? "organizer-dashboard.html" : "dashboard.html";
}

// 7) ALREADY LOGGED IN? skip the login page
sb.auth.getSession().then(function (r) {
    if (r.data.session) showDashboard();
});