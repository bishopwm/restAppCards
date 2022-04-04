
// API request options

// let config = {
//     method: 'get',
//     url: requestUrl,
//     headers: { 
//     'Authorization': `Bearer ${access_token}`, 
//     'Content-Type': 'application/json'
//     }
// }
// async function callMiro(cardTitle, cardDescription){
//     try {
//         let response = await axios(config);
//         let miroData = JSON.stringify(response.data);
//         axios.post("https://ironrest.herokuapp.com/whaleWatcher231", {miroData}).then(apiRes => {
//         res.redirect(301, 'http://localhost:8000');
//     });

//     } catch (err) {console.log(`ERROR: ${err}`)}
// }