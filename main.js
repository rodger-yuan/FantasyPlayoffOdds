
function calculate() {
	var base_url = "https://games.espn.com/ffl/api/v2/leagueSettings?"
	var leagueId = document.getElementById("leagueId").value;
	var seasonId = document.getElementById("seasonId").value;

	var settings_url = base_url + "leagueId=" + leagueId + "&seasonId=" + seasonId;

	$.getJSON(settings_url,  // get league settings
	    function (data) {  // success callback
	    	var num_Teams = data.leaguesettings.leagueMembers.length;
	    	var playoff_teams = data.leaguesettings.playoffTeamCount;
	    	var finalRegularSeasonMatchupPeriodId = data.leaguesettings.finalRegularSeasonMatchupPeriodId
	    	var leagueMembers = data.leaguesettings.leagueMembers;
	    	var teams = data.leaguesettings.teams;

	    	for (var i = 0; i < teams[Object.keys(teams)[0]].scheduleItems.length; ++i) { // find out which week it is
	    		var item = teams[Object.keys(teams)[0]].scheduleItems[i];
	    		if (item.matchups[0].outcome == 0) {
	    			var currentMatchupPeriod = item.matchupPeriodId;
	    			break;
	    		}
	    		if (item.matchupPeriodId == finalRegularSeasonMatchupPeriodId) {
	    			var currentMatchupPeriod = finalRegularSeasonMatchupPeriodId;
	    		}
	    	};

			//Standings
			clearBox("standings_body");
			var standings = document.getElementById("standings_body");
			team_standings = get_standings(teams, num_Teams);
			team_standings.forEach(function(team) {
				var tr = document.createElement("tr");
				standings.appendChild(tr);
				var td = document.createElement("td"); //name
				td.innerHTML = team.firstName + " " + team.lastName;
				tr.appendChild(td);
				var td = document.createElement("td"); //wins
				td.innerHTML = team.wins;
				tr.appendChild(td);
				var td = document.createElement("td"); //losses
				td.innerHTML = team.losses;
				tr.appendChild(td);
				var td = document.createElement("td"); //ties
				td.innerHTML = team.ties;
				tr.appendChild(td);
				var td = document.createElement("td"); //PF
				td.innerHTML = team.pointsFor;
				tr.appendChild(td);
				var td = document.createElement("td"); //PA
				td.innerHTML = team.pointsAgainst;
				tr.appendChild(td);
			});

	    	//Scoreboard
	    	clearBox("scoreboard_header"); 
	    	clearBox("scoreboard_body");

			sb_header_row = document.getElementById("scoreboard_header"); //headers for scoreboard
			th = document.createElement("th");
			th.width = "20%";
			th.innerHTML = "Name";
			sb_header_row.appendChild(th);
			for (var i = 1; i < finalRegularSeasonMatchupPeriodId + 1; ++i) {
				th = document.createElement("th");
				th.innerHTML = i;
				sb_header_row.appendChild(th);
			}
			var sb_header_details = ["Tot.","Avg.","Std. Dev.","Max","Min"]
			sb_header_details.forEach(function(item) {
				th = document.createElement("th");
				th.innerHTML = item;
				sb_header_row.appendChild(th);
			});

			var scoreboard = document.getElementById("scoreboard_body");

			var score_stats_all = get_score_stats_all(teams, currentMatchupPeriod, num_Teams); //score stats
			score_stats_all.forEach(function(score_stats) {
				var tr = document.createElement("tr");
				scoreboard.appendChild(tr);
				var td = document.createElement("td"); //name
				td.innerHTML = score_stats.name;
				tr.appendChild(td);
				for (var j = 1; j < finalRegularSeasonMatchupPeriodId + 1; ++j) { //scores
					var score = get_score(score_stats.player, j);
					var td = document.createElement("td");
					td.innerHTML = Math.round(score);
					tr.appendChild(td);
				}

				var td = document.createElement("td");
				td.innerHTML = Math.round(score_stats.total);
				tr.appendChild(td);
				var td = document.createElement("td");
				td.innerHTML = score_stats.avg;
				tr.appendChild(td);
				var td = document.createElement("td");
				td.innerHTML = score_stats.std;
				tr.appendChild(td);
				var td = document.createElement("td");
				td.innerHTML = Math.round(score_stats.max);
				tr.appendChild(td);
				var td = document.createElement("td");
				td.innerHTML = Math.round(score_stats.min);
				tr.appendChild(td);
			});

			//Playoff Odds
			if (currentMatchupPeriod > 5) { //make sure at least week 6
		    	clearBox("playoff_odds_header"); 
		    	clearBox("playoff_odds_body");

		    	pf_header_row = document.getElementById("playoff_odds_header"); //headers for scoreboard
		    	th = document.createElement("th");
				th.width = "20%";
				th.innerHTML = "Final Seeding";
				pf_header_row.appendChild(th);
				for (var i = 1; i < num_Teams + 1; ++i) {
					th = document.createElement("th");
					th.innerHTML = i;
					pf_header_row.appendChild(th);
				}
				th = document.createElement("th");
				th.innerHTML = "Tot.";
				pf_header_row.appendChild(th);

				team_variables = {};
				for (i = 0; i < score_stats_all.length; ++i) {
					var teamId = score_stats_all[i].player.teamId;
					var player_variables = {five_game_avg: math.mean(score_stats_all[i].scores.slice(5)),
											five_game_std: math.std(score_stats_all[i].scores.slice(5)),
											name: score_stats_all[i].name,
											teamId: teamId};
					team_standings.forEach(function(item){
						if (item.teamId == teamId) {
							player_variables.wins = item.wins;
							player_variables.losses = item.losses;
							player_variables.ties = item.ties;
							player_variables.pointsFor = item.pointsFor;
						}
					})
					team_variables[teamId] = player_variables;
				}
				
				matchups = get_matchups(teams,currentMatchupPeriod,finalRegularSeasonMatchupPeriodId, num_Teams);
				results = monte_carlo(team_variables, matchups, 2000, num_Teams);

				playoff_odds = document.getElementById("playoff_odds_body")
				team_standings.forEach(function(team){
					teamId = team.teamId;
					var tr = document.createElement("tr");
					playoff_odds.appendChild(tr);
					var td = document.createElement("td"); //name
					td.innerHTML = team.firstName + " " + team.lastName;
					tr.appendChild(td);
					for (var i=0; i < results[teamId].length; i++) {
						var td = document.createElement("td");
						td.innerHTML = Math.round(results[teamId][i]*10)/10;
						if (i < playoff_teams) {
							td.style.backgroundColor = "LightYellow";
						}
						tr.appendChild(td);
					}
					var td = document.createElement("td");
					td.innerHTML = Math.round(math.sum(results[teamId].slice(0,playoff_teams))*10)/10;
					td.style.backgroundColor = "LightYellow";
					tr.appendChild(td);
				})
			}

	    });
};

function clearBox(elementID)
{
    document.getElementById(elementID).innerHTML = "";
}

function get_score(player, matchupPeriodId) {
	var teamId = player.teamId;
	var matchup =  player.scheduleItems[matchupPeriodId-1].matchups[0]
	if (matchup.awayTeamId == teamId) {
		return matchup.awayTeamScores[0];
	}
	else {
		return matchup.homeTeamScores[0];
	} 
}

function get_score_stats(player, currentMatchupPeriod) {
	var scores = [];
	for (var j = 1; j < currentMatchupPeriod; ++j) {
		var score = get_score(player, j);
		scores.push(score)
	}

	var score_stats = {total: scores.reduce(function(a, b) { return a + b; }, 0), 
						std: Math.round(math.std(scores)),
						min: math.min(scores),
						max: math.max(scores),
						avg: Math.round(math.mean(scores)),
						name: player.owners[0].firstName + " " + player.owners[0].lastName,
						player: player,
						scores: scores}
	return score_stats
}

function get_score_stats_all(teams, currentMatchupPeriod, num_Teams) {
	score_stats_all = [];
	Object.keys(teams).forEach(function(key,index) {
		var player = teams[key];
		var score_stats = get_score_stats(player, currentMatchupPeriod);
		score_stats_all.push(score_stats);
	});
	return score_stats_all;
}

function get_standings(teams, num_Teams) {
	var players = [];
	Object.keys(teams).forEach(function(key,index) {
		var player = {};
		player.firstName = teams[key].owners[0].firstName;
		player.lastName = teams[key].owners[0].lastName;
		player.wins = teams[key].record.overallWins;
		player.losses = teams[key].record.overallLosses;
		player.ties = teams[key].record.overallTies;
		player.pointsFor = teams[key].record.pointsFor;
		player.pointsAgainst = teams[key].record.pointsAgainst;
		player.teamId = teams[key].teamId;
		players.push(player);
	});
	players.sort(standings_sort);
	return players;
}

function standings_sort(a,b) {
	if ((a.wins - a.losses - 0.5*a.ties) > (b.wins - b.losses - 0.5*b.ties)) {
		return -1;
	}
	else if ((a.wins - a.losses - 0.5*a.ties) < (b.wins - b.losses - 0.5*b.ties)) {
		return 1;
	}
	else if ((a.wins - a.losses - 0.5*a.ties) == (b.wins - b.losses - 0.5*b.ties)) {
		if (a.pointsFor > b.pointsFor) {
			return -1;
		}
		else {
			return 1;
		}
	}
}

function get_matchups(teams, currentMatchupPeriod, finalRegularSeasonMatchupPeriodId, num_Teams) {
	matchups = [];
	Object.keys(teams).forEach(function(key,index) {
		var player = teams[key];
		for (var j=currentMatchupPeriod; j < finalRegularSeasonMatchupPeriodId + 1; j++) {
			var schedule = player.scheduleItems[j-1];
			var matchup = schedule.matchups[0];
			var teamId1 = matchup.awayTeamId;
			var teamId2 = matchup.homeTeamId;
			var inArray = 0
			for (var k = 0; k < matchups.length; k++) {
				if (arrays_equal(matchups[k], [teamId1, teamId2])) {
					inArray = 1;
				}
			}
			if (inArray == 0) {
				matchups.push([teamId1, teamId2]);
			}
		}
	});

	return matchups;
}

function arrays_equal(a,b) {
	for (var i = 0; i < a.length; ++i) {
	    if (a[i] !== b[i]) return false;
	}
	return true;
}

// Standard Normal variate using Box-Muller transform.
function randn_bm() {
    var u = 0, v = 0;
    while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while(v === 0) v = Math.random();
    return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
}

function simulate_season(team_variables, matchups) {
	var final_standings = {} //key is teamId
	var team_results = []
	var team_variables_duplicate = JSON.parse(JSON.stringify(team_variables));
	matchups.forEach(function(matchup){
		var teamId1 = matchup[0];
		var teamId2 = matchup[1];
		var teamId1_score = team_variables[teamId1].five_game_avg + randn_bm()*team_variables[teamId1].five_game_std;
		var teamId2_score = team_variables[teamId2].five_game_avg + randn_bm()*team_variables[teamId2].five_game_std;
		
		//add scores and wins
		team_variables_duplicate[teamId1].pointsFor += teamId1_score;
		team_variables_duplicate[teamId2].pointsFor += teamId2_score;
		if (teamId1_score > teamId2_score) {
			team_variables_duplicate[teamId1].wins += 1;
			team_variables_duplicate[teamId2].losses += 1;
		}
		else {
			team_variables_duplicate[teamId2].wins +=1;
			team_variables_duplicate[teamId1].losses += 1;
		}
	});

	Object.keys(team_variables_duplicate).forEach(function(key,index) {
		team_results.push(team_variables_duplicate[key]);
	});

	team_results.sort(standings_sort);

	for (var i=0; i < team_results.length; i++) {
		final_standings[team_results[i].teamId] = i+1;
	}
	return final_standings
}

function monte_carlo(team_variables, matchups, iterations, num_Teams) {
	var results = {};
	Object.keys(team_variables).forEach(function(key,index) {
	    results[key] = new Array(num_Teams).fill(0); 
	});
	for (var i = 0; i < iterations; i++) {
		var final_standings = simulate_season(team_variables, matchups);

		Object.keys(final_standings).forEach(function(key,index) {
	    	results[key][final_standings[key]-1] += 1.0/iterations*100;
		});
	}
	return results;
}