import { crowdingDistance, nonDominatedSort, rank } from "./multiobjective_optimization";
import { AnyIndividual } from "../individual";
import { sum } from "../../util";

/**
 *
 */
export type ScalarizationMethod<I extends AnyIndividual = AnyIndividual> = (individual: I) => number;

/**
 *
 * @param individual
 * @category scalarization
 */
export const weightedSum: ScalarizationMethod = individual => sum(individual.objectives().map(objective => objective.fitness()));

/**
 *
 * @param members
 * @category scalarization
 */
export function NSGA2(members: AnyIndividual[]): ScalarizationMethod {
  const fronts = nonDominatedSort(members);
  const distances = crowdingDistance(members);

  return individual => rank(individual, fronts) + Math.max(1, rank(individual, fronts) / distances.get(individual)!) - 0.00001;
}
