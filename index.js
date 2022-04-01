// This sample app is intended to demonstrate the OAuth 2.0 flow that is required to call Miro's V2 APIs. 
// Devs may consider using this Node.js demo as a structural basis for any other preferred language/framework.
// NOTE: Any comments with "--->" signify part of a significant step in the flow. Comments without "--->" are added for additional reference on code.

// For the full guide on Miro's OAuth 2.0 flow, please see the documentation here:
// https://beta.developers.miro.com/docs/getting-started-with-oauth 


// Require sensitive environment variables (Client ID, Client Secret, Miro Board ID)
require('dotenv/config');

// Require Axios for handling HTTP requests to Miro /oauth and Miro API endpoints
const axios = require('axios');

// Require ExpressJS for local server
const express = require('express');
const app = express();

// Call Express server
app.get('/', (req, res) => {

    // ---> #1: 
    // ---> If an authorization `code` has not already been retrieved from the redirect URL after Miro authorization screen, proceed to #2 (Redirect to Miro authorization URL). Else, proceed to #3 (Requesting access_token/refresh_token pair, using `code`).

    if (req.query.code) {

        //console prompt to get app card details
        // const prompt = require("prompt-sync")({ sigint: true });
        // const create = prompt("Create an App Card! What is the title?");
        
        // const appCardTitle = create

        

        // #3: 
        // ---> Request `access_token` and `refresh_token` pair by making a request to Miro /oauth endpoint. 
        // ---> Required parameters include `grant_type`, `client_id`, `client_secret`, `code`, and `redirect_uri`.
        // ---> See full details in Miro documentation here: https://beta.developers.miro.com/docs/getting-started-with-oauth#step-3

        let url = `https://api.miro.com/v1/oauth/token?grant_type=authorization_code&client_id=${process.env.clientID}&client_secret=${process.env.clientSecret}&code=${req.query.code}&redirect_uri=${process.env.redirectURL}`
    
        async function grabToken() {
            try {
                let oauthResponse = await axios.post(url);
                
                // Console log accesss_token and reference_token:
                console.log(`access_token: ${oauthResponse.data.access_token}`)
                console.log(`access_token: ${oauthResponse.data.refresh_token}`)
                


                // Set global variable for access_token value
                const access_token = oauthResponse.data.access_token;
                
                // Specify Miro API request URL
                //let requestUrl = `https://api.miro.com/v2/boards/${process.env.boardId}`

                // AppCards Endpoint and payload

                let requestUrl = `https://api.miro.com/v2/boards/${process.env.boardId}/app_cards`

                
                // #4:
                // ---> If `access_token` was successfully retrieved, send an API request to any Miro endpoint that contains the same permissions as your OAuth 2.0 app, with `access_token` as value for Bearer Token. 
                // ---> (See permissions under user profile > apps: https://miro.com/app/settings/user-profile/apps)
                if (access_token) {

                    // API request options

                    let payload = JSON.stringify({
                        "data": {
                            "title": `My App Card!`,
                            "description": "sample app card description"
                        },
                        "style": {
                            "fillColor": "#2d9bf0"
                        },
                        "geometry": {
                            "rotation": "0.0"
                        }
                    });

                    let config = {
                        method: 'post',
                        url: requestUrl,
                        headers: { 
                        'Authorization': `Bearer ${access_token}`, 
                        'Content-Type': 'application/json'
                        },
                        data: payload
                    }
                    async function callMiro(){
                        try {
                            let response = await axios(config);
                            let miroData = JSON.stringify(response.data);
                            axios.post("https://ironrest.herokuapp.com/whaleWatcher231", {miroData}).then(apiRes => {
                            res.redirect(301, 'http://localhost:8000');
                        });

                        } catch (err) {console.log(`ERROR: ${err}`)}
                    }
                    callMiro();
                    }  
            } catch (err) {console.log(`ERROR: ${err}`)}
        }
        return grabToken();
    }
    // ---> #2: 
    // ---> If no authorization code is present, redirect to Miro OAuth to authorize retrieve new `code`.
    res.redirect('https://miro.com/oauth/authorize?response_type=code&client_id=' + process.env.clientID + '&redirect_uri=' + process.env.redirectURL)
})
// Run express server on Localhost 3000
app.listen(3000, () => console.log(`Listenting on Localhost 3000`))