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
  referredBy: String,   // 👈 added here
  remarks: [
    {
      text: String,
      date: { type: Date, default: Date.now }
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

const Lead = mongoose.model('Lead', leadSchema);

/* ------------------------- Duplicate check ------------------------- */
async function isDuplicateLead(raw) {
  const { mobileNumber, emailAddress } = raw;

  if (mobileNumber && emailAddress) {
    return await Lead.findOne({ mobileNumber });
  } else if (mobileNumber) {
    return await Lead.findOne({ mobileNumber });
  } else if (emailAddress) {
    return await Lead.findOne({ emailAddress });
  }
  return null;
}

// 📌 Public lead submission
// 📌 Public lead submission
app.post('/submit-lead', async (req, res) => {
  try {
    const raw = req.body || {};
    const leadData = {
      fullName: raw.fullName ?? raw['Full Name'] ?? 'NA',
      mobileNumber: raw.mobileNumber ?? raw['Mobile Number'] ?? '',
      emailAddress: raw.emailAddress ?? raw['Email Address'] ?? '',
      designation: raw.designation ?? raw['Designation'] ?? 'NA',
      companyName: raw.companyName ?? raw['Company Name'] ?? 'NA',
      city: raw.city ?? raw['City'] ?? 'NA',
      referredBy: raw.referredBy ?? raw['Referred By'] ?? 'NA',   // 👈 added here
      remarks: []
    };

    // ✅ rest logic unchanged
    const exists = await isDuplicateLead(leadData);
    if (exists) {
      if (leadData.mobileNumber && leadData.emailAddress) {
        return res.status(400).json({ success: false, message: 'Duplicate found: Mobile number already exists.' });
      } else if (leadData.mobileNumber) {
        return res.status(400).json({ success: false, message: 'Duplicate found: Mobile number already exists.' });
      } else if (leadData.emailAddress) {
        return res.status(400).json({ success: false, message: 'Duplicate found: Email already exists.' });
      }
    }

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

// 📌 Get all leads
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

// 📌 Append new remark
app.post('/api/leads/:id/remarks', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ success: false, message: "Remark text required" });

    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { $push: { remarks: { text, date: new Date() } } },
      { new: true }
    );

    res.json({ success: true, data: lead });
  } catch (err) {
    console.error('Error saving remark:', err);
    res.status(500).json({ success: false, message: 'Error saving remark' });
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
