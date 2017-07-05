import {
  Dict,
  Opaque
} from '@glimmer/util';
import {
  VersionedPathReference,
  TagWrapper,
  DirtyableTag
} from '@glimmer/reference';
import {
  PreparedArguments
} from '@glimmer/runtime';

export type Args = PreparedArguments;
export type RawNamedArgs = Dict<any>;

export default class UpdatableArgReference implements VersionedPathReference<Opaque> {
  public tag: TagWrapper<DirtyableTag>;

  constructor(public _value: Opaque) {
    this.tag = DirtyableTag.create();
  }

  get(key: string): VersionedPathReference<Opaque> {
    let value = this.value();

    if (!value) {
      return new UpdatableArgReference(value);
    }

    return new UpdatableArgReference(value[key]);
  }

  value(): Opaque {
    return this._value;
  }

  set(newValue): void {
    this._value = newValue;
    this.tag.inner.dirty();
  }
}

export function prepareNamedArgs(rawArgs: RawNamedArgs): Dict<UpdatableArgReference> {
  let named: Dict<UpdatableArgReference> = {};

  Object.keys(rawArgs).forEach(key => {
    named[key] = new UpdatableArgReference(rawArgs[key]) as any;
  });

  return named;
}
