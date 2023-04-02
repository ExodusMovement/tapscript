import { Buff }              from '@cmdcode/buff-utils'
import { TapTree, TapProof } from './types.js'

const DEFAULT_VERSION = 0xc0

export function getTapTag (tag : string) : Buff {
  const htag = Buff.str(tag).digest
  return Buff.join([ htag, htag ])
}

export function getTapLeaf (
  data : string | Uint8Array,
  version = DEFAULT_VERSION
) : string {
  return Buff.join([
    getTapTag('TapLeaf'),
    getVersion(version),
    Buff.normalize(data)
  ]).digest.hex
}

export function getTapBranch (
  leafA : string,
  leafB : string
) : string {
  if (leafB < leafA) {
    // Ensure that both branches
    // are sorted lexographically.
    [ leafA, leafB ] = [ leafB, leafA ]
  }
  return Buff.join([
    getTapTag('TapBranch'),
    Buff.hex(leafA).raw,
    Buff.hex(leafB).raw
  ]).digest.hex
}

export function getTapRoot (
  leaves : TapTree
) : Buff {
  // Merkelize the leaves into a root hash.
  return Buff.hex(merkleize(leaves)[0])
}

export function merkleize (
  taptree : TapTree,
  target  : string | null = null,
  path    : string[] = []
) : TapProof {
  const leaves : string[] = []
  const tree   : string[] = []

  // If there are nested leaves, resolve them.
  for (let i = 0; i < taptree.length; i++) {
    const leaf = taptree[i]
    if (Array.isArray(leaf)) {
      const [ r, t, p ] = merkleize(leaf, target)
      target = t
      leaves.push(r)
      for (const e of p) {
        path.push(e)
      }
    } else { leaves.push(leaf) }
  }

  // If there is only one leaf,
  // then return it as the root.
  if (leaves.length === 1) {
    return [ leaves[0], target, path ]
  }
  // Ensure the tree is sorted.
  leaves.sort()
  // Ensure the tree is balanced.
  if (leaves.length % 2 !== 0) {
    // If uneven, duplicate the last leaf.
    leaves.push(leaves[leaves.length - 1])
  }

  // Sort through the leaves (two at a time).
  for (let i = 0; i < leaves.length - 1; i += 2) {
    // Compute two leaves into a branch.
    const branch = getTapBranch(leaves[i], leaves[i + 1])
    // Push our branch to the tree.
    tree.push(branch)
    // Check if a proof target is specified.
    if (typeof target === 'string') {
      // Check if this branch is part of our proofs.
      if (target === leaves[i]) {
        // Include right-side of branch.
        path.push(leaves[i + 1])
        target = branch
      } else if (target === leaves[i + 1]) {
        // Include left-side of branch.
        path.push(leaves[i])
        target = branch
      }
    }
  }
  return merkleize(tree, target, path)
}

export function getVersion (version = 0xc0) : number {
  return version & 0xfe
}
