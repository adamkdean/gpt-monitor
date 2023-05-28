// Copyright (C) 2023 Adam K Dean <adamkdean@googlemail.com>
// Use of this source code is governed by the GPL-3.0
// license that can be found in the LICENSE file.

import { Configuration, OpenAIApi } from 'openai'
import { encode } from 'gpt-3-encoder'

export class StreamChatAPI {
  constructor(apiKey, model, debug = false) {
    this.model = model || 'gpt-3.5-turbo'
    this.openaiConfig = new Configuration({ apiKey })
    this.openai = new OpenAIApi(this.openaiConfig)
    this.debug = debug
  }

  async generateCompletion(messages, options = {}) {
    try {
      const payload = {
        model: this.model,
        messages,
        stream: true,
        ...options
      }

      let timeToFirstByte = 0
      let timeToLastByte = 0
      const startTime = Date.now()

      console.log('Generating completion')
      const response = await this.openai.createChatCompletion(payload, { responseType: 'stream' })

      console.log('Waiting for response')
      let data = ''
      for await (const chunk of response.data) {
        if (timeToFirstByte === 0) timeToFirstByte = Date.now() - startTime
        timeToLastByte = Date.now() - startTime

        const lines = chunk.toString('utf8').split('\n').filter((line) => line.trim().startsWith('data: '))
        for (const line of lines) {
          const text = line.replace('data: ', '')

          // If content present, add to data
          const obj = JSON.parse(text)
          const finishReason = obj.choices[0]?.finish_reason
          if (finishReason) {
            console.log(`Response complete (${data.length} bytes, ${encode(data).length} tokens)`)
            if (this.debug) console.log(`> "${data}"`)
            return {
              content: data,
              model: obj.model,
              tokens: encode(data).length,
              timeToFirstByte,
              timeToLastByte,
              finishReason
            }
          }

          const token = obj.choices[0]?.delta?.content
          if (token) {
            data += token
            if (this.debug) console.log(`Received ${token.length} bytes of data (${encode(token).length} tokens of ${encode(data).length} total)`)
          }
        }
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }
}
