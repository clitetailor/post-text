import { DocumentNode } from '../ast'
import { Interpreter, Context } from './interpreter'
import { Command } from './command'
import { Registry } from '../registry'
import { AnonymousContext } from './context'
import { Data } from './data'

export interface PrinterComponents {
  registry: Registry
}

export interface PrinterInput {
  ast: DocumentNode
}

export class Printer {
  private interpreters: Map<string, Interpreter>
  private registry: Registry

  static create(components: PrinterComponents): Printer {
    return new Printer(components)
  }

  constructor({ registry }: PrinterComponents) {
    this.interpreters = new Map()
    this.registry = registry
  }

  registerInterpreters(
    interpreters: Record<string, Interpreter>
  ): void {
    for (const [name, interpreter] of Object.entries(
      interpreters
    )) {
      this.interpreters.set(name, interpreter)
    }
  }

  async print(input: PrinterInput): Promise<void> {
    const { ast } = input

    const self = this
    const context = AnonymousContext.create({
      dispatch: async function* (
        command: Command
      ): AsyncGenerator<Data, any, any> {
        return yield* self.interpret(command, context)
      },
      interpreters: this.interpreters,
      registry: this.registry,
    })

    const iter = this.interpret(
      {
        name: 'render',
        node: ast,
      },
      context
    )
    const commands: Command[] = []
    for await (const command of iter) {
      commands.push(command)
    }
  }

  async *interpret(
    command: Command,
    context: Context
  ): AsyncGenerator<Command, any, any> {
    const interpreter = context.interpreters.get(command.name)
    if (!interpreter) {
      return
    }

    return yield* interpreter.interpret(command, context)
  }
}
