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

import { CrossoverMethod } from "../operators/crossover";
import { Genotype } from "../individual/data";
import { MutationMethod } from "../operators/mutation";
import { Serializable, SerializableValue } from "../serialization";

/**
 *
 */
export type ListGenerateFunction<T> = (i: number) => T;

/**
 *
 */
export class List<T> implements Genotype<T[]> {
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

    return new List<T>(genes);
  }

  /**
   *
   * @param serialized
   * @param func
   */
  public static deserialize<T = Serializable>(serialized: Serializable[], func?: (serialized: Serializable[]) => T[]): List<T> {
    const data = func ? func(serialized) : serialized;
    return new List(data as T[]);
  }

  /**
   *
   */
  private _genes: T[];

  /**
   *
   */
  public get length(): number {
    return this._genes.length;
  }

  /**
   *
   * @param genes
   */
  public constructor(genes: T[]) {
    this._genes = genes;
  }

  /**
   *
   */
  public data(): T[] {
    return this._genes.slice();
  }

  /**
   *
   * @param func
   */
  public mutate(func: MutationMethod<T[]>): void {
    if (typeof func !== "function") {
      throw new TypeError();
    }

    this._genes = (func(this.data()) ?? this.data()) as T[];
  }

  /**
   *
   */
  public clone(func?: (data: T[]) => T[]): List<T> {
    const data = this.data().slice();
    const newData = func ? func(data) : data;

    return new List(newData);
  }

  /**
   *
   * @param func
   */
  public serialize(func?: (data: T[]) => SerializableValue[]): SerializableValue[] {
    if (func) {
      return func(this.data());
    }

    return this.data() as unknown as SerializableValue[];
  }

  /**
   *
   * @param func
   */
  public toJSON(func?: (data: T[]) => SerializableValue[]): string {
    return JSON.stringify(this.serialize(func));
  }

  /**
   *
   * @param partners
   * @param method
   */
  public offspring(partners: List<T>[], method: CrossoverMethod<T[]>): List<T>[] {
    const members = [this, ...partners];
    return method(members.map(list => list.data())).map(genes => new List(genes));
  }
}
