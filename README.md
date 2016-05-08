# nextMain

NextMain gives you the possibility to find out which champions you will like based on your favorite champions. It utilizes mastery data of millions of summoners as well as your own personal mastery data to determine, which champions are just right for YOU! 
It also shows you what champions are popular with which kind of champion-lovers. Did you know that people who like to play Vayne like to play Riven (that explains a lot doesn't it?). And Teemo players are not all evil! They just like to play mechanically easier champions like Sona, Warwick and Heimerdinger (ok, maybe they ARE evil).
And all of this is visualized as a beautiful, interactable network graph!
Try it for yourself at http://nextmain.herokuapp.com/

It consists of 2 parts:
1. A server that serves a webpage to the user. The "Next Main"-webpage provides the functionality highlighted above!
2. A server that analyzes mastery data of summoners on all regional servers in order to find out how champion preferences influence each other. In order to build a good data set, a lot of summoner data has to be analyzed before the service can be used. This data is stored in a firebase db. 

# Difficulties
A lot of work was put into optimization of the data analyzation server in order to minimize traffic to the database and load on the server while maximizing the number of summoners analyzed (all of this on a free platform! - heroku).
Since we didn't want to give you just another boring site with numbers and stats we decided to visualize everything as a beautiful intuitively understandable network graph, which is created using vis.js
Putting most of the calculation and rendering load on the client, allows us to run this App on a free server.

#Setup
Analyzing-Server:
Simply put your API-Key into the apiKey.js File (its marked) and put in your firebase URL in the firebase.js file (thats also marked!) and deploy to heroku. DONE!

webApp:
Simply put your API-Key into the /api-request/apiKey.js File (its marked) and put in your firebase URL in the generateGraphFromData.js file (you guessed it - its marked) and deploy to heroku. DONE!
