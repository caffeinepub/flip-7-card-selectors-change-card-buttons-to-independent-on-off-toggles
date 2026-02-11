import Text "mo:core/Text";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";


import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

// Migrate the actor state on upgrade

actor {
  type GameType = {
    #skyjo : {
      rulesSummary : Text;
      gameEndCondition : Text;
      scoringMethod : ScoringMethod;
    };
    #milleBornes : {
      rulesSummary : Text;
      gameEndCondition : Text;
      scoringMethod : ScoringMethod;
    };
    #nerts : NertsRules;
    #flip7 : {
      rulesSummary : Text;
      gameEndCondition : Text;
      scoringMethod : ScoringMethod;
      targetScore : Nat;
    };
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
    scoringMethod = #roundBased;
  };

  type MilleBornesRules = {
    rulesSummary : Text;
    gameEndCondition : Text;
    scoringMethod : ScoringMethod;
  };

  let milleBornesRules : MilleBornesRules = {
    rulesSummary = "Mille Bornes is a French card game where players attempt to complete a 1000 km journey. Players collect mileage cards to reach the goal, while also interrupting opponents with hazard cards.";
    gameEndCondition = "The first player or team to reach 1000 km wins the game. Points are awarded based on distance travelled and bonuses for specific achievements.";
    scoringMethod = #endOfGame;
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
    scoringMethod = #roundBased;
    scoringDetails = "+1 per card moved to the center stack. -2 per card remaining in player's tableau. Round-based scoring.";
    winTarget = 200;
  };

  let flip7Rules = {
    rulesSummary = "Flip 7 is a fun and fast-paced card game similar to Nerts, but with a unique twist. Players race to be the first to reach 100 points by strategically flipping cards and playing quickly.";
    gameEndCondition = "Game ends when a player reaches 100 total points.";
    scoringMethod = #roundBased;
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
    scoringMethod = #roundBased;
  };

  module GameSession {
    public type Fields = {
      id : Nat;
      gameType : GameType;
      players : [PlayerProfile.Fields];
      rounds : [Round.Fields];
      finalScores : ?[PlayerScore.Fields];
      createdAt : Int;
      isActive : Bool;
      owner : Principal;
      nertsWinTarget : ?Nat;
      flip7TargetScore : ?Nat;
    };

    public func compare(session1 : Fields, session2 : Fields) : Order.Order {
      Nat.compare(session1.id, session2.id);
    };
  };

  type GameSession = GameSession.Fields;

  module PlayerProfile {
    public type Fields = {
      id : Nat;
      name : Text;
      gamesPlayed : Nat;
      wins : Nat;
      averageScore : Nat;
      totalScore : Nat;
      owner : Principal;
    };

    public func compare(profile1 : Fields, profile2 : Fields) : Order.Order {
      Nat.compare(profile1.id, profile2.id);
    };

    public func compareByGamesPlayed(profile1 : Fields, profile2 : Fields) : Order.Order {
      Nat.compare(profile1.gamesPlayed, profile2.gamesPlayed);
    };
  };

  type PlayerProfile = PlayerProfile.Fields;

  module Round {
    public type Fields = {
      roundNumber : Nat;
      playerScores : [PlayerScore.Fields];
    };
  };

  type Round = Round.Fields;

  module PlayerScore {
    public type Fields = {
      playerId : Nat;
      score : Nat;
    };
  };

  type PlayerScore = PlayerScore.Fields;

  public type UserProfile = {
    name : Text;
    email : ?Text;
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
          Runtime.trap("Unauthorized: Can only view your own player profiles");
        };
        profile;
      };
    };
  };

  public query ({ caller }) func getAllPlayerProfiles() : async [PlayerProfile] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view player profiles");
    };
    let playersArray = playerProfiles.values().toArray().sort();
    playersArray;
  };

  public query ({ caller }) func getAllPlayerProfilesByGamesPlayed() : async [PlayerProfile] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view player profiles");
    };
    let playersArray = playerProfiles.values().toArray().sort(PlayerProfile.compareByGamesPlayed);
    playersArray;
  };

  public shared ({ caller }) func createGameSession(gameType : GameType, playerIds : [Nat], nertsWinTarget : ?Nat, flip7TargetScore : ?Nat) : async Nat {
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
    let newGameSession = {
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

  public query ({ caller }) func getGameSession(gameId : Nat) : async GameSession {
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
      let sessionsArray = gameSessions.values().toArray().sort();
      return sessionsArray;
    };
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view game sessions");
    };
    let userSessions = gameSessions.values().filter(
      func(session : GameSession) : Bool {
        isGameParticipant(session, caller);
      }
    ).toArray().sort();
    userSessions;
  };
};
