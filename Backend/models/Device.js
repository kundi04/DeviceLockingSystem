const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
    name: String,
    status: { type: String, default: "unlocked" },
    paymentStatus: { type: String, default: "due" },
    owner: String,
    paymentDueDate: Date
});

const Device = mongoose.model("Device", deviceSchema);

module.exports = Device;
