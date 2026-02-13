import Text "mo:core/Text";
import Array "mo:core/Array";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Order "mo:core/Order";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  type GameType = {
    #skyjo : SkyjoRules;
    #milleBornes : MilleBornesRules;
    #nerts : NertsRules;
    #flip7 : Flip7Rules;
    #phase10 : Phase10Rules;
    #genericGame : GenericGameRules;
  };

  type ScoringMethod = {
    #roundBased;
    #endOfGame;
  };

  type SkyjoRules = {
    rulesSummary : Text;
    gameEndCondition : Text;
    scoringMethod : ScoringMethod;
  };

  let skyjoRules : SkyjoRules = {
    rulesSummary = "Skyjo is a card game where players aim to have the lowest total score at the end of the game. Players take turns flipping cards, trying to minimize their row totals. The game ends when a player's row is fully flipped.";
    gameEndCondition = "The game ends when a player's row is fully flipped, and scores are calculated. The player with the lowest total score wins.";
    scoringMethod = #roundBased : ScoringMethod;
  };

  type MilleBornesRules = {
    rulesSummary : Text;
    gameEndCondition : Text;
    scoringMethod : ScoringMethod;
  };

  let milleBornesRules : MilleBornesRules = {
    rulesSummary = "Mille Bornes is a French card game where players attempt to complete a 1000 km journey. Players collect mileage cards to reach the goal, while also interrupting opponents with hazard cards.";
    gameEndCondition = "The first player or team to reach 1000 km wins the game. Points are awarded based on distance travelled and bonuses for specific achievements.";
    scoringMethod = #endOfGame : ScoringMethod;
  };

  type NertsRules = {
    rulesSummary : Text;
    gameEndCondition : Text;
    scoringMethod : ScoringMethod;
    scoringDetails : Text;
    winTarget : Nat;
  };

  let nertsRules : NertsRules = {
    rulesSummary = "Nerts is a fast-paced, multi-player card game involving simultaneous solitaire-style play. Players race to clear their 'Nerts' pile and aim for the highest score. +1 per card played into the center, -2 per card left in a player's tableau.";
    gameEndCondition = "Game ends when a player reaches the set win target points. Points are tallied at the end of each round until the target is met.";
    scoringMethod = #roundBased : ScoringMethod;
    scoringDetails = "+1 per card moved to the center stack. -2 per card remaining in player's tableau. Round-based scoring.";
    winTarget = 200;
  };

  type Phase10Rules = {
    rulesSummary : Text;
    gameEndCondition : Text;
    scoringMethod : ScoringMethod;
    scoringDetails : Text;
    winTarget : Nat;
  };

  let phase10Rules : Phase10Rules = {
    rulesSummary = "Phase 10 is a rummy-type card game where players compete to complete 10 different phases. Points are accumulated based on the cards left in hand when a player goes out. +5 for cards 1-9, +10 for cards 10-12, +15 for skip and reverse, and +25 for wild cards.";
    gameEndCondition = "The game ends when a player completes all 10 phases. The player with the lowest score when the first player completes phase 10 wins.";
    scoringMethod = #roundBased : ScoringMethod;
    scoringDetails = "+5 for cards 1-9, +10 for cards 10-12, +15 for skip and reverse, +25 for wild cards. Round-based scoring.";
    winTarget = 0;
  };

  type Flip7Rules = {
    rulesSummary : Text;
    gameEndCondition : Text;
    scoringMethod : ScoringMethod;
    targetScore : Nat;
  };

  let flip7Rules : Flip7Rules = {
    rulesSummary = "Flip 7 is a fun and fast-paced card game similar to Nerts, but with a unique twist. Players race to be the first to reach 100 points by strategically flipping cards and playing quickly.";
    gameEndCondition = "Game ends when a player reaches 100 total points.";
    scoringMethod = #roundBased : ScoringMethod;
    targetScore = 100;
  };

  type GenericGameRules = {
    rulesSummary : Text;
    gameEndCondition : Text;
    scoringMethod : ScoringMethod;
  };

  let genericGameRules : GenericGameRules = {
    rulesSummary = "A generic game allows for unlimited rounds with one numeric score per player per round. Totals are automatically computed from entered round scores. Ideal for tracking scores in various games.";
    gameEndCondition = "There is no automatic game end. The game continues until players decide to stop.";
    scoringMethod = #roundBased : ScoringMethod;
  };

  type GameSession = {
    id : Nat;
    gameType : GameType;
    players : [PlayerProfile];
    rounds : [Round];
    finalScores : ?[PlayerScore];
    createdAt : Int;
    isActive : Bool;
    owner : Principal;
    nertsWinTarget : ?Nat;
    flip7TargetScore : ?Nat;
    phase10WinTarget : ?Nat;
    phase10Progress : ?Phase10Progress;
  };

  type PlayerProfile = {
    id : Nat;
    name : Text;
    gamesPlayed : Nat;
    wins : Nat;
    averageScore : Nat;
    totalScore : Nat;
    owner : Principal;
  };

  type Round = {
    roundNumber : Nat;
    playerScores : [PlayerScore];
  };

  type PlayerScore = {
    playerId : Nat;
    score : Nat;
  };

  type UserProfile = {
    name : Text;
    email : ?Text;
  };

  type Phase10Progress = [PlayerPhase];

  type PlayerPhase = {
    playerId : Nat;
    currentPhase : Nat;
  };

  type Phase10Completion = {
    playerId : Nat;
    completed : Bool;
  };

  type Phase10Round = {
    roundNumber : Nat;
    scores : [PlayerScore];
    phaseCompletions : [Phase10Completion];
  };

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let gameSessions = Map.empty<Nat, GameSession>();
  let playerProfiles = Map.empty<Nat, PlayerProfile>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  var nextGameId = 1;
  var nextUserId = 1;

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func createPlayerProfile(name : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create player profiles");
    };
    if (name.size() == 0) {
      Runtime.trap("Name cannot be empty.");
    };
    let profile = {
      id = nextUserId;
      name;
      gamesPlayed = 0;
      wins = 0;
      averageScore = 0;
      totalScore = 0;
      owner = caller;
    };
    playerProfiles.add(nextUserId, profile);
    nextUserId += 1;
    profile.id;
  };

  public query ({ caller }) func getPlayerProfile(profileId : Nat) : async PlayerProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view player profiles");
    };
    switch (playerProfiles.get(profileId)) {
      case (null) { Runtime.trap("Player profile does not exist") };
      case (?profile) {
        if (profile.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only view own player profiles");
        };
        profile;
      };
    };
  };

  public query ({ caller }) func getAllPlayerProfiles() : async [PlayerProfile] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view player profiles");
    };
    let playersArray = playerProfiles.values().toArray().sort(comparePlayerProfilesById);
    playersArray;
  };

  public query ({ caller }) func getAllPlayerProfilesByGamesPlayed() : async [PlayerProfile] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view player profiles");
    };
    let playersArray = playerProfiles.values().toArray().sort(comparePlayerProfilesByGamesPlayed);
    playersArray;
  };

  func comparePlayerProfilesById(profile1 : PlayerProfile, profile2 : PlayerProfile) : Order.Order {
    Nat.compare(profile1.id, profile2.id);
  };

  func comparePlayerProfilesByGamesPlayed(profile1 : PlayerProfile, profile2 : PlayerProfile) : Order.Order {
    Nat.compare(profile1.gamesPlayed, profile2.gamesPlayed);
  };

  func comparePlayerScoresByScore(score1 : PlayerScore, score2 : PlayerScore) : Order.Order {
    Nat.compare(score1.score, score2.score);
  };

  func comparePlayerPhasesByCurrentPhase(phase1 : PlayerPhase, phase2 : PlayerPhase) : Order.Order {
    Nat.compare(phase1.currentPhase, phase2.currentPhase);
  };

  public shared ({ caller }) func createGameSession(gameType : GameType, playerIds : [Nat], nertsWinTarget : ?Nat, flip7TargetScore : ?Nat, phase10WinTarget : ?Nat) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create game sessions");
    };
    if (playerIds.size() == 0) {
      Runtime.trap("At least one player is required.");
    };
    let playersArray : [PlayerProfile] = playerIds.map(
      func(id) {
        switch (playerProfiles.get(id)) {
          case (null) { Runtime.trap("Player profile does not exist") };
          case (?profile) { profile };
        };
      }
    );
    let newGameSession : GameSession = {
      id = nextGameId;
      gameType;
      players = playersArray;
      rounds = [];
      finalScores = null;
      createdAt = 1718192000;
      isActive = true;
      owner = caller;
      nertsWinTarget;
      flip7TargetScore;
      phase10WinTarget;
      phase10Progress = null;
    };
    gameSessions.add(nextGameId, newGameSession);
    nextGameId += 1;
    newGameSession.id;
  };

  func isGameParticipant(game : GameSession, caller : Principal) : Bool {
    if (game.owner == caller) {
      return true;
    };
    for (player in game.players.values()) {
      if (player.owner == caller) {
        return true;
      };
    };
    false;
  };

  public shared ({ caller }) func addRound(gameId : Nat, roundNumber : Nat, scores : [PlayerScore]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add rounds");
    };
    switch (gameSessions.get(gameId)) {
      case (null) { Runtime.trap("Game session does not exist") };
      case (?game) {
        if (not isGameParticipant(game, caller) and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only game participants or admins can add rounds");
        };
        if (not game.isActive) {
          Runtime.trap("Cannot score a completed game.");
        };

        let newRound = {
          roundNumber;
          playerScores = scores;
        };

        let updatedRounds = game.rounds.concat([newRound]);

        var gameShouldEnd = false;
        let updatedGame = switch (game.gameType) {
          case (#nerts(_)) {
            switch (game.nertsWinTarget) {
              case (?target) {
                var totalScore = 0;
                for (score in scores.values()) {
                  totalScore += score.score;
                  if (score.score >= target) {
                    gameShouldEnd := true;
                  };
                };
                {
                  id = game.id;
                  gameType = game.gameType;
                  players = game.players;
                  rounds = updatedRounds;
                  finalScores = game.finalScores;
                  createdAt = game.createdAt;
                  isActive = not gameShouldEnd;
                  owner = game.owner;
                  nertsWinTarget = game.nertsWinTarget;
                  flip7TargetScore = game.flip7TargetScore;
                  phase10WinTarget = game.phase10WinTarget;
                  phase10Progress = game.phase10Progress;
                };
              };
              case (null) {
                { game with rounds = updatedRounds };
              };
            };
          };
          case (#flip7(_)) {
            switch (game.flip7TargetScore) {
              case (?target) {
                var totalScore = 0;
                for (score in scores.values()) {
                  totalScore += score.score;
                  if (score.score >= target) {
                    gameShouldEnd := true;
                  };
                };
                {
                  id = game.id;
                  gameType = game.gameType;
                  players = game.players;
                  rounds = updatedRounds;
                  finalScores = game.finalScores;
                  createdAt = game.createdAt;
                  isActive = not gameShouldEnd;
                  owner = game.owner;
                  nertsWinTarget = game.nertsWinTarget;
                  flip7TargetScore = game.flip7TargetScore;
                  phase10WinTarget = game.phase10WinTarget;
                  phase10Progress = game.phase10Progress;
                };
              };
              case (null) {
                { game with rounds = updatedRounds };
              };
            };
          };
          case (#phase10(_)) {
            switch (game.phase10WinTarget) {
              case (?target) {
                var totalScore = 0;
                for (score in scores.values()) {
                  totalScore += score.score;
                  if (score.score >= target) {
                    gameShouldEnd := true;
                  };
                };
                {
                  id = game.id;
                  gameType = game.gameType;
                  players = game.players;
                  rounds = updatedRounds;
                  finalScores = game.finalScores;
                  createdAt = game.createdAt;
                  isActive = not gameShouldEnd;
                  owner = game.owner;
                  nertsWinTarget = game.nertsWinTarget;
                  flip7TargetScore = game.flip7TargetScore;
                  phase10WinTarget = game.phase10WinTarget;
                  phase10Progress = game.phase10Progress;
                };
              };
              case (null) {
                { game with rounds = updatedRounds };
              };
            };
          };
          case (#genericGame(_)) {
            { game with rounds = updatedRounds };
          };
          case (_) {
            { game with rounds = updatedRounds };
          };
        };
        gameSessions.add(gameId, updatedGame);
      };
    };
  };

  public shared ({ caller }) func updateRound(gameId : Nat, roundNumber : Nat, scores : [PlayerScore]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update rounds");
    };
    switch (gameSessions.get(gameId)) {
      case (null) { Runtime.trap("Game session does not exist") };
      case (?game) {
        if (not isGameParticipant(game, caller) and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only game participants or admins can update rounds");
        };
        if (not game.isActive) {
          Runtime.trap("Cannot update rounds in a completed game.");
        };

        var foundRound = false;
        let updatedRounds = game.rounds.map(
          func(round : Round) : Round {
            if (round.roundNumber == roundNumber) {
              foundRound := true;
              {
                roundNumber = round.roundNumber;
                playerScores = scores;
              };
            } else {
              round;
            };
          }
        );

        if (not foundRound) {
          Runtime.trap("Round not found");
        };

        var gameShouldEnd = false;
        let updatedGame = switch (game.gameType) {
          case (#nerts(_)) {
            switch (game.nertsWinTarget) {
              case (?target) {
                for (round in updatedRounds.values()) {
                  for (score in round.playerScores.values()) {
                    if (score.score >= target) {
                      gameShouldEnd := true;
                    };
                  };
                };
                {
                  id = game.id;
                  gameType = game.gameType;
                  players = game.players;
                  rounds = updatedRounds;
                  finalScores = game.finalScores;
                  createdAt = game.createdAt;
                  isActive = not gameShouldEnd;
                  owner = game.owner;
                  nertsWinTarget = game.nertsWinTarget;
                  flip7TargetScore = game.flip7TargetScore;
                  phase10WinTarget = game.phase10WinTarget;
                  phase10Progress = game.phase10Progress;
                };
              };
              case (null) {
                { game with rounds = updatedRounds };
              };
            };
          };
          case (#flip7(_)) {
            switch (game.flip7TargetScore) {
              case (?target) {
                for (round in updatedRounds.values()) {
                  for (score in round.playerScores.values()) {
                    if (score.score >= target) {
                      gameShouldEnd := true;
                    };
                  };
                };
                {
                  id = game.id;
                  gameType = game.gameType;
                  players = game.players;
                  rounds = updatedRounds;
                  finalScores = game.finalScores;
                  createdAt = game.createdAt;
                  isActive = not gameShouldEnd;
                  owner = game.owner;
                  nertsWinTarget = game.nertsWinTarget;
                  flip7TargetScore = game.flip7TargetScore;
                  phase10WinTarget = game.phase10WinTarget;
                  phase10Progress = game.phase10Progress;
                };
              };
              case (null) {
                { game with rounds = updatedRounds };
              };
            };
          };
          case (#phase10(_)) {
            switch (game.phase10WinTarget) {
              case (?target) {
                for (round in updatedRounds.values()) {
                  for (score in round.playerScores.values()) {
                    if (score.score >= target) {
                      gameShouldEnd := true;
                    };
                  };
                };
                {
                  id = game.id;
                  gameType = game.gameType;
                  players = game.players;
                  rounds = updatedRounds;
                  finalScores = game.finalScores;
                  createdAt = game.createdAt;
                  isActive = not gameShouldEnd;
                  owner = game.owner;
                  nertsWinTarget = game.nertsWinTarget;
                  flip7TargetScore = game.flip7TargetScore;
                  phase10WinTarget = game.phase10WinTarget;
                  phase10Progress = game.phase10Progress;
                };
              };
              case (null) {
                { game with rounds = updatedRounds };
              };
            };
          };
          case (#genericGame(_)) {
            { game with rounds = updatedRounds };
          };
          case (_) {
            { game with rounds = updatedRounds };
          };
        };
        gameSessions.add(gameId, updatedGame);
      };
    };
  };

  public shared ({ caller }) func submitPhase10Round(gameId : Nat, roundNumber : Nat, scores : [PlayerScore], phaseCompletions : [Phase10Completion]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can submit rounds");
    };

    switch (gameSessions.get(gameId)) {
      case (null) { Runtime.trap("Game session does not exist") };
      case (?game) {
        if (not isGameParticipant(game, caller) and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only game participants or admins can submit rounds");
        };
        if (not game.isActive) {
          Runtime.trap("Cannot submit rounds in a completed game.");
        };

        let newRound = {
          roundNumber;
          playerScores = scores;
        };
        let updatedRounds = game.rounds.concat([newRound]);

        let currentProgress = switch (game.phase10Progress) {
          case (?progress) { progress };
          case (null) {
            game.players.map(func(player) : PlayerPhase {
              { playerId = player.id; currentPhase = 1 }
            })
          };
        };

        var newProgress : [PlayerPhase] = currentProgress;
        for (completion in phaseCompletions.values()) {
          if (completion.completed) {
            let playerId = completion.playerId;
            var foundPlayer = false;

            let updatedProgress : [PlayerPhase] = newProgress.map(
              func(playerPhase : PlayerPhase) : PlayerPhase {
                if (playerPhase.playerId == playerId) {
                  foundPlayer := true;
                  let nextPhase = if (playerPhase.currentPhase < 10) {
                    playerPhase.currentPhase + 1;
                  } else {
                    10;
                  };
                  {
                    playerId = playerPhase.playerId;
                    currentPhase = nextPhase;
                  };
                } else {
                  playerPhase;
                };
              }
            );

            if (not foundPlayer) {
              newProgress := newProgress.concat([{ playerId; currentPhase = 2 }]);
            } else {
              newProgress := updatedProgress;
            };
          };
        };

        var gameShouldEnd = false;
        switch (game.gameType) {
          case (#phase10(_)) {
            switch (game.phase10WinTarget) {
              case (?target) {
                for (score in scores.values()) {
                  if (score.score >= target) {
                    gameShouldEnd := true;
                  };
                };
              };
              case (null) {};
            };
            for (playerPhase in newProgress.values()) {
              if (playerPhase.currentPhase >= 10) {
                gameShouldEnd := true;
              };
            };
          };
          case (_) {};
        };

        let updatedGame : GameSession = {
          id = game.id;
          gameType = game.gameType;
          players = game.players;
          rounds = updatedRounds;
          finalScores = game.finalScores;
          createdAt = game.createdAt;
          isActive = not gameShouldEnd;
          owner = game.owner;
          nertsWinTarget = game.nertsWinTarget;
          flip7TargetScore = game.flip7TargetScore;
          phase10WinTarget = game.phase10WinTarget;
          phase10Progress = ?newProgress;
        };

        gameSessions.add(gameId, updatedGame);
      };
    };
  };

  public query ({ caller }) func getGameSession(gameId : Nat) : async GameSession {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view game sessions");
    };
    switch (gameSessions.get(gameId)) {
      case (null) { Runtime.trap("Game session does not exist") };
      case (?gameSession) {
        if (not isGameParticipant(gameSession, caller) and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only game participants or admins can view this game session");
        };
        gameSession;
      };
    };
  };

  public query ({ caller }) func getAllGameSessions() : async [GameSession] {
    if (AccessControl.isAdmin(accessControlState, caller)) {
      let sessionsArray = gameSessions.values().toArray().sort(compareGameSessionsById);
      return sessionsArray;
    };
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view game sessions");
    };
    let userSessions = gameSessions.values().filter(
      func(session : GameSession) : Bool {
        isGameParticipant(session, caller);
      }
    ).toArray().sort(compareGameSessionsById);
    userSessions;
  };

  func compareGameSessionsById(session1 : GameSession, session2 : GameSession) : Order.Order {
    Nat.compare(session1.id, session2.id);
  };
};
