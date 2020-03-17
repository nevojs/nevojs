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

import { deserialize, serialize } from "../../serialization";

/**
 *
 */
export interface SerializedObjective {
  value: number;
  weight: number;
}

/**
 *
 */
export class Objective {
  /**
   *
   * @param serialized
   */
  public static deserialize(serialized: SerializedObjective): Objective {
    serialized = deserialize(serialized);

    const value = serialized.value;
    const weight = serialized.weight;

    return new Objective(value, weight);
  }

  /**
   *
   * @param data
   */
  public static fromJSON(data: string): Objective {
    return this.deserialize(JSON.parse(data));
  }

  /**
   *
   */
  private _value: number;

  /**
   *
   */
  private _weight: number;

  /**
   *
   * @param value
   * @param weight
   */
  public constructor(
    value: number,
    weight: number,
  ) {
    if (isNaN(value)) {
      throw new TypeError();
    }

    if (isNaN(weight)) {
      throw new TypeError();
    }

    this._value = value;
    this._weight = weight;
  }

  /**
   *
   * @param value
   */
  public set value(value: number) {
    this._value = value;
  }

  /**
   *
   */
  public get value(): number {
    return this._value;
  }

  /**
   *
   * @param value
   */
  public set weight(value: number) {
    this._weight = value;
  }

  /**
   *
   */
  public get weight(): number {
    return this._weight;
  }

  /**
   *
   */
  public fitness(): number {
    return this.value * this.weight;
  }

  /**
   *
   */
  public serialize(): SerializedObjective {
    const value = this.value;
    const weight = this.weight;

    return serialize({ value, weight });
  }

  /**
   *
   */
  public toJSON(): string {
    return JSON.stringify(this.serialize());
  }

  /**
   *
   */
  public clone(): Objective {
    return new Objective(this.value, this.weight);
  }
}
