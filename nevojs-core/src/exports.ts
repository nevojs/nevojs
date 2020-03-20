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
import { best, random, rank, roulette, tournament, worst, proportionate } from "./operators/selection";
export { TournamentSelectionSettings, SelectionMethod } from "./operators/selection";
export const selection = { best, random, rank, roulette, tournament, worst, proportionate };

// mutation
import { alternateGene, alternatePart, inversion, map, scramble, swap, bound, flip, gauss } from "./operators/mutation";
export { MutationMethod, MutationBoundSettings, AlternatePartSettings, AlternateGeneSettings, MutationMapSettings, PureMutationMethod, ImpureMutationMethod, MutationMapFunction } from "./operators/mutation";
export const mutation = { inversion, scramble, map, swap, alternateGene, alternatePart, bound, flip, gauss };

// util
import { pick, range, shuffle, sum } from "./util";
export const util = { pick, shuffle, sum, range };

// crossover
import { blend, ordered, point, simulatedBinary, uniform } from "./operators/crossover";
export { PointCrossoverSettings, CrossoverMethod, BlendCrossoverSettings, SimulatedBinaryCrossoverSettings, UniformCrossoverSettings } from "./operators/crossover";
export const crossover = { point, uniform, ordered, blend, simulatedBinary };

// individual
export { NSGA2, weightedSum, ScalarizationMethod } from "./individual/multiobjective_optimization/scalarization";
export { Objective, SerializedObjective } from "./individual/evaluation/objective";
export { BlueprintCreationSettings, Blueprint, BlueprintConstructorSettings } from "./individual/blueprint/blueprint";
export { AnyBlueprint, AsyncBlueprint, SyncBlueprint, ResolvedBlueprint } from "./individual/blueprint/blueprint_aliases";
export {
  Individual,
  IndividualConstructorSettings,
  IndividualDeserializationSettings,
  IndividualSerializationSettings,
  SerializedIndividual,
  AnyIndividual,
  ResolvedIndividual
} from "./individual/individual";
export { Default, DefaultsValues } from "./individual/individual_defaults";

export { EvaluationFunction, Evaluation } from "./individual/evaluation/evaluation_function";

// multi objective optimization
export { nonDominatedSort, crowdingDistance, rank } from "./individual/multiobjective_optimization/multiobjective_optimization";

// genotype
export { Genotype, GenotypeData, State } from "./individual/data";
export { List, ListGenerateFunction } from "./genotype/list";

// group
export { Group, GroupData, GroupCloneSettings, GroupCrowdSettings, GroupConstructorSettings } from "./individual/group";

export * as Util from "./util_types";

export { list, individual, group, scale, minimize, maximize, blueprint } from "./creation";
