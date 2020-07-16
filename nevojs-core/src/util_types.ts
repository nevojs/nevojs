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
import { CrossoverMethod } from "./operators/crossover";
import { EvaluationFunction } from "./individual/evaluation/evaluation_function";
import { Group } from "./individual/group";
import { MutationMethod } from "./operators/mutation";

/**
 *
 */
export type $Genotype<X> =
  X extends Genotype<any> ? X :
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
export type $Evaluation<X> = EvaluationFunction<$Genotype<X>, $Phenotype<X>>;

/**
 *
 */
export type $Mutation<X> = MutationMethod<$Data<X>>;

/**
 *
 */
export type $Crossover<X> = CrossoverMethod<$Data<X>>;

/**
 *
 */
export type $SyncBlueprint<X> = SyncBlueprint<$Genotype<X>, $Phenotype<X>>;

/**
 *
 */
export type $AsyncBlueprint<X> = AsyncBlueprint<$Genotype<X>, $Phenotype<X>>;

/**
 *
 */
export type $Blueprint<I extends AnyIndividual> = $SyncBlueprint<I> | $AsyncBlueprint<I>;

/**
 *
 */
export type $Individual<X> = Individual<$Genotype<X>, $Phenotype<X>>;

/**
 *
 */
export type $Group<X> = Group<$Individual<X>>;

/**
 *
 */
export type $Data<X> = $Genotype<X> extends Genotype<infer D> ? D : never;
