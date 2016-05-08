var Firebase = require("firebase");
var fbRef = new Firebase("<<YOUR_FIREBASE_URL>>");
var addedData = {};

function updateChampionData(masteryData, fbData, region) {
    var championData = fbData.champions;

    var totalPoints = 0;

    masteryData.forEach(function (champion, index, array){
       totalPoints += champion.championPoints;
    });

    masteryData.forEach(function (parent, index, array) {
        if (championData[parent.championId] === undefined) {
            championData[parent.championId] = {};
        }

        masteryData.forEach(function (child, index, array) {
            if (championData[parent.championId][child.championId] !== undefined) {
                championData[parent.championId][child.championId].noweightPts += child.championPoints;
                championData[parent.championId][child.championId].weightPts += Math.floor(child.championPoints * parent.championPoints / totalPoints);

                if (parent.championLevel > 4) {
                    championData[parent.championId][child.championId].noweightPtsLvl5 += child.championPoints;
                    championData[parent.championId][child.championId].weightPtsLvl5 += Math.floor(child.championPoints * parent.championPoints / totalPoints);
                }
            } else {
                championData[parent.championId][child.championId] = {
                    noweightPts: child.championPoints,
                    weightPts: Math.floor(child.championPoints * parent.championPoints / totalPoints),
                    noweightPtsLvl5: 0,
                    weightPtsLvl5: 0
                }
                if (parent.championLevel > 4) {
                    championData[parent.championId][child.championId].noweightPtsLvl5 = child.championPoints;
                    championData[parent.championId][child.championId].weightPtsLvl5 = Math.floor(child.championPoints * parent.championPoints / totalPoints);
                }
            }
        });
    });


    //fbRef.child("champions").set(championData));
}


function addSummonerToDb(masteryData, fbData, region) {
    var summonerData = fbData.summoners;
    var summonerId = masteryData[0].playerId;
    var newSummoner = {};

    masteryData.forEach(function(champion, index, array){
        newSummoner[champion.championId] = champion;
    });
}

module.exports.addData = updateChampionData;
module.exports.firebase = fbRef;