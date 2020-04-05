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

import { Serializable } from "../serialization";
import { CrossoverMethod } from "../operators/crossover";
import { MutationMethod } from "../operators/mutation";
import { AbstractGenotype, GenotypeSerializeFunction } from "./abstract_genotype";

/**
 *
 */
export type ListGenerateFunction<T> = (i: number) => T;

/**
 *
 */
export type ListSerializeFunction<T> = (data: T[]) => Serializable[];

/**
 *
 */
export type ListDeserializeFunction<T> = (data: Serializable[]) => T[];

/**
 *
 */
export class List<T> extends AbstractGenotype<T[]> {
  /**
   * @static
   * @param size
   * @param func
   */
  public static generate<T>(size: number, func: ListGenerateFunction<T>): List<T> {
    const genes = new Array(size);

    for (let i = 0; i < size; i++) {
      genes[i] = func(i);
    }

    return new List<T>(genes) as any;
  }

  /**
   *
   */
  public get length(): number {
    return this.data().length;
  }

  /**
   *
   * @param data
   */
  public constructor(data: T[]) {
    super(data);
  }

  /**
   *
   */
  public data(): T[] {
    return super.data().slice();
  }

  /**
   *
   * @param method
   */
  public mutate(method: MutationMethod<T[]>): void {
    super.mutate(method);

    if (!Array.isArray(this.data())) {
      throw new TypeError();
    }
  }

  /**
   *
   */
  public clone(func?: (data: T[]) => T[]): List<T> {
    const data = func
      ? func(this.data())
      : this.data();

    return new List(data);
  }

  /**
   *
   * @param partners
   * @param method
   */
  public offspring(partners: List<T>[], method: CrossoverMethod<T[]>): List<T>[] {
    return super.makeOffspring(partners, method, data => new List(data));
  }

  /**
   *
   * @param func
   */
  public serialize(func?: ListSerializeFunction<T>): Serializable[] {
    return super.serialize(func as GenotypeSerializeFunction<T[]>) as Serializable[];
  }

  /**
   *
   * @param func
   */
  public toJSON(func?: ListSerializeFunction<T>): string {
    return JSON.stringify(this.serialize(func));
  }
}
