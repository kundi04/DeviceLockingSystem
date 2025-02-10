const express = require('express');
const cors = require('cors');
const { format } = require('date-fns');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Test Route
app.get("/", (req, res) => {
    res.send("Device Locking System Backend is Running");
});

let devices = [
    { id: 1, name: "iPhone 13", status: "unlocked", paymentStatus: "due", owner: "John", paymentDueDate: "2025-01-25" },
    { id: 2, name: "MacBook Pro", status: "unlocked", paymentStatus: "paid", owner: "Alice", paymentDueDate: "2025-02-01" }
];

app.post('/lock-device', (req, res) => {
    const { deviceId } = req.body;
    const device = devices.find((device) => device.id === deviceId);

    if (!device) {
        return res.status(404).send({ message: "Device not found" });
    }

    const paymentDueDate = new Date(device.paymentDueDate);
    const currentDate = new Date(); 

    // Check if payment is overdue
    if (device.paymentStatus === "due" && currentDate > paymentDueDate) {
        device.status = "locked"; // Lock the device if payment is overdue
        return res.send({ message: `${device.name} has been locked due to overdue payment. Payment was due on ${format(paymentDueDate, "yyyy-MM-dd")}` });
    } else {
        return res.send({ message: `${device.name} is unlocked and payment is completed or not overdue.` });
    }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));