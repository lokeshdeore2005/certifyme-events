/* ==========================================================
   certificate.js  -->  DEMO BUTTONS ON THE CERTIFICATE PAGE
   Download and Verify are only demo actions at this stage.
   ========================================================== */

var certMsg = document.getElementById("certMsg");

function showCertMessage(text) {
    certMsg.textContent = text;
    certMsg.style.display = "block";
    window.scrollTo(0, 0);
}

// DOWNLOAD BUTTON (demo only - real PDF download comes later)
document.getElementById("downloadBtn").addEventListener("click", function () {
    showCertMessage("Download started... (demo only - PDF generation will be added in the next phase)");
});

// VERIFY BUTTON (demo only - real QR verification comes later)
document.getElementById("verifyBtn").addEventListener("click", function () {
    showCertMessage("Certificate ID RCPIT/2026/EVT/0001 is valid. (demo verification)");
});
