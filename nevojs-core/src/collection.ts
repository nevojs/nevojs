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

import * as validation from "./util";
import { merge } from "./util";

/**
 *
 */
export type CollectionData<T> = T | T[] | Collection<T>;

/**
 *
 */
export interface CollectionConstructorSettings<T> {
  members?: T[];
  size?: number;
}

/**
 *
 */
export interface CollectionCrowdSettings {
  threshold?: number;
}

/**
 *
 */
export class Collection<T> {
  protected _members: T[];
  protected _size: number;

  /**
   *
   */
  public get size(): number {
    return this._size;
  }

  /**
   *
   */
  public get length(): number {
    return this._members.length;
  }

  /**
   *
   * @param settings
   */
  public constructor(settings: CollectionConstructorSettings<T> = {}) {
    this._members = settings.members ?? [];

    const defaultSize = this._members.length || Infinity;
    this._size = settings.size ?? defaultSize;
  }

  /**
   *
   */
  public members(): T[] {
    return this._members.slice();
  }

  /**
   *
   */
  public clone(): Collection<T> {
    const members = this.members();
    const size = this.size;

    return new Collection({ members, size });
  }

  /**
   *
   * @param data
   */
  public except(data: CollectionData<T>): Collection<T> {
    const group = this.clone();
    group.remove(Collection.parse(data));

    return group;
  }

  /**
   *
   * @param data
   */
  public remove(data: CollectionData<T>): void {
    const members = Collection.parse(data);

    for (const member of members) {
      const i = this._members.indexOf(member);
      this._members.splice(i, 1);
    }
  }

  /**
   *
   * @param data
   */
  public set(data: CollectionData<T>): void {
    this._members = Collection.parse(data);
  }

  /**
   *
   */
  public empty(): void {
    this.set([]);
  }

  /**
   *
   */
  public space(): number {
    return this.size - this.length;
  }
  /**
   *
   * @param data
   */
  public and(data: CollectionData<T>): Collection<T> {
    const members = merge([this.members(), Collection.parse(data)]);
    return new Collection({ members });
  }

  /**
   *
   * @param data
   */
  public add(data: CollectionData<T>): void {
    const parsed = Collection.parse(data);

    if (parsed.length > this.space()) {
      throw new Error(`Cannot contain ${this.length + parsed.length} members in ${this.size}-sized group`);
    }

    this._members = this.members().concat(parsed);
  }

  /**
   *
   * @param data
   */
  public push(data: CollectionData<T>): void {
    const parsed = Collection.parse(data);

    this.resize(this.size + parsed.length);
    this.add(parsed);
  }

  /**
   *
   * @param func
   * @param settings
   */
  public crowd(
    func: (i: number) => CollectionData<T>,
    settings: CollectionCrowdSettings = {},
  ): T[] {
    const threshold = settings.threshold ?? this.space();

    if (
      !validation.isNumber(threshold) ||
      !validation.isFinite(threshold) ||
      !validation.isPositiveInt(threshold)
    ) {
      throw new TypeError(`Expected threshold to be a finite, positive integer value (${threshold} given)`);
    }

    let i = 0;
    const members: T[] = [];

    while (threshold > members.length) {
      const data = Collection.parse(func(i++));
      members.push(...data);
    }

    this.add(members.slice(0, threshold));
    return members;
  }

  /**
   *
   * @param func
   * @param settings
   */
  public async crowdAsync(
    func: (i: number) => Promise<CollectionData<T>>,
    settings: CollectionCrowdSettings = {},
  ): Promise<T[]> {
    const threshold = settings.threshold ?? this.space();

    if (
      !validation.isNumber(threshold) ||
      !validation.isFinite(threshold) ||
      !validation.isPositiveInt(threshold)
    ) {
      throw new TypeError( `Expected threshold to be a finite, positive integer value (${threshold} given)`);
    }

    let i = 0;
    const members: T[] = [];

    while (threshold > members.length) {
      const data = Collection.parse(await func(i++));
      members.push(...data);
    }

    this.add(members.slice(0, threshold));
    return members;
  }

  /**
   *
   * @param size
   */
  public resize(size: number = this.space()): void {
    if (
      !validation.isNumber(size) ||
      !validation.isPositiveInt(size)
    ) {
      throw new TypeError(`Expected size to be positive integer or an Infinity, (${size} given)`);
    }

    if (this.length > size) {
      console.warn(`Warning: Resize to ${size} in the ${this.length}-element group, removing last ${this.length - size} members`);

      this.set(this.members().slice(0, size));
    }

    this._size = size;
  }

  /**
   *
   * @param data
   */
  protected static parse<T>(data: CollectionData<T>): T[] {
    if (data instanceof Collection) {
      return data.members();
    }

    if (Array.isArray(data)) {
      return data.slice();
    }

    return [data];
  }
}
