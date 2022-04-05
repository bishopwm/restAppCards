// Require sensitive environment variables (Client ID, Client Secret, Miro Board ID)
require('dotenv/config');

// Require handlebars for clientside rendering
const express = require('express');
const exphbs = require('express-handlebars'); 

// Require Router
const Router = express.Router;

// Require ExpressJS for local server
const app = express();

// Require axios:
const axios = require('axios');

// Require body-parser to parse form submission
var bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())


// Require multer and fast-csv for CSV upload functionality
const multer = require('multer');
const csv = require('fast-csv');
const http = require('http');
const fs = require('fs');

// Define upload csv destination
const upload = multer({ dest: 'tmp/csv/' });

// Route to render upload CSV view
app.get('/upload-csv', (req, res) => {
    res.render('uploadCSV')
   });

// Define route for csv upload
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
        //process "fileRows" and respond
      })  
    
    res.render('uploadCSV.hbs', {fileRows});

});

// Route for creation of CSV items
app.post('/create-from-csv', function (req, res) {
    console.log("Hello from parsed content ");
    let cardTitle = req.body.Content.shift();
    let cardDesc = req.body.Content.shift(1);
    let tag1 = req.body.Content.shift(2);
    let tag2 = req.body.Content.shift(3);
    let tag3 = req.body.Content.shift(4);
    let tag4 = req.body.Content.shift(5);


    console.log("Title " + cardTitle);
    console.log("Description " + cardDesc);  
    console.log("Tag 1 " + tag1);
    console.log("Tag 2 " + tag2);
    console.log("Tag 3 " + tag3);
    console.log("Tag 4 " + tag4);
});



// Configure express-handlebars as our view engine:
app.engine('hbs', exphbs.engine({
    defaultLayout: 'main',
    extname: '.hbs'
}));

// Configure handlebars
app.set('view engine', 'hbs');

// Route to render home view
app.get('/', (req, res) => {
 res.render('home')
});

// Route to retrieve card data
app.get("/get-card", (req, res) => {
    //res.render('miro.hbs');
    let oauthToken = '4s97a1_pYGhNfvvN7juRsWx0N_Q';
    let config = {
        method: 'get',
        url: `https://api.miro.com/v2/boards/${process.env.boardId}/app_cards`,
        headers: { 
        'Authorization': `Bearer ${oauthToken}` 
        }
    }

    // function to call Miro API/retrieve App Cards
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


// Route to render `create card` view
  app.get("/create-card", (req, res) => {
    res.render('createCard')    
});

// Route to render `update card` view
app.get("/update-card", (req, res) => {
    res.render('updateCard')    
});

// Route to render `delete card` view
app.get("/delete-card", (req, res) => {
    res.render('deleteCard')    
});

// Route for POST to create card endpoint (createCard.js)
app.post("/create-card", function(req,res) {
    //console.log(req.body.Title, req.body.Description);
    let cardTitle = req.body.Title;
    let cardDescription = req.body.Description;
    //let cardDescription = req.body.Description;
    console.log("REQUEST BODY " + req.body.Title);


    // Miro request URL for POST Create App Card:
    let requestUrl = `https://api.miro.com/v2/boards/${process.env.boardId}/app_cards`

    // OAuth access_token
    let oauthToken = '4s97a1_pYGhNfvvN7juRsWx0N_Q';

    // Request Payload
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

    // Request configuration
    let config = {
        method: 'post',
        url: requestUrl,
        headers: { 
        'Authorization': `Bearer ${oauthToken}`, 
        'Content-Type': 'application/json'
        },
        data: payload
    }
    // Call Miro API to create App Card:
    async function callMiro(){
        try {
            let response = await axios(config);
            let miroData = JSON.stringify(response.data);
            // Post response to external storage
            axios.post("https://ironrest.herokuapp.com/whaleWatcher231", {miroData}).then(apiRes => {
                console.log(apiRes);
            
        });

        } catch (err) {console.log(`ERROR: ${err}`)}
    }
    callMiro();


    res.redirect(301, '/');
});


// Route to PATCH existing app card

app.post("/update-card", function(req,res) {
    console.log("Card ID : " + req.body.Id);
    let cardId = req.body.Id
    let newCardTitle = req.body.Title;
    let newCardDescription = req.body.Description;
    //let cardDescription = req.body.Description;
    console.log("PATCH UPDATE DETAILS " + `Card ID: ${cardId}, Card Title: ${newCardTitle}, Card Desc: ${newCardDescription}`);


    // Miro request URL for POST Create App Card:
    let requestUrl = `https://api.miro.com/v2/boards/${process.env.boardId}/app_cards/${cardId}`

    // OAuth access_token
    let oauthToken = '4s97a1_pYGhNfvvN7juRsWx0N_Q';

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

    // Request configuration
    let config = {
        method: 'patch',
        url: requestUrl,
        headers: { 
        'Authorization': `Bearer ${oauthToken}`, 
        'Content-Type': 'application/json'
        },
        data: payload
    }
    // Call Miro API to update App Card:
    async function callMiroUpdate(){
        try {
            let response = await axios(config);
            let miroData = JSON.stringify(response.data);
            // Post response to external storage
            axios.post("https://ironrest.herokuapp.com/whaleWatcher231", {miroData}).then(apiRes => {
                console.log(apiRes);
            
        });

        } catch (err) {console.log(`ERROR: ${err}`)}
    }
    callMiroUpdate();


    res.redirect(301, '/');
});

// Route to DELETE existing app card

app.post("/delete-card", function(req,res) {
    console.log("Card ID : " + req.body.Id);
    let cardId = req.body.Id
    // let newCardTitle = req.body.Title;
    // let newCardDescription = req.body.Description;
    //let cardDescription = req.body.Description;
    console.log("DELETE DETAILS " + `Card ID: ${cardId}`);


    // Miro request URL for POST Create App Card:
    let requestUrl = `https://api.miro.com/v2/boards/${process.env.boardId}/app_cards/${cardId}`

    // OAuth access_token
    let oauthToken = '4s97a1_pYGhNfvvN7juRsWx0N_Q';

//     let payload = JSON.stringify({
//         "data": {
//              "title": newCardTitle,
//              "description": newCardDescription
//         },
//         "style": {
//              "fillColor": "#2d9bf0"
//         },
//         "geometry": {
//              "rotation": "0.0"
//         }
//    })

    // Request configuration
    let config = {
        method: 'delete',
        url: requestUrl,
        headers: { 
        'Authorization': `Bearer ${oauthToken}`, 
        'Content-Type': 'application/json'
        }
    }
    // Call Miro API to delete App Card:
    async function callMiroDelete(){
        try {
            let response = await axios(config);
            let miroData = JSON.stringify(response.data);
            // Post response to external storage
            axios.post("https://ironrest.herokuapp.com/whaleWatcher231", {miroData}).then(apiRes => {
                console.log(apiRes);
            
        });

        } catch (err) {console.log(`ERROR: ${err}`)}
    }
    callMiroDelete();


    res.redirect(301, '/');
});


app.listen(8000, () => {
    console.log('The web server has started on port 8000');
});