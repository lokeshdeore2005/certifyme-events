/* ==========================================================
   common.js  -->  USED BY EVERY PAGE
   1) live visitor counter in the footer (site_stats table)
   2) role-aware navbar: "Login" becomes "Organizer Panel" for organizers
      and "Dashboard" for students when signed in
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

// 2) ROLE-AWARE NAVBAR LINK
sb.auth.getSession().then(async function (r) {
    if (!r.data.session || !r.data.session.user) return;
    var user = r.data.session.user;

    // Check if logged-in user is an Organizer/Admin
    var isOrganizer =
        user.user_metadata &&
        (user.user_metadata.role === "organizer" || user.user_metadata.role === "admin");

    if (!isOrganizer) {
        var prof = await sb.from("profiles").select("role").eq("id", user.id).maybeSingle();
        if (prof.data && (prof.data.role === "organizer" || prof.data.role === "admin")) {
            isOrganizer = true;
        }
    }

    if (!isOrganizer) {
        var roles = await sb.from("user_roles").select("role").eq("user_id", user.id);
        isOrganizer = (roles.data || []).some(function (x) {
            return x.role === "organizer" || x.role === "admin";
        });
    }

    var targetHref = isOrganizer ? "organizer-dashboard.html" : "dashboard.html";
    var targetText = isOrganizer ? "Organizer" : "Dashboard";

    document.querySelectorAll('.nav-links a[href="login.html"], .nav-links a[href="dashboard.html"]').forEach(function (a) {
        a.href = targetHref;
        a.textContent = targetText;
    });
});

loadVisitorCount();