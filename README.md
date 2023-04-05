# Tapscript Tools

A basic library for working with Tapscript, Schnorr Signatures, and Bitcoin transactions.

## Introduction

Tapscript uses some pretty cutting-edge stuff. If you are new to tapscript, please continue reading for a brief overview of how tapscript works. The library will make more sense if you have a general idea about what is happening under the hood.

If you already have a good understanding of tapscript, feel free to skip ahead by clicking [here](##-Library-Index)).

## What is Tapscript?

Bitcoin uses a simple scripting language that allows you to lock up coins into a contract. These contracts are published to the blockchain and enforced by all nodes in the network.

In order to settle a contract (and claim its coins), you are required to publish the *entire* contract, including parts that are not relevant to the settlement. This is expensive and wasteful, plus it leaks information that could have otherwise been kept private.

Tapscript is a new way to publish these contracts to the blockchain that fixes the above concerns. It allows you to settle contracts by publishing only the portion of the contract that is relevant. This means smaller transactions, cheaper fees, and better privacy guarantees for the contract as a whole.

Tapscript also comes with many other benefits, including:

 * It drastically simplifies the flow and logic of writing a contract.
 * You can create large, complex contracts that only need a small transaction to settle.
 * Commitments to data and other arbitrary things can be thrown into your contract for free.
 * The new schnorr-based signature format lets you do some crazy cool stuff (BIP340).

These new features came with the Taproot upgrade in 2019. Read more about it [here](https://cointelegraph.com/bitcoin-for-beginners/a-beginners-guide-to-the-bitcoin-taproot-upgrade).

## How does Taproot work?

Taproot uses a simple trick involving something called a "merkle tree".

```
                hash(ab, cd)                  <- Final hash    (the root)
              /             \                
      hash(a, b)             hash(c, d)       <- Combined hash (the branches)
     /          \           /          \    
    hash(a) hash(b)        hash(c) hash(d)    <- Initial hash  (the leaves)
[ script(a), script(b), script(c), script(d) ]  
```

A merkle tree is simply a list of data that is reduced down into a single hash. We do this by hashing items together in pairs of two, repeatedly, until we are naturally left with one item (the root).

The great thing about merkle trees is that you can use the root hash to prove that a piece of data (such as a script) was included somewhere in the tree, without having to reveal the entire tree.

For example, to prove that script(a) exists in the tree, we simply provide hash(b) and hash(c, d). This is all the information we need to recreate the root hash(ab, cd). We do not reveal any of the other scripts.

This allows us to break up a contract into many scripts, then lock coins to the root hash of our combined scripts. To redeem coins, we simply need to provide one of the scripts, plus a 'path' of hashes that let us to recompute the root of the tree.

## About Key Tweaking

Another clever trick that tapscript uses, is something called "key tweaking".

Typically, we create a pair of signing keys by multiplying a secret number with a prime number called a "generator" (G). This process is done in a way that is computationally impossible to reverse without knowing the secret.

```
seckey * G => pubkey
```

We use a special set of numbers when making key-pairs, so that some arithmetic still works between the keys, without breaking their secret relationship with G. This is how we produce signatures and proofs.

```
seckey +    randomkey    +    msg    = signature      <= Does not reveal seckey.
pubkey + (randomkey * G) + (msg * G) = signature * G  <= Proves that seckey was used.
```

Key tweaking is just an extention of this. We use a piece of data to "tweak" both keys in our key-pair, then use the modified keys to sign and verify transactions.

```
seckey +    tweak    =    tweakedkey    = tweakedsec
pubkey + (tweak * G) = (tweakedkey * G) = tweakedpub
```

Later, we can choose to reveal the original public key and tweak, with a proof that both were used to construct the modified key. Or we can simply choose to sign using the modified key, and not reveal anything!

Tapscript uses key tweaking in order to lock coins to the root hash of our script tree. This provides us with two paths for spending coins:

 * Using the tweaked key (without revealing anything).
 * Using the interal key + script + proof.

You can also create tweaked keys using an internal pubkey that has a provably unknown secret key. This is useful for locking coins so that they cannot ever be spent with a tweaked key, and *must* be redeemed using a script!

## Tool Index

This library provides a suite of tools for working with scripts, taproot, key tweaking, signatures and transactions. Use the links below to jump to the documentation for a certain tool.

[**Address Tool**](###-Address-Tool)  
Encode, decode, check, and convert various address types.  
[**Script Tool**](###-Script-Tool)  
Encode scripts into hex, or decode into a script array.  
[**Signer Tool**](###-Signer-Tool)  
Produce signatures and validate signed transactions.  
[**Tap Tool**](###-Tap-Tool)  
Build, tweak, and validate trees of data / scripts.  
[**Tx Tool**](###-Tx-Tool)  
Encode transactions into hex, or decode into a JSON object.  

### Import

Example import into a browser-based project:
```html
<script src="https://unpkg.com/@cmdcode/tapscript"></script>
<script> const { Address, Script, Signer, Tap, Tx } = window.tapscript </script>
```
Example import into a commonjs project:
```ts
const { Address, Script, Signer, Tap, Tx } = require('@cmdcode/tapscript')
```
Example import into an ES module project:
```ts
import { Address, Script, Signer, Tap, Tx } from '@cmdcode/tapscript'
```

### Address Tool

This tool allows you to encode, decode, check, an convert various address types.

```ts
Address = {
  // Work with Pay-to-Pubkey-Hash addresses (Base58 encoded).
  p2pkh : => AddressTool,
  // Work with Pay-to-Script-Hash addresses (Base58 encoded).
  p2sh  : => AddressTool,
  // Work with Pay-to-Witness addresses (Bech32 encoded).
  p2w   : => AddressTool,
  // Work with Pay-to-Taproot addresses (Bech32m encoded).
  p2tr  : => AddressTool,
  // Decode any address format into a detailed object.
  decode   : (address : string) => AddressData,
  // Convert any address into its scriptPubKey format.
  toScript : (address : string) => Buff
}

interface AddressTool {
  // Check if an address is valid.
  check  : (address : string, network ?: Networks) => boolean
  // Encode a pubkey or script hash into an address.
  encode : (key     : Bytes,  network ?: Networks) => string
  // Decode an address into a pubkey or script hash.
  decode : (address : string, network ?: Networks) => Buff
  // Return the scriptPubKey script for an address type.
  script : (key : string) => string[]
}

interface AddressData {
  data    : Buff
  network : Networks
  prefix  : string
  script  : string[]
  type    : keyof AddressTools
}

type Networks = 'main' | 'testnet' | 'signet' | 'regtest'
```

#### Examples

Example of using the main `Address` API.

```ts
const address = 'bcrt1q738hdjlatdx9xmg3679kwq9cwd7fa2c84my9zk'
// You can decode any address, extract data, or convert to a scriptPubKey format.
const decoded = Address.decode(address)
// Example of the decoded data object.
{ 
  prefix  : 'bcrt1q', 
  type    : 'p2w', 
  network : 'regtest', 
  data    : 'f44f76cbfd5b4c536d11d78b6700b8737c9eab07',
  script  : [ 'OP_0', 'f44f76cbfd5b4c536d11d78b6700b8737c9eab07' ]
}
// You can also quickly convert any address into a scriptPubKey format.
const bytes = Address.toScript(address)
// Bytes: 0014f44f76cbfd5b4c536d11d78b6700b8737c9eab07
```

Example of using the AddressTool API for a given address type.

```ts
// Example 33-byte public key.
const pubkey  = '03d5af2a3e89cb72ff9ca1b36091ca46e4d4399abc5574b13d3e56bca6c0784679'
// You can encode / decode / convert keys and script hashes.
const address = Address.p2w.encode(pubkey, 'regtest')
// Address: bcrt1q738hdjlatdx9xmg3679kwq9cwd7fa2c84my9zk
const bytes   = Address.p2w.decode(address)
// KeyHash: f44f76cbfd5b4c536d11d78b6700b8737c9eab07
const script  = Address.p2w.script(bytes)
// script: script: [ 'OP_0', 'f44f76cbfd5b4c536d11d78b6700b8737c9eab07' ]
```

### Script Tool

This tool helps with parsing / serializing scripts.

```ts
Script = {
  // Encode a JSON formatted script into hex.
  encode : (script : ScriptData, varint = true) => string,
  // Decode a hex formatted script into JSON.
  decode : (script : string, varint = false)    => ScriptData
  // Normalize script / data to a particular format:
  fmt : {
    // Convert script to opcodes / hex data (asm format).
    toAsm()   => string[]  (asm format).
    // Convert script to bytes (script hex).
    toBytes() => Buff
     // Convert non-script witness data to bytes.
    toParam() => Buff  
  }
}
```

### Signature Tool.

This tool helps with signatures and validation.

```ts
Signer.taproot = {
  // Calculate the signature hash for a transaction.
  hash : (
    txdata  : TxData | Bytes,
    index   : number,
    config  : HashConfig = {}
  ) => Uint8Array,
  // Sign a transaction using your *tweaked* private key.
  sign : (
    seckey  : Bytes,
    txdata  : TxData | Bytes,
    index   : number,
    config  : HashConfig = {}
  ) => Uint8Array,
  // Verify a transaction using the included tapkey (or specify a pubkey).
  verify : (
    txdata  : TxData | Bytes,
    index   : number,
    config  : HashConfig = {}
  ) => boolean
}

interface HashConfig {
  extension     ?: Bytes    // Hash and sign using this tapleaf.
  pubkey        ?: Bytes    // Verify using this pubkey instead of the tapkey.
  script        ?: Bytes    // Hash and sign using this script (for segwit spends).
  sigflag       ?: number   // Set the signature type flag.
  separator_pos ?: number   // If using OP_CODESEPARATOR, specify the latest opcode position.
  extflag       ?: number   // Set the extention version flag (future use).
  key_version   ?: number   // Set the key version flag (future use).
  throws        ?: boolean  // Should throw an exception on failure.
}
```

> Note: There is also a nearly identical `Signer.segwit` tool for signing and validating segwit (BIP1043) transactions.

### Tap Tool

```ts
Tap = {
  // Returns the tweaked public key (and cblock) for a given tree (and target).
  getPubKey : (pubkey : Bytes, config ?: TapConfig) => TapKey,
  // Returns the tweaked secret key (and cblock) for a given tree (and target).
  getSecKey : (seckey : Bytes, config ?: TapConfig) => TapKey,
  // Checks the validity of a given leaf target and control block.
  checkPath : (tapkey : Bytes, target : Bytes, cblock : Bytes, config ?: TapConfig) => boolean,
  // Gives access to the various sub-tools (described below).
  tree  : TreeTool,
  tweak : TweakTool,
  util  : UtilTool
}

interface TapConfig {
  isPrivate ?: boolean
  target    ?: Bytes
  tree      ?: TapTree
  throws    ?: boolean
  version   ?: number
}

type TapKey = [
  tapkey : string,  // The tweaked public key.
  cblock : string   // The control block needed for spending the tapleaf target.
]
```

#### Examples

Example of tapping a key with no scripts (key-spend).

```ts
const [ tapkey ] = Tap.getPubKey(pubkey)
```

Example of tapping a key with a single script and returning a proof.

```ts
// Encode the script as bytes.
const bytes = Script.encode([ 'script' ])
// Convert the bytes into a tapleaf.
const target = Tap.tree.getLeaf(bytes)
// Provide the tapleaf as a target for generating the proof.
const [ tapkey, cblock ] = Tap.getPubKey(pubkey, { target })
```

Example of tapping a key with many scripts.

```ts
const scripts = [
  [ 'scripta' ],
  [ 'scriptb' ],
  [ 'scriptc' ]
]

// Convert the scripts into an array of tap leaves.
const tree = scripts
  .map(e => Script.encode(e))
  .map(e => Tap.tree.getLeaf(e))

// Optional: You can also add data to the tree.
const bytes = encodeData('some data')
const leaf  = Tap.tree.getLeaf(bytes)
tree.push(leaf)

// Select a target leaf for generating the proof.
const target = tree[0]

// Provide the tree and target leaf as arguments.
const [ tapkey, cblock ] = Tap.getPubKey(pubkey, { tree, target })
```

### Tree Tool

This tool helps with creating a tree of scripts / data, plus the proofs to validate items in the tree.

```ts
Tap.tree = {
  // Returns a 'hashtag' used for padding. Mainly for internal use.
  getTag    : (tag : string) => Buff,
  // Returns a 'tapleaf' used for building a tree. 
  getLeaf   : (data : Bytes, version ?: number) => string,
  // Returns a 'branch' which combines two leaves (or branches).
  getBranch : (leafA : string, leafB : string) => string,
  // Returns the root hash of a tree.
  getRoot   : (leaves : TapTree) => Buff,
}

// A tree is an array of leaves, formatted as strings.
// These arrays can also be nested in multiple layers.
type TapTree = Array<string | string[]>
```

### Tweak Tool

This tool helps with tweaking public / secret (private) keys.

```ts
Tap.tweak = {
  // Return a tweaked private key using the provided raw data.
  getSeckey   : (seckey: Bytes, data ?: Bytes | undefined) => Buff,
  // Return a tweaked public key using the provided raw data.
  getPubkey   : (pubkey: Bytes, data ?: Bytes | undefined) => Buff,
  // Return a 'taptweak' which is used for key tweaking.
  getTweak    : (key : Bytes, data ?: Bytes, isPrivate ?: boolean) => Buff,
  // Return a tweaked secret key using the provided tweak.
  tweakSeckey : (seckey: Bytes, tweak: Bytes) => Buff,
  // Return a tweaked public key using the provided tweak.
  tweakPubkey : (seckey: Bytes, tweak: Bytes) => Buff
}
```

### Util Tool

This tool provides helper methods for reading and parsing data related to taproot.

```ts
Tap.util = {
  readCtrlBlock : (cblock : Bytes) => CtrlBlock,
  readParityBit : (parity ?: string | number) => number
}

interface CtrlBlock {
  version : number
  parity  : number
  intkey  : Buff
  paths   : string[]
}
```

### Tx Tool

This tool helps with parsing / serializing transaction data.

```ts
Tx = {
  // Serializes a JSON transaction into a hex-encoded string.
  encode : (
    txdata       : TxData,  // The transaction JSON.
    omitWitness ?: boolean  // If you wish to omit the witness data.
  ) => string,
  // Parses a hex-encoded transaction into a JSON object.
  decode : (bytes : string | Uint8Array) => TxData,
  // Normalize transaction data to a particular format.
  fmt : {
    // Convert transaction data into JSON format.
    toJson  : (txdata ?: TxData | Bytes) => TxData,
    // Convert transaction data into a byte format.
    toBytes : (txdata ?: TxData | Bytes) => Buff
  },
  util : {
    // Get the transaction Id of a transaction.
    getTxid     : (txdata : TxData | Bytes) => Buff,
    // Parse an array of witness data into named values.
    readWitness : (witness : ScriptData[])  => WitnessData
  }
}

interface TxData {
  version  : number           // The transaction verion.
  vin      : InputData[]      // Ann array of transaction inputs.
  vout     : OutputData[]     // An array of transaction outputs.
  locktime : LockData         // The locktime of the transaction.
}

interface InputData {
  txid : string               // The txid of the UTXO being spent.
  vout : number               // The output index of the UTXO being spent.
  prevout   ?: OutputData     // The output data of the UTXO being spent.
  scriptSig ?: ScriptData     // The ScriptSig field (mostly deprecated).
  sequence  ?: SequenceData   // The sequence field for the input.
  witness   ?: ScriptData[]   // An array of witness data for the input.
}

interface OutputData {
  value : number | bigint     // The satoshi value of the output.
  scriptPubKey ?: ScriptData  // The locking script data.
  address      ?: string      // (optional) provide a locking script
}                             // that is encoded as an address.

interface WitnessData {
  annex  : Uint8Array | null  // The annex data (if present) or null.
  cblock : Uint8Array | null  // The control block (if present) or null.
  script : Uint8Array | null  // The redeem script (if present) or null.
  params : Bytes[]            // Any remaining witness arguments.
}

type SequenceData = string | number
type LockData     = number
type ScriptData   = Bytes  | Word[]
type Word         = string | number | Uint8Array
type Bytes        = string | Uint8Array
```

#### Transaction Object

This is an example transaction in JSON format.

```ts
const txdata = {
  version : 2
  vin: [
    {
      txid     : '1351f611fa0ae6124d0f55c625ae5c929ca09ae93f9e88656a4a82d160d99052',
      vout     : 0,
      prevout  : { 
        value: 10000,
        scriptPubkey: '512005a18fccd1909f3317e4dd7f11257e4428884902b1c7466c34e7f490e0e627da'
        
      },
      sequence : 0xfffffffd,
      witness  : []
    }
  ],
  vout : [
    { 
      value: 9000, 
      address: 'bcrt1pqksclnx3jz0nx9lym4l3zft7gs5gsjgzk8r5vmp5ul6fpc8xyldqaxu8ys'
    }
  ],
  locktime: 0
}
```

## Example Transactions

Here are a few examples to help demonstrate using the library. Please feel free to contribute more!

### Create / Publish an Inscription

Creating an inscription is a three-step process:
 1. We create a script for publishing the inscription, and convert it into a bitcoin address.
 2. Send funds to the bitcoin address.
 3. Create a redeem transaction, which claims the previous funds (and publishes the data).

```ts
import { Address, Script, Signer, Tap, Tx } from '@cmdcode/tapscript'

/** 
 * Creating an Inscription. 
 */

// Provide your secret key.
const seckey = 'your secret key (in bytes)'
// There's a helper method to derive your pubkey.
const pubkey = 'your x-only public key (in bytes)'

// We have to provide the 'ord' marker,
// a mimetype for the data, and the blob
// of data itself (as hex or a Uint8Array).
const marker   = ec.encode('ord')        // The 'ord' marker.
const mimetype = ec.encode('image/png')  // The mimetype of the file.
const imgdata  = getFile('image.png')    // Fake method that fetches the file (and returns bytes). 

const script   = [
  // A basic "inscription" script. The script encoder will automatically 
  // break up large blobs of data and insert 'OP_PUSHDATA' where needed.
  pubkey, 'OP_CHECKSIG', 'OP_0', 'OP_IF', marker, '01', mimetype, 'OP_0', imgdata, 'OP_ENDIF'
]

// Encode the script as hex data.
const bytes = Script.encode(script)
// Convert the script into a tapleaf.
const target = Tap.tree.getLeaf(sbytes)
// Pass your pubkey and your leaf in order to get the tweaked pubkey.
const [ tapkey, cblock ] = Tap.getPubKey(pubkey, { target })
// Encode the tweaked pubkey as a bech32m taproot address.
const address = Address.p2tr.encode(tapkey)

// Once you send funds to this address, please make a note of 
// the transaction's txid, and vout index for this address.
console.log('Your taproot address:', address)

/** 
 * Publishing an Inscription. 
 */

// Construct our redeem transaction.
const txdata = {
  version : 2
  vin: [
    {
      txid     : 'replace with the txid of your previous transaction.',
      vout     : 'replace with the vout index spending to the previous address.',
      prevout  : {
        value: 'replace with the amount sent to this address from the previous transaction',
        scriptPubKey: Address.toScript(address)
      },
      sequence : 0xfffffffd,
      witness  : []
    }
  ],
  vout : [
    { 
      value: 'replace with the amount sent from the previous transaction, minus fees (for the miners)', 
      scriptPubKey: Address.toScript('replace with an address of your choice!')
    }
  ],
  locktime: 0
}

// Create a signature for our transaction (and commit to the tapleaf we are using).
const sig = Signer.taproot.sign(seckey, txdata, 0, { extension: target })

// Set our witness data to include the signature, the spending script, and the proof (cblock).
txdata[0].witness = [ sig, script, cblock ]

// Optional: Verify your transaction (and specify the pubkey to use).
Signer.taproot.verify(txdata, 0, { pubkey })

// Encode the transaction as a hex string.
const txhex = Tx.encode(txdata).hex

// Output our transaction data to console.
console.log('Your transaction:', txdata)
console.log('Your raw transaction hex:', txhex)

// You can publish your transaction data using 'sendrawtransaction' in Bitcoin Core, or you 
// can use an external API (such as https://mempool.space/docs/api/rest#post-transaction).
```

More examples to come!

## Development / Testing

This library uses yarn for package management, tape for writing tests, and rollup for bundling cross-platform compatible code. Here are a few scripts that are useful for development.

```bash
## Compiles types and builds release candidates in /dist folder.
yarn build
## Run any typescript file using real-time compilation.
yarn start contrib/example.ts
## Runs all tests listed in test/tape.ts 
yarn test
## Full macro script for generating a new release candidate.
yarn release
```

## Bugs / Issues

If you run into any bugs or have any questions, please submit an issue ticket.

## Contribution

Feel free to fork and make contributions. Suggestions are welcome!

## Future Roadmap

 - Add signature and validation for ecdsa (segwit and earlier).
 - Refactor and stress-test tree compilation with many (many) leaves.
 - Allow arbitrary ordering of tree elements.
 - Write more unit and vector tests (cover all the things).

## Dependencies

This library contains minimal dependencies.  

**Buff-Utils**  
A swiss-army-knife of byte manipulation tools.  
https://github.com/cmdruid/buff-utils

**Crypto-Utils**  
User-friendly cryptography tools.  
https://github.com/cmdruid/crypto-utils

## Resources  

**BIP340 Wiki Page**  
This BIP covers schnorr signatures and verification.  
https://github.com/bitcoin/bips/blob/master/bip-0340.mediawiki

**BIP341 Wiki Page**  
This BIP covers the construction of trees, signature hashes, and proofs.  
https://github.com/bitcoin/bips/blob/master/bip-0341.mediawiki

**BIP342 Wiki Page**  
This BIP covers changes to opcodes and signature verification.  
https://github.com/bitcoin/bips/blob/master/bip-0342.mediawiki

**Tapscript example using Tap**  
This is a guide on how to use a command-line tool called btcdeb and Tap.  
This tool will help you create a taproot transaction from scratch, which  
is great for learning (and to debug any issues with this library :-)).  
https://github.com/bitcoin-core/btcdeb/blob/master/doc/tapscript-example-with-tap.md

## License

Use this library however you want!

## Contact

You can find me on twitter at `@btctechsupport` or on nostr at `npub1gg5uy8cpqx4u8wj9yvlpwm5ht757vudmrzn8y27lwunt5f2ytlusklulq3`