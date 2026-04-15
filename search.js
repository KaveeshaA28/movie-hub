// ══════════════════════════════════════════
//  NAVBAR - CHECK LOGIN STATUS ON PAGE LOAD
// ══════════════════════════════════════════
document.addEventListener('DOMContentLoaded', function () {
    checkLoginStatus();
});

function checkLoginStatus() {
    const session =
        sessionStorage.getItem('cine_session') ||
        localStorage.getItem('cine_session'); 

    const loginBtn   = document.getElementById('loginNavBtn');
    const profileBtn = document.getElementById('profileNavBtn');

    if (session) {
        const user = JSON.parse(session);
        // Show profile button with user's first name
        if (profileBtn) {
            profileBtn.style.display = 'inline-block';
            profileBtn.innerText     = '👤 ' + user.firstName;
        }
        if (loginBtn) loginBtn.style.display = 'none';
    } else {
        // Show sign in button
        if (loginBtn)   loginBtn.style.display   = 'inline-block';
        if (profileBtn) profileBtn.style.display = 'none';
    }
}

// ══════════════════════════════════════════
//  SEARCH - ENTER KEY SUPPORT
// ══════════════════════════════════════════
document.getElementById("movieTag").addEventListener("keydown", function (e) {
    if (e.key === "Enter") search();
});

// ══════════════════════════════════════════
//  SEARCH FUNCTION
// ══════════════════════════════════════════
function search() {
    const movieTag = document.getElementById("movieTag");
    const movie    = movieTag.value.trim();

    // Do nothing if input is empty
    if (!movie) return;

    const loading  = document.getElementById("loading");
    const result   = document.getElementById("result");
    const errorMsg = document.getElementById("errorMsg");

    // Show loading, hide previous results
    loading.classList.add("visible");
    result.classList.remove("visible");
    errorMsg.classList.remove("visible");

    // API request
    const apiKey = "c5aea2f8";
    const url    = `https://www.omdbapi.com/?apikey=${apiKey}&t=${encodeURIComponent(movie)}`;

    const httpRequest        = new XMLHttpRequest();
    httpRequest.open("GET", url);
    httpRequest.responseType = "json";
    httpRequest.send();

    // On success
    httpRequest.onload = function () {
        loading.classList.remove("visible");
        const data = httpRequest.response;

        // Handle movie not found
        if (!data || data.Response === "False") {
            errorMsg.classList.add("visible");
            return;
        }

        // Populate poster
        document.getElementById("poster").src =
            data.Poster !== "N/A"
                ? data.Poster
                : "https://via.placeholder.com/300x450/12121a/c9a84c?text=No+Poster";

        // Populate text fields
        document.getElementById("title").innerText    = data.Title    || "—";
        document.getElementById("tagLine").innerText  = data.Tagline  || "";
        document.getElementById("plot").innerText     = data.Plot !== "N/A" ? data.Plot : "No synopsis available.";
        document.getElementById("director").innerText = data.Director || "—";
        document.getElementById("released").innerText = data.Released || "—";

        // Only show first genre
        document.getElementById("genre").innerText =
            data.Genre ? data.Genre.split(",")[0] : "—";

        // Populate badges
        document.getElementById("ratedBadge").innerText   = data.Rated   !== "N/A" ? data.Rated   : "";
        document.getElementById("yearBadge").innerText    = data.Year    || "";
        document.getElementById("runtimeBadge").innerText = data.Runtime !== "N/A" ? data.Runtime : "";

        // IMDb rating
        document.getElementById("imdbRating").innerText =
            data.imdbRating !== "N/A" ? data.imdbRating + " / 10" : "N/A";

        document.getElementById("imdbVotes").innerText =
            data.imdbVotes !== "N/A" ? `(${data.imdbVotes} votes)` : "";

        // Build star rating (out of 5)
        const starsRow    = document.getElementById("starsRow");
        starsRow.innerHTML = "";

        if (data.imdbRating !== "N/A") {
            const score = Math.round(parseFloat(data.imdbRating) / 2);
            for (let i = 1; i <= 5; i++) {
                const star     = document.createElement("span");
                star.className = "star" + (i <= score ? "" : " empty");
                star.innerText = "★";
                starsRow.appendChild(star);
            }
        }

        // Show result card
        result.classList.add("visible");
    };

    // On network error
    httpRequest.onerror = function () {
        loading.classList.remove("visible");
        errorMsg.classList.add("visible");
    };
}
