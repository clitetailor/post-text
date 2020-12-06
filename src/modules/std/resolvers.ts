/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import Prism from 'prismjs'
import loadLanguages from 'prismjs/components/'
import stripIndent from 'strip-indent'

import { Resolver, RegistryOptions } from '../../registry'
import { Command } from '../../printer'

export const TOC = Symbol('Toc')
export const tocDef = [null, 'title', 'subtitle', 'subsubtitle']

export const tagResolvers = (
  _options: RegistryOptions
): Record<string, Resolver> => {
  return {
    posttext: {
      resolve: async function* (): AsyncGenerator<
        Command,
        void,
        any
      > {
        const attrs: Record<string, string> = yield {
          name: 'getAttrs',
        }

        const title: string | undefined = attrs.title

        yield {
          name: 'metadata',
          metadata: {
            title,
          },
        }
      },
    },

    comment: {
      resolve: async function* (): AsyncGenerator<
        Command,
        void,
        any
      > {
        /* pass */
      },
    },

    section: {
      resolve: async function* (): AsyncGenerator<
        Command,
        void,
        any
      > {
        const content: string | undefined = yield {
          name: 'getBlock',
          index: 0,
        }

        yield {
          name: 'html',
          template: '<section>{{{ data.content }}}</section>',
          type: 'inline',
          data: {
            content: content ?? '',
          },
        }
      },
    },

    title: {
      preload: async function* (): AsyncGenerator<
        Command,
        void,
        any
      > {
        const content: string | undefined = yield {
          name: 'getBlock',
          index: 0,
        }

        yield {
          name: 'send',
          topic: TOC,
          data: {
            tagName: 'title',
            content,
          },
        }
      },

      resolve: async function* (): AsyncGenerator<
        Command,
        void,
        any
      > {
        const content: string | undefined = yield {
          name: 'getBlock',
          index: 0,
        }

        yield {
          name: 'html',
          template: '<h1>{{{ data.content }}}</h1>',
          type: 'inline',
          data: {
            content: content ?? '',
          },
        }
      },
    },

    subtitle: {
      preload: async function* (): AsyncGenerator<
        Command,
        void,
        any
      > {
        const content: string | undefined = yield {
          name: 'getBlock',
          index: 0,
        }

        yield {
          name: 'send',
          topic: TOC,
          data: {
            tagName: 'subtitle',
            content,
          },
        }
      },

      resolve: async function* (): AsyncGenerator<
        Command,
        void,
        any
      > {
        const content: string | undefined = yield {
          name: 'getBlock',
          index: 0,
        }

        yield {
          name: 'html',
          template: '<h2>{{{ data.content }}}</h2>',
          type: 'inline',
          data: {
            content: content ?? '',
          },
        }
      },
    },

    subsubtitle: {
      preload: async function* (): AsyncGenerator<
        Command,
        void,
        any
      > {
        const content: string | undefined = yield {
          name: 'getBlock',
          index: 0,
        }

        yield {
          name: 'send',
          topic: TOC,
          data: {
            tagName: 'subsubtitle',
            content,
          },
        }
      },

      resolve: async function* (): AsyncGenerator<
        Command,
        void,
        any
      > {
        const content: string | undefined = yield {
          name: 'getBlock',
          index: 0,
        }

        yield {
          name: 'html',
          template: '<h3>{{{ data.content }}}</h3>',
          type: 'inline',
          data: {
            content: content ?? '',
          },
        }
      },
    },

    bold: {
      resolve: async function* (): AsyncGenerator<
        Command,
        void,
        any
      > {
        const content: string | undefined = yield {
          name: 'getBlock',
          index: 0,
        }

        yield {
          name: 'html',
          template: '<b>{{{ data.content }}}</b>',
          type: 'inline',
          data: {
            content: content ?? '',
          },
        }
      },
    },

    italic: {
      resolve: async function* (): AsyncGenerator<
        Command,
        void,
        any
      > {
        const content: string | undefined = yield {
          name: 'getBlock',
          index: 0,
        }

        yield {
          name: 'html',
          template: '<i>{{{ data.content }}}</i>',
          type: 'inline',
          data: {
            content: content ?? '',
          },
        }
      },
    },

    underline: {
      resolve: async function* (): AsyncGenerator<
        Command,
        void,
        any
      > {
        const content: string | undefined = yield {
          name: 'getBlock',
          index: 0,
        }

        yield {
          name: 'html',
          template: '<u>{{{ data.content }}}<u>',
          type: 'inline',
          data: {
            content: content ?? '',
          },
        }
      },
    },

    paragraph: {
      resolve: async function* (): AsyncGenerator<
        Command,
        void,
        any
      > {
        const childNodes: any[] | undefined = yield {
          name: 'getBlockChildNodes',
          displayMode: true,
          index: 0,
        }

        let paragraph: string[] = []
        for (const childNode of childNodes ?? []) {
          switch (childNode.type) {
            case 'text': {
              const chunks = childNode.content
                .split(/(\n[^\S\n]*){2,}/)
                .filter(
                  (chunk) => chunk && !chunk.match(/^\s+$/)
                )
                .map((chunk) =>
                  chunk.replace(/\s\s\n/g, '<br>')
                )

              for (const chunk of chunks.slice(0, -1)) {
                paragraph.push(chunk)

                const content = paragraph.join('')
                if (content) {
                  yield {
                    name: 'html',
                    template: '<p>{{{ data.content }}}</p>',
                    data: {
                      content,
                    },
                  }
                }

                paragraph = []
              }

              if (chunks.length) {
                const lastChunk = chunks.slice(-1)[0]

                paragraph.push(lastChunk)
              }

              break
            }

            case 'inline': {
              paragraph.push(childNode.content)

              break
            }

            default: {
              if (paragraph.length !== 0) {
                const content = paragraph.join('')
                if (content) {
                  yield {
                    name: 'html',
                    template: '<p>{{{ data.content }}}</p>',
                    data: {
                      content,
                    },
                  }
                  paragraph = []
                }
              }

              yield {
                name: 'html',
                template: '{{{ data.content }}}',
                data: {
                  content: childNode.content,
                },
              }
            }
          }
        }

        if (paragraph.length !== 0) {
          const content = paragraph.join('')
          if (content) {
            yield {
              name: 'html',
              template: '<p>{{{ data.content }}}</p>',
              data: {
                content,
              },
            }
          }
        }
      },
    },

    list: {
      resolve: async function* (): AsyncGenerator<
        Command,
        void,
        any
      > {
        const content: string | undefined = yield {
          name: 'getBlock',
          index: 0,
        }

        yield {
          name: 'html',
          template: '<ul>{{{ data.content }}}</ul>',
          data: {
            content: content ?? '',
          },
        }
      },
    },

    item: {
      resolve: async function* (): AsyncGenerator<
        Command,
        void,
        any
      > {
        const content: string | undefined = yield {
          name: 'getBlock',
          index: 0,
        }
        yield {
          name: 'html',
          template: '<li>{{{ data.content }}}</li>',
          data: {
            content: content ?? '',
          },
        }
      },
    },

    code: {
      preload: async function* (): AsyncGenerator<
        Command,
        any,
        any
      > {
        const state: Record<string, any> = yield {
          name: 'getState',
        }
        if (!state.languagesLoaded) {
          loadLanguages()

          state.languagesLoaded = true

          yield {
            name: 'addDeps',
            deps: [
              {
                type: 'css',
                id: 'prismjs/themes/prism.css',
                src: 'prismjs/themes/prism.css',
                version: '^1.21.0',
              },
            ],
          }
        }
      },

      resolve: async function* (): AsyncGenerator<
        Command,
        void,
        any
      > {
        const params: string[] = yield {
          name: 'getParams',
        }
        const language: string =
          params[0] &&
          Object.keys(Prism.languages).indexOf(params[0])
            ? params[0]
            : 'text'

        const BEGIN_NEWLINE = /^\r?\n/
        const END_NEWLINE = /\r?\n[\t ]+$/

        const rawTextContent: string | undefined = yield {
          name: 'textContent',
          index: 0,
        }
        const textContent: string = rawTextContent
          ? stripIndent(rawTextContent)
              .replace(BEGIN_NEWLINE, '')
              .replace(END_NEWLINE, '')
          : ''

        const code: string =
          language !== 'text'
            ? Prism.highlight(
                textContent,
                Prism.languages[language],
                language
              )
            : textContent
        yield {
          name: 'html',
          template:
            '<pre class="language-{{ data.language }}"><code>{{{ data.code }}}</code></pre>',
          data: {
            language,
            code,
          },
        }
      },
    },

    toc: {
      resolve: async function* (): AsyncGenerator<
        Command,
        void,
        any
      > {
        const tocItems: any[] = yield {
          name: 'receive',
          topic: TOC,
        }

        const stack: any[] = []

        stack.push({
          content: '',
          children: [],
          previous: [],
        })

        while (stack.length > 1 || tocItems.length) {
          let currentItem = stack.pop()

          const nextItem = tocItems.shift()
          const nextItemLevel = nextItem?.tagName
            ? tocDef.indexOf(nextItem.tagName)
            : -1

          if (nextItemLevel === stack.length) {
            const counter = stack
              .concat([currentItem])
              .slice(1)
              .map((item) => item.previous.length + 1)
              .join('.')

            const renderedItem = yield {
              name: 'html',
              template: `
                <li class="std_toc__item">
                  <span class="std_toc__number">{{ data.counter }}</span>
                  <span class="std_toc__text">{{ data.content }}</span>
                  {{#if data.children.length}}
                  <ul class="std_toc__list">
                    {{#each data.children}}
                      {{{ this }}}
                    {{/each}}
                  </ul>
                  {{/if}}
                </li>
              `,
              emit: false,
              data: {
                content: currentItem.content,
                children: currentItem.children,
                counter,
              },
            }
            currentItem = {
              content: nextItem.content,
              children: [],
              previous: currentItem.previous.concat([
                renderedItem,
              ]),
            }

            stack.push(currentItem)
          } else if (nextItemLevel > stack.length) {
            stack.push(currentItem)

            while (nextItemLevel > stack.length) {
              stack.push({
                content: '',
                children: [],
                previous: [],
              })
            }

            stack.push({
              content: nextItem.content,
              children: [],
              previous: [],
            })
          } else {
            const counter = stack
              .concat([currentItem])
              .slice(1)
              .map((item) => item.previous.length + 1)
              .join('.')

            if (nextItem) {
              tocItems.unshift(nextItem)
            }
            let parentItem = stack.pop()

            const renderedItem = yield {
              name: 'html',
              template: `
                <li class="std_toc__item">
                  <span class="std_toc__number">{{ data.counter }}</span>
                  <span class="std_toc__text">{{ data.content }}</span>
                  {{#if data.children.length}}
                  <ul class="std_toc__list">
                    {{#each data.children}}
                      {{{ this }}}
                    {{/each}}
                  </ul>
                  {{/if}}
                </li>
              `,
              emit: false,
              data: {
                content: currentItem.content,
                children: currentItem.children,
                counter,
              },
            }

            parentItem = {
              content: parentItem.content,
              children: currentItem.previous.concat([
                renderedItem,
              ]),
              previous: parentItem.previous,
            }
            stack.push(parentItem)
          }
        }

        const rootItem = stack.pop()

        const content: string | undefined = yield {
          name: 'getBlock',
          index: 0,
        }

        yield {
          name: 'html',
          template: `
            <h1 class="std_toc__title">
              {{{ data.content }}}
            </h1>
            <ul class="std_toc__list">
              {{#each data.items}}
                {{{ this }}}
              {{/each}}
            </ul>
          `,
          data: {
            items: rootItem.children,
            content,
          },
        }
      },
    },

    blockquote: {
      resolve: async function* (): AsyncGenerator<
        Command,
        any,
        any
      > {
        const childNodes: any[] | undefined = yield {
          name: 'getBlockChildNodes',
          displayMode: true,
          index: 0,
        }

        let paragraph: string[] = []
        const nodes: string[] = []
        for (const childNode of childNodes ?? []) {
          switch (childNode.type) {
            case 'text': {
              const chunks = childNode.content
                .split(/(\n[^\S\n]*){2,}/)
                .filter(
                  (chunk) => chunk && !chunk.match(/^\s+$/)
                )
                .map((chunk) =>
                  chunk.replace(/\s\s\n/g, '<br>')
                )

              for (const chunk of chunks.slice(0, -1)) {
                paragraph.push(chunk)
                nodes.push(
                  yield {
                    name: 'html',
                    template: '<p>{{{ data.content }}}</p>',
                    emit: false,
                    data: {
                      content: paragraph.join(''),
                    },
                  }
                )

                paragraph = []
              }

              if (chunks.length) {
                const lastChunk = chunks.slice(-1)[0]

                paragraph.push(lastChunk)
              }

              break
            }

            case 'inline': {
              paragraph.push(childNode.content)

              break
            }

            default: {
              if (paragraph.length !== 0) {
                nodes.push(
                  yield {
                    name: 'html',
                    template: '<p>{{{ data.content }}}</p>',
                    emit: false,
                    data: {
                      content: paragraph.join(''),
                    },
                  }
                )
                paragraph = []

                nodes.push(childNode.content)
              }
            }
          }
        }

        if (paragraph.length !== 0) {
          const content = paragraph.join('')
          nodes.push(
            yield {
              name: 'html',
              template: '<p>{{{ data.content }}}</p>',
              emit: false,
              data: {
                content,
              },
            }
          )
        }

        yield {
          name: 'html',
          template: `
            <blockquote class="std_blockquote">
              {{{ data.content }}}
            </blockquote>
          `,
          data: {
            content: nodes.join(''),
          },
        }
      },
    },
  }
}
