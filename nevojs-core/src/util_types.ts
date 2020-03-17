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

import { Blueprint } from "./individual/blueprint/blueprint";
import { Group } from "./individual/group";
import { AnyIndividual, Individual } from "./individual/individual";
import { Resolved } from "./util";
import { AnyBlueprint, AsyncBlueprint, SyncBlueprint } from "./individual/blueprint/blueprint_aliases";
import { MutationMethod } from "./operators/mutation";
import { Genotype, GenotypeData } from "./individual/data";
import { CrossoverMethod } from "./operators/crossover";
import { EvaluationFunction } from "./individual/evaluation/evaluation_function";

/**
 *
 */
export type GenotypeOf<X> =
  X extends Individual<infer G, any> ? G :
  X extends Blueprint<infer G, any> ? G :
  X extends Group<infer I>
    ? I extends Individual<infer G, any> ? G : never
    : never;

/**
 *
 */
export type PhenotypeOf<X> =
  X extends Individual<any, infer P> ? P :
  X extends Blueprint<any, infer P> ? P :
  X extends Group<infer I>
    ? I extends Individual<any, infer P> ? P : never
    : never;

/**
 *
 */
export type EvaluationFunctionFor<X> =
  X extends Individual<infer G, infer P> ? EvaluationFunction<G, P> :
  X extends AnyBlueprint<infer G, infer P> ? EvaluationFunction<Resolved<G>, P> :
  X extends Group<infer I>
    ? I extends Individual<infer G, infer P> ? EvaluationFunction<G, P> : never
    : never;

/**
 *
 */
export type MutationMethodFor<X> =
  X extends Individual<infer G, any> ? MutationMethod<GenotypeData<G>> :
  X extends Genotype<infer D> ? MutationMethod<D> :
  X extends AnyBlueprint<infer G, any> ? MutationMethod<GenotypeData<Resolved<G>>> :
  X extends Group<infer I>
    ? I extends Individual<infer G, any> ? MutationMethod<GenotypeData<G>> : never
    : never;

/**
 *
 */
export type CrossoverMethodFor<X> =
  X extends Individual<infer G, any> ? CrossoverMethod<GenotypeData<G>> :
  X extends Genotype<infer D> ? CrossoverMethod<D> :
  X extends Blueprint<infer G, any> ? CrossoverMethod<GenotypeData<Resolved<G>>> :
  X extends Group<infer I>
    ? I extends Individual<infer G, any> ? CrossoverMethod<GenotypeData<G>> : never
    : never;

/**
 *
 */
export type BlueprintFrom<I extends AnyIndividual> = Blueprint<GenotypeOf<I>, PhenotypeOf<I>>;

/**
 *
 */
export type SyncBlueprintFrom<I extends AnyIndividual> = SyncBlueprint<GenotypeOf<I>, PhenotypeOf<I>>;

/**
 *
 */
export type AsyncBlueprintFrom<I extends AnyIndividual> = AsyncBlueprint<GenotypeOf<I>, PhenotypeOf<I>>;

/**
 *
 */
export type IndividualFrom<X> =
  X extends Blueprint<infer G, infer P> ? Individual<Resolved<G>, P> :
  X extends Group<infer I>
    ? I
    : never;

/**
 *
 */
export type GroupFrom<X> =
  X extends Individual<infer G, infer P> ? Group<Individual<Resolved<G>, P>> :
  X extends Blueprint<infer G, infer P>
    ? Group<Individual<Resolved<G>, P>>
    : never;
