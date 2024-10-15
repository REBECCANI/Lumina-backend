const express = require('express');
const app = express();
const port = 5000;
const cors = require("cors");
const path = require('path'); 
const { v4: uuidv4 } = require('uuid');
const bodyParser = require("body-parser"); 
const db = require("./db");
const bcrypt = require('bcryptjs');
require('dotenv').config();

const allowedOrigins = [
    'https://lumina-frontend-bbf9.vercel.app',
    'https://www.luminacoreapp.org', 
    'http://localhost:3000' 
  ];
  
  app.use(cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
       var msg = 'The CORS policy for this site does not allow access from the specified Origin.';
       return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }));


app.use(express.json());
app.use(bodyParser.json());

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    next();
});

app.post("/home", (req, res) => {
    const { firstName, lastName, email, password, institution, category, verificationToken } = req.body;
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            console.error('Error hashing password:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    
        const query = `
            INSERT INTO users_lumina (firstName, lastName, email, password, verificationToken, verified, expires)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [firstName, lastName, email, hashedPassword, verificationToken, false, Date.now() + 3600000]; 
    
        db.query(query, values, (err, result) => {
            if (err) {
                console.error('Error inserting user into the database:', err.message);
                return res.status(500).json({ error: `Database error: ${err.message}` });
            }
    
            res.json({
                message: 'User registered successfully',
                verificationLink: `https://www.lumina-backend-jza3.onrender.com/verify/${verificationToken}`
            });
            console.log('Hashed Password during registration:', hashedPassword);
        });
    });
});

app.get("/verify/:token", (req, res) => {
    const { token } = req.params;

    const query = `
        SELECT * FROM users_lumina WHERE verificationToken = ? AND expires > ?
    `;

    db.query(query, [token, Date.now()], (err, results) => {
        if (err) {
            console.error('Error querying the database:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (results.length === 0) {
            return res.status(400).json({ error: 'Token is invalid or expired' });
        }

        const user = results[0];

        const updateQuery = `
            UPDATE users_lumina SET verified = ? WHERE verificationToken = ?
        `;

        db.query(updateQuery, [true, token], (updateErr) => {
            if (updateErr) {
                console.error('Error updating the user verification status:', updateErr);
                return res.status(500).json({ error: 'Database error' });
            }

            res.redirect('https://www.luminacoreapp.org/confirm');
        });
    });
});

app.post("/login", (req, res) => {
    console.log('Login route hit');
    const { email, password } = req.body;
    console.log('Login attempt for:', email);

    if (!email || !password) {
        console.log('Missing email or password!');
        return res.status(400).json({ error: 'Email and password are required!' });
    }

    const query = 'SELECT * FROM users_lumina WHERE email = ? AND verified = ?';

    db.query(query, [email, true], (err, results) => {
        if (err) {
            console.error('Error querying the database:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        console.log('Query results:', results);

        if (results.length === 0) {
            console.log('No user found or not verified');
            return res.status(400).json({ error: 'Invalid email or the account is not verified' });
        }

        const user = results[0];

        bcrypt.compare(password, user.password, (bcryptErr, isMatch) => {
            if (bcryptErr) {
                console.error('Error comparing passwords:', bcryptErr);
                return res.status(500).json({ error: 'Internal server error' });
            }
        
            if (!isMatch) {
                console.log('Provided password:', password);
                console.log('Stored hashed password:', user.password);
                console.log('Invalid password');
                return res.status(400).json({ error: 'Invalid password' });
            }
        
            console.log('Login successful');

            res.json({
                message: 'Login successful',
                user: {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName
                }
            });
        });
    });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
