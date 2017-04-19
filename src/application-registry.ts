import {
  Injection,
  RegistrationOptions,
  Registry,
  RegistryAccessor,
  Resolver
} from '@glimmer/di';

function isTypeSpecifier(specifier: string) {
  return specifier.indexOf(':') === -1;
}

export default class ApplicationRegistry implements RegistryAccessor {
  private _registry: Registry;
  private _resolver: Resolver;

  constructor(registry: Registry, resolver: Resolver) {
    this._registry = registry;
    this._resolver = resolver;
  }

  public register(specifier: string, factory: any, options?: RegistrationOptions): void {
    let normalizedSpecifier = this._toAbsoluteSpecifier(specifier);
    this._registry.register(normalizedSpecifier, factory, options);
  }

  public registration(specifier: string): any {
    let normalizedSpecifier = this._toAbsoluteSpecifier(specifier);
    return this._registry.registration(normalizedSpecifier);
  }

  public unregister(specifier: string) {
    let normalizedSpecifier = this._toAbsoluteSpecifier(specifier);
    this._registry.unregister(normalizedSpecifier);
  }

  public registerOption(specifier: string, option: string, value: any): void {
    let normalizedSpecifier = this._toAbsoluteOrTypeSpecifier(specifier);
    this._registry.registerOption(normalizedSpecifier, option, value);
  }

  public registeredOption(specifier: string, option: string): any {
    let normalizedSpecifier = this._toAbsoluteOrTypeSpecifier(specifier);
    return this._registry.registeredOption(normalizedSpecifier, option);
  }

  public registeredOptions(specifier: string): any {
    let normalizedSpecifier = this._toAbsoluteOrTypeSpecifier(specifier);
    return this._registry.registeredOptions(normalizedSpecifier);
  }

  public unregisterOption(specifier: string, option: string): void {
    let normalizedSpecifier = this._toAbsoluteOrTypeSpecifier(specifier);
    this._registry.unregisterOption(normalizedSpecifier, option);
  }

  public registerInjection(specifier: string, property: string, injection: string): void {
    let normalizedSpecifier = this._toAbsoluteOrTypeSpecifier(specifier);
    let normalizedInjection = this._toAbsoluteSpecifier(injection);
    this._registry.registerInjection(normalizedSpecifier, property, normalizedInjection);
  }

  public registeredInjections(specifier: string): Injection[] {
    let normalizedSpecifier = this._toAbsoluteOrTypeSpecifier(specifier);
    return this._registry.registeredInjections(normalizedSpecifier);
  }

  private _toAbsoluteSpecifier(specifier: string, referrer?: string): string {
    return this._resolver.identify(specifier, referrer);
  }

  private _toAbsoluteOrTypeSpecifier(specifier: string): string {
    if (isTypeSpecifier(specifier)) {
      return specifier;
    } else {
      return this._toAbsoluteSpecifier(specifier);
    }
  }
}
