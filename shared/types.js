/** @typedef {'waiting' | 'playing' | 'round_feedback' | 'finished'} GamePhase */

/**
 * @typedef {Object} Player
 * @property {string} id
 * @property {string} name
 * @property {number} score
 * @property {number} slot - 0 or 1
 */

/**
 * @typedef {Object} NumberPos
 * @property {number} value
 * @property {number} x - percent 0-100
 * @property {number} y - percent 0-100
 */

/**
 * @typedef {Object} RoundFeedback
 * @property {string} playerId
 * @property {string} playerName
 * @property {number} slot
 * @property {number} target
 */

/**
 * @typedef {Object} GameState
 * @property {string} roomCode
 * @property {GamePhase} phase
 * @property {Player[]} players
 * @property {number} target
 * @property {NumberPos[]} board
 * @property {number[]} claimed
 * @property {RoundFeedback | null} lastWinner
 * @property {number | null} winnerSlot - 0, 1, or -1 for draw; null if not finished
 * @property {boolean} boardLocked
 */

export {};
