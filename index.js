const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { format } = require('date-fns');
const Device = require('./models/Device');  

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB Connection
const mongoURI = "mongodb+srv://kundai:eukmal2004@devicelockdb.4lqr7.mongodb.net/DeviceLockDB?retryWrites=true&w=majority";

mongoose.connect(mongoURI)
    .then(() => console.log("✅ MongoDB Connected Successfully"))
    .catch(err => console.error("❌ MongoDB Connection Failed:", err));

// Test Route
app.get("/", (req, res) => {
    res.send("Device Locking System Backend is Running");
});

// Add a Device (POST)
app.post('/add-device', async (req, res) => {
    try {
        const { name, owner, paymentDueDate } = req.body;
        const newDevice = new Device({ name, owner, paymentDueDate });
        await newDevice.save();
        res.status(201).send({ message: "Device added successfully", device: newDevice });
    } catch (error) {
        res.status(500).send({ message: "Error adding device", error });
    }
});

// Get All Devices (GET)
app.get('/devices', async (req, res) => {
    try {
        const devices = await Device.find();
        res.status(200).send(devices);
    } catch (error) {
        res.status(500).send({ message: "Error fetching devices", error });
    }
});

// Lock a Device if Payment is Due (POST)
app.post('/lock-device', async (req, res) => {
    try {
        const { deviceId } = req.body;
        const device = await Device.findById(deviceId);

        if (!device) {
            return res.status(404).send({ message: "Device not found" });
        }

        const paymentDueDate = new Date(device.paymentDueDate);
        const currentDate = new Date();

        if (device.paymentStatus === "due" && currentDate > paymentDueDate) {
            device.status = "locked";
            await device.save();
            return res.send({ message: `${device.name} has been locked due to overdue payment. Payment was due on ${format(paymentDueDate, "yyyy-MM-dd")}` });
        } else {
            return res.send({ message: `${device.name} is unlocked and payment is completed or not overdue.` });
        }
    } catch (error) {
        res.status(500).send({ message: "Error locking device", error });
    }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
