// Require sensitive environment variables (Client ID, Client Secret, Miro Board ID)
require('dotenv/config');

// Require express for server and handlebars for clientside rendering
const express = require('express');
const exphbs = require('express-handlebars'); 
const app = express();

// Require axios for http requests:
const axios = require('axios');

// Require body-parser to parse form submissions
var bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())


// Require multer and fast-csv for CSV upload functionality
const multer = require('multer');
const csv = require('fast-csv');
const http = require('http');
const fs = require('fs');
const upload = multer({ dest: 'tmp/csv/' });

// Configure express-handlebars as our view engine:
app.engine('hbs', exphbs.engine({
    defaultLayout: 'main',
    extname: '.hbs'
}));

// Configure handlebars
app.set('view engine', 'hbs');

// Declare global variable for Miro API endpoint (App Cards)
const requestUrl = `https://api.miro.com/v2/boards/${process.env.boardId}/app_cards`

// <-------- ROUTES -------->


// ROUTE(GET): VIEW UPLOAD .CSV OPTION
app.get('/upload-csv', (req, res) => {
    res.render('uploadCSV')
   });

// ROUTE(POST): UPLOAD .CSV FILE
app.post('/upload-csv', upload.single('csv'), function (req, res) {
    //console.log("upload triggered, here is req :" + req)
    const fileRows = [];

    // open uploaded file
    csv.parseFile(req.file.path)
      .on("data", function (data) {
        fileRows.push(data); // push each row
      })
      .on("end", function () {
        console.log(fileRows)
        fs.unlinkSync(req.file.path);   // remove temp file
        fileRows.shift(); // remove csv headers (start with actual content)
      })  
    res.render('uploadCSV.hbs', {fileRows});
});

// ROUTE(POST): CREATE CARDS FROM CSV CONTENT
app.post('/create-from-csv', function (req, res) {
    let csvCardContent = req.body.Content;

    // Loop through and make request for each line of CSV content
    let length = csvCardContent.length;
    for (let i = 0; i < length; i++) {
    
        // API Request Payload
        let payload = JSON.stringify({
            "data": {
                "title": `${csvCardContent.slice(i).shift(i)}`,
                "description": `${csvCardContent.slice(i).shift(i++)}`,
                "fields": [
                    {
                        "value": `${csvCardContent.slice(i).shift(i++)}`,
                        "fillColor": "#2fa9e3",
                        "textColor": "#1a1a1a",
                        "iconUrl": "https://cdn-icons-png.flaticon.com/512/5695/5695864.png",
                        "iconShape": "round",
                        "tooltip": "tooltip"
                    },
                    {
                        "value": `${csvCardContent.slice(i).shift(i++)}`,
                        "fillColor": "#2fa9e3",
                        "textColor": "#1a1a1a",
                        "iconUrl": "https://cdn-icons-png.flaticon.com/512/5695/5695864.png",
                        "iconShape": "round",
                        "tooltip": "tooltip"
                    },
                    {
                        "value": `${csvCardContent.slice(i).shift(i++)}`,
                        "fillColor": "#2fa9e3",
                        "textColor": "#1a1a1a",
                        "iconUrl": "https://cdn-icons-png.flaticon.com/512/5695/5695864.png",
                        "iconShape": "round",
                        "tooltip": "tooltip"
                    },
                    {
                        "value": `${csvCardContent.slice(i).shift(i++)}`,
                        "fillColor": "#2fa9e3",
                        "textColor": "#1a1a1a",
                        "iconUrl": "https://cdn-icons-png.flaticon.com/512/5695/5695864.png",
                        "iconShape": "round",
                        "tooltip": "tooltip"
                    }
                ]
            },
            "style": {
                "fillColor": "#2d9bf0"
            },
            "geometry": {
                "rotation": "0.0"
            },
            "position": {
                "x": 0 + (20*i),
                "y": 20*i,
                "origin": "center"
            }
        });
        // API Request configuration
        let config = {
            method: 'post',
            url: requestUrl,
            headers: { 
            'Authorization': `Bearer ${process.env.oauthToken}`, 
            'Content-Type': 'application/json'
            },
            data: payload
        }
        // Call Miro API to create App Card:
        async function callMiro(){
            try {
                let response = await axios(config);
                let miroData = JSON.stringify(response.data);
                return miroData
            } catch (err) {console.log(`ERROR: ${err}`)}
        }
        callMiro();
    }
    // Redirect to 'List Cards' view on success
    res.redirect(301, '/get-card')
});


// ROUTE(GET): RENDER HOME VIEW
app.get('/', (req, res) => {
 res.render('home')
});

// ROUTE(GET) RETRIEVE CARD DATA / 'List Cards'
app.get("/get-card", (req, res) => {
    let oauthToken = '4s97a1_pYGhNfvvN7juRsWx0N_Q';
    let config = {
        method: 'get',
        url: requestUrl,
        headers: { 
        'Authorization': `Bearer ${process.env.oauthToken}` 
        }
    }
    // Function to call Miro API/retrieve App Cards
    async function getCards(){
        try {
            let response = await axios(config);
            let miroData = response.data.data;
            console.log("API Response data: " + miroData);
            res.render('viewCard.hbs', {miroData});
        } catch (err) {console.log(`ERROR: ${err}`)}
        return
    }
    getCards()

});


// ROUTE(GET): RENDER 'CREATE CARD' VIEW
  app.get("/create-card", (req, res) => {
    res.render('createCard')    
});

// ROUTE(GET): RENDER 'UPDATE CARD' VIEW
app.get("/update-card", (req, res) => {
    res.render('updateCard')    
});

// ROUTE(GET): RENDER 'DELETE CARD' VIEW
app.get("/delete-card", (req, res) => {
    res.render('deleteCard')    
});

// ROUTE(POST): CREATE NEW APP CARD
app.post("/create-card", function(req,res) {
    let cardTitle = req.body.Title;
    let cardDescription = req.body.Description;

    // API Request Payload
    let payload = JSON.stringify({
        "data": {
            "title": `${cardTitle}`,
            "description": `${cardDescription}`
        },
        "style": {
            "fillColor": "#2d9bf0"
        },
        "geometry": {
            "rotation": "0.0"
        }
    });

    // API Request configuration
    let config = {
        method: 'post',
        url: requestUrl,
        headers: { 
        'Authorization': `Bearer ${process.env.oauthToken}`, 
        'Content-Type': 'application/json'
        },
        data: payload
    }
    // Call Miro API to create App Card:
    async function callMiro(){
        try {
            let response = await axios(config);
            let miroData = JSON.stringify(response.data);
            return miroData;
        } catch (err) {console.log(`ERROR: ${err}`)}
    }
    callMiro();
    res.redirect(301, '/');
});


// ROUTE(POST): UPDATE EXISTING APP CARD

app.post("/update-card", function(req,res) {
    let cardId = req.body.Id
    let newCardTitle = req.body.Title;
    let newCardDescription = req.body.Description;
    
    // Miro request URL for POST Create App Card:
    let cardRequestUrl = requestUrl+`/${cardId}`

    let payload = JSON.stringify({
        "data": {
             "title": newCardTitle,
             "description": newCardDescription
        },
        "style": {
             "fillColor": "#2d9bf0"
        },
        "geometry": {
             "rotation": "0.0"
        }
   })

    // API Request configuration
    let config = {
        method: 'patch',
        url: cardRequestUrl,
        headers: { 
        'Authorization': `Bearer ${process.env.oauthToken}`, 
        'Content-Type': 'application/json'
        },
        data: payload
    }
    // Call Miro API to update App Card:
    async function callMiroUpdate(){
        try {
            let response = await axios(config);
            let miroData = JSON.stringify(response.data);
            return miroData;
        } catch (err) {console.log(`ERROR: ${err}`)}
    }
    callMiroUpdate();
    res.redirect(301, '/');
});

// ROUTE(POST): DELETE EXISTING APP CARD

app.post("/delete-card", function(req,res) {
    console.log("Card ID : " + req.body.Id);
    let cardId = req.body.Id

    // Miro request URL for POST Create App Card:
    let cardRequestUrl = requestUrl+`/${cardId}`

    // Request configuration
    let config = {
        method: 'delete',
        url: cardRequestUrl,
        headers: { 
        'Authorization': `Bearer ${process.env.oauthToken}`, 
        'Content-Type': 'application/json'
        }
    }
    // Call Miro API to delete App Card:
    async function callMiroDelete(){
        try {
            let response = await axios(config);
            let miroData = JSON.stringify(response.data);
            return miroData;
        } catch (err) {console.log(`ERROR: ${err}`)}
    }
    callMiroDelete();
    res.redirect(301, '/');
});


app.listen(8000, () => {
    console.log('The web server has started on port 8000');
});