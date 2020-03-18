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

import * as validation from "../util";
import {
  AnyIndividual,
  Individual, IndividualConstructorSettings,
} from "./individual";
import { GenotypeOf, PhenotypeOf } from "../util_types";
import { merge, pick } from "../util";
import { CrossoverMethod } from "../operators/crossover";
import { GenotypeData } from "./data";
import { MutationMethod } from "../operators/mutation";
import { SelectionMethod } from "../operators/selection";
import { EvaluationFunction } from "./evaluation/evaluation_function";
import { ScalarizationMethod, weightedSum } from "./multiobjective_optimization/scalarization";

/**
 *
 */
export type GroupData<I extends AnyIndividual> = I | I[] | Group<I>;

/**
 *
 */
export interface GroupConstructorSettings<I extends AnyIndividual> {
  members?: I[];
  size?: number;
}

/**
 *
 */
export interface GroupCloneSettings {
  deep?: boolean;
}

/**
 *
 */
export interface GroupCrowdSettings {
  threshold?: number;
}

/**
 *
 */
export class Group<I extends AnyIndividual> {
  private _members: I[];
  private _size: number;

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
  public constructor(settings: Partial<GroupConstructorSettings<I>> = {}) {
    this._members = settings.members ?? [];
    this._size = settings.size ?? this._members.length;

    if (this.size === Infinity) {
      throw new TypeError();
    }
  }

  /**
   *
   */
  public members(): I[] {
    return this._members.slice();
  }

  /**
   *
   */
  public evaluate(func?: EvaluationFunction<GenotypeOf<I>, PhenotypeOf<I>>): void {
    this.members().forEach(member => member.evaluate(func));
  }

  /**
   *
   */
  public async evaluateAsync(): Promise<void> {
    return Promise.all(this.members().map(member => member.evaluate())).then();
  }

  /**
   *
   * @param amount
   * @param method
   * @param target
   */
  private $select(
    amount: number,
    method: SelectionMethod<I>,
    target: ScalarizationMethod<I> = weightedSum,
  ): I[] {
    const data = method(amount, this.members(), target);

    return data.length === amount ? data : data.slice(0, amount);
  }

  /**
   *
   * @param amount
   * @param method
   * @param target
   */
  public select(
    amount: number,
    method: SelectionMethod<I>,
    target?: ScalarizationMethod<I>,
  ): Group<I> {
    const members = this.$select(amount, method, target);
    const size = this.size;

    return new Group({ members, size });
  }

  /**
   *
   * @param fraction
   * @param method
   * @param target
   */
  public selectFraction(
    fraction: number,
    method: SelectionMethod<I>,
    target?: ScalarizationMethod<I>,
  ): Group<I> {
    if (fraction > 1 || 0 > fraction) {
      throw new TypeError();
    }

    const amount = Math.round(this.length * fraction);
    return this.select(amount, method, target);
  }

  /**
   *
   */
  public clone(settings: GroupCloneSettings = {}): Group<I> {
    const deep = settings.deep ?? false;

    if (typeof deep !== "boolean") {
      throw new TypeError();
    }

    const members = deep
      ? this.members().map(member => member.clone()) as I[]
      : this.members();

    const { size } = this;
    return new Group({ members, size });
  }

  /**
   *
   * @param data
   */
  public except(data: GroupData<I>): Group<I> {
    const group = this.clone();
    group.remove(Group.parse(data));

    return group;
  }

  /**
   *
   * @param method
   * @param target
   */
  public get(
    method: SelectionMethod<I>,
    target?: ScalarizationMethod<I>,
  ): I {
    return this.$select(1, method, target)[0];
  }

  /**
   *
   * @param data
   */
  public remove(data: GroupData<I>): void {
    const members = Group.parse(data);

    for (const member of members) {
      const i = this._members.indexOf(member);
      this._members.splice(i, 1);
    }
  }

  /**
   *
   * @param data
   */
  public set(data: GroupData<I>): void {
    this._members = Group.parse(data);
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
   * @param amount
   * @param method
   * @param settings
   */
  public crossover(
    amount: number,
    method?: CrossoverMethod<GenotypeData<GenotypeOf<I>>>,
    settings?: Partial<IndividualConstructorSettings<GenotypeOf<I>, PhenotypeOf<I>>>,
  ): I[] {
    const [a, ...partners] = this.members();
    const children: I[] = [];

    while (amount > children.length) {
      children.push(...a.crossover(amount, partners, method as any, settings) as I[]);
    }

    return children;
  }

  /**
   *
   * @param method
   * @param settings
   */
  public offspring(
    method?: CrossoverMethod<GenotypeData<GenotypeOf<I>>>,
    settings?: Partial<IndividualConstructorSettings<GenotypeOf<I>, PhenotypeOf<I>>>,
  ): I[] {
    const [parent, ...partners] = this.members() as Individual<GenotypeOf<I>, PhenotypeOf<I>>[];
    return parent.offspring(partners, method, settings) as I[];
  }

  /**
   *
   * @param method
  */
  public child(method?: CrossoverMethod<GenotypeData<GenotypeOf<I>>>): I {
    const [child] = pick(this.offspring(method), 1);
    return child;
  }

  /**
   *
   * @param method
   */
  public mutate(method?: MutationMethod<GenotypeData<GenotypeOf<I>>>): void {
    this.members().forEach(member => member.mutate(method as any));
  }

  /**
   *
   * @param data
   */
  public and(data: GroupData<I>): Group<I> {
    const members = merge([this.members(), Group.parse(data)]);
    return new Group({ members });
  }

  /**
   *
   * @param data
   */
  public add(data: GroupData<I>): void {
    const parsed = Group.parse(data);

    if (parsed.length > this.space()) {
      throw new Error(`Cannot contain ${this.length + parsed.length} members in ${this.size}-sized group`);
    }

    this._members = this.members().concat(parsed);
  }

  /**
   *
   * @param data
   */
  public push(data: GroupData<I>): void {
    const parsed = Group.parse(data);

    this.resize(this.size + parsed.length);
    this.add(parsed);
  }

  /**
   *
   * @param func
   * @param settings
   */
  public crowd(
    func: (i: number) => GroupData<I>,
    settings: GroupCrowdSettings = {},
  ): I[] {
    const threshold = settings.threshold ?? this.space();

    if (
      !validation.isNumber(threshold) ||
      !validation.isFinite(threshold) ||
      !validation.isPositiveInt(threshold)
    ) {
      throw new TypeError(`Expected threshold to be a finite, positive integer value (${threshold} given)`);
    }

    let i = 0;
    const members: I[] = [];

    while (threshold > members.length) {
      const data = Group.parse(func(i++));
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
    func: (i: number) => Promise<GroupData<I>>,
    settings: GroupCrowdSettings = {},
  ): Promise<I[]> {
    const threshold = settings.threshold ?? this.space();

    if (
      !validation.isNumber(threshold) ||
      !validation.isFinite(threshold) ||
      !validation.isPositiveInt(threshold)
    ) {
      throw new TypeError( `Expected threshold to be a finite, positive integer value (${threshold} given)`);
    }

    let i = 0;
    const members: I[] = [];

    while (threshold > members.length) {
      const data = Group.parse(await func(i++));
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
  public static parse<I extends AnyIndividual>(data: GroupData<I>): I[] {
    if (data instanceof Group) {
      return data.members();
    }

    if (Array.isArray(data)) {
      return data.slice();
    }

    if (data instanceof Individual) {
      return [data];
    }

    throw new TypeError();
  }
}
