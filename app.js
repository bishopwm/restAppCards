// Require handlebars for clientside rendering
const express = require('express');
const exphbs = require('express-handlebars'); 

// Require ExpressJS for local server

const app = express();

// Require axios:
const axios = require('axios');


// Configure express-handlebars as our view engine:
app.engine('hbs', exphbs.engine({
    defaultLayout: 'main',
    extname: '.hbs'
}));

// Retrieve stored request data:





app.set('view engine', 'hbs');

app.get('/', (req, res) => {
    async function getStoredData(){
        await axios.get("https://ironrest.herokuapp.com/whaleWatcher231").then(response => {
            console.log(response);
            let miroData = response.data
            res.render('home', {
                content: {
                    title: miroData[3].miroData
                }
            });
        });
        return
    }
    getStoredData()
});

app.listen(8000, () => {
    console.log('The web server has started on port 3000');
});