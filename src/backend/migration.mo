import Map "mo:core/Map";
import Nat "mo:core/Nat";

import AccessControl "authorization/access-control";
import Principal "mo:core/Principal";

module {
  type SpiritsOfTheWildAnimal = {
    id : Nat;
    name : Text;
    icon : Text;
  };

  type OldActor = {
    accessControlState : AccessControl.AccessControlState;
    skyjoRules : {
      rulesSummary : Text;
      gameEndCondition : Text;
      scoringMethod : {
        #roundBased;
        #endOfGame;
      };
    };
    milleBornesRules : {
      rulesSummary : Text;
      gameEndCondition : Text;
      scoringMethod : {
        #roundBased;
        #endOfGame;
      };
    };
    nertsRules : {
      rulesSummary : Text;
      gameEndCondition : Text;
      scoringMethod : {
        #roundBased;
        #endOfGame;
      };
      scoringDetails : Text;
      winTarget : Nat;
    };
    phase10Rules : {
      rulesSummary : Text;
      gameEndCondition : Text;
      scoringMethod : {
        #roundBased;
        #endOfGame;
      };
      scoringDetails : Text;
      winTarget : Nat;
    };
    flip7Rules : {
      rulesSummary : Text;
      gameEndCondition : Text;
      scoringMethod : {
        #roundBased;
        #endOfGame;
      };
      targetScore : Nat;
    };
    genericGameRules : {
      rulesSummary : Text;
      gameEndCondition : Text;
      scoringMethod : {
        #roundBased;
        #endOfGame;
      };
    };
    gameSessions : Map.Map<Nat, {
      id : Nat;
      gameType : {
        #skyjo : {
          rulesSummary : Text;
          gameEndCondition : Text;
          scoringMethod : {
            #roundBased;
            #endOfGame;
          };
        };
        #milleBornes : {
          rulesSummary : Text;
          gameEndCondition : Text;
          scoringMethod : {
            #roundBased;
            #endOfGame;
          };
        };
        #nerts : {
          rulesSummary : Text;
          gameEndCondition : Text;
          scoringMethod : {
            #roundBased;
            #endOfGame;
          };
          scoringDetails : Text;
          winTarget : Nat;
        };
        #flip7 : {
          rulesSummary : Text;
          gameEndCondition : Text;
          scoringMethod : {
            #roundBased;
            #endOfGame;
          };
          targetScore : Nat;
        };
        #phase10 : {
          rulesSummary : Text;
          gameEndCondition : Text;
          scoringMethod : {
            #roundBased;
            #endOfGame;
          };
          scoringDetails : Text;
          winTarget : Nat;
        };
        #genericGame : {
          rulesSummary : Text;
          gameEndCondition : Text;
          scoringMethod : {
            #roundBased;
            #endOfGame;
          };
        };
      };
      players : [{
        id : Nat;
        name : Text;
        gamesPlayed : Nat;
        wins : Nat;
        averageScore : Nat;
        totalScore : Nat;
        owner : Principal.Principal;
      }];
      rounds : [{
        roundNumber : Nat;
        playerScores : [{
          playerId : Nat;
          score : Nat;
        }];
      }];
      finalScores : ?[{
        playerId : Nat;
        score : Nat;
      }];
      createdAt : Int;
      isActive : Bool;
      owner : Principal.Principal;
      nertsWinTarget : ?Nat;
      flip7TargetScore : ?Nat;
      phase10WinTarget : ?Nat;
      phase10Progress : ?[{
        playerId : Nat;
        currentPhase : Nat;
      }];
    }>;
    playerProfiles : Map.Map<Nat, {
      id : Nat;
      name : Text;
      gamesPlayed : Nat;
      wins : Nat;
      averageScore : Nat;
      totalScore : Nat;
      owner : Principal.Principal;
    }>;
    userProfiles : Map.Map<Principal.Principal, {
      name : Text;
      email : ?Text;
    }>;
    nextGameId : Nat;
    nextUserId : Nat;
  };

  type NewActor = {
    accessControlState : AccessControl.AccessControlState;
    skyjoRules : {
      rulesSummary : Text;
      gameEndCondition : Text;
      scoringMethod : {
        #roundBased;
        #endOfGame;
      };
    };
    milleBornesRules : {
      rulesSummary : Text;
      gameEndCondition : Text;
      scoringMethod : {
        #roundBased;
        #endOfGame;
      };
    };
    nertsRules : {
      rulesSummary : Text;
      gameEndCondition : Text;
      scoringMethod : {
        #roundBased;
        #endOfGame;
      };
      scoringDetails : Text;
      winTarget : Nat;
    };
    phase10Rules : {
      rulesSummary : Text;
      gameEndCondition : Text;
      scoringMethod : {
        #roundBased;
        #endOfGame;
      };
      scoringDetails : Text;
      winTarget : Nat;
    };
    flip7Rules : {
      rulesSummary : Text;
      gameEndCondition : Text;
      scoringMethod : {
        #roundBased;
        #endOfGame;
      };
      targetScore : Nat;
    };
    genericGameRules : {
      rulesSummary : Text;
      gameEndCondition : Text;
      scoringMethod : {
        #roundBased;
        #endOfGame;
      };
    };
    gameSessions : Map.Map<Nat, {
      id : Nat;
      gameType : {
        #skyjo : {
          rulesSummary : Text;
          gameEndCondition : Text;
          scoringMethod : {
            #roundBased;
            #endOfGame;
          };
        };
        #milleBornes : {
          rulesSummary : Text;
          gameEndCondition : Text;
          scoringMethod : {
            #roundBased;
            #endOfGame;
          };
        };
        #nerts : {
          rulesSummary : Text;
          gameEndCondition : Text;
          scoringMethod : {
            #roundBased;
            #endOfGame;
          };
          scoringDetails : Text;
          winTarget : Nat;
        };
        #flip7 : {
          rulesSummary : Text;
          gameEndCondition : Text;
          scoringMethod : {
            #roundBased;
            #endOfGame;
          };
          targetScore : Nat;
        };
        #phase10 : {
          rulesSummary : Text;
          gameEndCondition : Text;
          scoringMethod : {
            #roundBased;
            #endOfGame;
          };
          scoringDetails : Text;
          winTarget : Nat;
        };
        #genericGame : {
          rulesSummary : Text;
          gameEndCondition : Text;
          scoringMethod : {
            #roundBased;
            #endOfGame;
          };
        };
      };
      players : [{
        id : Nat;
        name : Text;
        gamesPlayed : Nat;
        wins : Nat;
        averageScore : Nat;
        totalScore : Nat;
        owner : Principal.Principal;
      }];
      rounds : [{
        roundNumber : Nat;
        playerScores : [{
          playerId : Nat;
          score : Nat;
        }];
      }];
      finalScores : ?[{
        playerId : Nat;
        score : Nat;
      }];
      createdAt : Int;
      isActive : Bool;
      owner : Principal.Principal;
      nertsWinTarget : ?Nat;
      flip7TargetScore : ?Nat;
      phase10WinTarget : ?Nat;
      phase10Progress : ?[{
        playerId : Nat;
        currentPhase : Nat;
      }];
    }>;
    playerProfiles : Map.Map<Nat, {
      id : Nat;
      name : Text;
      gamesPlayed : Nat;
      wins : Nat;
      averageScore : Nat;
      totalScore : Nat;
      owner : Principal.Principal;
    }>;
    userProfiles : Map.Map<Principal.Principal, {
      name : Text;
      email : ?Text;
    }>;
    nextGameId : Nat;
    nextUserId : Nat;
    spiritsOfTheWildAnimals : Map.Map<Nat, SpiritsOfTheWildAnimal>;
    spiritsOfTheWildAnimalPlayers : Map.Map<Nat, [Nat]>;
  };

  public func run(old : OldActor) : NewActor {
    {
      accessControlState = old.accessControlState;
      skyjoRules = old.skyjoRules;
      milleBornesRules = old.milleBornesRules;
      nertsRules = old.nertsRules;
      phase10Rules = old.phase10Rules;
      flip7Rules = old.flip7Rules;
      genericGameRules = old.genericGameRules;
      gameSessions = old.gameSessions;
      playerProfiles = old.playerProfiles;
      userProfiles = old.userProfiles;
      nextGameId = old.nextGameId;
      nextUserId = old.nextUserId;
      spiritsOfTheWildAnimals = initializeAnimals();
      spiritsOfTheWildAnimalPlayers = Map.empty<Nat, [Nat]>();
    };
  };

  func initializeAnimals() : Map.Map<Nat, SpiritsOfTheWildAnimal> {
    let animalMap = Map.empty<Nat, SpiritsOfTheWildAnimal>();
    animalMap.add(
      0,
      {
        id = 0;
        name = "Spirit Owl";
        icon = "🦉";
      },
    );
    animalMap.add(
      1,
      {
        id = 1;
        name = "Spirit Wolf";
        icon = "🐺";
      },
    );
    animalMap.add(
      2,
      {
        id = 2;
        name = "Spirit Raven";
        icon = "🐦";
      },
    );
    animalMap.add(
      3,
      {
        id = 3;
        name = "Spirit Fox";
        icon = "🦊";
      },
    );
    animalMap.add(
      4,
      {
        id = 4;
        name = "Spirit Bear";
        icon = "🐻";
      },
    );
    animalMap.add(
      5,
      {
        id = 5;
        name = "Spirit Rabbit";
        icon = "🐇";
      },
    );
    animalMap.add(
      6,
      {
        id = 6;
        name = "Spirit Turtle";
        icon = "🐢";
      },
    );
    animalMap;
  };
};
