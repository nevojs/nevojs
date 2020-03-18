import { Objective } from "./objective";
import { Genotype } from "../data";
import { Individual } from "../individual";

/**
 *
 */
export type EvaluationData = Objective | Objective[];

/**
 *
 */
export type Evaluation = EvaluationData | Promise<EvaluationData>;

/**
 *
 */
export type EvaluationFunction<G extends Genotype, P> = (individual: Individual<G, P>) => Evaluation;
