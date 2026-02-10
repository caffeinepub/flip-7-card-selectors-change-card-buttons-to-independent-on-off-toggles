import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";

module {
  type ScoringMethod = {
    #roundBased;
    #endOfGame;
  };

  type SkyjoRules = {
    rulesSummary : Text;
    gameEndCondition : Text;
    scoringMethod : ScoringMethod;
  };

  type MilleBornesRules = {
    rulesSummary : Text;
    gameEndCondition : Text;
    scoringMethod : ScoringMethod;
  };

  type NertsRules = {
    rulesSummary : Text;
    gameEndCondition : Text;
    scoringMethod : ScoringMethod;
    scoringDetails : Text;
    winTarget : Nat;
  };

  type OldGameType = {
    #skyjo : SkyjoRules;
    #milleBornes : MilleBornesRules;
    #nerts : NertsRules;
    #flip7 : {
      rulesSummary : Text;
      gameEndCondition : Text;
      scoringMethod : ScoringMethod;
      targetScore : Nat;
    };
  };

  type GenericGameRules = {
    rulesSummary : Text;
    gameEndCondition : Text;
    scoringMethod : ScoringMethod;
  };

  type GameType = {
    #skyjo : SkyjoRules;
    #milleBornes : MilleBornesRules;
    #nerts : NertsRules;
    #flip7 : {
      rulesSummary : Text;
      gameEndCondition : Text;
      scoringMethod : ScoringMethod;
      targetScore : Nat;
    };
    #genericGame : GenericGameRules;
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
  };

  module OldGameSession {
    public type Fields = {
      id : Nat;
      gameType : OldGameType;
      players : [PlayerProfile.Fields];
      rounds : [Round.Fields];
      finalScores : ?[PlayerScore.Fields];
      createdAt : Int;
      isActive : Bool;
      owner : Principal;
      nertsWinTarget : ?Nat;
      flip7TargetScore : ?Nat;
    };
  };

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
  };

  module Round {
    public type Fields = {
      roundNumber : Nat;
      playerScores : [PlayerScore.Fields];
    };
  };

  module PlayerScore {
    public type Fields = {
      playerId : Nat;
      score : Nat;
    };
  };

  public type UserProfile = {
    name : Text;
    email : ?Text;
  };

  type OldActor = {
    gameSessions : Map.Map<Nat, OldGameSession.Fields>;
    playerProfiles : Map.Map<Nat, PlayerProfile.Fields>;
    userProfiles : Map.Map<Principal, UserProfile>;
    nextGameId : Nat;
    nextUserId : Nat;
  };

  type Actor = {
    gameSessions : Map.Map<Nat, GameSession.Fields>;
    playerProfiles : Map.Map<Nat, PlayerProfile.Fields>;
    userProfiles : Map.Map<Principal, UserProfile>;
    nextGameId : Nat;
    nextUserId : Nat;
  };

  public func run(old : OldActor) : Actor {
    {
      gameSessions = old.gameSessions.map<Nat, OldGameSession.Fields, GameSession.Fields>(
        func(_id, oldGame) { oldGame }
      );
      playerProfiles = old.playerProfiles;
      userProfiles = old.userProfiles;
      nextGameId = old.nextGameId;
      nextUserId = old.nextUserId;
    };
  };
};
