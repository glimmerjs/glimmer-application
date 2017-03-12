import {
  SymbolTable
} from '@glimmer/interfaces';
import {
  RevisionTag,
  PathReference,
  UNDEFINED_REFERENCE
} from '@glimmer/reference';
import {
  BaselineSyntax,
  ComponentDefinition,
  Environment as GlimmerEnvironment,
  isComponentDefinition,
  VM
} from '@glimmer/runtime';
import {
  Opaque
} from '@glimmer/util';

export function blockComponentMacro(sexp, builder) {
  let [, , params, hash, _default, inverse] = sexp;
  let definitionArgs: BaselineSyntax.Args = [params.slice(0, 1), null, null, null];
  let args: BaselineSyntax.Args = [params.slice(1), hash, _default, inverse];

  builder.component.dynamic(definitionArgs, dynamicComponentFor, args, builder.symbolTable);

  return true;
}

export function inlineComponentMacro(path, params, hash, builder) {
  let definitionArgs: BaselineSyntax.Args = [params.slice(0, 1), null, null, null];
  let args: BaselineSyntax.Args = [params.slice(1), hash, null, null];

  builder.component.dynamic(definitionArgs, dynamicComponentFor, args, builder.symbolTable);

  return true;
}

function dynamicComponentFor(vm: VM, symbolTable: SymbolTable): DynamicComponentReference {
  let args = vm.getArgs();
  let nameRef = args.positional.at(0);
  let env = vm.env;

  return new DynamicComponentReference(nameRef, env, symbolTable);
}

class DynamicComponentReference implements PathReference<ComponentDefinition<Opaque>> {
  public tag: RevisionTag;

  constructor(private nameRef: PathReference<Opaque>, private env: GlimmerEnvironment, private symbolTable: SymbolTable) {
    this.tag = nameRef.tag;
  }

  value(): ComponentDefinition<Opaque> {
    let { env, nameRef } = this;

    let nameOrDef = nameRef.value();

    if (typeof nameOrDef === 'string') {
      return env.getComponentDefinition([nameOrDef], this.symbolTable);
    }

    return null;
  }

  get() {
    return UNDEFINED_REFERENCE;
  }
}
