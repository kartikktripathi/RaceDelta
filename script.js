const API_BASE_URL = "https://api.openf1.org/v1"

let loadingIndicator = document.getElementById("loading-indicator")
let dashboardContent = document.getElementById("dashboard-content")
let errorContainer = document.getElementById("error-container")
let errorMessage = document.getElementById("error-message")
let retryButton = document.getElementById("retry-button")
let sessionInfo = document.getElementById("session-info")
let driverGrid = document.getElementById("driver-grid")

async function initDashboard() {
    showLoading()
    try {
        const [sessionRes, driversRes] = await Promise.all([
            fetch(`${API_BASE_URL}/sessions?session_key=latest`),
            fetch(`${API_BASE_URL}/drivers?session_key=latest`)
        ])

        if (!sessionRes.ok || !driversRes.ok) {
            throw new Error("Failed to fetch data from API")
        }

        const sessionData = await sessionRes.json()
        const driversData = await driversRes.json()

        if (!sessionData || sessionData.length === 0) {
            throw new Error("No latest session data available.")
        }

        renderSessionInfo(sessionData[0])
        renderDriversGrid(driversData)
        showDashboard()
    } catch (err) {
        console.log("Error fetching F1 data:", err)
        showError("An unexpected error occurred while loading F1 data.")
    }
}

function renderSessionInfo(session) {
    const dateObj = new Date(session.date_start)
    const dateStart = dateObj.toDateString() + " " + dateObj.toTimeString().split(" ")[0]

    sessionInfo.innerHTML = `
        <div class="session-stat">
            <span class="stat-label">Event / Year</span>
            <span class="stat-value">${session.year} ${session.country_name || "Grand Prix"}</span>
        </div>
        <div class="session-stat">
            <span class="stat-label">Session Name</span>
            <span class="stat-value">${session.session_name}</span>
        </div>
        <div class="session-stat">
            <span class="stat-label">Circuit</span>
            <span class="stat-value">${session.circuit_short_name || session.location}</span>
        </div>
        <div class="session-stat">
            <span class="stat-label">Start Time</span>
            <span class="stat-value">${dateStart}</span>
        </div>
    `
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
        const teamColor = driver.team_colour ? `#${driver.team_colour}` : "var(--f1-red)"
        
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

function showLoading() {
    loadingIndicator.className = loadingIndicator.className.replace("hidden", "").trim()
    if (dashboardContent.className.indexOf("hidden") === -1) dashboardContent.className += " hidden"
    if (errorContainer.className.indexOf("hidden") === -1) errorContainer.className += " hidden"
}

function showDashboard() {
    if (loadingIndicator.className.indexOf("hidden") === -1) loadingIndicator.className += " hidden"
    dashboardContent.className = dashboardContent.className.replace("hidden", "").trim()
    if (errorContainer.className.indexOf("hidden") === -1) errorContainer.className += " hidden"
}

function showError(message) {
    errorMessage.textContent = message
    if (loadingIndicator.className.indexOf("hidden") === -1) loadingIndicator.className += " hidden"
    if (dashboardContent.className.indexOf("hidden") === -1) dashboardContent.className += " hidden"
    errorContainer.className = errorContainer.className.replace("hidden", "").trim()
}

retryButton.addEventListener("click", initDashboard)
document.addEventListener("DOMContentLoaded", initDashboard)