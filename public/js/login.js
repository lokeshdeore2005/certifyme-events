/* ==========================================================
   login.js  -->  TAB SWITCHING + SIGNUP + DEMO LOGIN
   Frontend demo only. No real authentication is used.
   ========================================================== */

// 1) GET ALL THE PARTS OF THE PAGE
var tabStudent = document.getElementById("tabStudent");
var tabAdmin = document.getElementById("tabAdmin");

var studentForm = document.getElementById("studentForm");
var adminForm = document.getElementById("adminForm");
var signupForm = document.getElementById("signupForm");
var dashboard = document.getElementById("dashboard");
var dashboardText = document.getElementById("dashboardText");

var loginMsg = document.getElementById("loginMsg");

// 2) SMALL HELPERS
function hideAllForms() {
    studentForm.classList.add("hidden");
    adminForm.classList.add("hidden");
    signupForm.classList.add("hidden");
    dashboard.classList.add("hidden");
}

function showMessage(text, type) {
    loginMsg.textContent = text;
    loginMsg.className = "login-msg " + type;   // "error" or "success"
}

function clearMessage() {
    loginMsg.textContent = "";
    loginMsg.className = "login-msg";
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// 3) TAB SWITCHING
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

// 4) SHOW THE SIGNUP FORM
document.getElementById("showSignup").addEventListener("click", function (e) {
    e.preventDefault();
    clearMessage();
    hideAllForms();
    signupForm.classList.remove("hidden");
});

// 5) BACK TO THE STUDENT LOGIN FORM
document.getElementById("backToLogin").addEventListener("click", function (e) {
    e.preventDefault();
    clearMessage();
    hideAllForms();
    studentForm.classList.remove("hidden");
});

// 6) STUDENT LOGIN (demo)
studentForm.addEventListener("submit", function (e) {
    e.preventDefault();

    var email = document.getElementById("studentEmail").value.trim();
    var password = document.getElementById("studentPassword").value.trim();

    if (email === "" || password === "") {
        showMessage("Please enter both email and password.", "error");
        return;
    }
    if (!isValidEmail(email)) {
        showMessage("Please enter a valid email address.", "error");
        return;
    }

    showMessage("Login successful! (demo)", "success");
    hideAllForms();
    dashboardText.textContent = "You are logged in as a Student: " + email;
    dashboard.classList.remove("hidden");
});

// 7) ADMIN LOGIN (demo)
adminForm.addEventListener("submit", function (e) {
    e.preventDefault();

    var email = document.getElementById("adminEmail").value.trim();
    var password = document.getElementById("adminPassword").value.trim();

    if (email === "" || password === "") {
        showMessage("Please enter both email and password.", "error");
        return;
    }
    if (!isValidEmail(email)) {
        showMessage("Please enter a valid email address.", "error");
        return;
    }

    showMessage("Admin login successful! (demo)", "success");
    hideAllForms();
    dashboardText.textContent = "You are logged in as an Organizer / Admin: " + email;
    dashboard.classList.remove("hidden");
});

// 8) SIGNUP (demo)
signupForm.addEventListener("submit", function (e) {
    e.preventDefault();

    var name = document.getElementById("signupName").value.trim();
    var email = document.getElementById("signupEmail").value.trim();
    var password = document.getElementById("signupPassword").value.trim();
    var confirm = document.getElementById("confirmPassword").value.trim();

    if (name === "" || email === "" || password === "" || confirm === "") {
        showMessage("Please fill all the fields.", "error");
        return;
    }
    if (!isValidEmail(email)) {
        showMessage("Please enter a valid email address.", "error");
        return;
    }
    if (password.length < 6) {
        showMessage("Password must be at least 6 characters long.", "error");
        return;
    }
    if (password !== confirm) {
        showMessage("Password and Confirm Password do not match.", "error");
        return;
    }

    showMessage("Account created successfully! You can now login. (demo)", "success");
    hideAllForms();
    studentForm.classList.remove("hidden");
});
