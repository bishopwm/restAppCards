



// API request options

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

let config = {
    method: 'post',
    url: requestUrl,
    headers: { 
    'Authorization': `Bearer ${access_token}`, 
    'Content-Type': 'application/json'
    },
    data: payload
}
async function callMiro(cardTitle, cardDescription){
    try {
        let response = await axios(config);
        let miroData = JSON.stringify(response.data);
        axios.post("https://ironrest.herokuapp.com/whaleWatcher231", {miroData}).then(apiRes => {
        res.redirect(301, 'http://localhost:8000');
    });

    } catch (err) {console.log(`ERROR: ${err}`)}
}
callMiro();

module.exports.createCard = createCard;