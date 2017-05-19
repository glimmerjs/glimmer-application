import {
  DOMChanges,
  DOMTreeConstruction,
  Environment as GlimmerEnvironment,
  InlineMacros,
  ModifierManager,
  templateFactory,
  ComponentDefinition,
  Component,
  ComponentManager,
  BlockMacros,
  Helper as GlimmerHelper
} from '@glimmer/runtime';
import {
  Reference,
  OpaqueIterable
} from "@glimmer/reference";
import {
  dict,
  Opaque
} from '@glimmer/util';
import {
  getOwner,
  setOwner,
  Owner,
  Factory
} from '@glimmer/di';
import Iterable from './iterable';
import { TemplateMeta } from '@glimmer/component';
import ComponentDefinitionCreator from './component-definition-creator';
import Application from "./application";
import {
  blockComponentMacro,
  inlineComponentMacro
 } from './dynamic-component';
 import action from './helpers/action';
 import buildUserHelper from './helpers/user-helper';

type KeyFor<T> = (item: Opaque, index: T) => string;

export interface EnvironmentOptions {
  document?: HTMLDocument;
  appendOperations?: DOMTreeConstruction;
}

class DefaultComponentDefinition extends ComponentDefinition<any> {
  toJSON() {
    return `<default-component-definition name=${this.name}>`;
  }
}

const DEFAULT_MANAGER = 'main';
const DEFAULT_HELPERS = {
  action
};

export default class Environment extends GlimmerEnvironment {
  private helpers = dict<GlimmerHelper>();
  private modifiers = dict<ModifierManager<Opaque>>();
  private components = dict<ComponentDefinition<Component>>();
  private managers = dict<ComponentManager<Component>>();
  private uselessAnchor: HTMLAnchorElement;

  static create(options: EnvironmentOptions = {}) {
    options.document = options.document || self.document;
    options.appendOperations = options.appendOperations || new DOMTreeConstruction(options.document);

    return new Environment(options);
  }

  constructor(options: EnvironmentOptions) {
    super({ appendOperations: options.appendOperations, updateOperations: new DOMChanges(options.document as HTMLDocument || document) });

    setOwner(this, getOwner(options));

    // TODO - required for `protocolForURL` - seek alternative approach
    // e.g. see `installPlatformSpecificProtocolForURL` in Ember
    this.uselessAnchor = options.document.createElement('a') as HTMLAnchorElement;
  }

  protocolForURL(url: string): string {
    // TODO - investigate alternative approaches
    // e.g. see `installPlatformSpecificProtocolForURL` in Ember
    this.uselessAnchor.href = url;
    return this.uselessAnchor.protocol;
  }

  hasPartial() {
    return false;
  }

  lookupPartial(): any {
  }

  managerFor(managerId: string = DEFAULT_MANAGER): ComponentManager<Component> {
    let manager: ComponentManager<Component>;

    manager = this.managers[managerId];
    if (!manager) {
      let app: Application = getOwner(this) as any as Application;
      manager = this.managers[managerId] = getOwner(this).lookup(`component-manager:/${app.rootName}/component-managers/${managerId}`);
      if (!manager) {
        throw new Error(`No component manager found for ID ${managerId}.`);
      }
    }
    return manager;
  }

  hasComponentDefinition(name: string, meta: TemplateMeta): boolean {
    return !!this.getComponentDefinition(name, meta);
  }

  getComponentDefinition(name: string, meta: TemplateMeta): ComponentDefinition<Component> {
    let owner: Owner = getOwner(this);
    let relSpecifier = `template:${name}`;
    let referrer: string = meta.specifier;

    let specifier = owner.identify(relSpecifier, referrer);
    if (specifier === undefined) {
      if (owner.identify(`component:${name}`, referrer)) {
        throw new Error(`The component '${name}' is missing a template. All components must have a template. Make sure there is a template.hbs in the component directory.`);
      } else {
        throw new Error("Could not find template for " + name);
      }
    }

    if (!this.components[specifier]) {
      return this.registerComponent(name, specifier, meta, owner);
    }

    return this.components[specifier];
  }

  registerComponent(name: string, templateSpecifier: string, meta: TemplateMeta, owner: Owner): ComponentDefinition<Component> {
    let serializedTemplate = owner.lookup('template', templateSpecifier);
    let componentSpecifier = owner.identify('component', templateSpecifier);
    let componentFactory: Factory<Component> = null;

    if (componentSpecifier) {
      componentFactory = owner.factoryFor(componentSpecifier);
    }

    let template = templateFactory<TemplateMeta>(serializedTemplate).create(this);
    let manager: ComponentManager<Component> = this.managerFor(meta.managerId);
    let definition: ComponentDefinition<Component>;

    if (canCreateComponentDefinition(manager)) {
      definition = manager.createComponentDefinition(name, template, componentFactory);
    } else {
      definition = new DefaultComponentDefinition(name, manager, componentFactory);
    }

    this.components[templateSpecifier] = definition;

    return definition;
  }

  hasHelper(name: string, meta: TemplateMeta) {
    return !!this.lookupHelper(name, meta);
  }

  lookupHelper(name: string, meta: TemplateMeta): GlimmerHelper {
    if (DEFAULT_HELPERS[name]) {
      return DEFAULT_HELPERS[name];
    }

    let owner: Owner = getOwner(this);
    let relSpecifier = `helper:${name}`;
    let referrer: string = meta.specifier;

    let specifier = owner.identify(relSpecifier, referrer);
    if (specifier === undefined) {
      return;
    }

    if (!this.helpers[specifier]) {
      return this.registerHelper(specifier, owner);
    }

    return this.helpers[specifier];
  }

  registerHelper(specifier: string, owner: Owner): GlimmerHelper {
    let helperFunc = owner.lookup(specifier);

    let userHelper = buildUserHelper(helperFunc);
    this.helpers[specifier] = userHelper;

    return userHelper;
  }

  hasModifier(modifierName: string, blockMeta: TemplateMeta): boolean {
    return modifierName.length === 1 && (modifierName in this.modifiers);
  }

  lookupModifier(modifierName: string, blockMeta: TemplateMeta): ModifierManager<Opaque> {
    let modifier = this.modifiers[modifierName];

    if(!modifier) throw new Error(`Modifier for ${modifierName} not found.`);
    return modifier;
  }

  iterableFor(ref: Reference<Opaque>, keyPath: string): OpaqueIterable {
    let keyFor: KeyFor<Opaque>;

    if (!keyPath) {
      throw new Error('Must specify a key for #each');
    }

    switch (keyPath) {
      case '@index':
        keyFor = (_, index: number) => String(index);
      break;
      case '@primitive':
        keyFor = (item: Opaque) => String(item);
      break;
      default:
        keyFor = (item: Opaque) => item[keyPath];
      break;
    }

    return new Iterable(ref, keyFor);
  }

  macros(): { blocks: BlockMacros, inlines: InlineMacros } {
    let macros = super.macros();

    populateMacros(macros.blocks, macros.inlines);

    return macros;
  }
}

function populateMacros(blocks: BlockMacros, inlines: InlineMacros): void {
  blocks.add('component', blockComponentMacro);
  inlines.add('component', inlineComponentMacro);
}

function canCreateComponentDefinition(manager: ComponentDefinitionCreator | ComponentManager<Component>): manager is ComponentDefinitionCreator {
  return (manager as ComponentDefinitionCreator).createComponentDefinition !== undefined;
}
