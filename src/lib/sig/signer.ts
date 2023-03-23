import { Buff, Bytes }  from '@cmdcode/buff-utils'
import { Field, Point } from '@cmdcode/crypto-utils'
import { hashTag, safeThrow } from '../utils.js'

const FIELD_SIZE  = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2Fn
const CURVE_ORDER = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141n

export function sign (
  secret  : Bytes,
  message : Bytes,
  rand    : Bytes = Buff.random(32)
) : Buff {
  /**
   * Implementation of signature algorithm as specified in BIP340.
   * https://github.com/bitcoin/bips/blob/master/bip-0340.mediawiki
   */
  // Normalize our message into bytes.
  const m = Buff.normalize(message)
  // Let d' equal the integer value of secret key.
  const dp = new Field(secret)
  // Let P equal d' * G
  const P  = dp.point
  // If P has an odd Y coordinate, return negated version of d'.
  const d  = (P.hasEvenY) ? dp.big : dp.negated.big
  // Hash the auxiliary data according to BIP 0340.
  const a  = hashTag('BIP0340/aux', Buff.normalize(rand))
  // Let t equal the byte-wise xor of (d) and (a).
  const t  = d ^ a.big
  // Let our nonce value equal the tagged hash('BIP0340/nonce', t || P || m).
  const n  = hashTag('BIP0340/nonce', t, P.rawX, m)
  // Let k' equal our nonce mod N.
  const kp = new Field(n)
  // Let R equal k' * G.
  const R  = kp.point
  // If R has an odd Y coordinate, return negated version of k'.
  const k  = (R.hasEvenY) ? kp.big : kp.negated.big
  // Let e equal the tagged hash('BIP0340/challenge' || R || P || m) mod n.
  const e  = new Field(hashTag('BIP0340/challenge', R.rawX, P.rawX, m))
  // Let s equal (k + ed) mod n.
  const s  = new Field(k + (e.big * d))
  // Return (R || s) as a signature
  return Buff.join([ R.rawX, s.raw ])
}

export function verify (
  signature : Bytes,
  message   : Bytes,
  pubkey    : Bytes,
  shouldThrow = false
) : boolean {
   /**
   * Implementation of verification algorithm as specified in BIP340.
   * https://github.com/bitcoin/bips/blob/master/bip-0340.mediawiki
   */
  // Get the Point value for pubkey.
  const P = new Point(pubkey)
  // Normalize the message into bytes.
  const m = Buff.normalize(message)
  // Convert signature into a stream object.
  const stream = Buff.bytes(signature).stream
  // Check if the signature size is at least 64 bytes.
  if (stream.size < 64) {
    safeThrow('Signature length is too small: ' + String(stream.size), shouldThrow)
  }
  // Let r equal first 32 bytes of signature.
  const r = stream.read(32)
  // Fail if r > p (field size).
  if (r.big > FIELD_SIZE) {
    safeThrow('Signature r value greater than field size!', shouldThrow)
  }
  // Let s equal next 32 bytes of signature.
  const s = stream.read(32)
  // Fail if s > n (curve order).
  if (s.big > CURVE_ORDER) {
    safeThrow('Signature s value greater than curve order!', shouldThrow)
  }
  // Let e equal the tagged hash('BIP0340/challenge' || R || P || m) mod n.
  const e = new Field(hashTag('BIP0340/challenge', r.raw, P.rawX, m))
  // Let R equal s * G - eP.
  const sG = new Field(s).point
  const eP = P.mul(e.big)
  const R  = sG.sub(eP)
  // Reject if R value has an odd Y coordinate.
  if (R.hasOddY) {
    safeThrow('Signature R value has odd Y coordinate!', shouldThrow)
  }
  // Reject if R value is infinite.
  if (R.x === 0n) {
    safeThrow('Signature R value is infinite!', shouldThrow)
  }
  // Return if x coordinate of R value equals r.
  return R.x === r.big
}

// function lift_x (pubkey : Bytes) : Point {
//   const x = Buff.bytes(pubkey).big
//   if (x >= Field.N) {
//     throw new Error('Point X value is greater than field size!')
//   }
//   const p    = FIELD_SIZE
//   const y_sq = (pow(x, 3n, p) + 7n) % p
//   const yp   = pow(y_sq, (p + 1n) / 4n, p)
//   if (pow(yp, 2n, p) !== y_sq) {
//     throw new Error('Point value is at infinity!')
//   }
//   const y = ((yp & 1n) === 0n) ? yp : p - yp
//   return new Point(x, y)
// }

// function pow (
//   x : bigint,
//   e : bigint,
//   n = Field.N
// ) : bigint {
//   // Wrap starting value to field size.
//   e = Field.mod(e, n)
//   // If x value is zero, return zero.
//   if (x === 0n) return 0n
//   // Initialize result as 1.
//   let res = 1n
//   // While e value is greater than 0:
//   while (e > 0n) {
//     // If e value is odd, multiply x with result.
//     if ((e & 1n) === 1n) {
//       res = Field.mod(res * x, n)
//     }
//     // With e value being even, (e = e / 2).
//     e = e >> 1n
//     // Update x value.
//     x = Field.mod(x * x, n)
//   }
//   return res
// }
