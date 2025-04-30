//server
const http = require('http');
const app = require("express")();
app.use(require("express").static(__dirname));
app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));
//the port we actually hold the page
app.listen(9091, () => console.log("Listening on http port 9091"));
const websocketServer = require('websocket').server;
const httpServer = http.createServer();
httpServer.listen(9090, () => console.log("Listening on port 9090"));

//hashmap of clients (what does this mean?)
const clients = {};
const games = {};

const wsServer = new websocketServer({ 
    //property: 'httpServer',
    "httpServer": httpServer
});

wsServer.on("request", request => {

    //TCB connection --> client connect to server
    const connection = request.accept(null, request.origin);
    connection.on("open", () => console.log("opened!!"));
    connection.on("close", () => console.log("closed!!"));
    connection.on("message", message => {
        //where most o the code will live
        //meaning that "I have received a message from the client"
        //Data that the server will receive, assuming the client is sending JSON data
        //Might cause errors if the client is not sending JSON data
        const result = JSON.parse(message.utf8Data)
        
        //when user clicks on the create button, this will be called
        if(result.method === "create") {
            //ask for client id
            const clientId = result.clientId;
            const gameId = guid();
            games[gameId] = {
                "id": gameId,
                "balls": 20,
                "clients": []
            }

            const payLoad = {
                "method": "create",
                "game": games[gameId]
            }

            const con = clients[clientId].connection;
            con.send(JSON.stringify(payLoad));
        }

        //when user clicks on the join button, this will be called
        if(result.method === "join") {
            const clientId = result.clientId;
            const gameId = result.gameId;
            const game = games[gameId];
            //assign color to the player
            //tell us how many clients there are in the game (at most three clients, or it fails)
            if(game.clients.length >= 3) {
                //max number of clients reached
                return;
            }
            const color = {"0": "Red", "1": "Green", "2": "Blue"}[game.clients.length]
            game.clients.push({
                "clientId": clientId,
                "color": color
            })

            //start the game if there are three clients
            if(game.clients.length === 3){
                updateGameState();
            }

            const payLoad = {
                "method": "join",
                "game": game,
            }
            //sent info back to all clients
            //loop through all clients in the game and tell them that a new client has joined
            game.clients.forEach(c => {
                clients[c.clientId].connection.send(JSON.stringify(payLoad));
            })
        }

        if(result.method === "play") {
            const clientId = result.clientId;
            const gameId = result.gameId;
            const ballId = result.ballId;
            const color = result.color;
            let state = games[gameId].state;

            if(!state){
                state = {};
            }

            state[ballId] = color;
            games[gameId].state = state;
        }
    });

    //generate a new client id for the client
    const clientId = guid();
    //build a mapping between the clientId and the connection
    // might add more to the client object later
    clients[clientId] = {
        "connection": connection,
    }

    const payLoad = {
        "method": "connect",
        "clientId": clientId,
    }

    //send the payLoad as bytes by turning JSON into a string and then sending it
    //send back to the client
    connection.send(JSON.stringify(payLoad));

})


//make a new client id for the client
function S4() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
}
const guid = () => {
    return `${S4()}${S4()}-${S4()}-${S4()}-${S4()}-${S4()}${S4()}${S4()}`;
};

function updateGameState(){
    //a dictionary : {"gameId", (something)}
    for(const g of Object.keys(games)){
        const game = games[g];

        const payLoad = {
            "method": "update",
            "game": game,
        }

        game.clients.forEach(c => {
            clients[c.clientId].connection.send(JSON.stringify(payLoad));
        })
    }

    setTimeout(updateGameState, 500);
}