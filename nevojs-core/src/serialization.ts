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

import { inspectObjectRecursively, mapObjectValuesRecursively } from "./util";

/**
 * @hidden
 */
export type SerializableValue = number | string | boolean | undefined | null | SerializableValue[];

/**
 * @hidden
 */
export type SerializableObject = {
  [key: string]: SerializableValue | SerializableObject | void;
  apply?: void;
  call?: void;
}

/**
 * @hidden
 */
export type Serializable = SerializableObject | SerializableValue | SerializableObject[] | Serializable[];

/**
 * @hidden
 * @param data
 */
export function isSerializable(data: any): data is Serializable {
  return inspectObjectRecursively(data, property => {
    return ["string", "number", "boolean", "undefined"].includes(typeof property) || property === null;
  });
}

/**
 * @hidden
 * @param data
 */
export function isSerializableObjectLiteral(data: any): data is SerializableObject {
  return data !== undefined &&
    data !== null &&
    (data as any).constructor === Object &&
    isSerializable(data);
}

export enum SerializedValueIdentifier {
  NotANumber = "__NAN__",
  PositiveInfinity = "__POSITIVE_INFINITY__",
  NegativeInfinity = "__NEGATIVE_INFINITY__",
  Undefined = "__UNDEFINED__",
}

/**
 * @hidden
 * @param data
 */
export function serialize(data: any): any {
  const override = (value: any) => {
    if (Number.isNaN(value)) {
      return SerializedValueIdentifier.NotANumber;
    }

    if (value === Number.POSITIVE_INFINITY) {
      return SerializedValueIdentifier.PositiveInfinity;
    }

    if (value === Number.NEGATIVE_INFINITY) {
      return SerializedValueIdentifier.NegativeInfinity;
    }

    if (value === undefined) {
      return SerializedValueIdentifier.Undefined;
    }

    return value;
  };

  return mapObjectValuesRecursively(data, override);
}

/**
 * @hidden
 * @param data
 */
export function deserialize(data: any): any {
  const override = (value: string) => {
    if (value === SerializedValueIdentifier.NotANumber) {
      return NaN;
    }

    if (value === SerializedValueIdentifier.PositiveInfinity) {
      return Infinity;
    }

    if (value === SerializedValueIdentifier.NegativeInfinity) {
      return -Infinity;
    }

    if (value === SerializedValueIdentifier.Undefined) {
      return undefined;
    }

    return value;
  };

  return mapObjectValuesRecursively(data, value => override(value as string));
}
