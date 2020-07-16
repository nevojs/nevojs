import { Genotype } from "../individual/data";
import { MutationMethod } from "../operators/mutation";
import { CrossoverMethod } from "../operators/crossover";
import { isPositiveInt } from "../util";

/**
 *
 */
export abstract class AbstractGenotype<T> implements Genotype<T> {
  protected _data: T;

  public constructor(data: T) {
    this._data = data;
  }

  public data(): T {
    return this._data;
  }

  public mutate(method: MutationMethod<T>): void {
    const currentData = this.data();

    this._data = method(currentData) as T;
  }

  public __serialize(): unknown {
    return this.data();
  }

  public crossover(
    amount: number,
    partners: Genotype<T>[],
    method: CrossoverMethod<T>
  ): Genotype<T>[] {
    if (!isPositiveInt(amount)) {
      throw new TypeError();
    }

    const children: Genotype<T>[] = [];

    while (amount > children.length) {
      children.push(...this.offspring(partners, method));
    }

    return children.slice(0, amount);
  }

  public abstract offspring(
    partners: Genotype<T>[],
    method: CrossoverMethod<T>,
  ): Genotype<T>[];

  public abstract clone(
    func?: (data: T) => T,
  ): Genotype<T>;

  protected makeOffspring<G extends Genotype<T>>(
    partners: Genotype<T>[],
    method: CrossoverMethod<T>,
    func: (data: T) => G,
  ): G[] {
    const parents = [
      this.data(),
      ...partners.map((partner) => partner.data()),
    ];

    return method(parents).map((data) => func(data));
  }
}
