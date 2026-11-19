
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
require("dotenv").config();

const db = require("./db");

const app = express();

app.use(cors());
app.use(express.json());


 // Create a new admin account
app.post("/api/admin/register", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            message: "Username and password are required."
        });
    }

    if (password.length < 8) {
        return res.status(400).json({
            message: "Password must contain at least 8 characters."
        });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = `
            INSERT INTO admins (username, password)
            VALUES (?, ?)
        `;

        db.query(sql, [username, hashedPassword], (err, result) => {
            if (err) {
                if (err.code === "ER_DUP_ENTRY") {
                    return res.status(409).json({
                        message: "Username already exists."
                    });
                }

                return res.status(500).json({
                    message: "Admin registration failed."
                });
            }

            res.status(201).json({
                message: "Admin account created successfully!"
            });
        });

    } catch (error) {
        console.error("Admin registration error:", error);

        res.status(500).json({
            message: "Something went wrong."
        });
    }
});


// Admin Login API
app.post("/api/admin/login", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            message: "Username and password are required."
        });
    }

    const sql = "SELECT * FROM admins WHERE username = ?";

    db.query(sql, [username], async (err, results) => {
        if (err) {
            return res.status(500).json({
                message: "Database error."
            });
        }

        if (results.length === 0) {
            return res.status(401).json({
                message: "Invalid username or password."
            });
        }

        try {
            const isMatch = await bcrypt.compare(
                password,
                results[0].password
            );

            if (!isMatch) {
                return res.status(401).json({
                    message: "Invalid username or password."
                });
            }

            res.json({
                message: "Login successful!",
                admin: {
                    id: results[0].id,
                    username: results[0].username
                }
            });

        } catch (error) {
            res.status(500).json({
                message: "Login failed."
            });
        }
    });
});


// Homepage test
app.get("/", (req, res) => {
    res.send("Backend server is running successfully!");
});
// Update an existing event
app.put("/api/events/:id", (req, res) => {
    const eventId = Number(req.params.id);

    const {
        title,
        category,
        date,
        time,
        venue,
        seats,
        description
    } = req.body;

    if (
        !Number.isInteger(eventId) ||
        eventId <= 0 ||
        !title || !category || !date || !time ||
        !venue || !description ||
        !Number.isInteger(seats) || seats < 1
    ) {
        return res.status(400).json({
            message: "Please provide valid event details."
        });
    }

    const sql = `
        UPDATE events
        SET title = ?,
            category = ?,
            event_date = ?,
            event_time = ?,
            venue = ?,
            seats = ?,
            description = ?
        WHERE id = ?
    `;

    db.query(
        sql,
        [title, category, date, time, venue, seats, description, eventId],
        (err, result) => {
            if (err) {
                console.error("Event update failed:", err);
                return res.status(500).json({
                    message: "Failed to update event."
                });
            }

            if (result.affectedRows === 0) {
                return db.query(
                    "SELECT id FROM events WHERE id = ?",
                    [eventId],
                    (checkErr, rows) => {
                        if (checkErr) {
                            return res.status(500).json({
                                message: "Database error."
                            });
                        }

                        if (rows.length === 0) {
                            return res.status(404).json({
                                message: "Event not found."
                            });
                        }

                        res.json({
                            message: "Event updated successfully!"
                        });
                    }
                );
            }

            res.json({
                message: "Event updated successfully!"
            });
        }
    );
});

// Get all events from MySQL
app.get("/api/events", (req, res) => {

    const sql = `
        SELECT
            id,
            title,
            category,
            DATE_FORMAT(event_date, '%Y-%m-%d') AS date,
            TIME_FORMAT(event_time, '%H:%i') AS time,
            venue,
            seats,
            description
        FROM events
        ORDER BY event_date ASC
    `;

    db.query(sql, (err, results) => {

        if (err) {
            return res.status(500).json({
                message: "Unable to fetch events",
                error: err.message
            });
        }

        res.json(results);
    });
});


 // Add a new event
app.post("/api/events", (req, res) => {

    const {
        title,
        category,
        date,
        time,
        venue,
        seats,
        description
    } = req.body;

    if (!title || !category || !date || !time ||
        !venue || seats === undefined || !description) {
        return res.status(400).json({
            message: "Please provide all event details"
        });
    }

    const sql = `
        INSERT INTO events
        (title, category, event_date, event_time,
         venue, seats, description)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [title, category, date, time, venue, seats, description],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    message: "Failed to add event",
                    error: err.message
                });
            }

            res.status(201).json({
                message: "Event added successfully!",
                eventId: result.insertId
            });
        }
    );
});


 // Get all student registrations
app.get("/api/registrations", (req, res) => {

    const sql = `
        SELECT
            registration_id AS registrationId,
            event_id AS eventId,
            student_name AS name,
            email,
            department
        FROM registrations
        ORDER BY registration_date DESC
    `;

    db.query(sql, (err, results) => {

        if (err) {
            return res.status(500).json({
                message: "Unable to fetch registrations",
                error: err.message
            });
        }

        res.json(results);
    });
});


 // Register a student for an event
app.post("/api/registrations", (req, res) => {

    const {
        eventId,
        name,
        email,
        department
    } = req.body;

    if (!eventId || !name || !email || !department) {
        return res.status(400).json({
            message: "Please provide all student details"
        });
    }

    const registrationId = "ES" + Date.now();

    const sql = `
        INSERT INTO registrations
        (registration_id, event_id, student_name, email, department)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [registrationId, eventId, name, email, department],
        (err, result) => {

            if (err) {
                if (err.code === "ER_DUP_ENTRY") {
                    return res.status(409).json({
                        message: "This student is already registered for this event."
                    });
                }

                return res.status(500).json({
                    message: "Registration failed",
                    error: err.message
                });
            }

            res.status(201).json({
                message: "Registration successful!",
                registrationId: registrationId
            });
        }
    );
});


 // Delete an event from MySQL
app.delete("/api/events/:id", (req, res) => {

    const eventId = Number(req.params.id);

    if (!Number.isInteger(eventId) || eventId <= 0) {
        return res.status(400).json({
            message: "Invalid event ID"
        });
    }

    const sql = "DELETE FROM events WHERE id = ?";

    db.query(sql, [eventId], (err, result) => {

        if (err) {
            return res.status(500).json({
                message: "Failed to delete event",
                error: err.message
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Event not found"
            });
        }

        res.json({
            message: "Event deleted successfully!"
        });
    });
});


// Database test
app.get("/test-db", (req, res) => {
    db.query("SELECT 1 AS result", (err, results) => {
        if (err) {
            return res.status(500).json({
                message: "Database query failed",
                error: err.message
            });
        }

        res.json({
            message: "Database connected successfully!",
            data: results
        });
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
