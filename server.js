const express = require('express')
const { Client } = require('pg')
const app = express()
const cors = require('cors')
const http = require('http')
const speakeasy = require('speakeasy')
const qrcode = require('qrcode')
const { query } = require('express')

const client = new Client({
    host: 'ec2-18-212-160-4.compute-1.amazonaws.com',
    port: 5432,
    user: 'backend',
    password: 'CSE545_SS_backend',
    database: 'postgres'
})

app.use(cors())

client.connect((err) => {
    if (err) {
        console.error('connection error', err.stack)
    } else {
        console.log('connected')
    }
})

app.listen(3000, function () {
    console.log("Server is running on localhost3000");
});

// Get Patient user profile
app.get('/api/patient/profile/:Id', (req, res) => {
    console.log(req.params.Id);
    var query = "SELECT name, age, gender, address, \"phoneNumber\", \"creditCard\" FROM public.user as u, public.patient as p where u.\"userID\" = p.\"patientID\" and u.\"userID\"="+req.params.Id+"";
    client.query(query, function(err, result) {
        if (err) {
            console.log(err);
            throw err;
        }
        res.json(result.rows[0])
    });
    
}
);

// 2FA - Registration
app.get('/api/twofareg/:Id', (req, res) => {
    var secret = speakeasy.generateSecret({
        name: "Software Security - NodeJS"
    })
    console.log(req.params.Id)
    var secretAscii = secret.ascii
    var value
    //var query = "INSERT INTO public.\"oneTimePasscode\"('email', ') VALUES ("+req.params.Id+", "+ secretAscii +", now())";
    var query = "INSERT INTO \"oneTimePasscode\"(passcode, time, email) VALUES ('"+secretAscii+"', now(), '"+req.params.Id+"')";
    client.query(query, function(err, result) {
        if (err) {
            console.log(err);
            throw err;
        }
    });
    qrcode.toDataURL(secret.otpauth_url, function(err, data){
        value = data
        res.json({
            value
        })
    });
});

// 2FA - Login
app.get('/api/twofa/:Id/:code', (req, res) => {
    var query = "SELECT passcode from \"oneTimePasscode\" where email = '"+req.params.Id+"'";
    client.query(query, function(err, result) {
        if (err) {
            console.log(err);
            throw err;
        }
        if (result.rows[0] == null) {res.json("Invalid")} else {
        var ascii = result.rows[0]["passcode"]
        var verified = speakeasy.totp.verify({
            secret: ascii,
            encoding: 'ascii',
            token: req.params.code
        })
        res.json(verified)}
    });
});