import fs from 'fs-extra'
import yaml from 'js-yaml'

import { Parser } from '../parser'
import { Generator } from '../generator'

export interface CompilerOptions {
  input: {
    file: string
  }
}

export class Compiler {
  options: CompilerOptions

  parser: Parser
  generator: Generator

  constructor({
    options,
    parser,
    generator
  }: {
    options: CompilerOptions
    parser: Parser
    generator: Generator
  }) {
    this.options = options
    this.parser = parser
    this.generator = generator
  }

  static new(options: CompilerOptions) {
    const parser = Parser.new()
    const generator = Generator.new()

    return new Compiler({
      options,
      parser,
      generator
    })
  }

  async compile(): Promise<string> {
    const { file } = this.options.input

    const input = await fs.readFile(file, 'utf8')
    const ast = this.parser.parse(input)

    const outputHtml = this.generator.generate({
      ast,
      target: 'html'
    })

    return yaml.dump(outputHtml)
  }
}
