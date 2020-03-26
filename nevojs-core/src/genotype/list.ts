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

import { deserialize, Serializable, SerializableValue, serialize } from "../serialization";
import { CrossoverMethod } from "../operators/crossover";
import { Genotype } from "../individual/data";
import { MutationMethod } from "../operators/mutation";

/**
 *
 */
export type ListGenerateFunction<T> = (i: number) => T;

/**
 *
 */
export type ListSerializeFunction<T> = (data: T[]) => SerializableValue[];

/**
 *
 */
export type ListDeserializeFunction<T> = (data: Serializable[]) => T[];

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
  public static deserialize<T = Serializable>(
    serialized: Serializable[],
    func?: ListDeserializeFunction<T>,
  ): List<T> {
    const deserializedData = deserialize(serialized);
    const data = func
      ? func(deserializedData)
      : deserializedData;

    return new List(data as T[]);
  }

  /**
   *
   * @param data
   * @param func
   */
  public static fromJSON<T = Serializable>(
    data: string,
    func?: ListDeserializeFunction<T>,
  ): List<T> {
    return List.deserialize(JSON.parse(data), func);
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

    const data = func(this.data());

    if (data === undefined) {
      return;
    }

    if (!Array.isArray(data)) {
      throw new TypeError();
    }

    this._genes = data;
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
   * @param func
   */
  public serialize(func?: ListSerializeFunction<T>): SerializableValue[] {
    const data = func
      ? func(this.data())
      : this.data();

    return serialize(data);
  }

  /**
   *
   * @param func
   */
  public toJSON(func?: ListSerializeFunction<T>): string {
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
