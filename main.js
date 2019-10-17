
function calculate() {

	var base_url = "https://fantasy.espn.com/apis/v3/games/ffl/seasons/"
	var base_url_historial = "https://fantasy.espn.com/apis/v3/games/ffl/leagueHistory/"
	var leagueId = document.getElementById("leagueId").value;
	var seasonId = document.getElementById("seasonId").value;

	var matchup_url = base_url + seasonId + "/segments/0/leagues/" + leagueId + "?view=mMatchup";
	var league_info = base_url + seasonId + "/segments/0/leagues/" + leagueId + "?view=mSettings";
	var team_info = base_url + seasonId + "/segments/0/leagues/" + leagueId + "?view=mBoxScore";
	var standings = base_url + seasonId + "/segments/0/leagues/" + leagueId + "?view=mTeam";
	// $.getJSON(other,  // get scoreboard
	//     function (bsdata) {
	//     	console.log(bsdata)
	//     }
	// )

	$.when($.getJSON(matchup_url), $.getJSON(league_info), $.getJSON(team_info), $.getJSON(standings)).done( // get league settings
	    function (data1, data2, data3, data4) {  // success callback

			console.log(data1)
			console.log(data2)
			console.log(data3)
			console.log(data4)

			var team_names = data3[0].teams;
	    	var num_Teams = data1[0].teams.length;
	    	var playoff_teams = data2[0].settings.scheduleSettings.playoffTeamCount;
	    	var finalRegularSeasonMatchupPeriodId = data2[0].settings.scheduleSettings.matchupPeriodCount;
	    	var teams_key = []; // matrix to id
	    	var standing = data4[0].teams;

	    	Object.keys(data1[0].teams).forEach(function(key,index) {
	    		teams_key[key] = data1[0].teams[key].id;
	    	})
	    	var teams_key_rev = []; // id to matrix
	    	for (var i = 0; i < teams_key.length; ++i) {
	    		teams_key_rev[teams_key[i]] = i;
	    	}
	    	// var teams = data.leaguesettings.teams;

	    	// Object.keys(teams).forEach(function(key,index) {
	    	// 	teams[key].index = index;
	    	// })

	    	// for (var i = 0; i < teams[Object.keys(teams)[0]].scheduleItems.length; ++i) { // find out which week it is
	    	// 	var item = teams[Object.keys(teams)[0]].scheduleItems[i];
	    	// 	if (item.matchups[0].outcome == 0) {
	    	// 		var currentMatchupPeriod = item.matchupPeriodId;
	    	// 		var reg_season = 1;
	    	// 		break;
	    	// 	}
	    	// 	if (item.matchupPeriodId == finalRegularSeasonMatchupPeriodId) {
	    	// 		var currentMatchupPeriod = finalRegularSeasonMatchupPeriodId;
	    	// 		var reg_season = 0;
	    	// 	}
	    	// };

	    	//Find out which week it is
	    	var schedule = data1[0].schedule;
	    	var reg_season = 0;
	    	var currentMatchupPeriod = finalRegularSeasonMatchupPeriodId;
	    	for (var i = 0; i < Object.keys(schedule).length; ++i) {
	    		index = schedule[i];
	    		if (index.winner == "UNDECIDED") {
	    			var currentMatchupPeriod = index.matchupPeriodId;
	    			var reg_season = 1;
	    			break;
	    		}
	    	}

	    	//Power Rankings
	    	clearBox("power_rankings_header")
	    	clearBox("power_rankings_body");

	    	pr_header_row = document.getElementById("power_rankings_header"); //headers for power rankings
	    	th = document.createElement("th");
			th.width = "20%";
			th.innerHTML = "Name";
			pr_header_row.appendChild(th);
			for (var i = 1; i < finalRegularSeasonMatchupPeriodId + 1; ++i) {
				th = document.createElement("th");
				th.innerHTML = i;
				pr_header_row.appendChild(th);
			}

	    	var rankings = document.getElementById("power_rankings_body");
	    	var pr_all = power_rankings_all(schedule, currentMatchupPeriod, finalRegularSeasonMatchupPeriodId, num_Teams,reg_season, team_names, teams_key, teams_key_rev); //score stats

	    	pr_all.forEach(function(team) {
				var tr = document.createElement("tr");
				rankings.appendChild(tr);
				var td = document.createElement("td"); //name
				td.innerHTML = team.firstName + " " + team.lastName;
				tr.appendChild(td);
				for (i=0; i<team.powerScore.length; i++) {
					var td = document.createElement("td");
					td.innerHTML = Math.round(team.powerScore[i]*100)/100;
					if (reg_season == 1) {
						if (i == currentMatchupPeriod-2) {
							td.style.backgroundColor = "LightYellow";
						}
					}
					else {
						if (i == currentMatchupPeriod-1) {
							td.style.backgroundColor = "LightYellow";
						}
					}
					tr.appendChild(td);
				}
			});

			var pr_table = document.getElementById("power_rankings");
			sorttable.makeSortable(pr_table);

			//Standings
			clearBox("standings_body");
			var standings = document.getElementById("standings_body");
			team_standings = get_standings(standing, num_Teams);
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

			var score_stats_all = get_score_stats_all(schedule, standing, currentMatchupPeriod, num_Teams); //score stats
			score_stats_all.forEach(function(score_stats) {
				var tr = document.createElement("tr");
				scoreboard.appendChild(tr);
				var td = document.createElement("td"); //name
				td.innerHTML = score_stats.name;
				tr.appendChild(td);
				for (var j = 0; j < finalRegularSeasonMatchupPeriodId; ++j) { //scores
					var scorel = score_stats.scores.length;
					if (j < scorel) {
						var score = score_stats.scores[j];
					}
					else {
						var score = 0;
					}
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

			var sb_table = document.getElementById("scoreboard");
			sorttable.makeSortable(sb_table);

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
					var teamId = score_stats_all[i].player.id;
					scores_length = score_stats_all[i].scores.length
					var player_variables = {five_game_avg: math.mean(score_stats_all[i].scores.slice(scores_length-5, scores_length)),
											five_game_std: math.std(score_stats_all[i].scores.slice(scores_length-5, scores_length)),
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
				
				matchups = get_matchups(schedule,standing,currentMatchupPeriod,finalRegularSeasonMatchupPeriodId, num_Teams);
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
			else {
				clearBox("playoff_odds_header"); 
				clearBox("playoff_odds_body");

				th = document.createElement("th");
				th.innerHTML = "Not Enough Data"
				document.getElementById("playoff_odds_header").appendChild(th)
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

function get_score_stats(player, schedule, currentMatchupPeriod) {
	var scores = [];
	schedule.forEach(function(element) {
		if (element.matchupPeriodId < currentMatchupPeriod) {
			if (element.away.teamId == player.id) {
				var score = element.away.totalPoints;
				scores.push(score);
			}
			if (element.home.teamId == player.id) {
				var score = element.home.totalPoints;
				scores.push(score);
			}
		}
	})

	// for (var j = 1; j < currentMatchupPeriod; ++j) {
	// 	var score = get_score(player, j);
	// 	scores.push(score)
	// }

	var score_stats = {total: scores.reduce(function(a, b) { return a + b; }, 0), 
						std: Math.round(math.std(scores)),
						min: math.min(scores),
						max: math.max(scores),
						avg: Math.round(math.mean(scores)),
						name: player.location + " " + player.nickname,
						player: player,
						scores: scores}

	return score_stats
}

function get_score_stats_all(schedule, standings, currentMatchupPeriod, num_Teams) {
	score_stats_all = [];
	console.log(standings)
	standings.forEach(function(element) {
		var score_stats = get_score_stats(element, schedule, currentMatchupPeriod);
		score_stats_all.push(score_stats);
	});
	return score_stats_all;
}

function get_power_matrix(week, num_Teams, schedule, teams_key_rev) {
	var win_matrix = [] //row is winning team index, column is losing team index

	for(var i=0; i<num_Teams; i++) { //make a square matrix filled with zeros
    	win_matrix[i] = [];
	    for(var j=0; j<num_Teams; j++) {
	        win_matrix[i][j] = 0;
    	}	
	}

	// Object.keys(teams).forEach(function(key,index) {
	// 	var schedule = teams[key].scheduleItems
	// 	for(var i=0; i<week + 1; i++) { //up until this week, populate power matrix
	// 		matchup = schedule[i].matchups[0]
	// 		away_team = [matchup.awayTeamId, matchup.awayTeamScores[0]]
	// 		home_team = [matchup.homeTeamId, matchup.homeTeamScores[0]]
	// 		if (key == away_team[0]) {
	// 			if (away_team[1] > home_team[1]) {
	// 				win_matrix[teams[away_team[0]].index][teams[home_team[0]].index] += 1
	// 			}
	// 			if (away_team[1] == home_team[1]) {
	// 				win_matrix[teams[away_team[0]].index][teams[home_team[0]].index] += 0.5
	// 			}
	// 		}
	// 		else if (key == home_team[0]) {
	// 			if (away_team[1] < home_team[1]) {
	// 				win_matrix[teams[home_team[0]].index][teams[away_team[0]].index] += 1
	// 			}
	// 			if (away_team[1] == home_team[1]) {
	// 				win_matrix[teams[home_team[0]].index][teams[away_team[0]].index] += 0.5
	// 			}
	// 		}
	// 	}
	// });

	schedule.forEach(function(element) {
		if (week + 2 > element.matchupPeriodId) {
			away_team = [element.away.teamId, element.away.totalPoints];
			home_team = [element.home.teamId, element.home.totalPoints];
			if (away_team[1] > home_team[1]) {
				win_matrix[teams_key_rev[away_team[0]]][teams_key_rev[home_team[0]]] += 1;
			}
			if (away_team[1] < home_team[1]) {
				win_matrix[teams_key_rev[home_team[0]]][teams_key_rev[away_team[0]]] += 1;
			}
			if (away_team[1] == home_team[1]) {
				win_matrix[teams_key_rev[away_team[0]]][teams_key_rev[home_team[0]]] += 0.5;
				win_matrix[teams_key_rev[home_team[0]]][teams_key_rev[away_team[0]]] += 0.5;
			}
		}
	});

	return win_matrix
}

function square_matrix(A) {
	length = A.length;
	var result = []

	for(var i=0; i<length; i++) {
    	result[i] = [];
	    for(var j=0; j<length; j++) {
	        result[i][j] = 0;
    	}	
	}

	for (var i=0; i<length; i++) {
		for (var j=0; j<length; j++) {
			for (var k=0; k<length; k++) {
				result[i][j] += A[i][k] * A[k][j];
			}
		}
	}

	return result
}

function add_matrix(A,B) {
	length = A.length;
	result = [];
	for (var i=0; i<length; i++) {
		result[i] = [];
		for (var j=0; j<length; j++) {
			result[i][j] = A[i][j] + 0.5*B[i][j];
		}
	}

	return result
}

function get_average_score(week, num_Teams, schedule, teams_key_rev) {
	var average_score = [];

	for (var i = 0; i < num_Teams; i++) {
		average_score[i] = 0;
	}
	// Object.keys(teams).forEach(function(key,index) {
	// 	average_score[teams[key].index] = 0 
	// 	var schedule = teams[key].scheduleItems
	// 	for(var i=0; i<week + 1; i++) {
	// 		matchup = schedule[i].matchups[0]
	// 		away_team = [matchup.awayTeamId, matchup.awayTeamScores[0]]
	// 		home_team = [matchup.homeTeamId, matchup.homeTeamScores[0]]
	// 		if (key == away_team[0]) {
	// 			average_score[teams[key].index] += matchup.awayTeamScores[0];
	// 		}
	// 		else if (key == home_team[0]) {
	// 			average_score[teams[key].index] += matchup.homeTeamScores[0];
	// 		}
	// 	}
	// 	average_score[teams[key].index] = average_score[teams[key].index]/(week+1);
	// });	

	schedule.forEach(function(element) {
		if (week + 2 > element.matchupPeriodId) {
			away_team = [element.away.teamId, element.away.totalPoints];
			home_team = [element.home.teamId, element.home.totalPoints];
			average_score[teams_key_rev[away_team[0]]] += away_team[1];
			average_score[teams_key_rev[home_team[0]]] += home_team[1];
		}
	});

	for (var i = 0; i < average_score.length; i++) {
		average_score[i] = average_score[i]/(week + 1);
	}

	return average_score
}

function z_score(X) {
	sum = X.reduce((a,b)=>a+b,0);
	length = X.length;
	mean = sum/length;
	sd = 0;
	result = []

	for (var i=0; i<length; i++) {
		sd += (X[i] - mean) * (X[i] - mean);
	}

	sd = sd/(length-1);
	sd = Math.sqrt(sd);
	for (var i=0; i<length; i++) {
		result[i] = (X[i]-mean)/sd;
	}
	return result
}	

function power_rankings_all(schedule, currentMatchupPeriod, finalRegularSeasonMatchupPeriodId, num_Teams, reg_season, team_names, teams_key, teams_key_rev) {
	pr_array = [];
	if (currentMatchupPeriod == finalRegularSeasonMatchupPeriodId) {
		if (reg_season == 0) {
			currentMatchupPeriod += 1;
		}
	}
	for (var week = 0; week < currentMatchupPeriod-1; ++week) {
		power_matrix = get_power_matrix(week, num_Teams, schedule, teams_key_rev);
		dominance_matrix = add_matrix(power_matrix, square_matrix(power_matrix));
		two_step_dominance = [];
		for (var i=0; i<dominance_matrix.length; i++) {
			two_step_dominance[i] = dominance_matrix[i].reduce((a,b)=>a+b,0)
		}

		two_step_dominance = z_score(two_step_dominance);

		average_score = get_average_score(week, num_Teams, schedule, teams_key_rev);
		average_score = z_score(average_score);

		power_score = [];

		for (var i=0; i<num_Teams; i++) {
			power_score[i] = two_step_dominance[i]*0.4 + average_score[i]*0.6;
		}

		pr_array.push(power_score);
	}

	players = [];

	team_names.forEach(function(element) {
		var player = {};
		player.firstName = element.location;
		player.lastName = element.nickname;
		player.id = element.id;
		player.powerScore = [];
		for (i=0; i<finalRegularSeasonMatchupPeriodId; ++i) {
			player.powerScore.push(0);
		}
		for (i=0; i<currentMatchupPeriod-1; ++i) {
			player.powerScore[i] = pr_array[i][teams_key_rev[player.id]];
		}
		player.matchupPeriodId = currentMatchupPeriod;
		players.push(player);
	});

	players.sort(power_rankings_sort);
	return players;
}

function power_rankings_sort(a,b) {
	currentMatchupPeriod = a.matchupPeriodId;
	if (a.powerScore[currentMatchupPeriod-2] > b.powerScore[currentMatchupPeriod-2]) {
		return -1;
	}
	else {
		return +1;
	}
}

function get_standings(standings, num_Teams) { //list with each player, in order of standing
	var players = [];
	standings.forEach(function(element) {
		var player = {};
		player.firstName = element.location;
		player.lastName = element.nickname;
		player.wins = element.record.overall.wins;
		player.losses = element.record.overall.losses;
		player.ties = element.record.overall.ties;
		player.pointsFor = element.record.overall.pointsFor.toFixed(2);
		player.pointsAgainst = element.record.overall.pointsAgainst.toFixed(2);
		player.teamId = element.id;
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

function get_matchups(schedule, standing, currentMatchupPeriod, finalRegularSeasonMatchupPeriodId, num_Teams) {
	matchups = [];
	// Object.keys(teams).forEach(function(key,index) {
	// 	var player = teams[key];
	// 	for (var j=currentMatchupPeriod; j < finalRegularSeasonMatchupPeriodId + 1; j++) {
	// 		var schedule = player.scheduleItems[j-1];
	// 		var matchup = schedule.matchups[0];
	// 		var teamId1 = matchup.awayTeamId;
	// 		var teamId2 = matchup.homeTeamId;
	// 		var inArray = 0
	// 		for (var k = 0; k < matchups.length; k++) {
	// 			if (arrays_equal(matchups[k], [teamId1, teamId2])) {
	// 				inArray = 1;
	// 			}
	// 		}
	// 		if (inArray == 0) {
	// 			matchups.push([teamId1, teamId2]);
	// 		}
	// 	}
	// });

	schedule.forEach(function(element) {
		if (element.matchupPeriodId > currentMatchupPeriod - 1) {
			if (element.matchupPeriodId < finalRegularSeasonMatchupPeriodId + 1) {
				matchups.push([element.away.teamId, element.home.teamId])
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