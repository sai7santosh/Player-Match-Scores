const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;
app.use(express.json());

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running on http://localhost/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

convertDbObjectToResponseObject = (DbObject) => {
  return {
    playerId: DbObject.player_id,
    playerName: DbObject.player_name,
  };
};

//Get players
app.get("/players/", async (request, response) => {
  const getPlayerDetailsQuery = `
    SELECT * FROM
    player_details
    ORDER BY 
    player_id;`;
  const playersDetails = await db.all(getPlayerDetailsQuery);
  response.send(
    playersDetails.map((eachPlayerObject) =>
      convertDbObjectToResponseObject(eachPlayerObject)
    )
  );
});

//Get a Specific Player
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT * FROM
    player_details
    WHERE
    player_id = ${playerId};`;
  const playerDetails = await db.get(getPlayerQuery);
  response.send(convertDbObjectToResponseObject(playerDetails));
});

//Update Player Detail
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;

  const updatePlayerDetailsQuery = `
    UPDATE
    player_details
    SET
    player_name = '${playerName}'
    WHERE
    player_id = ${playerId};`;
  await db.run(updatePlayerDetailsQuery);
  response.send("Player Details Updated");
});

const convertMatchDetailsResponseToObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

//Get Specific Match
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetailsQuery = `
    SELECT * FROM
    match_details
    WHERE
    match_id = ${matchId};`;
  const matchDetailsResponse = await db.get(getMatchDetailsQuery);
  response.send(convertMatchDetailsResponseToObject(matchDetailsResponse));
});

//Get All Matches Of a Player
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatches = `
    SELECT * FROM 
    player_match_score NATURAL JOIN match_details
    WHERE 
    player_id = ${playerId};`;
  const playerMatchesResponse = await db.all(getPlayerMatches);
  response.send(
    playerMatchesResponse.map((eachMatch) =>
      convertMatchDetailsResponseToObject(eachMatch)
    )
  );
});

//All Players Of A Specific Match
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayersOfAMatchQuery = `
    SELECT 
    player_details.player_id AS playerId,
    player_details.player_name AS playerName
    FROM
    player_match_score NATURAL JOIN player_details
    WHERE
    match_id = ${matchId};`;
  const playerNamesResponse = await db.all(getPlayersOfAMatchQuery);
  response.send(playerNamesResponse);
});

//Get Stats Of a Player
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;

  const getPlayerStatsQuery = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};
    `;
  const playerStats = await db.get(getPlayerStatsQuery);
  response.send(playerStats);
});
module.exports = app;
