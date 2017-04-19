import { isSpecifierStringAbsolute, Resolver } from '@glimmer/di';

export class BlankResolver implements Resolver {
  public identify(specifier: string, referrer?: string) {
    if (isSpecifierStringAbsolute(specifier)) {
      return specifier;
    }
  }
  public retrieve(specifier: string): any {
  }
}
