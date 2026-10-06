/* ==========================================================
   login.js  -->  REAL LOGIN / SIGNUP (Supabase Auth) + DASHBOARD
   ========================================================== */

var tabStudent = document.getElementById("tabStudent");
var tabAdmin = document.getElementById("tabAdmin");
var studentForm = document.getElementById("studentForm");
var adminForm = document.getElementById("adminForm");
var signupForm = document.getElementById("signupForm");
var loginMsg = document.getElementById("loginMsg");

function hideAllForms() {
    [studentForm, adminForm, signupForm].forEach(function (x) { x.classList.add("hidden"); });
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

// 5) AFTER LOGIN -> go to the protected dashboard page
function showDashboard() { window.location.href = "dashboard.html"; }

// 6) ALREADY LOGGED IN? skip the login page
sb.auth.getSession().then(function (r) { if (r.data.session) showDashboard(); });
