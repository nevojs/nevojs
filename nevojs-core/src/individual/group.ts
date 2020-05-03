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

import {
  AnyIndividual,
  Individual, IndividualOffspringSettings,
} from "./individual";
import { $Genotype, $Phenotype, $Data } from "../util_types";
import { merge, choose } from "../util";
import { CrossoverMethod } from "../operators/crossover";
import { EvaluationFunction } from "./evaluation/evaluation_function";
import { MutationMethod } from "../operators/mutation";
import { SelectionMethod } from "../operators/selection";
import { Collection } from "../collection";

/**
 *
 */
export type GroupData<I extends AnyIndividual> = I | I[] | Group<I>;

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
export class Group<I extends AnyIndividual> extends Collection<I> {
  /**
   *
   */
  public evaluate(func?: EvaluationFunction<$Genotype<I>, $Phenotype<I>>): void {
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
   */
  private $select(
    amount: number,
    method: SelectionMethod<I>,
  ): I[] {
    const data = method(amount, this.members());

    return data.length === amount ? data : data.slice(0, amount);
  }

  /**
   *
   * @param amount
   * @param method
   */
  public select(
    amount: number,
    method: SelectionMethod<I>,
  ): Group<I> {
    const members = this.$select(amount, method);
    const size = this.size;

    return new Group({ members, size });
  }

  /**
   *
   * @param fraction
   * @param method
   */
  public selectFraction(
    fraction: number,
    method: SelectionMethod<I>,
  ): Group<I> {
    if (fraction > 1 || 0 > fraction) {
      throw new TypeError();
    }

    const amount = Math.round(this.length * fraction);
    return this.select(amount, method);
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
   */
  public get(
    method: SelectionMethod<I>,
  ): I {
    return this.$select(1, method)[0];
  }

  /**
   *
   * @param data
   */
  public remove(data: GroupData<I>): void {
    super.remove(data);
  }

  /**
   *
   * @param amount
   * @param method
   * @param settings
   */
  public crossover(
    amount: number,
    method?: CrossoverMethod<$Data<$Genotype<I>>>,
    settings?: IndividualOffspringSettings<$Genotype<I>, $Phenotype<I>>,
  ): I[] {
    const [parent, ...partners] = this.members();
    return parent.crossover(amount, partners, method as any, settings) as I[];
  }

  /**
   *
   * @param method
   * @param settings
   */
  public offspring(
    method?: CrossoverMethod<$Data<$Genotype<I>>>,
    settings?: IndividualOffspringSettings<$Genotype<I>, $Phenotype<I>>,
  ): I[] {
    const [parent, ...partners] = this.members() as Individual<$Genotype<I>, $Phenotype<I>>[];
    return parent.offspring(partners, method, settings) as I[];
  }

  /**
   *
   * @param method
  */
  public child(method?: CrossoverMethod<$Data<$Genotype<I>>>): I {
    const [child] = choose(this.offspring(method), 1);
    return child;
  }

  /**
   *
   * @param method
   */
  public mutate(method?: MutationMethod<$Data<$Genotype<I>>>): void {
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
    super.add(data);
  }

  /**
   *
   * @param data
   */
  public push(data: GroupData<I>): void {
    super.push(data);
  }
}
