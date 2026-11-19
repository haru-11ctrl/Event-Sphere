console.log("EVENT SPHERE JAVASCRIPT IS WORKING!");
// Sample Events

function futureDate(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split("T")[0];
}

const defaultEvents = [
    {
        id: 1,
        title: "Tech Innovation Hackathon",
        category: "Hackathon",
        date: futureDate(5),
        time: "09:00",
        venue: "Innovation Lab",
        seats: 50,
        description: "Build creative solutions to real-world problems."
    },
    {
        id: 2,
        title: "Web Development Workshop",
        category: "Workshop",
        date: futureDate(8),
        time: "10:00",
        venue: "Computer Lab",
        seats: 40,
        description: "Learn the fundamentals of modern web development."
    },
    {
        id: 3,
        title: "Cultural Fest",
        category: "Cultural",
        date: futureDate(12),
        time: "11:00",
        venue: "University Auditorium",
        seats: 100,
        description: "Enjoy music, dance and cultural performances."
    },
    {
        id: 4,
        title: "Inter College Sports Meet",
        category: "Sports",
        date: futureDate(15),
        time: "08:00",
        venue: "Sports Ground",
        seats: 60,
        description: "Participate in exciting sports competitions."
    }
];

// Load saved data

function loadData(key, fallback) {
    try {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : fallback;
    } catch {
        return fallback;
    }
}

let events = [];
let editingEventId = null;
let registrations = loadData("registrations", []);

// Save data

function saveData() {
    localStorage.setItem("events", JSON.stringify(events));
    localStorage.setItem("registrations", JSON.stringify(registrations));
}


const API_URL = "http://localhost:5000/api";

async function loadEvents() {
    try {
        const response = await fetch(`${API_URL}/events`);

        if (!response.ok) {
            throw new Error("Unable to load events");
        }

        events = await response.json();

        renderAll();

        console.log("Events loaded from MySQL:", events);

    } catch (error) {
        console.error("Event loading failed:", error);
        alert("Could not connect to the server. Please check your backend.");
    }
}

async function loadRegistrations() {
    try {
        const response = await fetch(`${API_URL}/registrations`);

        if (!response.ok) {
            throw new Error("Unable to load registrations");
        }

        registrations = await response.json();

        renderAll();

        console.log("Registrations loaded from MySQL:", registrations);

    } catch (error) {
        console.error("Registration loading failed:", error);
        alert("Could not load registrations from the server.");
    }
}


// Escape user-entered text before displaying it

function safeText(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

// Navigation

function showPage(pageId) {
    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active");
    });

    document.getElementById(pageId).classList.add("active");

    renderAll();
}


document.querySelectorAll(".nav-links a").forEach(link => {
    link.addEventListener("click", function(event) {
        event.preventDefault();

        const view = this.dataset.view;

        if (view === "admin") {
            showPage("adminLogin");
        } else {
            showPage(view);
        }
    });
});

// Admin Login Form
document.getElementById("adminLoginForm").addEventListener(
    "submit", async function(event) {
        event.preventDefault();

        const username = document.getElementById("adminUsername").value.trim();
        const password = document.getElementById("adminPassword").value;

        const message = document.getElementById("adminLoginMessage");

        try {
            const response = await fetch(`${API_URL}/admin/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ username, password })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Login failed.");
            }

            message.textContent = "Login successful!";

            showPage("admin");

            this.reset();

        } catch (error) {
            message.textContent = error.message;
        }
    }
);


// Event Card

function createEventCard(event) {
    const registeredCount = registrations.filter(
        r => Number(r.eventId) === Number(event.id)
    ).length;

    const remainingSeats = Math.max(0, Number(event.seats) - registeredCount);

    return `
        <div class="event-card">
            <span class="category">${safeText(event.category)}</span>

            <h3>${safeText(event.title)}</h3>

            <p>📅 ${safeText(event.date)}</p>
            <p>⏰ ${safeText(event.time)}</p>
            <p>📍 ${safeText(event.venue)}</p>

            <p>${safeText(event.description)}</p>

            <p>Available Seats: ${remainingSeats}</p>

            <button data-action="register"
                    data-id="${event.id}"
                    ${remainingSeats === 0 ? "disabled" : ""}>
                ${remainingSeats === 0 ? "Full" : "Register"}
            </button>
        </div>
    `;
}

// Display Events

function displayEvents() {
    const eventList = document.getElementById("eventList");

    const search = document.getElementById("searchInput").value.toLowerCase();

    const category = document.getElementById("categoryFilter").value;

    const filteredEvents = events.filter(event => {
        const matchesSearch = event.title.toLowerCase().includes(search);

        const matchesCategory =
            category === "All" || event.category === category;

        return matchesSearch && matchesCategory;
    });

    eventList.innerHTML = filteredEvents.length
        ? filteredEvents.map(createEventCard).join("")
        : "<p>No events found.</p>";
}

// Featured Events

function displayFeatured() {
    const featured = document.getElementById("featuredEvents");

    featured.innerHTML = events.slice(0, 3)
        .map(createEventCard).join("");
}

// Search and Filter

document.getElementById("searchInput").addEventListener(
    "input", displayEvents
);

document.getElementById("categoryFilter").addEventListener(
    "change", displayEvents
);


// Edit Event
function editEvent(eventId) {

    const event = events.find(e => Number(e.id) === Number(eventId));

    if (!event) {
        alert("Event not found.");
        return;
    }

    editingEventId = event.id;
    document.getElementById("eventFormTitle").textContent = "Edit Event";
document.getElementById("eventSubmitBtn").textContent = "Update Event";

    document.getElementById("eventTitle").value = event.title;
    document.getElementById("eventCategory").value = event.category;
    document.getElementById("eventDate").value = event.date;
    document.getElementById("eventTime").value = event.time;
    document.getElementById("eventVenue").value = event.venue;
    document.getElementById("eventSeats").value = event.seats;
    document.getElementById("eventDescription").value = event.description;

    showPage("admin");
    
    alert("Event details loaded. You can now edit them.");
}

// Open Registration Modal

function openModal(eventId) {
    const event = events.find(e => Number(e.id) === Number(eventId));

    if (!event) return;

    const registeredCount = registrations.filter(
        r => Number(r.eventId) === Number(eventId)
    ).length;

    if (registeredCount >= Number(event.seats)) {
        alert("Sorry! All seats are filled.");
        return;
    }

    document.getElementById("registerEventId").value = eventId;

    document.getElementById("registrationModal").style.display = "flex";
}

function closeModal() {
    document.getElementById("registrationModal").style.display = "none";
}

// Register Student


 // Register Student
document.getElementById("registrationForm").addEventListener(
    "submit", async function(event) {

        event.preventDefault();

        const eventId = Number(
            document.getElementById("registerEventId").value
        );

        const newRegistration = {
            eventId: eventId,
            name: document.getElementById("studentName").value.trim(),
            email: document.getElementById("studentEmail").value.trim(),
            department: document.getElementById("studentDept").value.trim()
        };

        if (!newRegistration.name || !newRegistration.email ||
            !newRegistration.department) {
            alert("Please fill in all student details.");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/registrations`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(newRegistration)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Registration failed");
            }

            alert("Registration Successful!");

            this.reset();
            closeModal();

            // Reload registrations from MySQL
            await loadRegistrations();

        } catch (error) {
            console.error("Registration failed:", error);
            alert(error.message || "Could not complete registration.");
        }
    }
);


// Show My Registrations

function displayMyEvents() {
    const myList = document.getElementById("myEventList");

    if (registrations.length === 0) {
        myList.innerHTML = "<p>No registrations yet.</p>";
        return;
    }

    myList.innerHTML = registrations.map(registration => {

        const event = events.find(
            e => Number(e.id) === Number(registration.eventId)
        );

        if (!event) return "";

        return `
            <div class="event-card">
                <h3>${safeText(event.title)}</h3>

                <p>Student: ${safeText(registration.name)}</p>

                <p>Email: ${safeText(registration.email)}</p>

                <p>Department: ${safeText(registration.department)}</p>

                <p>Date: ${safeText(event.date)}</p>

                <p>Registration ID:
                    ${safeText(registration.registrationId)}
                </p>
            </div>
        `;
    }).join("");
}

// Add New Event


// Add New Event or Update Existing Event
document.getElementById("eventForm").addEventListener(
    "submit", async function(event) {
        event.preventDefault();

        const newEvent = {
            title: document.getElementById("eventTitle").value.trim(),
            category: document.getElementById("eventCategory").value,
            date: document.getElementById("eventDate").value,
            time: document.getElementById("eventTime").value,
            venue: document.getElementById("eventVenue").value.trim(),
            seats: Number(document.getElementById("eventSeats").value),
            description: document.getElementById("eventDescription").value.trim()
        };

        if (!newEvent.title || !newEvent.category || !newEvent.date ||
            !newEvent.time || !newEvent.venue ||
            !Number.isInteger(newEvent.seats) || newEvent.seats < 1 ||
            !newEvent.description) {
            alert("Please enter valid event details.");
            return;
        }

        const isEditing = editingEventId !== null;

        const url = isEditing
            ? `${API_URL}/events/${editingEventId}`
            : `${API_URL}/events`;

        try {
            const response = await fetch(url, {
                method: isEditing ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(newEvent)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Failed to save event");
            }

            alert(
                isEditing
                    ? "Event Updated Successfully!"
                    : "New Event Added Successfully!"
            );

            editingEventId = null;
this.reset();

document.getElementById("eventFormTitle").textContent = "Add New Event";
document.getElementById("eventSubmitBtn").textContent = "Add Event";

await loadEvents();

        } catch (error) {
            console.error("Event save failed:", error);
            alert(error.message || "Could not save the event. Check the backend.");
        }
    }
);


// Admin Dashboard

function displayAdmin() {

    document.getElementById("totalEvents").textContent = events.length;

    document.getElementById("totalRegistrations").textContent =
        registrations.length;

    const adminList = document.getElementById("adminEventList");

    adminList.innerHTML = events.map(event => `
        <div class="admin-item">
            <div>
                <strong>${safeText(event.title)}</strong>
                <p>${safeText(event.date)} | ${safeText(event.category)}</p>
            </div>
            <button class="edit-btn"
        data-action="edit"
        data-id="${event.id}">
    Edit
</button>

<button class="delete-btn"
        data-action="delete"
        data-id="${event.id}">
    Delete
</button>
           
        </div>
    `).join("");
}

// Button Actions

document.addEventListener("click", async function(event) {

    const button = event.target.closest("[data-action]");

    if (!button) return;

    const eventId = Number(button.dataset.id);

    if (button.dataset.action === "register") {
        openModal(eventId);
    }
    if (button.dataset.action === "edit") {
    editEvent(eventId);
}
    
if (button.dataset.action === "delete") {

    if (confirm("Are you sure you want to delete this event?")) {

        try {
            const response = await fetch(
                `${API_URL}/events/${eventId}`,
                {
                    method: "DELETE"
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Delete failed");
            }

            alert("Event Deleted Successfully!");

            await loadEvents();
            await loadRegistrations();

        } catch (error) {
            console.error("Delete failed:", error);
            alert(error.message || "Could not delete event.");
        }
    }
}


   
});

// Display Everything

function renderAll() {
    displayFeatured();
    displayEvents();
    displayMyEvents();
    displayAdmin();
}

// Initial Display

// Load events from MySQL when website opens
// Load events and registrations from MySQL
async function initializeApp() {
    await loadEvents();
    await loadRegistrations();
}

initializeApp();