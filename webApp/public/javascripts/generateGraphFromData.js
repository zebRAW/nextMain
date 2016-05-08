var fbRef = new Firebase("<<yourFirebaseUrl>>");
var graphData = {
    nodes : new vis.DataSet(),
    edges : new vis.DataSet()
};
var fbData;
var staticChampionData;
var network;
var settings;
var container;
var summonerView = false;
var summonerData = {};

var $loadingDiv = $("#loadingDiv");
var $loadingText = $("#loadText");
var $progressBar = $("#progressBar");
var $progressDiv = $("#progress");
var $searchButton = $("#searchButton");
var $searchField = $("#searchField");
var progress = 0;

$(".search").hide();
$("#seedLabel").hide();
$("#nextLabel").hide();
$("#maxNextChampions").hide();
$("#maxSeedChampions").hide();
$loadingText.text("Loading data...");

$("#infoButton").on("click", function(){
    $("#settingsDiv").hide();
    $("#infoDiv").toggle();
});

$("#settingsButton").on("click", function(){
    $("#infoDiv").hide();
    $("#settingsDiv").toggle();
});

$("#generateNewGraph").on("click", function(){
    progress = 0;
    if (summonerView) {
        generateSummonerGraph(
            summonerData,
            $("#weighted").is(":checked"),
            $("#lvl5").is(":checked"),
            parseInt($("#maxEdges").val()),
            parseInt($("#maxSeedChampions").val()),
            parseInt($("#maxNextChampions").val())
        );
    } else {
        $loadingDiv.show();
        generateGraph($("#weighted").is(":checked"), $("#lvl5").is(":checked"), parseInt($("#maxEdges").val()));
    }
});

getStaticData();

//gets static champion data from datadragon for images and champion names
function getStaticData(){
    var staticChampionDataRequest = new XMLHttpRequest();
    staticChampionDataRequest.open("GET", "http://ddragon.leagueoflegends.com/cdn/6.9.1/data/en_US/champion.json", true);
    $.getJSON("http://ddragon.leagueoflegends.com/cdn/6.9.1/data/en_US/champion.json", function(data){
        staticChampionData = data.data;
    });
}

//gets firebase champion data
fbRef.child("champions").once("value", function(data){
    $(".search").fadeIn();
    $("#infoButton").fadeIn();
    $("#settingsButton").fadeIn();
    $loadingText.text("Generating graph...");
    $progressBar.width(70);
    fbData = data.val();
    generateGraph($("#weighted").is(":checked"), $("#lvl5").is(":checked"), parseInt($("#maxEdges").val()));
});

//generate graph from champion data with or without weights
function generateGraph(weighted, lvl5, maxEdges){
    graphData.nodes = new vis.DataSet();
    graphData.edges = new vis.DataSet();

    //make nodes and edges for every champion and highest played other champions
    for (var championId in fbData){
        generateChampionNode(championId, lvl5);
        generateChampionEdges(championId, weighted, lvl5, maxEdges);
    }

    //initialize graph
    makeGraph();
}

//generateChampionNodes
function generateChampionNode(championId, lvl5){
    var champion = fbData[championId];
    var add = "";

    if (lvl5){
        add = "Lvl5";
    }
    //baseUrl for champion images
    var imgUrl = "http://ddragon.leagueoflegends.com/cdn/6.9.1/img/champion/";
    //champion total points
    var value = champion[championId][("weightPts"+add)];

    var championName = "";

    //find ChampionName and imgUrl
    for (var thisChampion in staticChampionData){
        if (staticChampionData[thisChampion].key === championId){
            imgUrl += staticChampionData[thisChampion].image.full;
            championName = thisChampion;
        }
    }

    //add node to graphData
    graphData.nodes.add({
        id : championId,
        title : championName,
        image : imgUrl,
        borderWidth : 3,
        color :
        {
            border : "#000000",
            background: "#000000",
            highlight : {
                border : "#000000",
                background: "#000000"
            }
        },
        value : value
    });
}


function generateChampionEdges(championId, weighted, lvl5, maxEdges){
    //championData
    var champion = fbData[championId];
    //for the possibility of calculating %
    var totalPoints = 0;
    //to sort Champions by points
    var sortArray = [];

    var add = "";

    if (lvl5){
        add = "Lvl5";
    }


    //calculate weighted points and add to array
    for (var relatedChampion in champion){
        var weight = 1;
        if (weighted){
            weight = fbData[relatedChampion][relatedChampion][("noweightPts"+add)];
            if (lvl5){
                weight = Math.sqrt(weight);
            }
        }
        if (relatedChampion !== championId) {
            totalPoints += champion[relatedChampion];
            sortArray.push([relatedChampion, champion[relatedChampion][("weightPts"+add)]/weight]);
        }
    }
    //sort champions by points
    sortArray.sort(function(a,b){return b[1]-a[1]});

    //add edges to graphdata
    for (var i = 0; i < maxEdges; i++) {
            graphData.edges.add({
                from: championId,
                to: sortArray[i][0],
                color: {
                    color: "#ffffff",
                    opacity: 0.1
                },
                width: 2
            });
    }
}

function makeGraph(){
    //container
    container = document.getElementById('graph');
    //settings for graph
    settings = {
        physics : {
            enabled: true,
            maxVelocity : 50,
            minVelocity : 3,
            stabilization : {
                enabled : true,
                iterations : 900,
                updateInterval : 5
            }
        },
        layout : {
            improvedLayout : false,
        },
        nodes : {
            shape : "circularImage",
            scaling :
            {
                min : 15,
                max : 40
            }
        },
        edges : {
            smooth : {
                type : "dynamic"
            }
        },
        interaction : {
            selectConnectedEdges : false
        }
    };

    //realize graph
    network = new vis.Network(container, graphData, settings);
    $loadingText.text("Beautifying graph...");

    //add click interaction
    network.on("click", highlightConnected);
    //hide progresswindow
    network.on("afterDrawing", function(){
        $loadingText.text("Done! :)");
        setTimeout(function(){
            $loadingDiv.hide();
        }, 200);
    });

    //animate progressBar
    network.on("stabilizationProgress", function(){
        $progressDiv.show();
        if (progress < 900) {
            progress += 5;
        }
        $progressBar.width(Math.floor(progress / 900 * 90));
    });

    network.on("stabilizationIterationsDone", function(){
        network.stopSimulation();
        network.storePositions();
        settings.physics.enabled = false;
        settings.edges.smooth.type = "straightCross";
        network.setOptions(settings);
        $loadingText.text("Done! :)");
        setTimeout(function(){
            $loadingDiv.hide();
        }, 200);
        progress = 0;
    })
}

function highlightConnected(params){
    network.storePositions();
    var scale = network.getScale();
    var position = network.getViewPosition();
    var allNodes = graphData.nodes.get({returnType : "Object"});
    var allEdges = graphData.edges.get({returnType : "Object"});

    //reset nodes
    for (var node in allNodes) {
        allNodes[node].color.border = "#000000";
        allNodes[node].color.background = "#000000";
        allNodes[node].color.highlight.border = "#000000";
        allNodes[node].color.highlight.background = "#000000";
        allNodes[node].borderWidth = 2;
    }

    //reset edges
    for (var edge in allEdges) {
        allEdges[edge].color.color = "#ffffff";
        allEdges[edge].color.opacity = 0.1;
        allEdges[edge].value = 0;

    }

    if (params.nodes.length>0){
        var selectedNode = params.nodes[0];
        var viewNodes = [];

        //highlight nodes and edges
        for (var key in allEdges) {
            if (allEdges[key].from === selectedNode) {
                for (var edge in allEdges){
                    //2nd order
                    if(allEdges[edge].from === allEdges[key].to){
                        //2nd order edges
                        if (allEdges[edge].color.color !== "#1abc9c") {
                            allEdges[edge].color.color = "#3498db";
                            allEdges[edge].color.opacity = 1;
                        }

                        //2nd order nodes
                        if (allNodes[allEdges[edge].to].color.border !== "#1abc9c") {
                            allNodes[allEdges[edge].to].color.border = "#3498db";
                            allNodes[allEdges[edge].to].color.background = "#3498db";
                            allNodes[allEdges[edge].to].color.highlight.border = "#3498db";
                            allNodes[allEdges[edge].to].color.highlight.background = "#3498db";
                            allNodes[allEdges[edge].to].borderWidth = 5;
                            viewNodes.push(allEdges[edge].to);
                        }
                    }
                }

                //1st order edges
                allEdges[key].color.color = "#1abc9c";
                allEdges[key].color.opacity = 1;

                //1st order nodes
                allNodes[allEdges[key].to].color.border = "#1abc9c";
                allNodes[allEdges[key].to].color.background = "#1abc9c";
                allNodes[allEdges[key].to].color.highlight.border = "#1abc9c";
                allNodes[allEdges[key].to].color.highlight.background = "#1abc9c";
                allNodes[allEdges[key].to].borderWidth = 5;
                viewNodes.push(allEdges[key].to);
            }
        }

        allNodes[selectedNode].color.border = "#e74c3c";
        allNodes[selectedNode].color.highlight.border = "#e74c3c";
        allNodes[selectedNode].color.background = "#e74c3c";
        allNodes[selectedNode].color.highlight.background = "#e74c3c";
        allNodes[selectedNode].borderWidth = 6;

        var nodeArray = [];
        for (i = 0; i < allNodes.length; i++){
            nodeArray.push(allNodes[i]);
        }
        var edgeArray = [];
        for (i = 0; i < allEdges.length; i++){
            edgeArray.push(allEdges[i]);
        }

        graphData.edges.update(edgeArray);
        graphData.nodes.update(nodeArray);

        network.setData(graphData);
        network.moveTo({position : position, scale : scale});
        network.fit({nodes : viewNodes, animation : {duration : 1000, easingFunction : "easeInOutQuint"}});

    }else{
        network.setData(graphData);
        network.moveTo({position : position, scale : scale});
    }

}

function generateSummonerGraph(summonerData, weighted, lvl5, maxEdges, maxSeedChamps, maxNextChampions){
    $("#seedLabel").show();
    $("#nextLabel").show();
    $("#maxNextChampions").show();
    $("#maxSeedChampions").show();
    $("#infoDiv").html('This graph shows you which champions you might enjoy based on mastery data of millions of summoners. Your favorite <font color="#e74c3c">champions</font> are the basis of this calculation. The bigger a champion icon, the more likely you will enjoy the champions playstyle.');
    $loadingDiv.show();

    summonerView = true;

    graphData.nodes = new vis.DataSet();
    graphData.edges = new vis.DataSet();

    var totalSummonerPoints = 0;
    var summonerPts = {};
    var nextChampPts = {};
    var sortArray = [];
    var add = "";

    if (summonerData.length < maxSeedChamps) {
        maxSeedChamps = summonerData.length;
    }

    if (lvl5) {
        add = "Lvl5";
    }
    //get total summonerpoints
    for (var i = 0; i < summonerData.length; i++){
        totalSummonerPoints += summonerData[i].championPoints;
    }

    //put summonerchampion points in array
    for (i = 0; i < summonerData.length; i++){
        summonerPts[summonerData[i].championId] = summonerData[i].championPoints;
    }


    summonerData = summonerData.slice(0, maxSeedChamps);
    //calculate scores for next champs best on summoners (maxSeedChamps) mostplayed champions
    for (i=0; i < summonerData.length; i++){
        var summonerChampion = summonerData[i].championId;


        //calculate nextChamps
        for (var nextChampion in fbData[summonerChampion]) {
            if (nextChampPts[nextChampion] === undefined) {
                nextChampPts[nextChampion] = fbData[summonerChampion][nextChampion][("weightPts"+add)] * summonerPts[summonerChampion] / totalSummonerPoints / fbData[nextChampion][nextChampion][("noweightPts"+add)];
            }else{
                nextChampPts[nextChampion] += fbData[summonerChampion][nextChampion][("weightPts"+add)] * summonerPts[summonerChampion] / totalSummonerPoints / fbData[nextChampion][nextChampion][("noweightPts"+add)];
            }
        }
    }

    //sort nextChamps
    for (var champion in nextChampPts){
        sortArray.push([champion, nextChampPts[champion]]);
    }
    sortArray.sort(function(a,b){return b[1]-a[1]});

    //add Seed Champion Nodes
    for (i=0; i < maxSeedChamps; i++){
        generateSummonerSeedNode(summonerData[i], summonerData[i].championPoints/summonerData[0].championPoints * sortArray[0][1]);
    }

    //add nextChamps nodes
    for (var i = 0; i < maxNextChampions*2; i++){
        generateSummonerNextChampionNode(sortArray[i]);
    }

    //generate Edges
    for (i=0; i < summonerData.length; i++) {
        generateSummonerEdges(summonerData[i].championId, summonerData, weighted, lvl5, maxEdges);
    }

    settings.physics.enabled = true;
    settings.physics.minVelocity = 1;
    settings.edges.smooth.type = "dynamic";

    network = new vis.Network(container, graphData, settings);
    //add click interaction
    network.on("click", function(params){highlightConnectedSummoner(params, summonerData);});


    //animate progressBar
    network.on("stabilizationProgress", function(){
        $loadingDiv.show();
        $loadingText.text("Beautifying graph...");
        $progressDiv.show();
        if (progress < 900) {
            progress += 5;
        }
        $progressBar.width(Math.floor(progress / 900 * 90));
    });

    network.on("stabilizationIterationsDone", function(){
        network.stopSimulation();
        network.storePositions();
        settings.physics.enabled = false;
        settings.edges.smooth.type = "straightCross";
        network.setOptions(settings);
        $loadingText.text("Done! :)");
        setTimeout(function(){
            $loadingDiv.hide();
        }, 200);
        progress = 0;
    });
}

function generateSummonerSeedNode(champion, value){
    //baseUrl for champion images
    var imgUrl = "http://ddragon.leagueoflegends.com/cdn/6.9.1/img/champion/";

    var championName = "";

    //find ChampionName and imgUrl
    for (var thisChampion in staticChampionData){
        if (parseInt(staticChampionData[thisChampion].key) === champion.championId){
            imgUrl += staticChampionData[thisChampion].image.full;
            championName = thisChampion;
        }
    }

    //add node to graphData
    graphData.nodes.add({
        id : champion.championId,
        title : championName,
        image : imgUrl,
        borderWidth : 3,
        color :
        {
            border : "#e74c3c",
            background: "#e74c3c",
            highlight : {
                border : "#e74c3c",
                background: "#e74c3c"
            }
        }
        //value : value
    });
}

function generateSummonerNextChampionNode(champion){

    if (graphData.nodes.get(champion[0]) === null) {
        //baseUrl for champion images
        var imgUrl = "http://ddragon.leagueoflegends.com/cdn/6.9.1/img/champion/";
        //champion total points
        var value = champion[1];

        var championName = "";

        //find ChampionName and imgUrl
        for (var thisChampion in staticChampionData) {
            if (staticChampionData[thisChampion].key === champion[0]) {
                imgUrl += staticChampionData[thisChampion].image.full;
                championName = thisChampion;
            }
        }

        //add node to graphData
        graphData.nodes.add({
            id: champion[0],
            title: championName,
            image: imgUrl,
            borderWidth: 3,
            color: {
                border: "#000000",
                background: "#000000",
                highlight: {
                    border: "#000000",
                    background: "#000000"
                }
            },
            value: value
        });
    }
}

function generateSummonerEdges(championId, summonerData, weighted, lvl5, maxEdges){
    //championData
    var champion = fbData[championId];
    //for the possibility of calculating %
    var totalPoints = 0;
    //to sort Champions by points
    var sortArray = [];

    var add = "";

    if (lvl5) {
        add = "Lvl5";
    }

    var summonerChampionArray = [];
    for (var summonerChampion in summonerData) {
        summonerChampionArray.push(summonerData[summonerChampion].championId);
    }

    //calculate weighted points and add to array
    for (var relatedChampion in champion){
        var weight = 1;
        if (weighted){
            weight = fbData[relatedChampion][relatedChampion][("noweightPts")];
            if (lvl5) {
                weight = Math.sqrt(weight);
            }
        }
        if (relatedChampion !== championId) {
            totalPoints += champion[relatedChampion];
            sortArray.push([relatedChampion, champion[relatedChampion][("weightPts"+add)]/weight]);
        }
    }
    //sort champions by points
    sortArray.sort(function(a,b){return b[1]-a[1]});

    //change edges if weighted (too much vaynes in non weighted)
    if (weighted) {
        maxEdges = 3;
    }

    //add edges to graphdata
    for (var i = 0; i < sortArray.length; i++) {
        if (
            maxEdges > 0
            && graphData.nodes.get(sortArray[i][0]) !== null
            && summonerChampionArray.indexOf(parseInt(sortArray[i][0])) === -1
        ) {
            maxEdges -= 1;
            graphData.edges.add({
                from: championId,
                to: sortArray[i][0],
                color: {
                    color: "#ffffff",
                    opacity: 0.1
                },
                width: 2
            });
        }
    }
}

function highlightConnectedSummoner(params, summonerData){
    network.storePositions();
    var scale = network.getScale();
    var position = network.getViewPosition();
    var allNodes = graphData.nodes.get({returnType : "Object"});
    var allEdges = graphData.edges.get({returnType : "Object"});

    //reset nodes
    for (var node in allNodes) {
        allNodes[node].color.border = "#000000";
        allNodes[node].color.background = "#000000";
        allNodes[node].color.highlight.border = "#000000";
        allNodes[node].color.highlight.background = "#000000";
        allNodes[node].borderWidth = 2;
    }

    for (var i = 0; i < summonerData.length; i++){
        allNodes[summonerData[i].championId].color.border = "#e74c3c";
        allNodes[summonerData[i].championId].color.background = "#e74c3c";
        allNodes[summonerData[i].championId].color.highlight.border = "#e74c3c";
        allNodes[summonerData[i].championId].color.highlight.background = "#e74c3c";
        allNodes[summonerData[i].championId].borderWidth = 2;
    }

    //reset edges
    for (var edge in allEdges) {
        allEdges[edge].color.color = "#ffffff";
        allEdges[edge].color.opacity = 0.1;
        allEdges[edge].value = 0;

    }

    if (params.nodes.length>0){
        var selectedNode = params.nodes[0];
        var viewNodes = [];

        //highlight nodes and edges
        for (var key in allEdges) {
            if (allEdges[key].from === selectedNode) {

                //1st order edges
                allEdges[key].color.color = "#1abc9c";
                allEdges[key].color.opacity = 1;

                //1st order nodes
                allNodes[allEdges[key].to].color.border = "#1abc9c";
                allNodes[allEdges[key].to].color.background = "#1abc9c";
                allNodes[allEdges[key].to].color.highlight.border = "#1abc9c";
                allNodes[allEdges[key].to].color.highlight.background = "#1abc9c";
                allNodes[allEdges[key].to].borderWidth = 5;
                viewNodes.push(allEdges[key].to);
            }
        }

        allNodes[selectedNode].color.border = "#e74c3c";
        allNodes[selectedNode].color.highlight.border = "#e74c3c";
        allNodes[selectedNode].color.background = "#e74c3c";
        allNodes[selectedNode].color.highlight.background = "#e74c3c";
        allNodes[selectedNode].borderWidth = 6;

        var nodeArray = [];
        for (i = 0; i < allNodes.length; i++){
            nodeArray.push(allNodes[i]);
        }
        var edgeArray = [];
        for (i = 0; i < allEdges.length; i++){
            edgeArray.push(allEdges[i]);
        }

        graphData.edges.update(edgeArray);
        graphData.nodes.update(nodeArray);

        network.setData(graphData);
        network.moveTo({position : position, scale : scale});
        network.fit({nodes : viewNodes, animation : {duration : 1000, easingFunction : "easeInOutQuint"}});

    }else{
        network.setData(graphData);
        network.moveTo({position : position, scale : scale});
    }

}

function errorMessage(message){
    var $errorMessage = $("<div id='errorMessage'>"+ message +"</div>");
    $("body").prepend($errorMessage);
    $errorMessage.hide().fadeIn();
    setTimeout(function(){
        $errorMessage.fadeOut(400, $errorMessage.remove());
    }, 3000);
}

$searchButton.on("click", function(e){
    e.preventDefault();
    $.getJSON("../summoner/" + $("select").val() + "/" + $("input").val(), function(data){
        if (data.length > 0) {
            console.log(data);
            summonerData = data;
            generateSummonerGraph(
                summonerData,
                $("#weighted").is(":checked"),
                $("#lvl5").is(":checked"),
                parseInt($("#maxEdges").val()),
                parseInt($("#maxSeedChampions").val()),
                parseInt($("#maxNextChampions").val())
            );
        }else{
            errorMessage("Summoner has no mastery points...")
        }
    }).error(function(){
        errorMessage("Summoner not found :(");
    });
});

$searchField.keypress(function(e){
    if (e.which == 13){
        $.getJSON("../summoner/" + $("select").val() + "/" + $("input").val(), function(data){
            generateSummonerGraph(data, fbData, true);
        }).error(function(){
            errorMessage("Summoner not found :(");
        });
    }
});

$('input[type=checkbox]').unbind('click.checks').bind('click.checks', function(e){
    $(this).val($(this).is(':checked'));
});