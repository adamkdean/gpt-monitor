// Copyright (C) 2023 Adam K Dean <adamkdean@googlemail.com>
// Use of this source code is governed by the GPL-3.0
// license that can be found in the LICENSE file.

import cron from 'node-cron'
import { FlexDB } from 'node-flexdb'
import { StreamChatAPI } from './openai/stream.js'

export class Monitor {
  constructor(config) {
    this.config = config
    this.gpt3t = new StreamChatAPI(config.openai.apiKey, 'gpt-3.5-turbo', !!process.env.DEBUG)
    this.gpt4 = new StreamChatAPI(config.openai.apiKey, 'gpt-4', !!process.env.DEBUG)
    this.models = {
      'GPT-3.5': this.gpt3t,
      'GPT-4': this.gpt4
    }

    // Generate a relatively small mundane response to get a baseline.
    this.messages = [{ role: 'user', content: `Please write a simple paragraph (max 50 tokens) about copper.` }]
    this.options = { max_tokens: 50 }
  }

  async initialize() {
    console.log('Initializing FlexDB...')
    try {
      this.flexdb = new FlexDB({ apiKey: this.config.flexdb.apiKey })
      this.store = await this.flexdb.ensureStoreExists(this.config.flexdb.store)
      this.results = this.store.collection(this.config.flexdb.collection)
      console.log(`FlexDB initialized (store: ${this.store.id}, collection: ${this.results.name})`)
    } catch (error) {
      console.error('Error initializing FlexDB:', error.message)
    }

    if (!process.env.DEBUG) cron.schedule(this.config.monitor.pattern, this.performCheck.bind(this))
    else this.performCheck()
  }

  async performCheck() {
    try {
      for (const [name, api] of Object.entries(this.models)) {
        console.log(`----\nPerforming API test for ${name}...`)
        const response = await api.generateCompletion(this.messages, this.options)
        const msPerToken = this.roundToTwoDecimals(elapsed / response.tokens)
        const tokensPerMinute = this.roundToTwoDecimals(response.tokens / (elapsed / 1000 / 60))
        console.log(`Response: "${response.content}"`)
        console.log(`${response.model}: ${elapsed} ms with ${response.tokens} tokens`)
        console.log(`${msPerToken} ms/token`)
        console.log(`${tokensPerMinute} tokens/minute`)
        console.log(`timeToFirstByte: ${response.timeToFirstByte} ms`)
        console.log(`timeToLastByte: ${response.timeToLastByte} ms`)

        console.log('Saving results to FlexDB...')
        await this.results.create({
          model: response.model,
          tokens: response.tokens,
          length: response.content.length,
          timeToFirstByte: response.timeToFirstByte,
          timeToLastByte: response.timeToLastByte,
          msPerToken,
          tokensPerMinute
        })
      }
    } catch (error) {
      console.error('Error checking API:', error)
    }
  }

  roundToTwoDecimals(number) {
    return Math.round((number + Number.EPSILON) * 100) / 100
  }
}
