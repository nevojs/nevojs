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
import { MutationMethod } from "../operators/mutation";
import { Serializable } from "../serialization";

/**
 *
 */
export interface Genotype<D> {
  mutate(method: MutationMethod<D>): void;
  clone(func?: (data: D) => D): Genotype<D>;
  serialize(func?: (data: D) => Serializable): any;
  toJSON(func?: (data: D) => Serializable): string;
  data(): D;
  offspring(partners: Genotype<D>[], method: CrossoverMethod<D>): Genotype<D>[];
}

/**
 *
 */
export type AnyGenotype = Genotype<any>;

/**
 *
 */
export type UnresolvedGenotype = AnyGenotype | Promise<AnyGenotype>;
