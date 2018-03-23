/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

/**
 * Simple utility function used to find an item in a set with a predicate
 * function.  Analagous to Array.find(), without requiring converting the set
 * an Array.
 */
export function find<T>(items: Iterable<T>, predicate: (item: T) => boolean): T|
    undefined {
  for (const item of items) {
    if (predicate(item)) {
      return item;
    }
  }
}

/**
 * Converts string like `abc-xyz__omg` to `abcXyzOmg`.
 */
export function camelCase(text: string): string {
  return text.replace(
      /([a-z0-9])[^a-z0-9]+([a-z])/gi, (m) => m[0] + m[2].toUpperCase());
}

/**
 * Returns a set of unique/distinct values returned by calling the given
 * function on each item.
 */
export function uniq<T, R>(items: Iterable<T>, map: (item: T) => R): Set<R> {
  const results = new Set();
  for (const item of items) {
    results.add(map(item));
  }
  return results;
}


/**
 * Performs an in-place rewrite of a target object's properties from a given
 * replacement node.  This is useful because there are some transformations
 * of ASTs which simply require replacing a node, but it is not always
 * convenient to obtain the specific parent node property to which a node may be
 * attached out of many possible configurations.
 */
export function rewriteObject(target: Object, replacement: Object) {
  // Strip all properties from target
  for (const key of Object.getOwnPropertyNames(target)) {
    if (!replacement.hasOwnProperty(key)) {
      delete target[key];
    }
  }
  // Transfer remaining properties from replacement
  for (const key of Object.getOwnPropertyNames(replacement)) {
    target[key] = replacement[key];
  }
}
