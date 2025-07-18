const express = require('express');
const nodemailer = require('nodemailer');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'your_super_secret_key',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 10 * 60 * 1000 } // 10 minutes
}));

// Gmail SMTP transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'allshere.info@gmail.com',
    pass: 'zcmeequjkwrlyeha',
  },
});

// OTP generator
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper function to safely read and validate users
function getUsers() {
  const filePath = path.join(__dirname, 'users.json');
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      if (data) {
        const users = JSON.parse(data);
        
        // Validate and clean user data
        return users.filter(user => {
          return user && 
                 typeof user === 'object' &&
                 typeof user.id === 'number' &&
                 typeof user.name === 'string' &&
                 typeof user.email === 'string' &&
                 typeof user.password === 'string' &&
                 user.email.trim() !== '';
        });
      }
    }
    return [];
  } catch (err) {
    console.error('Error reading users file:', err);
    return [];
  }
}

// Reset authentication state in session
function resetAuthState(req) {
  req.session.registrationPending = false;
  req.session.regData = null;
  req.session.loginPending = false;
  req.session.loginData = null;
  req.session.otp = null;
  req.session.otpExpires = null;
  req.session.otpEmailSent = false;
  req.session.otpError = null;
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Protected home route
app.get('/home', (req, res) => {
  if (req.session.loggedIn) {
    res.sendFile(path.join(__dirname, 'public', 'home.html'));
  } else {
    res.redirect('/'); 
  }
});

app.get('/login', (req, res) => {
  if (req.session.loggedIn) {
    res.redirect('/home');
  } else {
    res.redirect('/?panel=login');
  }
  
});

app.get('/register', (req, res) => {
  res.redirect('/?panel=register');
});



// Protected OTP verification route
app.get('/verify-otp', (req, res) => {
  if (req.session.otp && req.session.otpExpires) {
    res.sendFile(path.join(__dirname, 'public', 'verify-otp.html'));
  } else {
    if (req.session.loggedIn) {
      res.redirect('/home');
    } else {
      res.redirect('/');
    }
  }
});

// Handle registration request
app.post('/register', (req, res) => {
  resetAuthState(req);
  req.session.registrationPending = true;

  const { name, email, password } = req.body;
  
  // Basic validation
  if (!name || !email || !password) {
    return res.status(400).send('❌ All fields are required.');
  }

  const users = getUsers();
  
  // Case-insensitive duplicate check
  const emailExists = users.some(user => 
    user.email.toLowerCase() === email.toLowerCase()
  );

  if (emailExists) {
   return res.status(400).send(`
  <div style="text-align:center; margin-top:100px; font-family: Arial, sans-serif;">
    <h1 style="color:red;">❌ Email already registered. Please login.</h1>
  </div>
`);

  }

  const otp = generateCode();

  // Set session variables
  req.session.otp = otp;
  req.session.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  req.session.regData = { name, email, password };

  // Immediately redirect to OTP page
  res.redirect('/verify-otp');

  // Send email in background
  const mailOptions = {
    from: '"QuickPipz" <allshere.info@gmail.com>',
    to: email,
    subject: 'Your OTP Code',
    text: `Hi ${name}, your OTP code is: ${otp}`
  };

  transporter.sendMail(mailOptions)
    .then(() => {
      req.session.otpEmailSent = true;
    })
    .catch(err => {
      console.error(err);
      req.session.otpError = 'Failed to send OTP email. Try again.';
    });
});

// Handle login request
app.post('/login', (req, res) => {
  resetAuthState(req);
  req.session.loginPending = true;

  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).send('❌ Email and password are required.');
  }

  const users = getUsers();

  // Case-insensitive email check
  const user = users.find(u => 
    u.email.toLowerCase() === email.toLowerCase() && 
    u.password === password
  );

  if (!user) {
    res.send(`
  <div style="text-align:center; margin-top:100px;">
    <h1 style="color:red;">❌ Invalid email or password</h1>
  </div>
`);


  }

  const otp = generateCode();
  
  // Set session variables
  req.session.otp = otp;
  req.session.otpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes
  req.session.loginData = {
    email: user.email,
    name: user.name
  };

  // Immediately redirect to OTP page
  res.redirect('/verify-otp');

  // Send email in background
  const mailOptions = {
    from: '"QuickPipz" <allshere.info@gmail.com>',
    to: email,
    subject: 'Your OTP Code for Login',
    html: `<p>Hi ${user.name},</p><p>Your login OTP is: <b>${otp}</b></p><p>This code will expire in 5 minutes.</p>`
  };

  transporter.sendMail(mailOptions)
    .then(() => {
      req.session.otpEmailSent = true;
    })
    .catch(err => {
      console.error('Error sending OTP:', err);
      req.session.otpError = 'Could not send OTP. Try again.';
    });
});

// Handle OTP verification for both flows
app.post('/verify-otp', (req, res) => {
  const userOtp = req.body.otp;
  const currentTime = Date.now();

  // Validate OTP session
  if (!req.session.otp || !req.session.otpExpires) {
    return res.status(400).send('❌ OTP session not found. Please start over.');
  }

  if (currentTime > req.session.otpExpires) {
    resetAuthState(req);
    return res.status(400).send('❌ OTP expired. Please start over.');
  }

  // Handle REGISTRATION flow
  if (req.session.registrationPending) {
    if (String(userOtp) === String(req.session.otp)) {
      const { name, email, password } = req.session.regData;
      const users = getUsers();

      // Final duplicate check
      const exists = users.some(u => 
        u.email.toLowerCase() === email.toLowerCase()
      );

      if (exists) {
        resetAuthState(req);
        return res.status(400).send('❌ Email already registered. Please login.');
      }

      // Add new user
      users.push({ 
        id: Date.now(), 
        name, 
        email, 
        password 
      });

      try {
  fs.writeFileSync(path.join(__dirname, 'users.json'), JSON.stringify(users, null, 2));
  resetAuthState(req);

  // Success message with redirect after 3 seconds
  return res.send(`
    <div style="text-align:center; margin-top:100px; font-family: Arial, sans-serif;">
      <h1 style="color:green; font-size: 2rem; ">Registration successful! ✅  Redirecting to login page...</h1>
     <script>
        setTimeout(() => {
          window.location.href = '/login';
        }, 5000);
      </script>
    </div>
  `);
} catch (err) {
  console.error('Error writing users file:', err);
  return res.status(500).send(`
    <div style="text-align:center; margin-top:100px; font-family: Arial, sans-serif;">
      <h1 style="color:red;">❌ Could not save user. Try again.</h1>
    </div>
  `);
}

    } else {
      return res.status(400).send(`
  <div style="text-align:center; margin-top:100px; font-family: Arial, sans-serif;">
    <h1 style="color:red;">❌ invalid otp</h1>
  </div>
`);

    }
  }
  // Handle LOGIN flow
  else if (req.session.loginPending) {
    if (String(userOtp) === String(req.session.otp)) {
      const { name, email } = req.session.loginData;
      
      // Set logged-in status
      req.session.regenerate((err) => {
        if (err) {
          console.error('Session regeneration error:', err);
          return res.status(500).send('❌ Login failed. Please try again.');
        }
        
        req.session.loggedIn = true;
        req.session.user = { name, email };
        res.redirect('/home');
      });
    } else {
      return res.status(400).send(`
  <div style="text-align:center; margin-top:100px; font-family: Arial, sans-serif;">
    <h1 style="color:red;">❌ invalid otp</h1>
  </div>
`);


    }
  }
  // Unknown flow
  else {
    resetAuthState(req);
    return res.status(400).send('❌ Invalid session. Please start over.');
  }
});

// Logout route
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).send('❌ Could not log out. Try again.');
    }
    res.redirect('/');
  });
});

// 404 fallback
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});