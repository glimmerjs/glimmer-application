import {
  Dict,
  Opaque
} from '@glimmer/util';

import {
  PathReference,
  Reference,
  VOLATILE_TAG
} from '@glimmer/reference';

import {
  Arguments,
  CapturedArguments,
  Helper as GlimmerHelper,
  VM
} from '@glimmer/runtime';

export type UserHelper = (args: ReadonlyArray<Opaque>, named: Dict<Opaque>) => any;

export default function buildUserHelper(helperFunc): GlimmerHelper {
  return (_vm: VM, args: Arguments) => new HelperReference(helperFunc, args);
}

export class SimplePathReference<T> implements PathReference<T> {
  public tag = VOLATILE_TAG;
  private parent: Reference<T>;
  private property: string;

  constructor(parent: Reference<T>, property: string) {
    this.parent = parent;
    this.property = property;
  }

  public value(): T {
    return this.parent.value()[this.property];
  }

  public get(prop: string): PathReference<Opaque> {
    return new SimplePathReference(this, prop);
  }
}

export class HelperReference implements PathReference<Opaque> {
  public tag = VOLATILE_TAG;
  private helper: UserHelper;
  private args: CapturedArguments;

  constructor(helper: UserHelper, args: Arguments) {
    this.helper = helper;
    this.args = args.capture();
  }

  public value() {
    let { helper, args } = this;

    return helper(args.positional.value(), args.named.value());
  }

  public get(prop: string): SimplePathReference<Opaque> {
    return new SimplePathReference(this, prop);
  }
}
