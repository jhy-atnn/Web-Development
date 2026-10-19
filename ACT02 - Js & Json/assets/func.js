const teamId = "capital1";

function findTeam(data, id) {
    return data.teams.find((team) => team.id === id);
}

function formatDate(date) {
    return new Date(`${date}T00:00:00`).toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric"
    }).toUpperCase();
}

function formatTime(time) {
    const [hour, minute] = time.split(":");
    return `${Number(hour) % 12 || 12}:${minute} ${Number(hour) >= 12 ? "PM" : "AM"}`;
}

function renderPage(data) {
    const standing = data.standings.find((row) => row.teamId === teamId);
    const attack = data.teamStats[0];

    document.getElementById("hero-season").textContent = data.meta.league;
    document.getElementById("hero-stats").innerHTML = `
        <div class="col-4 hero-stat"><strong>${standing.wins.toString().padStart(2, "0")}</strong><span>Season wins</span></div>
        <div class="col-4 hero-stat"><strong>${standing.leaguePoints}</strong><span>League points</span></div>
        <div class="col-4 hero-stat"><strong>${attack.value}</strong><span>Attack rate</span></div>`;

    renderFeaturedMatch(data);
    renderStandings(data);
    renderPlayers(data);
    renderTeamStats(data);
}

function renderFeaturedMatch(data) {
    const match = data.matches.find((item) => item.id === data.featuredMatchId);
    const home = findTeam(data, match.homeTeamId);
    const away = findTeam(data, match.awayTeamId);

    document.getElementById("featured-match").innerHTML = `
        <div class="match-photo"><img src="" alt=""><span class="match-label">GAME OF THE WEEK</span></div>
        <div class="match-content">
            <div class="match-meta"><span>${data.meta.league}</span><span>${match.venue}</span></div>
            <div class="matchup">
                <div><span class="team-mark">✳</span><h3>${home.shortName}</h3><small>Solar Spikers</small></div>
                <div class="versus"><small>${formatDate(match.date)} · ${formatTime(match.time)}</small>VS<small>MANDALUYONG</small></div>
                <div><span class="team-mark opponent">CC</span><h3>${away.shortName}</h3><small>Cool Smashers</small></div>
            </div>
            <div class="match-countdown"><span>FIRST SERVE IN</span><strong>02 <small>DAYS</small> · 14 <small>HRS</small> · 38 <small>MIN</small></strong><a href="#matches">Match center →</a></div>
        </div>`;
}

function renderStandings(data) {
    document.getElementById("standings-body").innerHTML = data.standings.map((row) => {
        const team = findTeam(data, row.teamId);
        return `<tr class="${row.teamId === teamId ? "capital1-row" : ""}">
            <td>${row.rank}</td><td>${team.name}</td><td>${row.matchesPlayed}</td>
            <td>${row.wins}</td><td>${row.losses}</td><td>${row.leaguePoints}</td>
        </tr>`;
    }).join("");
}

function renderPlayers(data) {
    const cards = data.players.map((player) => `
        <article class="player-card">
            <img class="player-image" src="${player.image}" alt="${player.name}">
            <strong class="player-number">${player.jerseyNumber.toString().padStart(2, "0")}</strong>
            <div class="player-info"><small>${player.position}</small><h3>${player.name}</h3><span>${player.height} &nbsp; · &nbsp; ${player.points} PTS</span></div>
        </article>`).join("");

    document.getElementById("player-grid").innerHTML = cards + `
        <a class="roster-card text-decoration-none" href="#team"><small>${data.players.length} ATHLETES</small><h3>View full<br>roster</h3><span class="roster-sun">✳</span></a>`;
}

function renderTeamStats(data) {
    document.getElementById("team-stats").innerHTML = data.teamStats.map((stat) => `
        <div class="stat-row">
            <div class="stat-label"><span>${stat.label}</span><span>${stat.value}</span></div>
            <div class="bar"><i style="width:${stat.primary}%"></i></div>
            <div class="bar yellow"><i style="width:${stat.secondary}%"></i></div>
        </div>`).join("");
}

function changeNavbar() {
    document.getElementById("site-nav").classList.toggle("nav-scrolled", window.scrollY > 40);
}

fetch("assets/game-data.json")
    .then((response) => response.json())
    .then((data) => renderPage(data))
    .catch(() => { document.getElementById("hero-stats").textContent = "Unable to load game data."; });

window.addEventListener("scroll", changeNavbar);
changeNavbar();
