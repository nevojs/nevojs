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

import { AnyBlueprint, AsyncBlueprint, SyncBlueprint } from "./individual/blueprint/blueprint_aliases";
import { AnyIndividual, Individual } from "./individual/individual";
import { Genotype } from "./individual/data";
import { Blueprint } from "./individual/blueprint/blueprint";
import { CrossoverMethod } from "./operators/crossover";
import { EvaluationFunction } from "./individual/evaluation/evaluation_function";
import { Group } from "./individual/group";
import { MutationMethod } from "./operators/mutation";
import { Resolved } from "./util";

/**
 *
 */
export type $Genotype<X> =
  X extends Individual<infer G, any> ? G :
  X extends AnyBlueprint<infer G, any> ? G :
  X extends Group<infer I>
    ? I extends Individual<infer G, any> ? G : never
    : never;

/**
 *
 */
export type $Phenotype<X> =
  X extends Individual<any, infer P> ? P :
  X extends AnyBlueprint<any, infer P> ? P :
  X extends Group<infer I>
    ? I extends Individual<any, infer P> ? P : never
    : never;

/**
 *
 */
export type $Evaluation<X> =
  X extends Individual<infer G, infer P> ? EvaluationFunction<G, P> :
  X extends AnyBlueprint<infer G, infer P> ? EvaluationFunction<Resolved<G>, P> :
  X extends Group<infer I>
    ? I extends Individual<infer G, infer P> ? EvaluationFunction<G, P> : never
    : never;

/**
 *
 */
export type $Mutation<X> =
  X extends Individual<infer G, any> ? MutationMethod<$Data<G>> :
  X extends Genotype<infer D> ? MutationMethod<D> :
  X extends AnyBlueprint<infer G, any> ? MutationMethod<$Data<Resolved<G>>> :
  X extends Group<infer I>
    ? I extends Individual<infer G, any> ? MutationMethod<$Data<G>> : never
    : never;

/**
 *
 */
export type $Crossover<X> =
  X extends Individual<infer G, any> ? CrossoverMethod<$Data<G>> :
  X extends Genotype<infer D> ? CrossoverMethod<D> :
  X extends AnyBlueprint<infer G, any> ? CrossoverMethod<$Data<Resolved<G>>> :
  X extends Group<infer I>
    ? I extends Individual<infer G, any> ? CrossoverMethod<$Data<G>> : never
    : never;

/**
 *
 */
export type $Blueprint<I extends AnyIndividual> = Blueprint<$Genotype<I>, $Phenotype<I>>;

/**
 *
 */
export type $SyncBlueprint<I extends AnyIndividual> = SyncBlueprint<$Genotype<I>, $Phenotype<I>>;

/**
 *
 */
export type $AsyncBlueprint<I extends AnyIndividual> = AsyncBlueprint<$Genotype<I>, $Phenotype<I>>;

/**
 *
 */
export type $Individual<X> =
  X extends Blueprint<infer G, infer P> ? Individual<Resolved<G>, P> :
  X extends AnyBlueprint<infer G, infer P> ? Individual<Resolved<G>, P> :
  X extends Group<infer I>
    ? I
    : never;

/**
 *
 */
export type $Group<X> =
  X extends Individual<infer G, infer P> ? Group<Individual<Resolved<G>, P>> :
  X extends AnyBlueprint<infer G, infer P>
    ? Group<Individual<Resolved<G>, P>>
    : never;

/**
 *
 */
export type $Data<X> = X extends Genotype<infer D> ? D : never;
