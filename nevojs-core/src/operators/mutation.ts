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

import { randomGauss, shuffle } from "../util";

/**
 *
 */
export type MutationMethod<D> = (data: D) => D;

/**
 *
 */
export type IterativeMutationCallback<T, U = T> = (value: T, i: number, arr: T[]) => U;

/**
 *
 */
export interface IterativeMutationSettings<T> {
  rate?: number | IterativeMutationCallback<T, number>;
}

/**
 *
 * @param func
 * @param settings
 * @category mutation
 */
export function map<T>(
  func: IterativeMutationCallback<T>,
  settings: IterativeMutationSettings<T> = {},
): MutationMethod<T[]> {
  const rate = settings.rate ?? 1;

  if (typeof func !== "function") {
    throw new TypeError();
  }

  if (typeof rate !== "number" && typeof rate !== "function") {
    throw new TypeError();
  }

  if (typeof rate === "number" && (0 > rate || rate > 1)) {
    throw new TypeError();
  }

  return (genes) => genes.map((gene, i) => {
    const probability = typeof rate === "function"
      ? rate(gene, i, genes)
      : rate;

    return probability > Math.random()
      ? func(gene, i, genes)
      : gene;
  });
}

/**
 *
 * @param func
 * @param settings
 * @category mutation
 */
export function forEach<T>(
  func: IterativeMutationCallback<T, void>,
  settings: IterativeMutationSettings<T> = {},
): MutationMethod<T[]> {
  return map(
    (gene, i, genes) => {
      func(gene, i, genes);
      return gene;
    },
    settings,
  );
}

/**
 *
 */
export interface MutationBoundSettings {
  min?: number;
  max?: number;
}

function boundValue(gene: number, settings: MutationBoundSettings): number {
  const min = settings.min ?? -Infinity;
  const max = settings.max ?? Infinity;

  gene = Math.max(gene, min);
  gene = Math.min(gene, max);

  return gene;
}

/**
 *
 * @param func
 * @param settings
 * @category mutation
 */
export function bound(func: MutationMethod<number>, settings?: MutationBoundSettings): MutationMethod<number>;
export function bound(settings: MutationBoundSettings): MutationMethod<number>;
export function bound(
  funcOrSettings: MutationMethod<number> | MutationBoundSettings,
  settings: MutationBoundSettings = {},
): MutationMethod<number> {
  const min = settings.min ?? -Infinity;
  const max = settings.max ?? Infinity;

  if (min > max) {
    throw new TypeError();
  }

  return typeof funcOrSettings === "function"
    ? (gene) => boundValue(funcOrSettings(gene), settings)
    : (gene) => boundValue(gene, funcOrSettings);
}

/**
 *
 */
export interface AlternateGeneSettings<T> {
  index?: number | ((genes: T[]) => number);
}

/**
 *
 * @param func
 * @param settings
 * @category mutation
 */
export function alternateGene<T>(
  func: IterativeMutationCallback<T>,
  settings: AlternateGeneSettings<T> = {},
): MutationMethod<T[]> {
  return (genes) => {
    const unresolvedIndex = settings.index ?? Math.floor(Math.random() * genes.length);
    const index = typeof unresolvedIndex === "function"
      ? unresolvedIndex(genes)
      : unresolvedIndex;

    if (index > genes.length - 1 || 0 > genes.length) {
      throw new TypeError();
    }

    genes[index] = func(genes[index], index, genes);
    return genes;
  }
}

/**
 *
 */
export interface AlternatePartSettings<T> {
  start?: number | ((genes: T[]) => number);
  end?: number | ((genes: T[], start: number) => number);
}

/**
 *
 * @param func
 * @param settings
 * @category mutation
 */
export function alternatePart<T>(
  func: (data: T[], start: number, end: number) => T[],
  settings: AlternatePartSettings<T> = {},
): MutationMethod<T[]> {
  return (genes) => {
    const unresolvedStart = settings.start ?? Math.floor(Math.random() * (genes.length - 1));
    const start = typeof unresolvedStart === "function"
      ? unresolvedStart(genes)
      : unresolvedStart;

    const unresolvedEnd = settings.end ?? Math.floor(Math.random() * (genes.length - start - 1) + start + 1);
    const end = typeof unresolvedEnd === "function"
      ? unresolvedEnd(genes, start)
      : unresolvedEnd;

    const mutated = func(genes.slice(start, end + 1), start, end);
    for (let i = start; i < end + 1; i++) {
      genes[i] = mutated[i - start];
    }

    return genes;
  }
}

/**
 *
 * @category mutation
 */
export function flip(): MutationMethod<number> {
  return (gene) => Number(!gene);
}

/**
 *
 * @param settings
 * @category mutation
 */
export function inversion<T = any>(settings?: AlternatePartSettings<T>): MutationMethod<T[]> {
  return alternatePart((genes) => genes.reverse(), settings);
}

/**
 *
 * @param settings
 * @category mutation
 */
export function swap<T = any>(settings?: AlternatePartSettings<T>): MutationMethod<T[]> {
  return alternatePart((genes) => {
    const start = 0;
    const end = genes.length - 1;

    [genes[start], genes[end]] = [genes[end], genes[start]];
    return genes;
  }, settings);
}

/**
 *
 * @param settings
 * @category mutation
 */
export function scramble<T = any>(settings?: AlternatePartSettings<T>): MutationMethod<T[]> {
  return alternatePart(shuffle, settings);
}

/**
 * @category mutation
 */
export function gauss(): MutationMethod<number> {
  return (gene) => gene + randomGauss();
}
