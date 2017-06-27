import {
  VM,
  Arguments,
} from "@glimmer/runtime";
import { DynamicComponentReference } from "../dynamic-component";

export default function buildComponent(vm: VM, _args: Arguments) {
  console.log("HHEERRE: ", arguments[1]);
  let args = _args.capture();
  let nameRef = args.positional.at(0);
  let env = vm.env;

  return new DynamicComponentReference(nameRef, env, null);
}
