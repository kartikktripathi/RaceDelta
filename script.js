const API_BASE_URL = "https://api.openf1.org/v1"

let loadingIndicator = document.getElementById("loading-indicator")
let dashboardContent = document.getElementById("dashboard-content")
let errorContainer = document.getElementById("error-container")
let errorMessage = document.getElementById("error-message")
let retryButton = document.getElementById("retry-button")
let sessionInfo = document.getElementById("session-info")
let driverGrid = document.getElementById("driver-grid")
let teamGrid = document.getElementById("team-grid")
let seasonsGrid = document.getElementById("seasons-grid")
let seasonSelect = document.getElementById("season-select")

async function initDashboard() {
    if (!sessionInfo && !driverGrid && !teamGrid && !seasonsGrid) return;

    showLoading()
    try {
        const tasks = [];
        let fetchedSession = null;
        let fetchedDrivers = null;
        let fetchedSeasonsData = null;

        if (seasonsGrid) {
            const year = seasonSelect ? seasonSelect.value : new Date().getFullYear();
            tasks.push(fetchSeasonData(year).then(data => fetchedSeasonsData = data));
        }

        if (sessionInfo) {
            const currentYear = new Date().getFullYear();
            tasks.push(fetch(`${API_BASE_URL}/meetings?year=${currentYear}`).then(res => {
                if (!res.ok) throw new Error("Failed to fetch meetings data");
                return res.json().then(async meetings => {
                    meetings.sort((a, b) => new Date(a.date_start) - new Date(b.date_start));
                    const now = new Date();
                    const nextMeeting = meetings.find(m => new Date(m.date_end || m.date_start) > now);

                    if (nextMeeting) {
                        return { type: 'next_gp', data: nextMeeting };
                    } else {
                        const [driverRes, teamRes] = await Promise.all([
                            fetch(`${API_BASE_URL}/championship_drivers?session_key=latest`),
                            fetch(`${API_BASE_URL}/championship_teams?session_key=latest`)
                        ]);

                        let dChamp = null;
                        let tChamp = null;

                        if (driverRes.ok) {
                            const dData = await driverRes.json();
                            if (dData && dData.length > 0) dChamp = dData.sort((a, b) => b.points_current - a.points_current)[0];
                        }

                        if (teamRes.ok) {
                            const tData = await teamRes.json();
                            if (tData && tData.length > 0) tChamp = tData.sort((a, b) => b.points_current - a.points_current)[0];
                        }

                        return { type: 'season_ended', driver: dChamp, team: tChamp };
                    }
                });
            }).then(result => fetchedSession = result));
        }
        if (driverGrid || teamGrid) {
            tasks.push(fetch(`${API_BASE_URL}/drivers?session_key=latest`).then(res => {
                if (!res.ok) throw new Error("Failed to fetch drivers data");
                return res.json().then(data => fetchedDrivers = data);
            }));
        }

        await Promise.all(tasks);

        if (sessionInfo) {
            if (!fetchedSession) {
                throw new Error("No session data available.");
            }
            renderSessionInfo(fetchedSession);
        }

        if (driverGrid) {
            if (!fetchedDrivers) {
                throw new Error("No initial driver grid data available.");
            }
            renderDriversGrid(fetchedDrivers);
        }

        if (teamGrid) {
            if (!fetchedDrivers) {
                throw new Error("No initial team data available.");
            }
            renderTeamsGrid(fetchedDrivers);
        }

        if (seasonsGrid) {
            if (!fetchedSeasonsData) {
                throw new Error("No season data available.");
            }
            renderSeasonsGrid(fetchedSeasonsData);
        }

        showDashboard()
    } catch (err) {
        console.log("Error fetching F1 data:", err)
        showError("An unexpected error occurred while loading F1 data.")
    }
}

function renderSessionInfo(result) {
    const sectionTitle = sessionInfo.closest('.session-section').querySelector('.section-title');

    if (result.type === 'next_gp') {
        const meeting = result.data;
        const dateObj = new Date(meeting.date_start)
        const dateStart = dateObj.toDateString() + " " + dateObj.toTimeString().split(" ")[0]

        if (sectionTitle) sectionTitle.textContent = "Next Grand Prix";

        sessionInfo.innerHTML = `
            <div class="session-stat">
                <span class="stat-label">Event / Year</span>
                <span class="stat-value">${meeting.year} ${meeting.country_name || "Grand Prix"}</span>
            </div>
            <div class="session-stat">
                <span class="stat-label">Meeting Name</span>
                <span class="stat-value">${meeting.meeting_name || meeting.meeting_official_name}</span>
            </div>
            <div class="session-stat">
                <span class="stat-label">Circuit</span>
                <span class="stat-value">${meeting.circuit_short_name || meeting.location || "TBA"}</span>
            </div>
            <div class="session-stat">
                <span class="stat-label">Start Time</span>
                <span class="stat-value">${dateStart}</span>
            </div>
        `
    } else if (result.type === 'season_ended') {
        if (sectionTitle) sectionTitle.textContent = "Season Concluded - Champions";

        const dChamp = result.driver;
        const tChamp = result.team;

        const dName = dChamp ? (dChamp.full_name || `${dChamp.first_name} ${dChamp.last_name}`) : "Unknown";
        const tName = tChamp ? tChamp.team_name : "Unknown";
        const dPoints = dChamp ? dChamp.points_current : "-";
        const tPoints = tChamp ? tChamp.points_current : "-";

        sessionInfo.innerHTML = `
            <div class="session-stat" style="grid-column: span 2; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 1rem; margin-bottom: 0.5rem; justify-content: center; align-items: center;">
                <span class="stat-value highlight" style="font-size: 1.5rem; letter-spacing: 1px;">Season Finished</span>
            </div>
            <div class="session-stat" style="background: rgba(225, 6, 0, 0.1); border-left: 3px solid #e10600; padding: 1rem;">
                <span class="stat-label">World Driver Champion</span>
                <span class="stat-value">${dName}</span>
                <span class="stat-label" style="margin-top: 0.5rem; font-size: 0.75rem;">Points</span>
                <span class="stat-value" style="font-size: 1.1rem; color: #ffd700;">${dPoints} pts</span>
            </div>
            <div class="session-stat" style="background: rgba(255, 255, 255, 0.05); border-left: 3px solid #ccc; padding: 1rem;">
                <span class="stat-label">World Constructor Champion</span>
                <span class="stat-value">${tName}</span>
                <span class="stat-label" style="margin-top: 0.5rem; font-size: 0.75rem;">Points</span>
                <span class="stat-value" style="font-size: 1.1rem; color: #ffd700;">${tPoints} pts</span>
            </div>
        `;
    }
}

function renderDriversGrid(drivers) {
    driverGrid.innerHTML = ""

    if (!drivers || drivers.length === 0) {
        driverGrid.innerHTML = "<p class='text-muted'>No drivers data available for this session.</p>"
        return
    }

    // handling the duplicates below..
    const uniqueDrivers = []
    const seenNumbers = []

    for (const d of drivers) {
        if (!seenNumbers.includes(d.driver_number)) {
            uniqueDrivers.push(d)
            seenNumbers.push(d.driver_number)
        }
    }

    uniqueDrivers.forEach(driver => {
        const teamColor = driver.team_colour ? `#${driver.team_colour}` : "#e10600"

        const card = document.createElement("div")
        card.className = "driver-card"
        card.style.borderTop = `3px solid ${teamColor}`

        const teamNameText = driver.team_name || "Unknown Team"
        const driverNameText = driver.full_name || `${driver.first_name} ${driver.last_name}`
        const headshot = driver.headshot_url || "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/fallback/fallback.png.transform/1col/image.png"

        card.innerHTML = `
            <div class="card-header">
                <span class="driver-number">${driver.driver_number}</span>
            </div>
            <div class="card-body">
                <div style="display: flex; gap: 1rem; align-items: center;">
                    <img src="${headshot}" alt="Photo of ${driverNameText}" 
                         style="width: 60px; height: 60px; object-fit: cover; border-radius: 50%; border: 2px solid ${teamColor};">
                    <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                        <span class="driver-name">${driverNameText}</span>
                        <div class="team-chip" style="border-left-color: ${teamColor};">${teamNameText}</div>
                    </div>
                </div>
            </div>
        `

        driverGrid.appendChild(card)
    })
}

function renderTeamsGrid(drivers) {
    teamGrid.innerHTML = ""

    if (!drivers || drivers.length === 0) {
        teamGrid.innerHTML = "<p class='text-muted'>No teams data available for this session.</p>"
        return
    }

    const uniqueTeams = {}

    for (const d of drivers) {
        if (!uniqueTeams[d.team_name] && d.team_name) {
            uniqueTeams[d.team_name] = {
                team_name: d.team_name,
                team_colour: d.team_colour,
                drivers: []
            }
        }
        if (d.team_name) {
            const driverName = d.full_name || `${d.first_name} ${d.last_name}`
            if (!uniqueTeams[d.team_name].drivers.includes(driverName)) {
                uniqueTeams[d.team_name].drivers.push(driverName)
            }
        }
    }

    Object.values(uniqueTeams).forEach(team => {
        const teamColor = team.team_colour ? `#${team.team_colour}` : "#e10600"

        const card = document.createElement("div")
        card.className = "driver-card"
        card.style.borderTop = `3px solid ${teamColor}`

        card.innerHTML = `
            <div class="card-header">
                <span class="driver-number" style="background: ${teamColor}; font-size: 0.8rem; padding: 0.2rem 0.5rem; border-radius: 4px;">F1</span>
            </div>
            <div class="card-body">
                <div style="display: flex; gap: 1rem; align-items: center;">
                    <div style="min-width: 60px; height: 60px; border-radius: 50%; border: 2px solid ${teamColor}; background: ${teamColor}33; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1.5rem; color: #fff;">
                       ${team.team_name.charAt(0)}
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                        <span class="driver-name">${team.team_name}</span>
                        <div class="team-chip" style="border-left-color: ${teamColor}; height: auto; white-space: normal;">
                            ${team.drivers.join(" & ")}
                        </div>
                    </div>
                </div>
            </div>
        `

        teamGrid.appendChild(card)
    })
}

function showLoading() {
    if (loadingIndicator && loadingIndicator.className.indexOf("hidden") === -1 === false) {
        loadingIndicator.className = loadingIndicator.className.replace("hidden", "").trim()
    }
    if (loadingIndicator) loadingIndicator.className = loadingIndicator.className.replace("hidden", "").trim()
    if (dashboardContent && dashboardContent.className.indexOf("hidden") === -1) dashboardContent.className += " hidden"
    if (errorContainer && errorContainer.className.indexOf("hidden") === -1) errorContainer.className += " hidden"
}

function showDashboard() {
    if (loadingIndicator && loadingIndicator.className.indexOf("hidden") === -1) loadingIndicator.className += " hidden"
    if (dashboardContent) dashboardContent.className = dashboardContent.className.replace("hidden", "").trim()
    if (errorContainer && errorContainer.className.indexOf("hidden") === -1) errorContainer.className += " hidden"
}

function showError(message) {
    if (errorMessage) errorMessage.textContent = message
    if (loadingIndicator && loadingIndicator.className.indexOf("hidden") === -1) loadingIndicator.className += " hidden"
    if (dashboardContent && dashboardContent.className.indexOf("hidden") === -1) dashboardContent.className += " hidden"
    if (errorContainer) errorContainer.className = errorContainer.className.replace("hidden", "").trim()
}

if (retryButton) {
    retryButton.addEventListener("click", initDashboard)
}
if (seasonSelect) {
    seasonSelect.addEventListener("change", initDashboard)
}
document.addEventListener("DOMContentLoaded", initDashboard)

async function fetchSeasonData(year) {
    const sessionRes = await fetch(`${API_BASE_URL}/sessions?year=${year}&session_name=Race`);
    if (!sessionRes.ok) throw new Error("Failed to fetch sessions data");
    const sessions = await sessionRes.json();

    const now = new Date();
    const pastRaces = sessions.filter(s => new Date(s.date_end || s.date_start) < now)
        .sort((a, b) => new Date(a.date_start) - new Date(b.date_start));

    let driversMap = {};
    const podiumRounds = [];
    
    for (let i = 0; i < pastRaces.length; i += 3) {
        const batch = pastRaces.slice(i, i + 3);
        const batchResults = await Promise.all(batch.map(async (race) => {
            const [posRes, drvRes] = await Promise.all([
                fetch(`${API_BASE_URL}/position?session_key=${race.session_key}&position%3C%3D3`),
                fetch(`${API_BASE_URL}/drivers?session_key=${race.session_key}`)
            ]);
            
            if (drvRes.ok) {
                const drvs = await drvRes.json();
                drvs.forEach(d => {
                    if (!driversMap[d.driver_number]) driversMap[d.driver_number] = d;
                });
            }

            if (!posRes.ok) return { race, podium: [] };
            const posData = await posRes.json();

            const latestPositions = { 1: null, 2: null, 3: null };
            posData.forEach(p => {
                const pos = p.position;
                if (pos >= 1 && pos <= 3) {
                    if (!latestPositions[pos] || new Date(p.date) > new Date(latestPositions[pos].date)) {
                        latestPositions[pos] = p;
                    }
                }
            });

            return { race, podium: [latestPositions[1], latestPositions[2], latestPositions[3]] };
        }));
        
        podiumRounds.push(...batchResults);

        if (i + 3 < pastRaces.length) {
            await new Promise(r => setTimeout(r, 200));
        }
    }

    return { pastRaces, podiumRounds, driversMap };
}

function renderSeasonsGrid(data) {
    const { pastRaces, podiumRounds, driversMap } = data;
    seasonsGrid.innerHTML = "";

    if (pastRaces.length === 0) {
        seasonsGrid.innerHTML = "<p class='text-muted' style='grid-column: 1/-1;'>No past races found for this season yet.</p>";
        return;
    }

    podiumRounds.forEach(round => {
        const race = round.race;
        const podium = round.podium;
        const gpTitle = race.location ? `${race.country_name} (${race.location})` : race.country_name;

        const getDriverUI = (posEvent) => {
            if (!posEvent) return `<div class="team-chip" style="margin:0 auto; opacity: 0.5;">N/A</div>`;
            const driver = driversMap[posEvent.driver_number];
            if (!driver) return `<div class="team-chip" style="margin:0 auto;">#${posEvent.driver_number}</div>`;

            const teamColor = driver.team_colour ? `#${driver.team_colour}` : "#ccc";
            const name = driver.name_acronym || driver.last_name || driver.full_name;
            const headshot = driver.headshot_url || "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/fallback/fallback.png.transform/1col/image.png";

            return `
                <div style="display:flex; flex-direction:column; align-items:center; gap:0.25rem;">
                    <div style="width: 40px; height: 40px; border-radius: 50%; border: 2px solid ${teamColor}; 
                        background-image: url('${headshot}'); background-size: cover; background-position: center; background-color: ${teamColor}33;">
                    </div>
                    <span style="font-size: 0.75rem; font-weight: bold; margin-top:4px; padding: 2px 4px; background: rgba(0,0,0,0.5); border-radius: 4px;">${name}</span>
                </div>
            `;
        }

        const card = document.createElement("div");
        card.className = "driver-card";
        card.style.display = "flex";
        card.style.flexDirection = "column";
        card.style.justifyContent = "space-between";
        card.style.height = "100%";

        const dateObj = new Date(race.date_start);
        const podiumContent = podium.every(p => !p) 
            ? `<div style="flex: 1; display: flex; align-items: center; justify-content: center; text-align: center; color: #9ca3af; font-size: 0.9rem; padding: 1rem;">Not able to fetch data</div>`
            : `
                <div style="display: flex; justify-content: center; align-items: flex-end; gap: 0.5rem; height: 100px; padding-top: 10px;">
                    <div style="display: flex; flex-direction: column; align-items: center; width: 30%;">
                        ${getDriverUI(podium[1])}
                        <div style="width: 100%; height: 30px; background: silver; color: black; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-top: 0.5rem; border-radius: 4px 4px 0 0;">2</div>
                    </div>
                    <div style="display: flex; flex-direction: column; align-items: center; width: 35%;">
                        ${getDriverUI(podium[0])}
                        <div style="width: 100%; height: 45px; background: gold; color: black; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-top: 0.5rem; border-radius: 4px 4px 0 0;">1</div>
                    </div>
                    <div style="display: flex; flex-direction: column; align-items: center; width: 30%;">
                        ${getDriverUI(podium[2])}
                        <div style="width: 100%; height: 20px; background: #cd7f32; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-top: 0.5rem; border-radius: 4px 4px 0 0;">3</div>
                    </div>
                </div>
            `;

        card.innerHTML = `
            <div class="card-header" style="justify-content: center; background: rgba(255,255,255,0.05); padding: 0.5rem; text-align: center; min-height: 3.5rem;">
                <span class="driver-name" style="font-size: 1rem; text-align: center; width: 100%; white-space: normal; line-height: 1.2;">${gpTitle}</span>
            </div>
            <div class="card-body" style="flex: 1; display:flex; flex-direction:column; justify-content:space-between; gap: 1rem;">
                <div style="text-align: center; color: #aaa; font-size: 0.8rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.5rem;">
                    ${dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                ${podiumContent}
            </div>
        `;
        seasonsGrid.appendChild(card);
    });
}