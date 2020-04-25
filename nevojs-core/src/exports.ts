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

// selection
import { best, random, rank, roulette, tournament, worst, NSGA2 } from "./operators/selection";
export { TournamentSelectionSettings, SelectionMethod, NSGA2Settings } from "./operators/selection";
export const selection = { best, random, rank, roulette, tournament, worst, NSGA2 };

// mutation
import { alternateGene, alternatePart, inversion, map, forEach, scramble, swap, bound, flip, gauss } from "./operators/mutation";
export { MutationMethod, MutationBoundSettings, AlternatePartSettings, AlternateGeneSettings, IterativeMutationSettings, IterativeMutationCallback } from "./operators/mutation";
export const mutation = { inversion, scramble, map, forEach, swap, alternateGene, alternatePart, bound, flip, gauss };

// crossover
import { blend, ordered, point, simulatedBinary, uniform } from "./operators/crossover";
export { PointCrossoverSettings, CrossoverMethod, BlendCrossoverSettings, SimulatedBinaryCrossoverSettings, UniformCrossoverSettings } from "./operators/crossover";
export const crossover = { point, uniform, ordered, blend, simulatedBinary };

// individual
export { weightedSum, ScalarizationMethod } from "./individual/multiobjective_optimization/scalarization";
export { Objective, SerializedObjective } from "./individual/evaluation/objective";
export { BlueprintCreationSettings, Blueprint, BlueprintConstructorSettings, BlueprintPhenotypeFunction, BlueprintGenotypeFunction } from "./individual/blueprint/blueprint";
export { AnyBlueprint, AsyncBlueprint, SyncBlueprint, ResolvedBlueprint } from "./individual/blueprint/blueprint_aliases";
export {
  Individual,
  IndividualConstructorSettings,
  IndividualDeserializationSettings,
  IndividualSerializationSettings,
  SerializedIndividual,
  AnyIndividual,
  ResolvedIndividual,
  IndividualCloneSettings,
  PhenotypeFunction,
} from "./individual/individual";
export { Default, DefaultsValues } from "./individual/individual_defaults";
export { State } from "./individual/state";

export { EvaluationFunction, Evaluation } from "./individual/evaluation/evaluation_function";

// multi objective optimization
export { nonDominatedSort, crowdingDistance, rank } from "./individual/multiobjective_optimization/multiobjective_optimization";

// genotype
export { Genotype, GenotypeCloneFunction, AnyGenotype, UnresolvedGenotype } from "./individual/data";
export { List, ListGenerateFunction } from "./genotype/list";

// group
export { Group, GroupData, GroupCloneSettings, GroupCrowdSettings } from "./individual/group";

export { $Evaluation, $Genotype, $AsyncBlueprint, $Blueprint, $Crossover, $Data, $Group, $Individual, $Mutation, $Phenotype, $SyncBlueprint } from "./util_types";

export { list, individual, group, objective, minimize, maximize, blueprint } from "./creation";

// helpers
export { pick, PickEntry } from "./helpers";
