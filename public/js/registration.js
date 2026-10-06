/* ==========================================================
   registration.js  -->  AUTO FILL EVENT + VALIDATION + SAVE TO SUPABASE
   ========================================================== */

var params = new URLSearchParams(window.location.search);
var eventId = params.get("id");
var eventFromUrl = params.get("event") || "Not Selected";

document.getElementById("selectedEvent").textContent = eventFromUrl;
document.getElementById("eventName").value = eventFromUrl;

var form = document.getElementById("registrationForm");
var successMsg = document.getElementById("successMsg");
var currentUser = null;

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showBox(text, ok) {
    successMsg.textContent = text;
    successMsg.style.display = "block";
    successMsg.style.background = ok ? "" : "#fdecea";
    successMsg.style.color = ok ? "" : "#C0392B";
    window.scrollTo(0, 0);
}

// 1) USER MUST BE LOGGED IN TO REGISTER
sb.auth.getUser().then(function (r) {
    currentUser = r.data.user;
    if (!currentUser) {
        showBox("Please login first to register for this event.", false);
        successMsg.innerHTML += ' <a href="login.html">Go to Login</a>';
    } else {
        document.getElementById("email").value = currentUser.email;
    }
    if (!eventId) showBox("Please choose an event from the Events page first.", false);
});

// 2) VALIDATE + SAVE
form.addEventListener("submit", async function (e) {
    e.preventDefault();
    var f = {
        name: document.getElementById("fullName").value.trim(),
        roll: document.getElementById("rollNo").value.trim(),
        prn: document.getElementById("prn").value.trim(),
        email: document.getElementById("email").value.trim(),
        branch: document.getElementById("branch").value,
        year: document.getElementById("year").value
    };
    var errs = { errName: !f.name && "Please enter your full name.",
                 errRoll: !f.roll && "Please enter your roll number.",
                 errPrn: !f.prn && "Please enter your PRN.",
                 errEmail: !f.email ? "Please enter your email." : (!isValidEmail(f.email) && "Please enter a valid email address."),
                 errBranch: !f.branch && "Please select your branch.",
                 errYear: !f.year && "Please select your year." };
    var valid = true;
    for (var id in errs) {
        document.getElementById(id).textContent = errs[id] || "";
        if (errs[id]) valid = false;
    }
    successMsg.style.display = "none";
    if (!valid) return;
    if (!currentUser) return showBox("Please login first to register.", false);
    if (!eventId) return showBox("Please choose an event from the Events page first.", false);

    var res = await sb.from("registrations").insert({
        user_id: currentUser.id, event_id: eventId,
        full_name: f.name, roll_number: f.roll, prn: f.prn,
        email: f.email, branch: f.branch, year: f.year
    });
    if (res.error) {
        var dup = res.error.code === "23505";
        return showBox(dup ? "You are already registered for this event." : "Error: " + res.error.message, false);
    }
    showBox("Registration submitted successfully!", true);
    form.reset();
    document.getElementById("eventName").value = eventFromUrl;
});
