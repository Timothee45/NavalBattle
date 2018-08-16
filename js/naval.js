var size = 10;
var defendCases;
var launchCases;
var pseudo = "";
var gameHost = "192.168.192.148";

var socket = io.connect('http://' + gameHost + ':8080');
var colors = ["red", "black", "green", "blue", "yellow", "orange", "teal", "white", "seagreen", "pink"];

AskAuth("");

$("#launch_table").append(InitTables());
$("#defense_table").append(InitTables());           
SwapLauncher();

$("body").delegate(".btn_game", "click", function() {
    $(this).toggleClass("btn_selected");
});

socket.on('my-auth', function(message) {
    if (message["status"] == "ko") {
        DisplayError(message["message"]);
        if (message["data"] != "WAIT_OTHER_GAME") {
            AskAuth(message["message"]);
        } else {
            DestroyGame();
        }
    } else {
        $("#pseudo_title").text("Bonjour " + pseudo);
        document.title = "Amiral " + pseudo;
        ClearMessage();
    }
});

function AskAuth(message) {
    pseudo = prompt("What is your pseudo?" + "\n" + message);
    socket.emit('auth', pseudo);
}

$("#defend").click(function() {
    ClearMessage();
    defendCases = [];
    var count = 0;

    $("#defense_table").find(".btn_selected").each(function() {
        element = $(this);
        defendCases.push(element.data("row") + "-" + element.data("col"));
    });

    if (true || defendCases.length == maxPoints) {
        socket.emit('defend', defendCases);
    } else {
        DisplayError("Pas assez de bateaux");
    }
});

socket.on('my-defend', function(message) {
    if (message["status"] == "ko") {
        DisplayError(message["message"]);
    } else {
        DisplayMessage(message["message"]);

        $("#defense_table").find(".btn_game").each(function() {
            $(this).remove();
        });

        message["data"].forEach( function(element) {
            $("#defense_table").find('.' + element).addClass("case-defend");
        });

        $("#defend").remove();
        SwapLauncher();
    }
});

$("#launch").click(function() {
    ClearMessage();
    launchCases = [];

    $(".btn_selected").each(function() {
        element = $(this);
        launchCases.push(element.data("row") + "-" + element.data("col"));
    })

    socket.emit('launches', launchCases);
});

socket.on('launches', function(message) {
    for (var key in message["data"]["shots"]) {
        displayLaunch($("#defense_table"), key, message["data"]["shots"][key]);
    }

    DisplayMessage("Tour de " + message["data"]["currentPlayer"] + " !!!");
});

socket.on('my-launches', function(message) {
console.log(message)

    if (message["status"] == "ko") {
        DisplayError(message["message"]);
    } else {
        DisplayMessage(message["message"]);

        for (var key in message["data"]["shots"]) {
            displayLaunch($("#launch_table"), key, message["data"]["shots"][key]);
        }
    }
});

function displayLaunch(perimeter, coords, isTouched) {
    perimeter.find("." + coords).each(function() {
        $(this).text("X");
        if (isTouched) {
            $(this).addClass("is-touched");
        }

        if (perimeter.attr('id') == "launch_table") {
            $(this).addClass("case-fired");
        }
    });
}

socket.on('scores', function(message) {
    var scoresPlayer = "<tbody>";

    for (key in message["scores"]) {
        scoresPlayer += "<tr><td class='table-score-cell score-pseudo'>" + key + "</td><td class='table-score-cell score-score'>" + message["scores"][key] + "</td></tr>";
    }

    $("#scores-game").html(scoresPlayer + "</tbody>");

    if (message["winner"] != "") {
        ClearMessage();

        $("#message_game").text(message["winner"] + " a gagné la partie!!!").addClass("message_end");

        $("#launch").remove();

        EndGame();
    }
});

function InitTables() {
    var result = "<tbody><tr class='table-row'>" + FillHeader() + "</tr>";

    for (i=1; i<=size; i++) {
        result += "<tr class='table-row'>" + FillLine(i) + "</tr>";
    }

    return result + "</tbody>";
}

function FillHeader() {
    var line = ""
    for (j=0; j<=size; j++) {
        line += "<th class='table-cell'>" + (j!= 0 ? String.fromCharCode(j + 64): "") + "</th>";
    }
    return line;
}

function FillLine(row) {
    var line = "<th class='table-cell'>" + (row != 0 ? row : "") + "</th>";
    for (j=1; j<=size; j++) {
        line += "<td class='table-cell " + row + "-" + j + "'>" + "<input type='button' value='*' class='btn_game' data-row='" + row + "' data-col='" + j + "'/>" + "</td>";
    }
    return line;
}

function DisplayError(error) {
    $("#message_game").text(error).addClass("message_alert");
}

function DisplayMessage(error) {
    $("#message_game").text(error).addClass("message_good");
}

function ClearMessage() {
    $("#message_game").text("")
        .removeClass("message_alert")
        .removeClass("message_good");
}

function SwapLauncher() {
    $("#launch_table").find('.btn_game').each(function() {
        $(this).toggleClass("hidden");
    });

    $("#launch").toggleClass("hidden");
}

function DestroyGame() {
    $("table").each(function() {
        $(this).remove();
    })

    $("#defend").remove();
}

function EndGame() {
    setInterval(function() {
        $("#message_game").css('color', colors[getRandomInt(colors.length)]);
    }, 350);
}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}
