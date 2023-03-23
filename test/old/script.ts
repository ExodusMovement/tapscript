export {}

// import { Stream } from './format/bytes.js'
// import { isValidCode } from './validate.js'
// import { getOpName, getOpCode } from './words.js'
// import Base58 from './format/base58.js'
// import Convert from './format/convert.js'
// import Crypto from './crypto/index.js'
// import Bech32 from './format/bech32.js'

// const { Hash } = Crypto

// const scriptRegex = {
//   p2pkh: /^76a914(?<hash>\w{40})88ac$/,
//   p2sh: /^a914(?<hash>\w{40})87$/,
//   p2wpkh: /^0014(?<hash>\w{40})$/,
//   p2wsh: /^0020(?<hash>\w{64})$/,
//   p2tr: /^0120(?<hash>\w{64})$/
// }

// function getScriptType(script) {
//   for (const p in scriptRegex) {
//     if (scriptRegex[p].test(script)) {
//       return p
//     }
//   }
//   return 'unknown'
// }

// export function addScriptSigMeta(script) {
//   const { hex } = script
//   const scriptAsm = decodeScript(hex)
//   const scriptType = getScriptType(hex)
//   const isValidSig = checkScriptSig(scriptAsm)

//   switch (true) {
//     case (scriptType):
//       script.type = 'p2sh-' + scriptType
//       break
//     case (scriptAsm.length === 2 && isValidSig):
//       script.type = 'p2pkh'
//       break
//     default:
//       script.type = null
//   }

//   script.asm = scriptAsm
//   script.isValidSig = isValidSig
// }

// export function addScriptPubMeta(script) {
//   const { hex } = script
//   const scriptType = getScriptType(hex)
//   script.asm = decodeScript(hex)
//   script.type = scriptType
//   script.address = getPayAddress(hex, scriptType)
// }

// export async function addWitScriptMeta(witness) {
//   if (witness.data.length > 2) {
//     const script = witness.data.pop()
//     const hash = await getScriptHash(script, 'p2wsh')
//     witness.type = 'p2wsh'
//     witness.hex = script
//     witness.asm = decodeScript(script)
//     witness.hash = hash
//     witness.template = await getTemplateHash(script)
//     witness.address = getPayAddress('0020' + hash, 'p2wsh')
//   } else {
//     witness.type = 'p2wpkh'
//     // witness.address = getPayAddress('0014' + witness.data[1], 'p2wpkh')
//     witness.isValidSig = checkScriptSig(witness.data)
//   }
// }

// function getPayAddress(script, scriptType) {
//   const regex = scriptRegex[scriptType]
//   const { groups } = script.match(regex)

//   if (groups?.hash) {
//     const { hash } = groups
//     switch (true) {
//       case (scriptType === 'p2pkh'):
//         return Base58.encode(hash)
//       case (scriptType.startsWith('p2sh')):
//         return Base58.encode(hash)
//       case (scriptType.startsWith('p2w')):
//         return Bech32.encode('bcrt', Convert.from(hash, 'hex').toBytes())
//       case (scriptType === 'p2tr'):
//         return Bech32.encode('tr', Convert.from(hash, 'hex').toBytes(), 1)
//       default:
//         return null
//     }
//   } else {
//     return null
//   }
// }

// function checkScriptSig(scriptAsm) {
//   // const [signature, pubkey] = scriptAsm
//   // also need to get sighash of tx
//   return null
// }

// export async function getScriptHash(script, fmt) {
//   let res
//   switch (fmt) {
//     case 'p2pkh':
//       res = Hash.hash160(Convert.hex(script))
//       break
//     case 'p2sh':
//       res = Hash.hash160(Convert.hex(script))
//       break
//     case 'p2wsh':
//       res = Hash.hash256(Convert.hex(script))
//       break
//     default:
//       throw new Error('Invalid format: ' + fmt)
//   }
//   return Convert.bytes(await res).toHex()
// }

// export async function getTemplateHash(script) {
//   const scriptAsm = decodeScript(script)
//   const template = scriptAsm.map(word => {
//     word = convertCode(word)
//     if (isValidCode(word)) {
//       return word
//     }
//     return 0x01
//   })

//   return Convert.bytes(await Hash.sha256(Uint8Array.from(template))).toHex()
// }

// export function convertCode(word) {
//   /** Check if the word is a valid opcode,
//    *  and return its integer value.
//    */
//   if (
//     typeof (word) === 'string' &&
//     word.startsWith('OP_')
//   ) {
//     return Number(getOpCode(word))
//   }
//   return word
// }
