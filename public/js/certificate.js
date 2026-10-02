/* ==========================================================
   certificate.js  -->  SHOW REAL CERTIFICATES + QR + VERIFY
   certificate.html            -> list of my certificates
   certificate.html?code=XXXX  -> one certificate (public verification)
   ========================================================== */

var certMsg = document.getElementById("certMsg");
var certList = document.getElementById("certList");
var code = new URLSearchParams(window.location.search).get("code");

function showCertMessage(text, ok) {
    certMsg.textContent = text;
    certMsg.style.display = "block";
    certMsg.style.background = ok === false ? "#fdecea" : "";
    certMsg.style.color = ok === false ? "#C0392B" : "";
}
function formatDate(d) {
    return new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}

// fill the template with real data + draw the QR code
function renderCertificate(c) {
    document.querySelector(".student-name").textContent = c.student_name;
    document.querySelector(".event-name").textContent = c.event_name;
    document.querySelector(".event-date").textContent = formatDate(c.event_date);
    document.getElementById("certCode").textContent = c.certificate_code;
    var verifyUrl = window.location.origin + "/certificate.html?code=" + c.certificate_code;
    document.getElementById("qrcode").innerHTML = "";
    new QRCode(document.getElementById("qrcode"), { text: verifyUrl, width: 90, height: 90 });
    document.getElementById("certWrapper").classList.remove("hidden");
    document.getElementById("certActions").classList.remove("hidden");
}

// VERIFY: checks the code in the database (works without login)
async function verify(c) {
    var res = await sb.rpc("verify_certificate", { _code: c });
    if (res.error || !res.data || res.data.length === 0) {
        showCertMessage("❌ Certificate " + c + " is NOT valid.", false);
        return null;
    }
    showCertMessage("✅ Valid certificate issued to " + res.data[0].student_name + " for " + res.data[0].event_name + ".");
    return res.data[0];
}

async function start() {
    if (code) {                                     // opened from a QR scan
        var c = await verify(code);
        if (c) renderCertificate(c);
        return;
    }
    var u = (await sb.auth.getUser()).data.user;
    if (!u) {
        certList.innerHTML = '<p>Please <a href="login.html" style="display:inline;box-shadow:none;padding:0">login</a> to see your certificates.</p>';
        return;
    }
    var res = await sb.from("certificates").select("*").eq("user_id", u.id).order("issued_at", { ascending: false });
    var list = res.data || [];
    if (list.length === 0) { certList.innerHTML = "<p>No certificates issued to you yet.</p>"; return; }
    certList.innerHTML = list.map(function (c, i) {
        return '<a href="#" data-i="' + i + '">🎓 ' + esc(c.event_name) + " — " + esc(c.certificate_code) + "</a>";
    }).join("");
    certList.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function (e) { e.preventDefault(); renderCertificate(list[a.getAttribute("data-i")]); });
    });
    renderCertificate(list[0]);
}

// DOWNLOAD: browser "Save as PDF" of just the certificate
document.getElementById("downloadBtn").addEventListener("click", function () { window.print(); });
document.getElementById("verifyBtn").addEventListener("click", function () {
    verify(document.getElementById("certCode").textContent);
});

start();
