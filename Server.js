// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Serve lead form
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'leads.html'));
});

// MongoDB connection
const url = "mongodb+srv://monukumarharautha12345:fjEX8kTtQNLU5VXs@cofaso.1j2mxqt.mongodb.net/test?retryWrites=true&w=majority&appName=Cofaso";
mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Schema
const leadSchema = new mongoose.Schema({
  fullName: String,
  mobileNumber: String,
  emailAddress: String,
  designation: String,
  companyName: String,
  city: String,
  remark: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});
const Lead = mongoose.model('Lead', leadSchema);

// 📌 Public lead submission
app.post('/submit-lead', async (req, res) => {
  try {
    const raw = req.body || {};
    const leadData = {
      fullName: raw.fullName ?? raw['Full Name'] ?? 'NA',
      mobileNumber: raw.mobileNumber ?? raw['Mobile Number'] ?? 'NA',
      emailAddress: raw.emailAddress ?? raw['Email Address'] ?? 'NA',
      designation: raw.designation ?? raw['Designation'] ?? 'NA',
      companyName: raw.companyName ?? raw['Company Name'] ?? 'NA',
      city: raw.city ?? raw['City'] ?? 'NA',
      remark: raw.remark ?? ''
    };
    const lead = new Lead(leadData);
    await lead.save();
    res.json({ success: true, message: 'Lead saved successfully!' });
  } catch (err) {
    console.error('Error saving lead:', err);
    res.status(500).json({ success: false, message: 'Error saving lead data' });
  }
});

// 📌 Admin page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// 📌 Get all leads (with search filters)
app.get('/api/leads', async (req, res) => {
  try {
    const { name, email, phone } = req.query;
    let query = {};

    if (name) query.fullName = { $regex: name, $options: 'i' };
    if (email) query.emailAddress = { $regex: email, $options: 'i' };
    if (phone) query.mobileNumber = { $regex: phone, $options: 'i' };

    const leads = await Lead.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: leads });
  } catch (err) {
    console.error('Error fetching leads:', err);
    res.status(500).json({ success: false, message: 'Error fetching leads' });
  }
});

// 📌 Create lead (Admin manual add)
app.post('/api/leads', async (req, res) => {
  try {
    const lead = new Lead(req.body);
    await lead.save();
    res.json({ success: true, data: lead });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 📌 Update full lead
app.put('/api/leads/:id', async (req, res) => {
  try {
    const updatedLead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: updatedLead });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 📌 Delete lead
app.delete('/api/leads/:id', async (req, res) => {
  try {
    await Lead.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 📌 Update only remark
app.patch('/api/leads/:id/remark', async (req, res) => {
  try {
    const updatedLead = await Lead.findByIdAndUpdate(req.params.id, { remark: req.body.remark }, { new: true });
    res.json({ success: true, data: updatedLead });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
