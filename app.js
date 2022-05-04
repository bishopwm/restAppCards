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
const requestUrl = `https://api.miro.com/v2/boards/${process.env.boardId}/sticky_notes`

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
    let tagContentCollection1 = [];
    let tagContentCollection2 = [];
    let tagContentCollection3 = [];

    // Loop through and make request for each line of CSV content
    let length = csvCardContent.length;
    for (let i = 0; i < length; i++) {
        // Capture sticky content from csv content
        stickyContent = {
                "content": 
                    `<strong>Title</strong>: ${csvCardContent.slice(i).shift(i++)}` + "<br>" +
                    `<strong>Description</strong>: ${csvCardContent.slice(i).shift(i++)}`
                }
        // Capture tag content from csv content
        tagContent1 = {
            "tagContent": `${csvCardContent.slice(i).shift(i++)}`
        }
        tagContent2 = {
            "tagContent": `${csvCardContent.slice(i).shift(i++)}`
        }
        tagContent3 = {
            "tagContent": `${csvCardContent.slice(i).shift(i++)}`
        }

        // Sort tag content 
        tagContentCollection1.push(
            tagContent1.tagContent, 
            tagContent1.tagContent, 
            tagContent1.tagContent, 
            tagContent1.tagContent, 
            tagContent1.tagContent, 
            tagContent1.tagContent
        );

        tagContentCollection2.push(
            tagContent2.tagContent, 
            tagContent2.tagContent, 
            tagContent2.tagContent, 
            tagContent2.tagContent, 
            tagContent2.tagContent, 
            tagContent2.tagContent
        );

        tagContentCollection3.push(
            tagContent3.tagContent, 
            tagContent3.tagContent, 
            tagContent3.tagContent, 
            tagContent3.tagContent, 
            tagContent3.tagContent, 
            tagContent3.tagContent
        );

        // API request configuration for Create Sticky API
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
        // Call Miro API to create sticky, create tag, and attach tag to sticky:
        async function callMiro(){
            // Create Sticky
            try {
                let response = await axios(config);
                let miroData = JSON.stringify(response.data.id);
                console.log("Sticky ID : " + miroData); 
                    // Create tag
                    async function createTag(){
                        let tagPayload1 = JSON.stringify({
                            "fillColor": "blue",
                            "title": tagContentCollection1[i]
                        });


                        let tagPayload2 = JSON.stringify({
                            "fillColor": "red",
                            "title": tagContentCollection2[i]
                        });

                        let tagPayload3 = JSON.stringify({
                            "fillColor": "red",
                            "title": tagContentCollection3[i]
                        });

                        let config1 = {
                            method: 'post',
                            url: `https://api.miro.com/v2/boards/${process.env.boardId}/tags`,
                            headers: { 
                            'Authorization': `Bearer ${process.env.oauthToken}`, 
                            'Content-Type': 'application/json'
                            },
                            data: tagPayload1
                        }

                        let config2 = {
                            method: 'post',
                            url: `https://api.miro.com/v2/boards/${process.env.boardId}/tags`,
                            headers: { 
                            'Authorization': `Bearer ${process.env.oauthToken}`, 
                            'Content-Type': 'application/json'
                            },
                            data: tagPayload2
                        }

                        let config3 = {
                            method: 'post',
                            url: `https://api.miro.com/v2/boards/${process.env.boardId}/tags`,
                            headers: { 
                            'Authorization': `Bearer ${process.env.oauthToken}`, 
                            'Content-Type': 'application/json'
                            },
                            data: tagPayload3
                        }

                        try {
                            // API request to Create Tag endpoint
                            let tagResponse = await axios(config1);
                            let tagResponse2 = await axios(config2);
                            let tagResponse3 = await axios(config3);

                            tagData = JSON.stringify(tagResponse.data.id);
                            tagData2 = JSON.stringify(tagResponse2.data.id);
                            tagData3 = JSON.stringify(tagResponse3.data.id);

                            //console.log("Tag id: " + tagData)
                            tagId = tagData.replace(/['"]+/g, '');
                            tagId2 = tagData2.replace(/['"]+/g, '');
                            tagId3 = tagData3.replace(/['"]+/g, '');

                                // Attach tag 1
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
                                        // API Request to attach tag to sticky note
                                        let response = await axios(attachConfig);
                                        let attachData = JSON.stringify(response.data);
                                        console.log(attachData);
                                        console.log("attach url : " + attachConfig.url)
                                        return attachData;
                    
                                    } catch (err) {console.log(`ERROR: ${err}`)}
                                }
                                attachTag()

                                // Attach tag 2
                                async function attachTag2(){
                                    let stickyId = miroData.replace(/['"]+/g, '');
                                    let attachConfig = {
                                        method: 'post',
                                        url: `https://api.miro.com/v2/boards/${process.env.boardId}/items/${stickyId}?tag_id=${tagId2}`,
                                        headers: { 
                                        'Authorization': `Bearer ${process.env.oauthToken}`, 
                                        'Content-Type': 'application/json'
                                        }
                                    }
                                    try {
                                        // API Request to attach tag to sticky note
                                        let response = await axios(attachConfig);
                                        let attachData = JSON.stringify(response.data);
                                        console.log(attachData);
                                        console.log("attach url : " + attachConfig.url)
                                        return attachData;
                    
                                    } catch (err) {console.log(`ERROR: ${err}`)}
                                }
                                attachTag2()

                                // Attach tag 3
                                async function attachTag3(){
                                    let stickyId = miroData.replace(/['"]+/g, '');
                                    let attachConfig = {
                                        method: 'post',
                                        url: `https://api.miro.com/v2/boards/${process.env.boardId}/items/${stickyId}?tag_id=${tagId3}`,
                                        headers: { 
                                        'Authorization': `Bearer ${process.env.oauthToken}`, 
                                        'Content-Type': 'application/json'
                                        }
                                    }
                                    try {
                                        // API Request to attach tag to sticky note
                                        let response = await axios(attachConfig);
                                        let attachData = JSON.stringify(response.data);
                                        console.log(attachData);
                                        console.log("attach url : " + attachConfig.url)
                                        return attachData;
                    
                                    } catch (err) {console.log(`ERROR: ${err}`)}
                                }
                                attachTag3()



                        } catch (err) {console.log(`ERROR on createTag(): ${err}`)}   
                    }
                    createTag();
            } catch (err) {console.log(`ERROR: ${err}`)}
        }
        callMiro();
    }
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