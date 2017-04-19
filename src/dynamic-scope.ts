import {
  PathReference
} from '@glimmer/reference';
import {
  DynamicScope as GlimmerDynamicScope
} from '@glimmer/runtime';
import {
  assign,
  Opaque
} from '@glimmer/util';

export default class DynamicScope implements GlimmerDynamicScope {
  private bucket;

  constructor(bucket= null) {
    if (bucket) {
      this.bucket = assign({}, bucket);
    } else {
      this.bucket = {};
    }
  }

  public get(key: string): PathReference<Opaque> {
    return this.bucket[key];
  }

  public set(key: string, reference: PathReference<Opaque>) {
    return this.bucket[key] = reference;
  }

  public child(): DynamicScope {
    return new DynamicScope(this.bucket);
  }
}
