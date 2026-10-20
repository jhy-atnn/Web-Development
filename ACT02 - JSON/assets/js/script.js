const $ = (selector) => document.querySelector(selector);
const positions = ["All", "Outside Hitter", "Opposite Hitter", "Middle Blocker", "Setter", "Libero"];
const startingNames = ["Pauline Marie Monique Gaston", "Mhicaela Belen", "Vanessa Gandler", "Julia Cyrille Coronel", "Ma. Bernadett Pepito", "Erika Mae Santos"];
let players = [];
let lineup = [];
let activeLineupIndex = 0;
let activePosition = "All";
let rosterExpanded = false;

const imagePath = (player) => player.profile || "";
const initials = (name) => name.split(" ").map((word) => word[0]).slice(0, 2).join("");
const playerIsCaptain = (player) => /captain/i.test(player.role);
const positionLabel = (position) => ({ "Outside Hitter": "OUTSIDE", "Opposite Hitter": "OPPOSITE", "Middle Blocker": "MIDDLE", "Middle Blocker / Center": "MIDDLE" }[position] || position).toUpperCase();
const playerByName = (name) => players.find((player) => player.name === name);

function playerImage(player, className = "") {
    const image = imagePath(player);
    return image ? `<img class="${className}" src="${image}" alt="${player.name}">` : `<span class="image-placeholder ${className}">${initials(player.name)}</span>`;
}

function rosterCard(player) {
    const image = imagePath(player);
    const captainClass = playerIsCaptain(player) ? " is-captain" : "";
    return `<article class="col"><button class="roster-card${captainClass}" type="button" data-player-id="${player.id}" data-bs-toggle="modal" data-bs-target="#playerModal"><div class="roster-photo ${image ? "has-image" : ""}">${image ? `<img src="${image}" alt="${player.name}">` : ""}<span class="player-position">${positionLabel(player.position)}</span>${playerIsCaptain(player) ? '<span class="captain-badge">TEAM CAPTAIN</span>' : ""}</div><div class="roster-body"><p class="player-number">#${player.number}</p><h3>${player.name}</h3><p class="player-role">${player.role} - ${player.hometown}</p><span class="roster-more">View player profile <b>→</b></span></div></button></article>`;
}

function showPlayer(player) {
    if (!player) return;
    const image = imagePath(player);
    $("#modalPosition").textContent = `${player.position} - ${player.role}`;
    $("#modalNumber").textContent = `#${player.number}`;
    $("#playerModalTitle").textContent = player.name;
    $("#modalBio").textContent = player.bio;
    $("#modalImage").innerHTML = image ? `<img src="${image}" alt="${player.name}">` : "";
    $("#modalStats").innerHTML = [[player.height, "Height"], [player.points, "Points / match"], [player.attack, "Attack"], [player.services, "Service aces"]].map(([value, label]) => `<div class="col"><div class="stat-box"><b>${value}</b><small>${label}</small></div></div>`).join("");
}

function renderFilters() {
    $("#filterButtons").innerHTML = positions.map((position) => `<button class="btn btn-sm rounded-pill ${position === activePosition ? "active" : ""}" type="button" data-position="${position}">${position === "All" ? "All players" : position}</button>`).join("");
}

function renderRoster() {
    const matching = activePosition === "All" ? players : players.filter((player) => player.position === activePosition || (activePosition === "Middle Blocker" && player.position.includes("Middle Blocker")));
    const ordered = activePosition === "All" ? [...matching].sort((a, b) => Number(playerIsCaptain(b)) - Number(playerIsCaptain(a))) : matching;
    const visible = rosterExpanded || activePosition !== "All" ? ordered : ordered.slice(0, 5);
    $("#rosterCards").innerHTML = visible.map(rosterCard).join("");
    $("#rosterStatus").textContent = `Showing ${visible.length} of ${ordered.length} ${activePosition === "All" ? "players" : `${activePosition.toLowerCase()}s`}`;
    const toggle = $("#toggleRoster");
    const showToggle = activePosition === "All" && ordered.length > 5;
    toggle.classList.toggle("d-none", !showToggle);
    toggle.textContent = rosterExpanded ? "Show fewer players" : `Show all ${ordered.length} players`;
    toggle.setAttribute("aria-expanded", String(rosterExpanded));
}

function buildLineup() {
    const namedPlayers = startingNames.map(playerByName).filter(Boolean);
    const extras = players.filter((player) => !namedPlayers.includes(player));
    lineup = [...namedPlayers, ...extras].slice(0, 6);
}

function renderLineupChoices() {
    $("#lineupCards").innerHTML = lineup.map((player, index) => `<div class="col"><button class="lineup-select ${index === activeLineupIndex ? "is-active" : ""}" type="button" data-lineup-index="${index}" aria-pressed="${index === activeLineupIndex}"><span class="lineup-select-photo">${playerImage(player)}</span><span class="lineup-select-copy"><small>#${player.number} - ${positionLabel(player.position)}</small><strong>${player.name}</strong></span><span class="lineup-select-arrow">→</span></button></div>`).join("");
}

function showLineupPlayer(index) {
    if (!lineup.length) return;
    activeLineupIndex = (index + lineup.length) % lineup.length;
    const player = lineup[activeLineupIndex];
    const image = imagePath(player);
    $("#featureImage").innerHTML = image ? `<img src="${image}" alt="${player.name}">` : `<span class="feature-placeholder">Add player image<br><b>${initials(player.name)}</b></span>`;
    $("#featureCaptain").textContent = playerIsCaptain(player) ? "TEAM CAPTAIN" : "STARTING SIX";
    $("#featureNumber").textContent = `#${player.number}`;
    $("#featureHeight").textContent = player.height;
    $("#featureHometown").textContent = player.hometown;
    $("#featureTag").textContent = positionLabel(player.position);
    $("#featureIndex").textContent = String(activeLineupIndex + 1).padStart(2, "0");
    $("#featureRole").textContent = player.role;
    $("#featureName").textContent = player.name;
    $("#featureBio").textContent = player.bio;
    $("#featureStats").innerHTML = [[player.points, "Points / match"], [player.attack, "Attack success"], [player.reception, "Reception"], [player.services, "Service aces"]].map(([value, label]) => `<div class="col"><div class="feature-stat"><b>${value}</b><small>${label}</small></div></div>`).join("");
    const zoneOrder = [4, 3, 2, 5, 6, 1];
    $("#courtZones").innerHTML = zoneOrder.map((zone, zoneIndex) => `<span class="${zoneIndex === activeLineupIndex ? "is-current" : ""}"><small>ZONE ${zone}</small>${zoneIndex === activeLineupIndex ? `<b>#${player.number}</b>` : ""}</span>`).join("");
    renderLineupChoices();
}

function renderLineup() {
    buildLineup();
    showLineupPlayer(0);
    $("#heroAvatars").innerHTML = lineup.slice(0, 4).map((player) => {
        const image = imagePath(player);
        return image ? `<img src="${image}" alt="">` : `<span class="avatar-placeholder">${initials(player.name)}</span>`;
    }).join("");
}

function fillTeamDetails(data) {
    $("#conference").textContent = data.conference;
    $("#teamRank").textContent = data.rank;
    $("#statsRank").textContent = data.rank;
    $("#seasonWins").textContent = data.record.split("-")[0].padStart(2, "0");
    $("#standingRecord").textContent = data.record.replace("-", "\u2013");
    $("#standingRank").textContent = `${data.rank.replace("#", "")}nd`;
    $("#playerCount").textContent = `${data.players.length} players`;
}

function bindEvents() {
    $("#filterButtons").addEventListener("click", (event) => {
        const button = event.target.closest("[data-position]");
        if (!button) return;
        activePosition = button.dataset.position;
        rosterExpanded = activePosition !== "All";
        renderFilters();
        renderRoster();
    });
    $("#toggleRoster").addEventListener("click", () => {
        rosterExpanded = !rosterExpanded;
        renderRoster();
    });
    $("#lineupCards").addEventListener("click", (event) => {
        const choice = event.target.closest("[data-lineup-index]");
        if (choice) showLineupPlayer(Number(choice.dataset.lineupIndex));
    });
    $("#previousLineup").addEventListener("click", () => showLineupPlayer(activeLineupIndex - 1));
    $("#nextLineup").addEventListener("click", () => showLineupPlayer(activeLineupIndex + 1));
    document.addEventListener("click", (event) => {
        const card = event.target.closest("[data-player-id]");
        if (card) showPlayer(players.find((player) => player.id === Number(card.dataset.playerId)));
    });
    $("#newsletterForm").addEventListener("submit", (event) => {
        event.preventDefault();
        const email = $("#newsletterEmail");
        const message = $("#newsletterMessage");
        if (!email.checkValidity()) {
            message.textContent = "Enter a valid email address to join the rally.";
            email.focus();
            return;
        }
        message.textContent = "You are in - watch your inbox for the next match update.";
        email.value = "";
    });
    const navigationFolders = [...document.querySelectorAll(".site-nav a[href^='#']")]
        .map((link) => document.querySelector(link.getAttribute("href")))
        .filter((folder, index, all) => folder && folder.classList.contains("folder") && all.indexOf(folder) === index);
    const stackedFolders = [...document.querySelectorAll(".folder")];
    const edgeConfirmationScrolls = 2;
    let pendingNavigationFolder = null;
    let edgeConfirmationFolder = null;
    let edgeConfirmationDirection = 0;
    let edgeConfirmationCount = 0;
    const setActiveNavigation = (folderId) => {
        document.querySelectorAll(".site-nav a[href^='#']").forEach((link) => {
            link.classList.toggle("is-active", link.getAttribute("href") === `#${folderId}`);
        });
    };
    const getFolderOrigin = (folder) => {
        const marker = $(`#${folder.id}Anchor`);
        return marker ? marker.offsetTop : folder.offsetTop;
    };
    const getFolderDestination = (folder) => {
        if (folder.id === "home") return 0;
        const stackOffset = parseFloat(window.getComputedStyle(folder).top) || 0;
        return Math.max(0, getFolderOrigin(folder) - stackOffset);
    };
    const resetEdgeScrollConfirmation = () => {
        edgeConfirmationFolder = null;
        edgeConfirmationDirection = 0;
        edgeConfirmationCount = 0;
    };
    const getFrontFolder = () => {
        let frontFolder = stackedFolders[0];
        stackedFolders.forEach((folder) => {
            if (window.scrollY >= getFolderDestination(folder) - 1) frontFolder = folder;
        });
        return frontFolder;
    };
    const keepScrollInFrontFolder = (event) => {
        if (event.ctrlKey || Math.abs(event.deltaY) <= Math.abs(event.deltaX) || document.body.classList.contains("modal-open")) return;
        const folder = getFrontFolder();
        const folderContent = folder && folder.querySelector(":scope > .container-fluid");
        if (!folderContent || folderContent.scrollHeight <= folderContent.clientHeight + 1) return;
        const isMovingDown = event.deltaY > 0;
        const atTop = folderContent.scrollTop <= 0;
        const atBottom = folderContent.scrollTop + folderContent.clientHeight >= folderContent.scrollHeight - 1;
        const hasMoreFolderContent = isMovingDown ? !atBottom : !atTop;
        if (hasMoreFolderContent) {
            resetEdgeScrollConfirmation();
            event.preventDefault();
            folderContent.scrollTop += event.deltaY;
            return;
        }
        const direction = isMovingDown ? 1 : -1;
        if (edgeConfirmationFolder !== folder || edgeConfirmationDirection !== direction) {
            edgeConfirmationFolder = folder;
            edgeConfirmationDirection = direction;
            edgeConfirmationCount = 0;
        }
        edgeConfirmationCount += 1;
        if (edgeConfirmationCount < edgeConfirmationScrolls) event.preventDefault();
    };
    const updateActiveNavigation = () => {
        if (pendingNavigationFolder) {
            const distanceToTarget = Math.abs(window.scrollY - getFolderDestination(pendingNavigationFolder));
            if (distanceToTarget > 3) {
                setActiveNavigation(pendingNavigationFolder.id);
                return;
            }
            pendingNavigationFolder = null;
        }
        let activeFolder = navigationFolders[0];
        navigationFolders.forEach((folder) => {
            if (window.scrollY >= getFolderDestination(folder) - 2) activeFolder = folder;
        });
        if (activeFolder) setActiveNavigation(activeFolder.id);
    };
    const setNavigationState = () => {
        $("#siteNav").classList.toggle("is-scrolled", window.scrollY > 20);
        updateActiveNavigation();
    };
    setNavigationState();
    window.addEventListener("scroll", setNavigationState, { passive: true });
    window.addEventListener("wheel", keepScrollInFrontFolder, { passive: false });
    const scrollToFolder = (folder, behavior = "smooth") => {
        const folderContent = folder.querySelector(".container-fluid");
        if (folderContent) folderContent.scrollTop = 0;
        resetEdgeScrollConfirmation();
        const destination = getFolderDestination(folder);
        pendingNavigationFolder = behavior === "smooth" ? folder : null;
        window.scrollTo({ top: destination, behavior });
        setActiveNavigation(folder.id);
    };
    const cancelPendingNavigation = () => { pendingNavigationFolder = null; };
    window.addEventListener("wheel", cancelPendingNavigation, { passive: true });
    window.addEventListener("touchstart", cancelPendingNavigation, { passive: true });
    document.querySelectorAll("a[href^='#']").forEach((link) => link.addEventListener("click", (event) => {
        const selector = link.getAttribute("href");
        const folder = selector && document.querySelector(selector);
        if (!folder || !folder.classList.contains("folder")) return;
        event.preventDefault();
        scrollToFolder(folder);
        if (window.location.hash !== selector) window.history.pushState(null, "", selector);
        const menuToggle = document.querySelector(".navbar-toggler");
        const mobileMenuIsVisible = menuToggle && window.getComputedStyle(menuToggle).display !== "none";
        if (link.closest("#mainMenu") && mobileMenuIsVisible) bootstrap.Collapse.getOrCreateInstance($("#mainMenu")).hide();
    }));
    window.addEventListener("hashchange", () => {
        const folder = document.querySelector(window.location.hash);
        if (folder && folder.classList.contains("folder")) scrollToFolder(folder, "auto");
    });
    if (window.location.hash) {
        const folder = document.querySelector(window.location.hash);
        if (folder && folder.classList.contains("folder")) requestAnimationFrame(() => scrollToFolder(folder, "auto"));
    }
}

fetch("assets/data/data.json")
    .then((response) => {
        if (!response.ok) throw new Error("Could not load roster data.");
        return response.json();
    })
    .then((data) => {
        players = data.players;
        fillTeamDetails(data);
        renderLineup();
        renderFilters();
        renderRoster();
        bindEvents();
    })
    .catch((error) => {
        $("#rosterStatus").textContent = "Roster data could not be loaded. Please run the project with Live Server.";
        console.error(error);
    });
