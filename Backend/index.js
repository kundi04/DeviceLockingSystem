require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const sgMail = require('@sendgrid/mail');
const Admin = require('./models/Admin'); // Adjust the path as necessary
const Device = require('./models/Device'); // Adjust the path as necessary

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const app = express();
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch((err) => console.log('MongoDB connection error:', err));

// Add a mock device
const addMockDevice = async () => {
    try {
        const existingDevice = await Device.findOne({ name: 'iphone 16 pro max' });
        if (!existingDevice) {
            const mockDevice = new Device({
                name: 'iphone 16 pro max',
                locked: false,
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                paymentStatus: false,
                ownerEmail: 'owner@example.com',
            });

            const savedDevice = await mockDevice.save();
            console.log('Mock device added with ID:', savedDevice._id);
        } else {
            console.log('Mock device already exists with ID:', existingDevice._id);
        }
    } catch (error) {
        console.log('Error adding mock device:', error);
    }
};

// Call the function to add a mock device
addMockDevice();

// Root Route
app.get('/', (req, res) => {
    res.send('Welcome to the Device Locking System API');
});

// Register Admin (One-Time Setup)
app.post('/register-admin', async (req, res) => {
    try {
        const { username, password } = req.body;
        const existingAdmin = await Admin.findOne({ username });

        if (existingAdmin) {
            return res.status(400).json({ message: "Admin already exists" });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        const newAdmin = new Admin({ username, password: hashedPassword });
        await newAdmin.save();

        res.status(201).json({ message: "Admin registered successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error registering admin", error });
    }
});

// Admin Login
app.post('/admin-login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const admin = await Admin.findOne({ username });

        if (!admin) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        const token = jwt.sign({ id: admin._id, username: admin.username }, process.env.JWT_SECRET, { expiresIn: "2h" });

        res.json({ message: "Login successful", token });
    } catch (error) {
        res.status(500).json({ message: "Error logging in", error });
    }
});

// Lock Device
app.post('/lock-device', async (req, res) => {
    try {
        const { deviceId } = req.body;
        if (!mongoose.Types.ObjectId.isValid(deviceId)) {
            return res.status(400).json({ message: "Invalid deviceId" });
        }

        const device = await Device.findById(deviceId);

        if (!device) {
            return res.status(404).json({ message: "Device not found" });
        }

        device.locked = true;
        await device.save();

        res.json({ message: "Device locked successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error locking device", error });
    }
});

// Unlock Device
app.post('/unlock-device', async (req, res) => {
    try {
        const { deviceId } = req.body;
        if (!mongoose.Types.ObjectId.isValid(deviceId)) {
            return res.status(400).json({ message: "Invalid deviceId" });
        }

        const device = await Device.findById(deviceId);

        if (!device) {
            return res.status(404).json({ message: "Device not found" });
        }

        device.locked = false;
        await device.save();

        res.json({ message: "Device unlocked successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error unlocking device", error });
    }
});

// Automatic Locking and Notification based on Due Date
const checkDueDates = async () => {
    const now = new Date();
    const devices = await Device.find({ dueDate: { $lte: now }, paymentStatus: false });

    for (const device of devices) {
        if (!device.locked) {
            device.locked = true;
            await device.save();
            console.log(`Device ${device.name} locked due to overdue payment.`);
        }
    }

    // Notify users about upcoming due dates
    const notificationDate = new Date(now);
    notificationDate.setDate(notificationDate.getDate() + 1); // Notify 1 day before due date
    const devicesToNotify = await Device.find({ dueDate: { $lte: notificationDate, $gt: now }, paymentStatus: false });

    for (const device of devicesToNotify) {
        const msg = {
            to: device.ownerEmail,
            from: 'your-email@example.com', // Use your verified SendGrid email
            subject: 'Device Payment Due Soon',
            text: `Your device ${device.name} will be locked on ${device.dueDate} if the balance is not paid.`,
        };
        sgMail.send(msg)
            .then(() => {
                console.log(`Notification sent to ${device.ownerEmail}`);
            })
            .catch((error) => {
                console.error('Error sending notification:', error);
            });
    }
};

// Schedule the checkDueDates function to run periodically
setInterval(checkDueDates, 60 * 60 * 1000); // Check every hour

// Start Server
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));