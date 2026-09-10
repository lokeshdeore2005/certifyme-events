/* ==========================================================
   registration.js  -->  AUTO FILL EVENT NAME + FORM VALIDATION
   Simple beginner level JavaScript.
   ========================================================== */

// 1) READ THE SELECTED EVENT FROM THE URL
//    example: registration.html?event=Hackathon%202026
var params = new URLSearchParams(window.location.search);
var eventFromUrl = params.get("event");

if (!eventFromUrl) {
    eventFromUrl = "Not Selected";
}

// 2) SHOW IT ON THE PAGE AND INSIDE THE FORM
document.getElementById("selectedEvent").textContent = eventFromUrl;
document.getElementById("eventName").value = eventFromUrl;

// 3) SMALL HELPER TO CHECK EMAIL FORMAT
function isValidEmail(email) {
    // must contain one @ and a dot after it
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// 4) VALIDATE THE FORM WHEN IT IS SUBMITTED
var form = document.getElementById("registrationForm");
var successMsg = document.getElementById("successMsg");

form.addEventListener("submit", function (e) {
    e.preventDefault();     // stop the page from reloading

    var name = document.getElementById("fullName").value.trim();
    var roll = document.getElementById("rollNo").value.trim();
    var prn = document.getElementById("prn").value.trim();
    var email = document.getElementById("email").value.trim();
    var branch = document.getElementById("branch").value;
    var year = document.getElementById("year").value;

    // clear all old messages
    document.getElementById("errName").textContent = "";
    document.getElementById("errRoll").textContent = "";
    document.getElementById("errPrn").textContent = "";
    document.getElementById("errEmail").textContent = "";
    document.getElementById("errBranch").textContent = "";
    document.getElementById("errYear").textContent = "";
    successMsg.style.display = "none";

    var valid = true;

    if (name === "") {
        document.getElementById("errName").textContent = "Please enter your full name.";
        valid = false;
    }
    if (roll === "") {
        document.getElementById("errRoll").textContent = "Please enter your roll number.";
        valid = false;
    }
    if (prn === "") {
        document.getElementById("errPrn").textContent = "Please enter your PRN.";
        valid = false;
    }
    if (email === "") {
        document.getElementById("errEmail").textContent = "Please enter your email.";
        valid = false;
    } else if (!isValidEmail(email)) {
        document.getElementById("errEmail").textContent = "Please enter a valid email address.";
        valid = false;
    }
    if (branch === "") {
        document.getElementById("errBranch").textContent = "Please select your branch.";
        valid = false;
    }
    if (year === "") {
        document.getElementById("errYear").textContent = "Please select your year.";
        valid = false;
    }

    // 5) IF EVERYTHING IS CORRECT, SHOW THE SUCCESS MESSAGE
    //    (no data is sent to a server at this stage)
    if (valid) {
        successMsg.style.display = "block";
        form.reset();
        document.getElementById("eventName").value = eventFromUrl;  // keep the event name
        window.scrollTo(0, 0);
    }
});
