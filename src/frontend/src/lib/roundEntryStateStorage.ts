import type { RoundEntryState } from './sessionTypes';

/**
 * Generate a storage key for a round's entry state
 */
function getStorageKey(sessionId: string, gameType: string, roundNumber: number): string {
  return `round-entry-${sessionId}-${gameType}-${roundNumber}`;
}

/**
 * Save round entry state to sessionStorage
 */
export function saveRoundEntryState(
  sessionId: string,
  gameType: string,
  roundNumber: number,
  entryState: RoundEntryState
): void {
  try {
    const key = getStorageKey(sessionId, gameType, roundNumber);
    const serialized = serializeEntryState(entryState);
    sessionStorage.setItem(key, serialized);
  } catch (error) {
    console.error('Failed to save round entry state:', error);
  }
}

/**
 * Load round entry state from sessionStorage with backward compatibility fallback
 */
export function loadRoundEntryState(
  sessionId: string,
  gameType: string,
  roundNumber: number
): RoundEntryState | undefined {
  try {
    const key = getStorageKey(sessionId, gameType, roundNumber);
    const serialized = sessionStorage.getItem(key);
    
    if (serialized) {
      return deserializeEntryState(serialized);
    }

    // Backward compatibility: if gameType is 'spiritsOwl' and no state found,
    // try loading from legacy 'genericGame' key
    if (gameType === 'spiritsOwl') {
      const legacyKey = getStorageKey(sessionId, 'genericGame', roundNumber);
      const legacySerialized = sessionStorage.getItem(legacyKey);
      if (legacySerialized) {
        return deserializeEntryState(legacySerialized);
      }
    }

    return undefined;
  } catch (error) {
    console.error('Failed to load round entry state:', error);
    return undefined;
  }
}

/**
 * Clear all round entry states for a session
 */
export function clearSessionEntryStates(sessionId: string): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(`round-entry-${sessionId}-`)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => sessionStorage.removeItem(key));
  } catch (error) {
    console.error('Failed to clear session entry states:', error);
  }
}

/**
 * Serialize entry state to JSON string
 */
function serializeEntryState(entryState: RoundEntryState): string {
  const serializable = {
    type: entryState.type,
    state: mapToObject(entryState.state),
  };
  return JSON.stringify(serializable);
}

/**
 * Deserialize entry state from JSON string
 */
function deserializeEntryState(serialized: string): RoundEntryState {
  const parsed = JSON.parse(serialized);
  return {
    type: parsed.type,
    state: objectToMap(parsed.state),
  } as RoundEntryState;
}

/**
 * Convert Map to plain object for serialization
 */
function mapToObject(map: any): any {
  if (map instanceof Map) {
    const obj: any = {};
    map.forEach((value, key) => {
      obj[key] = mapToObject(value);
    });
    return obj;
  } else if (Array.isArray(map)) {
    return map.map(mapToObject);
  } else if (typeof map === 'object' && map !== null) {
    const obj: any = {};
    Object.keys(map).forEach((key) => {
      obj[key] = mapToObject(map[key]);
    });
    return obj;
  }
  return map;
}

/**
 * Convert plain object back to Map for deserialization
 */
function objectToMap(obj: any): any {
  if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
    const map = new Map();
    Object.keys(obj).forEach((key) => {
      map.set(key, objectToMap(obj[key]));
    });
    return map;
  } else if (Array.isArray(obj)) {
    return obj.map(objectToMap);
  }
  return obj;
}
