import { Buff } from '@cmdcode/buff-utils'
import { Hash } from '@cmdcode/crypto-utils'

import TxInput    from './TxInput.js'
import TxOutput   from './TxOutput.js'
import TxLocktime from './TxLocktime.js'
import encodeTx   from '../../lib/tx/encode.js'
import decodeTx   from '../../lib/tx/decode.js'
import encodeSighash from '../../lib/sig/segwit.js'

import {
  TxData,
  ScriptData
} from '../../schema/types.js'

import { Schema } from '../../schema/check.js'

export default class Transaction {
  public version  : number
  public vin      : TxInput[]
  public vout     : TxOutput[]
  public locktime : TxLocktime

  constructor (
    txdata : string | Uint8Array | TxData
  ) {
    if (typeof txdata === 'string') {
      txdata = Buff.hex(txdata).raw
    }

    if (txdata instanceof Uint8Array) {
      txdata = decodeTx(txdata)
    }

    const schema = Schema.TxData
    const data   = schema.parse(txdata)

    this.version  = data.version
    this.vin      = data.vin?.map(e => new TxInput(e))
    this.vout     = data.vout?.map(e => new TxOutput(e))
    this.locktime = new TxLocktime(data.locktime)
  }

  get data () : TxData {
    return JSON.parse(JSON.stringify(this))
  }

  get bytes () : Uint8Array {
    return encodeTx(this.data)
  }

  get hex () : string {
    return Buff.buff(this.bytes).toHex()
  }

  get base () : Uint8Array {
    return encodeTx(this.data, true)
  }

  get size () : number {
    return this.bytes.length
  }

  get bsize () : number {
    return this.base.length
  }

  get weight () : number {
    return this.bsize * 3 + this.size
  }

  get vsize () : number {
    const remainder = (this.weight % 4 > 0) ? 1 : 0
    return Math.floor(this.weight / 4) + remainder
  }

  get hash () : Promise<string> {
    return Hash.hash256(this.bytes)
      .then(bytes => Buff.buff(bytes).reverse().toHex())
  }

  get txid () : Promise<string> {
    return Hash.hash256(this.base)
      .then(bytes => Buff.buff(bytes).reverse().toHex())
  }

  async sighash (
    idx     : number,
    value   : number,
    script  : ScriptData,
    sigflag : string | number,
    anypay ?: boolean
  ) : Promise<Uint8Array> {
    return encodeSighash(this.data, idx, value, script, sigflag, anypay)
  }

  async export () : Promise<object> {
    const { size, weight, vsize, hex } = this
    const txid = await this.txid
    const hash = await this.hash
    return { txid, hash, ...this.data, size, weight, vsize, hex }
  }
}
