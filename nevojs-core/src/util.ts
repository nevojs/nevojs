/**
 * @license
 * Copyright 2020 Aleksander Ciesielski. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

/**
 * @hidden
 */
export function shuffle<T>(arr: T[]): T[] {
  let m = arr.length;

  while (m) {
    const i = Math.floor(Math.random() * m--);
    const t = arr[m];

    arr[m] = arr[i];
    arr[i] = t;
  }

  return arr;
}

/**
 * @hidden
 */
export function choose<T>(arr: T[], n: number): T[] {
  const picked: T[] = new Array(n);
  const clone = arr.slice();

  for (let i = 0; i < n; i++) {
    const index = Math.floor(Math.random() * clone.length);

    picked[i] = clone[index];
    clone.splice(index, 1);
  }

  return picked;
}

/**
 * @hidden
 */
export function chooseOne<T>(arr: T[]): T {
  return choose(arr, 1)[0];
}

/**
 * @hidden
 */
export function range(start: number, end: number): number[] {
  const size = end - start + 1;
  const range = new Array(size);
  for (let i = 0; i < size; i++) {
    range[i] = start + i;
  }

  return range;
}

/**
 * @hidden
 */
export const merge = <T>(arrays: T[][]) => ([] as T[]).concat.apply([], arrays);

/**
 * @hidden
 */
export function sum(arr: number[]): number {
  let value = 0;
  for (let i = 0; i < arr.length; i++) {
    value += arr[i];
  }

  return value;
}

/**
 * @hidden
 */
export function toArray<T>(data: T | T[]): T[] {
  return Array.isArray(data) ? data : [data];
}

/**
 * @hidden
 */
export type Without<T, U extends number | string> = Omit<T, U> & { [K in U]?: void; };

/**
 * @hidden
 */
export type Resolved<T> = T extends Promise<infer V> ? V : T;

/**
 * @hidden
 */
export type Merge<T1, T2> = Omit<T1, keyof T2> & T2;

/**
 * @hidden
 */
export function isNumber(x: any): x is number {
  return typeof x === "number" && !isNaN(x);
}

/**
 * @hidden
 */
export function isFinite(x: number): boolean {
  return x !== Infinity && x !== -Infinity;
}

/**
 * @hidden
 */
export function isPositiveInt(x: number): boolean {
  return x > 0 && x % 1 === 0;
}

/**
 * @hidden
 */
export function randomGauss(mean: number = 0, standardDeviation: number = 1): number {
  const u1 = Math.random();
  const u2 = Math.random();

  const value = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return standardDeviation * value + mean;
}

/**
 * @hidden
 */
export function inspectObjectRecursively<T>(
  data: T,
  func: (value: unknown) => boolean,
): boolean {
  if (typeof data !== "object") {
    return func(data);
  }

  const properties = Array.isArray(data)
    ? data
    : Object.values(data);

  return !properties.some(property => !inspectObjectRecursively(property, func));
}

/**
* @hidden
*/
export function mapObjectValuesRecursively<T>(
  data: T,
  func: (value: unknown) => any,
): any {
  if (typeof data !== "object") {
    return func(data);
  }

  return Array.isArray(data)
    ? data.map(value => mapObjectValuesRecursively(value, func))
    : Object.fromEntries(Object.entries(data).map(([key, value]) => [key, mapObjectValuesRecursively(value, func)]));
}

/**
 * @hidden
 */
export const id = <T>(value: T): T => value;

/**
 * @hidden
 */
export const deepClone = <T>(data: T): T => mapObjectValuesRecursively(data, id);
