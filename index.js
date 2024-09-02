const fs = require("fs");
const path = require("path");

const groups = JSON.parse(fs.readFileSync(path.join(__dirname, "groups.json")));

// const exhibitions = JSON.parse(
//   fs.readFileSync(path.join(__dirname, "exibitions.json"))
// );

// // A function to generate a random score depending on the rankin
const generateGameResult = (team1, team2) => {
  const rankDifference = Math.abs(team1.FIBARanking - team2.FIBARanking);

  let baseScore1 = 80 + Math.floor(Math.random() * 30);
  let baseScore2 = 80 + Math.floor(Math.random() * 30);

  if (team1.FIBARanking < team2.FIBARanking) {
    baseScore1 += Math.floor(rankDifference / 2);
  } else {
    baseScore2 += Math.floor(rankDifference / 2);
  }

  return { score1: baseScore1, score2: baseScore2 };
};

// Group phase simulation

const simulateGroupStage = (groups) => {
  const groupResults = {};

  console.log("Grupna faza - I kolo:");

  for (const [groupName, teams] of Object.entries(groups)) {
    console.log(`Grupa:  ${groupName}:`);

    groupResults[groupName] = {
      teams: teams.map((team) => ({
        ...team,
        points: 0,
        scored: 0,
        conceded: 0,
        wins: 0,
        losses: 0,
        games: [],
      })),
    };

    // Generate all possible pairs

    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const team1 = teams[i];
        const team2 = teams[j];

        const result = generateGameResult(team1, team2);

        // Update scores for both teams

        const team1Result = groupResults[groupName].teams.find(
          (t) => t.ISOCode === team1.ISOCode
        );

        const team2Result = groupResults[groupName].teams.find(
          (t) => t.ISOCode === team2.ISOCode
        );

        team1Result.scored += result.score1;
        team1Result.conceded += result.score2;
        team2Result.scored += result.score2;
        team2Result.conceded += result.score1;

        if (result.score1 > result.score2) {
          team1Result.points += 2;
          team1Result.wins += 1;
          team2Result.points += 1;
          team2Result.losses += 1;
        } else {
          team1Result.points += 1;
          team1Result.losses += 1;
          team2Result.points += 2;
          team2Result.wins += 1;
        }

        // Add the match result

        team1Result.games.push({
          opponent: team2.Team,
          score: result.score1,
          opponentScore: result.score2,
        });

        team2Result.games.push({
          opponent: team1.Team,
          score: result.score2,
          opponentScore: result.score1,
        });

        console.log(
          `    ${team1.Team} - ${team2.Team} (${result.score1}:${result.score2})`
        );
      }
    }

    // Sorting teams by points, point difference, and number of points scored

    groupResults[groupName].teams.sort(
      (a, b) =>
        b.points - a.points ||
        b.scored - b.conceded - (a.scored - a.conceded) ||
        b.scored - a.scored
    );

    // Print the final ranking in groups

    console.log(
      `\nKonačan plasman u grupi ${groupName} (Ime - pobede/porazi/bodovi/postignuti koševi/primljeni koševi/koš razlike) :`
    );

    groupResults[groupName].teams.forEach((team, index) => {
      const goalDifference = team.scored - team.conceded;
      console.log(
        `  ${index + 1}. ${team.Team} ${team.wins} / ${team.losses} / ${
          team.points
        } / ${team.scored} / ${team.conceded} / ${
          goalDifference > 0 ? "+" : ""
        }${goalDifference}`
      );
    });
  }

  return groupResults;
};

// Simulation of the draw and the elimination phase

const simulateEliminationStage = (groupResults) => {
  // Collecting teams by ranking
  const rankedTeams = [];

  for (const groupName in groupResults) {
    rankedTeams.push(...groupResults[groupName].teams);
  }

  rankedTeams.sort(
    (a, b) =>
      b.points - a.points ||
      b.scored - b.conceded - (a.scored - a.conceded) ||
      b.scored - a.scored
  );

  const pots = {
    D: rankedTeams.slice(0, 2),
    E: rankedTeams.slice(2, 4),
    F: rankedTeams.slice(4, 6),
    G: rankedTeams.slice(6, 8),
  };

  console.log("\nŠeširi:");
  for (const [potName, teams] of Object.entries(pots)) {
    console.log(`  Šešir ${potName}`);
    teams.forEach((team) => console.log(`    ${team.Team}`));
  }

  // Creating pairs for the quarterfinals

  const quarterfinalPairs = [
    [pots.D[0], pots.G[1]],
    [pots.D[1], pots.G[0]],
    [pots.E[0], pots.F[1]],
    [pots.E[1], pots.F[0]],
  ];

  console.log("\nEliminaciona faza - Četvrtfinale:");

  const semifinalTeams = [];

  quarterfinalPairs.forEach(([team1, team2]) => {
    const result = generateGameResult(team1, team2);
    console.log(
      `  ${team1.Team} - ${team2.Team}: (${result.score1} - ${result.score2})`
    );
    if (result.score1 > result.score2) {
      semifinalTeams.push(team1);
    } else {
      semifinalTeams.push(team2);
    }
  });

  // Creating pairs for the semi-finals

  const semifinalPairs = [
    [semifinalTeams[0], semifinalTeams[2]],
    [semifinalTeams[1], semifinalTeams[3]],
  ];

  console.log("\nEliminaciona faza - Polufinale:");

  const finalists = [];
  const thirdPlaceTeams = [];

  semifinalPairs.forEach(([team1, team2]) => {
    const result = generateGameResult(team1, team2);
    console.log(
      `  ${team1.Team} - ${team2.Team}: (${result.score1} - ${result.score2})`
    );
    if (result.score1 > result.score2) {
      finalists.push(team1);
      thirdPlaceTeams.push(team2);
    } else {
      finalists.push(team2);
      thirdPlaceTeams.push(team1);
    }
  });

  // Match for third place

  console.log("\nUtakmica za treće mesto:");

  const thirdPlaceResult = generateGameResult(
    thirdPlaceTeams[0],
    thirdPlaceTeams[1]
  );
  console.log(
    `  ${thirdPlaceTeams[0].Team} - ${thirdPlaceTeams[1].Team}: (${thirdPlaceResult.score1} - ${thirdPlaceResult.score2})`
  );

  let thirdPlace;

  if (thirdPlaceResult.score1 > thirdPlaceResult.score2) {
    thirdPlace = thirdPlaceTeams[0];
  } else {
    thirdPlace = thirdPlaceTeams[1];
  }

  //Finale

  console.log("\nFinale:");

  const finalResult = generateGameResult(finalists[0], finalists[1]);

  //Printing final matches

  console.log(
    `  ${finalists[0].Team} - ${finalists[1].Team}:( ${finalResult.score1} - ${finalResult.score2})`
  );

  let firstPlace, secondPlace;

  if (finalResult.score1 > finalResult.score2) {
    firstPlace = finalists[0];
    secondPlace = finalists[1];
  } else {
    firstPlace = finalists[1];
    secondPlace = finalists[0];
  }

  console.log("\nMedalje:");
  console.log(`  1. ${firstPlace.Team}`);
  console.log(`  2. ${secondPlace.Team}`);
  console.log(`  3. ${thirdPlace.Team}`);
};

const simulateTournament = () => {
  const groupResults = simulateGroupStage(groups);
  simulateEliminationStage(groupResults);
};

// Starting the simulation
simulateTournament();

// simulateGroupStage(groups);
