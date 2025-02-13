const mongoose = require('mongoose');
const Device = require('./models/Device'); // Adjust the path as necessary

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch((err) => console.log('MongoDB connection error:', err));

const findDeviceId = async () => {
    try {
        const device = await Device.findOne({ name: 'iphone 16 pro max' });
        if (device) {
            console.log('Device ID:', device._id);
        } else {
            console.log('Device not found');
        }
    } catch (error) {
        console.log('Error finding device:', error);
    } finally {
        mongoose.connection.close();
    }
};

// Call the function to find the device ID
findDeviceId();