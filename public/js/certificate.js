/* ==========================================================
   certificate.js  -->  STRICT READ-ONLY CERTIFICATE VIEW + QR + VERIFY
   certificate.html            -> list of student's issued certificates
   certificate.html?code=XXXX  -> single certificate (public verification / direct view)
   ========================================================== */

var certMsg = document.getElementById("certMsg");
var certList = document.getElementById("certList");
var certBox = document.getElementById("certificate");
var params = new URLSearchParams(window.location.search);
var code = params.get("code");
var certId = params.get("id");

var builtInStyles = {
    classic: "classic",
    modern: "modern",
    royal: "royal",
    dark: "dark"
};

function showCertMessage(text, ok) {
    if (!certMsg) return;
    certMsg.textContent = text;
    certMsg.style.display = "block";
    certMsg.style.background = ok === false ? "#fdecea" : "";
    certMsg.style.color = ok === false ? "#C0392B" : "";
}

function formatDate(d) {
    if (!d) return "";
    return new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}

// Automatically apply the template/style assigned by the Organizer (Read-Only for Student)
async function applyAssignedTemplate(c) {
    if (!certBox) return;
    certBox.className = "certificate tpl-classic";
    certBox.style.backgroundImage = "";

    // Apply custom theme/border color if saved by the organizer on the certificate record
    if (c.theme_color || c.border_color) {
        var customColor = c.theme_color || c.border_color;
        var innerBorder = certBox.querySelector(".cert-inner-border");
        var certHeading = certBox.querySelector(".cert-heading");
        if (innerBorder) innerBorder.style.borderColor = customColor;
        if (certHeading) certHeading.style.color = customColor;
    }

    if (!c.template_id) return;

    // 1) Check if template_id matches a built-in style name directly
    var key = String(c.template_id).toLowerCase();
    if (builtInStyles[key]) {
        certBox.className = "certificate tpl-" + builtInStyles[key];
        return;
    }

    // 2) Otherwise look up the template in Supabase 'certificate_templates' table
    var res = await sb.from("certificate_templates").select("*").eq("id", c.template_id).maybeSingle();
    if (res.data) {
        var tName = (res.data.name || "").toLowerCase();
        if (builtInStyles[tName]) {
            certBox.className = "certificate tpl-" + builtInStyles[tName];
        }
        if (res.data.bg_path || res.data.image_url) {
            var bgUrl = res.data.image_url;
            if (!bgUrl && res.data.bg_path) {
                var pub = sb.storage.from("certificate-templates").getPublicUrl(res.data.bg_path);
                bgUrl = pub.data && pub.data.publicUrl;
            }
            if (bgUrl) {
                certBox.className = "certificate tpl-custom";
                certBox.style.backgroundImage = "url('" + bgUrl + "')";
                certBox.style.backgroundSize = "cover";
                certBox.style.backgroundPosition = "center";
            }
        }
    }
}

// Render the certificate preview on screen (Read-Only)
async function renderCertificate(c) {
    if (!c) {
        showCertMessage("Certificate not found or invalid certificate code.", false);
        return;
    }

    await applyAssignedTemplate(c);

    var wrapper = document.getElementById("certWrapper");
    var actions = document.getElementById("certActions");
    if (wrapper) wrapper.classList.remove("hidden");
    if (actions) actions.classList.remove("hidden");

    var sName = certBox.querySelector(".student-name");
    var eName = certBox.querySelector(".event-name");
    var eDate = certBox.querySelector(".event-date");
    var cCode = document.getElementById("certCode");

    if (sName) sName.textContent = c.student_name || "Student";
    if (eName) eName.textContent = c.event_name || "College Event";
    if (eDate) eDate.textContent = formatDate(c.event_date);
    if (cCode) cCode.textContent = c.certificate_code || c.id;

    // Generate QR Code for verification
    var qrContainer = document.getElementById("qrcode");
    if (qrContainer) {
        qrContainer.innerHTML = "";
        var verifyUrl = window.location.origin + window.location.pathname + "?code=" + encodeURIComponent(c.certificate_code || c.id);
        if (typeof QRCode !== "undefined") {
            new QRCode(qrContainer, {
                text: verifyUrl,
                width: 80,
                height: 80
            });
        }
    }
}

// Load either a single certificate (via ?code= or ?id=) OR the logged-in student's list
async function initCertificates() {
    // Case 1: Direct link with ?code=XXXX or ?id=XXXX
    if (code || certId) {
        var query = sb.from("certificates").select("*");
        query = code ? query.eq("certificate_code", code) : query.eq("id", certId);
        var singleRes = await query.maybeSingle();

        if (!singleRes.data) {
            showCertMessage("No certificate found with that verification code.", false);
            return;
        }
        showCertMessage("✅ Verified Certificate issued to " + singleRes.data.student_name, true);
        await renderCertificate(singleRes.data);
        return;
    }

    // Case 2: Logged-in student viewing all their issued certificates
    var authRes = await sb.auth.getUser();
    var user = authRes.data && authRes.data.user;
    if (!user) {
        showCertMessage("Please login to view and download your issued certificates.", false);
        return;
    }

    var listRes = await sb.from("certificates").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    var certs = listRes.data || [];

    if (certs.length === 0) {
        showCertMessage("You do not have any issued certificates yet.", false);
        return;
    }

    // Render clickable list of student's certificates
    if (certList) {
        certList.innerHTML = certs.map(function (item, idx) {
            return '<button class="btn-light cert-select-btn" data-idx="' + idx + '" style="margin: 5px;">🎓 ' +
                esc(item.event_name) + " (" + formatDate(item.event_date) + ")</button>";
        }).join("");

        certList.querySelectorAll(".cert-select-btn").forEach(function (btn) {
            btn.addEventListener("click", function () {
                var selected = certs[ Number(btn.getAttribute("data-idx")) ];
                renderCertificate(selected);
            });
        });
    }

    // Automatically preview the latest certificate
    await renderCertificate(certs[0]);
}

// Download / Print Certificate Button
var downloadBtn = document.getElementById("downloadBtn");
if (downloadBtn) {
    downloadBtn.addEventListener("click", function () {
        window.print();
    });
}

// Verify Certificate Button
var verifyBtn = document.getElementById("verifyBtn");
if (verifyBtn) {
    verifyBtn.addEventListener("click", function () {
        var currentCode = document.getElementById("certCode").textContent;
        if (currentCode) {
            showCertMessage("✅ Certificate ID " + currentCode + " is authentic and verified by RCPIT Event Portal.", true);
        }
    });
}

initCertificates();