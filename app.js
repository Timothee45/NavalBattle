var http = require('http');
var fs = require('fs');

// Chargement du fichier index.html affiché au client
var server = http.createServer(function(req, res) {
	if (req.url == "/") {
	    sendFile('./index.html', "text/html");
	} else {
		sendFile('.' + req.url, "text/css");
	}

	function sendFile(file, contentType) {
	    fs.readFile(file, 'utf-8', function(error, content) {
	        res.writeHead(200, {"Content-Type": contentType});
	        res.end(content, 'utf-8');
	    });
	}
});

// Chargement de socket.io
var io = require('socket.io').listen(server);

var maxSize = 10;
var playerArray = [];
var gameData = {};
var maxPoints = 17;
var maxLaunches = 3;
var currentPlayerNum = 0;
var currentPlayer = "";

var isTest = true;

function ParcourirGrille(user) {
	for (var i=0; i<maxSize; i++) {
		for (var j=0; j<maxSize; j++) {
			if (gameData[user]["boats"][i][j] != 0) {
console.log("Boat " + (i + 1) + "-" + (j + 1))
			}
		}
	}
}

// Quand un client se connecte, on le note dans la console
io.sockets.on('connection', function (socket) {
    socket.on('auth', function(message) {
    	if (message.length != 0) {
    		if (playerArray.includes(message)) {
	    		socket.emit('my-auth', {
					"status": "ko",
					"message": "Pseudo déja utilisé!!!",
					"data": message,});
			} else {
		    	if (playerArray.length < 2) {
			    	socket.pseudo = message;

			    	playerArray.push(message);

			    	gameData[message] = addData();
			    	gameData[message]["num"] = playerArray.length;

			    	if (playerArray.length == 2) {
			    		gameData[playerArray[0]]["opponent"] = playerArray[1];
			    		gameData[playerArray[1]]["opponent"] = playerArray[0];

			    		currentPlayer = playerArray[currentPlayerNum];
			    	}

		    		socket.emit('my-auth', {
						"status": "ok",
						"message": "",
						"data": message,});
			    } else {
		    		socket.emit('my-auth', {
						"status": "ko",
						"message": "Trop de joueurs dans la partie.",
						"data": "WAIT_OTHER_GAME"});
			    }
			}
    	} else {
    		socket.emit('my-auth', {
				"status": "ko",
				"message": "Pseudo vide!!",
				"data": message,});
    	}
    });

	socket.on('defend', function (message) {
		if (message.length == maxPoints || isTest) {
console.log(message)
			message.forEach(function(element) {
				boatCoordinates = element.split("-");

				placeBoat(boatCoordinates[0], boatCoordinates[1]);
			});

			ParcourirGrille(socket.pseudo);

			socket.emit('my-defend', {
				"status": "ok",
				"message": "Importation réussie.",
				"data": message,});
		} else {
			socket.emit('my-defend', {
				"status": "ko",
				"message": "Pas assez de bateaux!!!",
				"data": message,});
		}
	});

	socket.on('launches', function (message) {
		var nbrTouches = 0;
		var dataReturn = new Object();
		var bonus = 0;

		if (socket.pseudo == currentPlayer) {
			if (message.length == maxLaunches || isTest) {
				message.forEach( function(element) {
					launchCoordinates = element.split("-");

					bonus = fireToCoord(launchCoordinates[0], launchCoordinates[1]);
					nbrTouches += bonus;
					dataReturn[element] = false;

					if (bonus != 0) {
						dataReturn[element] = true;
					}
				});

				gameData[socket.pseudo]["points"] += nbrTouches;

				nextPlayer();

				socket.broadcast.emit('launches', {
					"status": "ok",
					"message": "Vous avez été touché " + nbrTouches + " fois.",
					"data": dataReturn,
					"currentPlayer": currentPlayer,});
				socket.emit('my-launches', {
					"status": "ok",
					"message": "Vous avez fait " + nbrTouches + " touches.",
					"data": dataReturn,
					"currentPlayer": currentPlayer,});
				SendScores();
			} else {
				socket.emit('my-launches', {
					"status": "ko",
					"message": "Vous ne pouvez tirer que " + maxLaunches + " fois.",
					"data": dataReturn,});
			}
		} else {
			socket.emit('my-launches', {
				"status": "ko",
				"message": "Ce n'est pas encore votre tour!!",
				"data": dataReturn,});
		}
	});

	function SendScores() {
		var returnedData = {"scores": {}, "winner": "",};
		var currentPoints;

		for (var key in gameData) {
			currentPoints = gameData[key]["points"];
			returnedData["scores"][key] = currentPoints;

			if (currentPoints == maxPoints) {
				returnedData["winner"] = socket.pseudo;
			}
		}

		socket.broadcast.emit('scores', returnedData);
		socket.emit('scores', returnedData);
	}

	function placeBoat(x, y) {
		gameData[socket.pseudo]["boats"][x - 1][y - 1] = 1;
	}

	function fireToCoord(x, y) {
		yourData = gameData[socket.pseudo]
		yourData["launches"][x - 1][y - 1] = 1;
		var touche = 0;

		target = gameData[yourData["opponent"]]["boats"][x - 1][y - 1];
		if (target == 1) {
			touche = 1;
		}

		target = -1;

		return touche;
	}
});

function addData() {
	var myData = {
		"launches": [],
		"boats": [],
		"points": 0,
		"num": 0,
		"opponent": "",
	}

	for (var i=1; i<=maxSize; i++ ) {
		myData["launches"].push(Array(maxSize).fill(0));
		myData["boats"].push(Array(maxSize).fill(0));
	}

	return myData;
}

function nextPlayer() {
	currentPlayerNum = currentPlayerNum + 1;

	if (currentPlayerNum > 1) {
		currentPlayerNum = 0;
	}

	currentPlayer = playerArray[currentPlayerNum];
}

server.listen(8080);
