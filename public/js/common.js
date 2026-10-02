/* ==========================================================
   common.js  -->  USED BY EVERY PAGE
   1) live visitor counter in the footer (site_stats table)
   2) navbar "Login" becomes "Dashboard" when signed in
   ========================================================== */

// makes text safe to put inside HTML (shared helper)
function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
}

// 1) VISITOR COUNTER - counted once per browser session
async function loadVisitorCount() {
    var box = document.getElementById("visitorCount");
    if (!box) return;
    var count;
    if (!sessionStorage.getItem("counted")) {
        var r = await sb.rpc("increment_visitors");
        if (!r.error) { count = r.data; sessionStorage.setItem("counted", "1"); }
    }
    if (count == null) {
        var s = await sb.from("site_stats").select("value").eq("key", "visitors").maybeSingle();
        count = s.data ? s.data.value : 0;
    }
    box.textContent = Number(count).toLocaleString("en-IN");
}

// 2) NAVBAR LINK
sb.auth.getSession().then(function (r) {
    if (!r.data.session) return;
    document.querySelectorAll('.nav-links a[href="login.html"]').forEach(function (a) {
        a.href = "dashboard.html";
        a.textContent = "Dashboard";
    });
});

loadVisitorCount();
