import { Genotype, GenotypeData } from "./data";
import { Individual } from "./individual";
import { MutationMethod } from "../operators/mutation";
import { CrossoverMethod } from "../operators/crossover";
import { EvaluationFunction } from "./evaluation/evaluation_function";

export abstract class IndividualDefaults<G extends Genotype, P> {
  protected evaluationFunc?: EvaluationFunction<G, P>;
  protected mutationMethod?: MutationMethod<GenotypeData<G>>;
  protected crossoverMethod?: CrossoverMethod<GenotypeData<G>>;

  /**
   *
   * @param func
   */
  public setDefaultEvaluation(func: EvaluationFunction<G, P>): void {
    this.evaluationFunc = func;
  }

  /**
   *
   */
  public get hasDefaultEvaluation(): boolean {
    return Boolean(this.evaluationFunc);
  }

  /**
   *
   * @param func
   */
  public setDefaultMutation(func: MutationMethod<GenotypeData<G>>): void {
    this.mutationMethod = func;
  }

  /**
   *
   */
  public get hasDefaultMutation(): boolean {
    return Boolean(this.mutationMethod);
  }

  /**
   *
   * @param func
   */
  public setDefaultCrossover(func: CrossoverMethod<GenotypeData<G>>): void {
    this.crossoverMethod = func;
  }

  /**
   *
   */
  public get hasDefaultCrossover(): boolean {
    return Boolean(this.crossoverMethod);
  }

  /**
   *
   * @param individual
   */
  protected applyDefaults(individual: Individual<G, P>): void {
    if (this.evaluationFunc) {
      individual.setDefaultEvaluation(this.evaluationFunc);
    }

    if (this.mutationMethod) {
      individual.setDefaultMutation(this.mutationMethod);
    }

    if (this.crossoverMethod) {
      individual.setDefaultCrossover(this.crossoverMethod);
    }
  }
}
