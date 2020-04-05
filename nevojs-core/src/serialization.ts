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
export type SerializableValue = number | string | boolean | undefined | SerializableValue[];

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
  return inspectObjectRecursively(data, property => ["string", "number", "boolean", "undefined"].includes(typeof property));
}

const NAN = "__NAN__";
const POSITIVE_INFINITY = "__POSITIVE_INFINITY__";
const NEGATIVE_INFINITY = "__NEGATIVE_INFINITY__";
const UNDEFINED = "__UNDEFINED__";

/**
 * @hidden
 * @param data
 */
export function serialize(data: any): any {
  const override = (value: any) => {
    if (Number.isNaN(value)) {
      return NAN;
    }

    if (value === Number.POSITIVE_INFINITY) {
      return POSITIVE_INFINITY;
    }

    if (value === Number.NEGATIVE_INFINITY) {
      return NEGATIVE_INFINITY;
    }

    if (value === undefined) {
      return UNDEFINED;
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
    if (value === NAN) {
      return NaN;
    }

    if (value === POSITIVE_INFINITY) {
      return Infinity;
    }

    if (value === NEGATIVE_INFINITY) {
      return -Infinity;
    }

    if (value === UNDEFINED) {
      return undefined;
    }

    return value;
  };

  return mapObjectValuesRecursively(data, value => override(value as string));
}
