import crypto from "crypto"
import assert from "assert"
import Module from "./bcrypt"

const _genSalt = Module.cwrap("gen_salt", "string", ["string", "number", "array"])
const _encrypt = Module.cwrap("encrypt", "string", ["string", "number", "string"])
const _compare = Module.cwrap("compare", "boolean", ["string", "number", "string"])
const _getRounds = Module.cwrap("get_rounds", "number", ["string"])

/**
 * Generate a salt
 * @param rounds number of rounds (default 10)
 */
export function genSalt(rounds = 10, minor: "a" | "b" = "b"): string {
  assert(isNumber(rounds), "rounds must be a number")
  assert(minor === "a" || minor === "b", 'minor must be either "a" or "b"')

  return _genSalt(minor, rounds, crypto.randomBytes(16))
}

/**
 * Hash data using a salt
 * @param data the data to encrypt
 * @param salt the salt to use when hashing
 */
export function hash(data: string, salt: string): string {
  assert(data != null && salt != null, "data and salt arguments required")
  assert(isString(data), "data must be a string")
  assert(
    isString(salt) || isNumber(salt),
    "salt must either be a salt string or a number of rounds"
  )

  if (isNumber(salt)) {
    salt = genSalt(salt)
  }

  const encrypted = _encrypt(data, data.length, salt)
  if (encrypted === "INVALID_SALT") {
    throw new Error(
      "Invalid salt. Salt must be in the form of: $Vers$log2(NumRounds)$saltvalue"
    )
  }

  return encrypted
}

/**
 * Compare raw data to hash
 * @param data the data to hash and compare
 * @param hash expected hash
 * @return true if hashed data matches hash
 */
export function compare(data: string, hash: string): boolean {
  assert(data !== null && hash !== null, "data and hash arguments required")
  assert(isString(data), "data must be a string")
  assert(isString(hash), "hash must be a string")

  return _compare(data, data.length, hash)
}

/**
 * @param hash extract rounds from this hash
 * @return the number of rounds used to encrypt a given hash
 */
export function getRounds(hash: string): number {
  assert(hash !== null, "hash arguments required")
  assert(isString(hash), "hash must be a string")

  const round = _getRounds(hash)
  if (!round) {
    throw new Error("Invalid hash provided: " + round)
  }

  return _getRounds(hash)
}

function isString(value: any): value is string {
  return typeof value === "string"
}

function isNumber(value: any): value is number {
  return typeof value === "number"
}
