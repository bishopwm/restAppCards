// Require sensitive environment variables (oauthToken, Miro boardID)
require('dotenv/config');

// Require express for server and handlebars for clientside rendering
const express = require('express');
const exphbs = require('express-handlebars'); 
const app = express();

// Require axios for http requests:
const axios = require('axios');

// Require body-parser to parse form submissions
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


// Require multer and fast-csv for CSV upload functionality
const multer = require('multer');
const csv = require('fast-csv');
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

    
    //declare variables for sticky and tag content
    let stickyContent;
    let tagContent1;
    let tagContent2;
    let tagContent3;

    //declare variable to hold stored IDs
    let storedData = [];
    let tagContentCollection = [];

    // Loop through and make request for each line of CSV content
    let length = csvCardContent.length;
    for (let i = 0; i < length; i++) {

        stickyContent = {
                "content": 
                    `<strong>Title</strong>: ${csvCardContent.slice(i).shift(i++)}` + "<br>" +
                    `<strong>Description</strong>: ${csvCardContent.slice(i).shift(i++)}`
                }

        tagContent1 = {
            "tagContent": `${csvCardContent.slice(i).shift(i++)}`
        }
        tagContent2 = {
            "tagContent": `${csvCardContent.slice(i).shift(i++)}`
        }
        tagContent3 = {
            "tagContent": `${csvCardContent.slice(i).shift(i++)}`
        }

        tagContentCollection.push(tagContent1.tagContent, tagContent2.tagContent, tagContent3.tagContent, tagContent1.tagContent, tagContent2.tagContent, tagContent3.tagContent);

        // API Request Payload
        let payload = JSON.stringify({

            "data": {
                "content": `${stickyContent.content}`,
                "shape": "square"
           },
           "style": {
                "fillColor": "light_pink",
                "textAlign": "left",
                "textAlignVertical": "top"
           },
           "position": {
                "x": 0 + (40*i),
                "y": 40*i,
                "origin": "center"
           }
        });
        // API Request configuration
        let config = {
            method: 'post',
            url: `https://api.miro.com/v2/boards/${process.env.boardId}/sticky_notes`,
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
                let miroData = JSON.stringify(response.data.id);
                console.log("Sticky ID : " + miroData); 

                    async function createTag(){
                        let tagPayload = JSON.stringify({
                            "fillColor": "blue",
                            "title": tagContentCollection[i]
                        });
                        let config = {
                            method: 'post',
                            url: `https://api.miro.com/v2/boards/${process.env.boardId}/tags`,
                            headers: { 
                            'Authorization': `Bearer ${process.env.oauthToken}`, 
                            'Content-Type': 'application/json'
                            },
                            data: tagPayload
                        }
                        try {
                            let tagResponse = await axios(config);
                            tagData = JSON.stringify(tagResponse.data.id);
                            console.log("Tag id: " + tagData)
                            tagId = tagData.replace(/['"]+/g, '');

                                async function attachTag(){
                                    let stickyId = miroData.replace(/['"]+/g, '');
                                    let attachConfig = {
                                        method: 'post',
                                        url: `https://api.miro.com/v2/boards/${process.env.boardId}/items/${stickyId}?tag_id=${tagId}`,
                                        headers: { 
                                        'Authorization': `Bearer ${process.env.oauthToken}`, 
                                        'Content-Type': 'application/json'
                                        }
                                    }
                                    
                                    try {
                                        let response = await axios(attachConfig);
                                        let attachData = JSON.stringify(response.data);
                                        console.log(attachData);
                                        console.log("attach url : " + attachConfig.url)
                                        return attachData;
                    
                                    } catch (err) {console.log(`ERROR: ${err}`)}
                                }
                                attachTag()

                        } catch (err) {console.log(`ERROR on createTag(): ${err}`)}   
                    }
                    createTag();

                
            } catch (err) {console.log(`ERROR: ${err}`)}
            
        }
        callMiro();

        console.log("Sticky Content lives here : " + stickyContent.content);
        console.log("Tag content 1 : " + tagContent1.tagContent)
        console.log("Tag content 2 : " + tagContent2.tagContent)
        console.log("Tag content 3 : " + tagContent3.tagContent)

       
                

    

    }
    

    //console.log("stored data : " + storedData)

    // Redirect to 'List Cards' view on success
    res.redirect(301, '/get-card');
});


// ROUTE(GET): RENDER HOME VIEW
app.get('/', (req, res) => {
 res.render('home')
});

// ROUTE(GET) RETRIEVE CARD DATA / 'List Cards'
app.get("/get-card", (req, res) => {
    
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
            //console.log("API Response data: " + miroData);
            res.render('viewCard.hbs', {miroData});
        } catch (err) {console.log(`ERROR: ${err}`)}
        return
    }
    getCards();

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

// ROUTE(POST): CREATE STICKY
app.post("/create-card", function(req,res) {
    let stickyTitle = req.body.Title;
    let stickyDescription = req.body.Description;
    let stickyTag1 = req.body.Tag1


    // API Request Payload
    let payload = JSON.stringify({
        "data": {
             "content": stickyTitle + " " + stickyDescription,
             "shape": "square"
        },
        "style": {
             "fillColor": "light_yellow",
             "textAlign": "center",
             "textAlignVertical": "top"
        },
        "position": {
             "x": 0,
             "y": 0,
             "origin": "center"
        }
   });

    // API Request configuration
    let config = {
        method: 'post',
        url: `https://api.miro.com/v2/boards/${process.env.boardId}/sticky_notes`,
        headers: { 
        'Authorization': `Bearer ${process.env.oauthToken}`, 
        'Content-Type': 'application/json'
        },
        data: payload
    }
    
    // Call Miro API to create Sticky:
    async function callMiro(){
        let miroData;
        let tagId;
        try {
            // Call Create Sticky endpoint
            let response = await axios(config);
            miroData = JSON.stringify(response.data.id);
            tagId = await createTag();
            // Function to create tag item
            async function createTag(){
                let tagPayload = JSON.stringify({
                    "fillColor": "blue",
                    "title": stickyTag1
                });
                let config = {
                    method: 'post',
                    url: `https://api.miro.com/v2/boards/${process.env.boardId}/tags`,
                    headers: { 
                    'Authorization': `Bearer ${process.env.oauthToken}`, 
                    'Content-Type': 'application/json'
                    },
                    data: tagPayload
                }
                try {
                    let tagResponse = await axios(config);
                    tagData = JSON.stringify(tagResponse.data.id);
                    console.log("tag id: " + tagData)
                    tagId = tagData.replace(/['"]+/g, '');
                    return tagId;       
                } catch (err) {console.log(`ERROR on createTag(): ${err}`)}   
            }
            createTag();
            // Function to attach tag to sticky
            async function attachTag(){
                let stickyId = miroData.replace(/['"]+/g, '');
                let attachConfig = {
                    method: 'post',
                    url: `https://api.miro.com/v2/boards/${process.env.boardId}/items/${stickyId}?tag_id=${tagId}`,
                    headers: { 
                    'Authorization': `Bearer ${process.env.oauthToken}`, 
                    'Content-Type': 'application/json'
                    }
                }
                try {
                    let response = await axios(attachConfig);
                    let attachData = JSON.stringify(response.data);
                    console.log(attachData);
                    return attachData;

                } catch (err) {console.log(`ERROR: ${err}`)}
            }
            attachTag()
        } catch (err) {console.log(`ERROR: ${err}`)}   
    }
    callMiro();
    res.redirect(301, '/get-card');
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
    res.redirect(301, '/get-card');
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
    res.redirect(301, '/get-card');
});


app.listen(8000, () => {
    console.log('The web server has started on port 8000');
});


// ARCHIVE

// ROUTE(POST): CREATE NEW APP CARD
// app.post("/create-card", function(req,res) {
//     let cardTitle = req.body.Title;
//     let cardDescription = req.body.Description;

//     // API Request Payload
//     let payload = JSON.stringify({
//         "data": {
//             "title": `${cardTitle}`,
//             "description": `${cardDescription}`
//         },
//         "style": {
//             "fillColor": "#2d9bf0"
//         },
//         "geometry": {
//             "rotation": "0.0"
//         }
//     });

//     // API Request configuration
//     let config = {
//         method: 'post',
//         url: requestUrl,
//         headers: { 
//         'Authorization': `Bearer ${process.env.oauthToken}`, 
//         'Content-Type': 'application/json'
//         },
//         data: payload
//     }
//     // Call Miro API to create App Card:
//     async function callMiro(){
//         try {
//             let response = await axios(config);
//             let miroData = JSON.stringify(response.data);
//             return miroData;
//         } catch (err) {console.log(`ERROR: ${err}`)}
//     }
//     callMiro();
//     res.redirect(301, '/get-card');
// });