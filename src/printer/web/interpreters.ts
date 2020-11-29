/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import Handlebars from '../helpers/handlebars'
import fs from 'fs-extra'
import path from 'path'
import webpack from 'webpack'
import prettier from 'prettier'
import stripIndent from 'strip-indent'

import { interpreters as commonInterpreters } from '../common'
import { Interpreter, Context } from '../interpreter'
import { Command } from '../command'
import { Data } from '../data'
import * as ast from '../../ast'

export interface InterpreterOptions {
  js: string[]
  css: string[]
}

export const getInterpreters = ({
  js = [],
  css = [],
}: Partial<InterpreterOptions> = {}): Record<
  string,
  Interpreter
> => {
  const externalJsDeps = js
  const externalCssDeps = css

  return {
    ...commonInterpreters,

    print: {
      modifier: 'private',

      interpret: async function* (
        command: Command,
        context: Context
      ): AsyncGenerator<Data, any, any> {
        const documentAst = command.ast as
          | ast.DocumentNode
          | ast.BlockNode
          | ast.TagNode
          | ast.TextNode

        const preloadIter = context.dispatch({
          name: 'preload',
          node: documentAst,
        })

        const preloadCollection: Data[] = []
        for await (const data of preloadIter) {
          preloadCollection.push(data)
        }

        const renderIter = context.dispatch({
          name: 'render',
          node: documentAst,
        })

        const collection: Data[] = []
        for await (const data of renderIter) {
          collection.push(data)
        }

        const metadata = collection
          .filter((data) => data.name === 'metadata')
          .map((data) => data.metadata)
          .reduce(
            (prevMetadata, metadata) => ({
              ...prevMetadata,
              ...metadata,
            }),
            {}
          )

        const deps = [
          ...preloadCollection,
          ...collection,
        ].filter((data) => data.name === 'dependency')

        const content = collection
          .filter((data) => data.name === 'html')
          .map((data) => data.content)
          .join('')

        const template = Handlebars.compile(
          stripIndent(`
            <!DOCTYPE html>
            <html lang="en">
              <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>{{ metadata.title }}</title>
              </head>
              <body>
                {{{ data.content }}}
  
                <script src="./bundle.js"></script>
              </body>
            </html>
          `)
        )

        const rendered = template({
          metadata: {
            ...metadata,
            title: metadata.title || 'PostText',
          },
          data: {
            content,
          },
        })

        // TODO: Add hooks.

        yield* context.dispatch({
          name: 'writeFile',
          file: 'index.html',
          content: prettier.format(rendered, {
            parser: 'html',
          }),
        })

        yield* context.dispatch({
          name: 'compileDeps',
          deps,
        })
      },
    },

    writeFile: {
      modifier: 'private',

      interpret: async function* (
        command: Command,
        _context: Context
      ): AsyncGenerator<Data, any, any> {
        const file = command.file as string
        const content = command.content as string

        const filePath = path.resolve('dist', file)

        await fs.ensureFile(filePath)
        await fs.writeFile(filePath, content)
      },
    },

    compileDeps: {
      modifier: 'private',

      interpret: async function* (
        command: Command,
        _context: Context
      ): AsyncGenerator<Data, any, any> {
        const deps = command.deps as any[]

        const jsDeps = deps
          .filter((dep) => dep.type === 'js')
          .map((dep) => dep.src)
          .concat(externalJsDeps) as string[]

        const cssDeps = deps
          .filter((dep) => dep.type === 'css')
          .map((dep) => dep.src)
          .concat(externalCssDeps) as string[]

        if (jsDeps.length + cssDeps.length > 0) {
          const compiler = webpack({
            entry: [...jsDeps, ...cssDeps],
            output: {
              path: path.resolve('dist'),
              filename: 'bundle.js',
            },
            mode: 'development',
            devtool: false,
            target: 'web',
            module: {
              rules: [
                { test: /\.ts$/i, use: 'ts-loader' },
                {
                  test: /\.css$/i,
                  use: [
                    'style-loader',
                    {
                      loader: 'css-loader',
                    },
                  ],
                },
              ],
            },
            resolve: {
              modules: ['node_modules'],
            },
            plugins: [
              new webpack.SourceMapDevToolPlugin({
                filename: 'bundle.js.map',
              }),
            ],
          })

          await new Promise((resolve, reject) => {
            compiler.run((err, _stats) => {
              if (err) {
                reject(err)
              }

              resolve()
            })
          })
        }
      },
    },
  }
}

export const interpreters = getInterpreters()
